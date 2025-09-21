import axios from 'axios';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class GmailService {
  private accessToken: string;
  private refreshToken?: string;
  private onTokenRefresh?: (result: TokenRefreshResult) => Promise<void>;

  constructor(accessToken: string, refreshToken?: string, onTokenRefresh?: (result: TokenRefreshResult) => Promise<void>) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Update the access token
      this.accessToken = access_token;
      
      // If a new refresh token is provided, update it
      if (refresh_token) {
        this.refreshToken = refresh_token;
      }

      // Notify the callback if provided
      if (this.onTokenRefresh) {
        await this.onTokenRefresh({
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
        });
      }

      console.log('✅ Access token refreshed successfully');
      return access_token;
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  private async makeAuthenticatedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          console.log('🔄 401 Unauthorized, attempting token refresh...');
          
          // Try to refresh the token
          await this.refreshAccessToken();
          
          // Retry the request with the new token
          return await requestFn();
        } else if (error.response?.status === 429) {
          // Exponential backoff for rate limiting
          const retryAfter = error.response.headers['retry-after'] || 5;
          const backoffTime = Math.min(retryAfter * 1000, 30000); // Max 30 seconds
          console.log(`⏳ 429 Rate limited, waiting ${backoffTime/1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return await requestFn();
        }
      }
      throw error;
    }
  }

  async getProfile(): Promise<GmailProfile> {
    return this.makeAuthenticatedRequest(async () => {
      const response = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        { headers: this.getHeaders() }
      );
      return response.data;
    });
  }

  async getInboxMessageCount(): Promise<number> {
    return this.makeAuthenticatedRequest(async () => {
      console.log('🔍 [DEBUG] Getting inbox message count...');
      
      // Get all inbox messages (up to a reasonable limit)
      // Use a more specific query to exclude archived emails and other non-inbox labels
      // Alternative approach: explicitly look for INBOX label and exclude unwanted labels
      const response = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=label:INBOX -label:archive -label:trash -label:spam&maxResults=500',
        { headers: this.getHeaders() }
      );
      
      console.log('🔍 [DEBUG] Response status:', response.status);
      console.log('🔍 [DEBUG] Total messages in response:', response.data.messages?.length || 0);
      
      // Return the actual count of messages we can process
      const count = response.data.messages?.length || 0;
      console.log('🔍 [DEBUG] Actual message count:', count);
      
      return count;
    });
  }

  async getMessages(maxResults: number = 10, query?: string): Promise<GmailMessage[]> {
    return this.makeAuthenticatedRequest(async () => {
      let url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
      if (query) {
        url += `&q=${encodeURIComponent(query)}`;
      }

      const response = await axios.get(url, { headers: this.getHeaders() });
      
      if (!response.data.messages) {
        return [];
      }

      // Get full message details for each message
      const messagePromises = response.data.messages.map((msg: { id: string }) =>
        this.getMessage(msg.id)
      );

      return await Promise.all(messagePromises);
    });
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    return this.makeAuthenticatedRequest(async () => {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    });
  }

  async searchMessages(query: string, maxResults: number = 10): Promise<GmailMessage[]> {
    return this.getMessages(maxResults, query);
  }

  async getRecentMessages(maxResults: number = 10): Promise<GmailMessage[]> {
    return this.getMessages(maxResults, 'is:recent');
  }

  async getUnreadMessages(maxResults: number = 10): Promise<GmailMessage[]> {
    return this.getMessages(maxResults, 'is:unread');
  }

  async getMessagesFromSender(sender: string, maxResults: number = 10): Promise<GmailMessage[]> {
    return this.getMessages(maxResults, `from:${sender}`);
  }

  async getMessagesWithSubject(subject: string, maxResults: number = 10): Promise<GmailMessage[]> {
    return this.getMessages(maxResults, `subject:${subject}`);
  }

  // Helper method to extract email content
  extractEmailContent(message: GmailMessage): string {
    let content = '';

    // Try to get content from body
    if (message.payload.body?.data) {
      content = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }

    // If no content in body, try parts
    if (!content && message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          content = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    }

    // If still no content, try HTML parts
    if (!content && message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          content = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Strip HTML tags for plain text
          content = content.replace(/<[^>]*>/g, '');
          break;
        }
      }
    }

    return content || message.snippet;
  }

  // Helper method to extract email headers
  extractEmailHeaders(message: GmailMessage): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (message.payload.headers) {
      for (const header of message.payload.headers) {
        headers[header.name.toLowerCase()] = header.value;
      }
    }

    return headers;
  }

  // Helper method to get sender email
  getSenderEmail(message: GmailMessage): string {
    const headers = this.extractEmailHeaders(message);
    return headers['from'] || '';
  }

  // Helper method to get subject
  getSubject(message: GmailMessage): string {
    const headers = this.extractEmailHeaders(message);
    return headers['subject'] || '';
  }

  // Helper method to get recipients (to + cc)
  getRecipients(message: GmailMessage): string {
    const headers = this.extractEmailHeaders(message);
    const to = headers['to'] || '';
    const cc = headers['cc'] || '';
    
    if (to && cc) {
      return `${to}, ${cc}`;
    }
    return to || cc;
  }

  // Helper method to get date
  getDate(message: GmailMessage): Date {
    return new Date(parseInt(message.internalDate));
  }
}
