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

export class GmailService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getProfile(): Promise<GmailProfile> {
    try {
      const response = await axios.get(
        'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Gmail profile:', error);
      throw new Error('Failed to fetch Gmail profile');
    }
  }

  async getMessages(maxResults: number = 10, query?: string): Promise<GmailMessage[]> {
    try {
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
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error('Failed to fetch Gmail messages');
    }
  }

  async getMessage(messageId: string): Promise<GmailMessage> {
    try {
      const response = await axios.get(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Gmail message:', error);
      throw new Error('Failed to fetch Gmail message');
    }
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

  // Helper method to get date
  getDate(message: GmailMessage): Date {
    return new Date(parseInt(message.internalDate));
  }
}
