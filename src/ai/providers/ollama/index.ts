import axios from 'axios';
import { IAIProvider, Task, AIExtractionResult } from '../../interfaces/IAIProvider';
import { config } from '../../../config';

export class OllamaProvider implements IAIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = config.ai.ollama.baseUrl;
    this.model = config.ai.ollama.model;
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

  private buildPrompt(message: string): string {
    return `You are a task extraction AI. Analyze the following message and extract any actionable tasks that require the user to DO something.

IMPORTANT: Only extract tasks that require ACTION from the user. Ignore:
- Newsletters, marketing emails, promotional content
- Automated notifications, system messages
- Informational updates, status reports
- Social media notifications, likes, follows
- General announcements, company updates
- Receipts, confirmations, automated responses
- Calendar invites (unless they require preparation)
- News articles, blog posts, informational content

Focus on emails that contain:
- Direct requests for action ("Please review", "Can you send", "Need you to")
- Deadlines or time-sensitive requests
- Follow-up items ("Let me know when", "Get back to me")
- Action items from meetings or discussions
- Requests for information or documents
- Tasks assigned to the user

Message: "${message}"

Please respond with a JSON object in this exact format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description (optional)",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "dueDate": "YYYY-MM-DD" (optional, only if a specific date is mentioned)
    }
  ],
  "confidence": 0.85,
  "reasoning": "Brief explanation of why these tasks were extracted or why none were found"
}

If no actionable tasks are found, return:
{
  "tasks": [],
  "confidence": 0.0,
  "reasoning": "No actionable tasks found - this appears to be informational content"
}

IMPORTANT: Respond with ONLY valid JSON. Do not include any explanatory text, comments, or markdown formatting. Ensure all quotes are properly escaped and there are no trailing commas. Do not add any comments inside the JSON. Do not use placeholder dates like "YYYY-MM-DD" - only include dueDate if a specific date is mentioned in the message.`;
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
        .replace(/([^\\])"/g, '$1"') // Fix unescaped quotes
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\r/g, ' ') // Remove carriage returns
        .replace(/\t/g, ' ') // Remove tabs
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('🔍 [DEBUG] Cleaned JSON string:', cleanedJson);

      const parsed = JSON.parse(cleanedJson);
      console.log('🔍 [DEBUG] Parsed JSON object:', JSON.stringify(parsed, null, 2));
      
      // Validate and transform the response
      const tasks: Task[] = (parsed.tasks || []).map((task: any) => ({
        title: task.title || 'Untitled Task',
        description: task.description,
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));

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
}
