import axios from 'axios';
import { IAIProvider, Task, AIExtractionResult } from '../../interfaces/IAIProvider';
import { config } from '../../../config';

export interface BatchMessage {
  id: string;
  content: string;
  subject?: string;
  sender?: string;
}

export interface BatchExtractionResult {
  messageId: string;
  result: AIExtractionResult;
}

export class OllamaProvider implements IAIProvider {
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private batchSize: number;

  constructor() {
    this.baseUrl = config.ai.ollama.baseUrl;
    this.model = config.ai.ollama.model;
    this.maxTokens = config.ai.ollama.maxTokens;
    this.batchSize = config.ai.ollama.batchSize;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.status === 200;
    } catch (error) {
      console.warn('Ollama server not available:', error);
      return false;
    }
  }

  async extractTasks(message: string): Promise<AIExtractionResult> {
    const prompt = this.buildPrompt(message);
    
    // Check if prompt is too long
    if (prompt.length > this.maxTokens * 4) { // Rough estimate: 1 token ≈ 4 characters
      console.warn(`Prompt too long (${prompt.length} chars), truncating message content`);
      const truncatedMessage = this.truncateMessage(message, this.maxTokens * 2); // Leave room for prompt
      const truncatedPrompt = this.buildPrompt(truncatedMessage);
      console.log(`Truncated prompt length: ${truncatedPrompt.length} characters`);
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      });

      const result = response.data.response;
      return this.parseResponse(result);
    } catch (error) {
      console.error('Error calling Ollama:', error);
      throw new Error('Failed to extract tasks from message');
    }
  }

  async extractTasksBatch(messages: BatchMessage[]): Promise<BatchExtractionResult[]> {
    if (messages.length === 0) {
      return [];
    }

    console.log(`🔍 [DEBUG] Processing batch of ${messages.length} messages`);

    // Process messages in batches to avoid overwhelming the AI
    const results: BatchExtractionResult[] = [];
    
    for (let i = 0; i < messages.length; i += this.batchSize) {
      const batch = messages.slice(i, i + this.batchSize);
      console.log(`🔍 [DEBUG] Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(messages.length / this.batchSize)}`);
      
      try {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
        
        // Add a small delay between batches to be respectful to the AI service
        if (i + this.batchSize < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / this.batchSize) + 1}:`, error);
        // Add failed results for this batch
        batch.forEach(msg => {
          results.push({
            messageId: msg.id,
            result: {
              tasks: [],
              confidence: 0.0,
              reasoning: `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          });
        });
      }
    }

    console.log(`🔍 [DEBUG] Completed batch processing. Extracted tasks from ${results.length} messages`);
    return results;
  }

  private async processBatch(messages: BatchMessage[]): Promise<BatchExtractionResult[]> {
    const prompt = this.buildBatchPrompt(messages);
    
    // Check if batch prompt is too long
    if (prompt.length > this.maxTokens * 4) {
      console.warn(`Batch prompt too long (${prompt.length} chars), processing smaller batches`);
      // If batch is too large, process messages individually
      const results: BatchExtractionResult[] = [];
      for (const message of messages) {
        try {
          const result = await this.extractTasks(message.content);
          results.push({ messageId: message.id, result });
        } catch (error) {
          console.error(`Error processing individual message ${message.id}:`, error);
          results.push({
            messageId: message.id,
            result: {
              tasks: [],
              confidence: 0.0,
              reasoning: `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          });
        }
      }
      return results;
    }
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      });

      const result = response.data.response;
      return this.parseBatchResponse(result, messages);
    } catch (error) {
      console.error('Error calling Ollama for batch processing:', error);
      throw new Error('Failed to extract tasks from batch');
    }
  }

  private truncateMessage(message: string, maxChars: number): string {
    if (message.length <= maxChars) {
      return message;
    }
    
    // Try to truncate at a sentence boundary
    const truncated = message.substring(0, maxChars);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastExclamation = truncated.lastIndexOf('!');
    const lastQuestion = truncated.lastIndexOf('?');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastSentenceEnd > maxChars * 0.8) { // If we can find a sentence end in the last 20%
      return truncated.substring(0, lastSentenceEnd + 1) + ' [Content truncated...]';
    }
    
    return truncated + ' [Content truncated...]';
  }

  private buildPrompt(message: string): string {
    return `Extract actionable tasks from this email. Focus on requests for action, deadlines, or follow-up items.

IGNORE: newsletters, notifications, receipts, announcements, news articles.

EXTRACT: direct requests, deadlines, action items, follow-ups.

Email: "${message}"

Respond with JSON only:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Description (optional)",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "dueDate": "YYYY-MM-DD" (only if specific date mentioned)
    }
  ],
  "confidence": 0.85,
  "reasoning": "Why tasks were extracted or why none found"
}

If no tasks found:
{
  "tasks": [],
  "confidence": 0.0,
  "reasoning": "No actionable tasks - informational content"
}`;
  }

  private buildBatchPrompt(messages: BatchMessage[]): string {
    const messagesJson = messages.map((msg, index) => ({
      id: msg.id,
      subject: msg.subject || 'No subject',
      sender: msg.sender || 'Unknown sender',
      content: this.truncateMessage(msg.content, 1000) // Limit each message to 1000 chars
    }));

    return `Extract actionable tasks from these emails. Process each message separately.

IGNORE: newsletters, notifications, receipts, announcements, news articles.

EXTRACT: direct requests, deadlines, action items, follow-ups.

Messages: ${JSON.stringify(messagesJson, null, 2)}

Respond with a JSON array only (no markdown formatting):
[
  {
    "messageId": "message_id_1",
    "tasks": [
      {
        "title": "Task title",
        "description": "Description (optional)",
        "priority": "LOW",
        "dueDate": "YYYY-MM-DD" (only if specific date mentioned)
      }
    ],
    "confidence": 0.85,
    "reasoning": "Why tasks were extracted or why none found"
  }
]

If no tasks found in a message:
{
  "messageId": "message_id_2",
  "tasks": [],
  "confidence": 0.0,
  "reasoning": "No actionable tasks - informational content"
}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.`;
  }

  private parseResponse(response: string): AIExtractionResult {
    try {
      console.log('🔍 [DEBUG] Raw Ollama response:', response);
      
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ [DEBUG] No JSON found in response');
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      console.log('🔍 [DEBUG] Extracted JSON string:', jsonString);

      // Try to fix common JSON issues
      let cleanedJson = jsonString
        .replace(/\/\/.*?(?=\n|$)/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\r/g, ' ') // Remove carriage returns
        .replace(/\t/g, ' ') // Remove tabs
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('🔍 [DEBUG] Cleaned JSON string:', cleanedJson);

      const parsed = JSON.parse(cleanedJson);
      console.log('🔍 [DEBUG] Parsed JSON object:', JSON.stringify(parsed, null, 2));
      
      // Validate and transform the response
      const tasks: Task[] = (parsed.tasks || []).map((task: any) => {
        // Fix priority parsing - handle cases where AI returns multiple options
        let priority = task.priority || 'MEDIUM';
        if (typeof priority === 'string' && priority.includes('|')) {
          // If AI returns multiple options like "LOW|MEDIUM|HIGH|URGENT", take the first one
          priority = priority.split('|')[0];
        }
        
        return {
          title: task.title || 'Untitled Task',
          description: task.description,
          priority: priority,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        };
      });

      const result = {
        tasks,
        confidence: parsed.confidence || 0.0,
        reasoning: parsed.reasoning || 'No reasoning provided',
      };

      console.log('🔍 [DEBUG] Final extraction result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ [DEBUG] Error parsing Ollama response:', error);
      console.error('❌ [DEBUG] Original response:', response);
      return {
        tasks: [],
        confidence: 0.0,
        reasoning: `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private parseBatchResponse(response: string, messages: BatchMessage[]): BatchExtractionResult[] {
    try {
      console.log('🔍 [DEBUG] Raw Ollama batch response:', response);
      
      // Clean the response to extract JSON - handle both object and array responses
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to match array format
        jsonMatch = response.match(/\[[\s\S]*\]/);
      }
      
      if (!jsonMatch) {
        console.error('❌ [DEBUG] No JSON found in batch response');
        throw new Error('No JSON found in batch response');
      }

      const jsonString = jsonMatch[0];
      console.log('🔍 [DEBUG] Extracted batch JSON string:', jsonString);

      // Try to fix common JSON issues
      let cleanedJson = jsonString
        .replace(/\/\/.*?(?=\n|$)/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\r/g, ' ') // Remove carriage returns
        .replace(/\t/g, ' ') // Remove tabs
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('🔍 [DEBUG] Cleaned batch JSON string:', cleanedJson);

      const parsed = JSON.parse(cleanedJson);
      console.log('🔍 [DEBUG] Parsed batch JSON object:', JSON.stringify(parsed, null, 2));
      
      const results: BatchExtractionResult[] = [];
      
      // Handle both object format (with results array) and direct array format
      let batchResults;
      if (Array.isArray(parsed)) {
        batchResults = parsed;
      } else {
        batchResults = parsed.results || [];
      }

      // Process each result in the batch
      for (const batchResult of batchResults) {
        const tasks: Task[] = (batchResult.tasks || []).map((task: any) => {
          // Fix priority parsing - handle cases where AI returns multiple options
          let priority = task.priority || 'MEDIUM';
          if (typeof priority === 'string' && priority.includes('|')) {
            // If AI returns multiple options like "LOW|MEDIUM|HIGH|URGENT", take the first one
            priority = priority.split('|')[0];
          }
          
          return {
            title: task.title || 'Untitled Task',
            description: task.description,
            priority: priority,
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          };
        });

        results.push({
          messageId: batchResult.messageId,
          result: {
            tasks,
            confidence: batchResult.confidence || 0.0,
            reasoning: batchResult.reasoning || 'No reasoning provided',
          }
        });
      }

      console.log('🔍 [DEBUG] Final batch extraction results:', JSON.stringify(results, null, 2));
      return results;
    } catch (error) {
      console.error('❌ [DEBUG] Error parsing Ollama batch response:', error);
      console.error('❌ [DEBUG] Original batch response:', response);
      
      // Return failed results for all messages in the batch
      return messages.map(msg => ({
        messageId: msg.id,
        result: {
          tasks: [],
          confidence: 0.0,
          reasoning: `Failed to parse AI batch response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      }));
    }
  }
}
