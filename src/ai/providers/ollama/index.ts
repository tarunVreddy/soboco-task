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
    return `You are a task extraction AI. Analyze the following message and extract any actionable tasks. 

Message: "${message}"

Please respond with a JSON object in this exact format:
{
  "tasks": [
    {
      "title": "Task title",
      "description": "Task description (optional)",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "dueDate": "YYYY-MM-DD" (optional)
    }
  ],
  "confidence": 0.85,
  "reasoning": "Brief explanation of why these tasks were extracted"
}

If no tasks are found, return:
{
  "tasks": [],
  "confidence": 0.0,
  "reasoning": "No actionable tasks found in this message"
}

Only respond with valid JSON, no additional text.`;
  }

  private parseResponse(response: string): AIExtractionResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and transform the response
      const tasks: Task[] = (parsed.tasks || []).map((task: any) => ({
        title: task.title || 'Untitled Task',
        description: task.description,
        priority: task.priority || 'MEDIUM',
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));

      return {
        tasks,
        confidence: parsed.confidence || 0.0,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Error parsing Ollama response:', error);
      return {
        tasks: [],
        confidence: 0.0,
        reasoning: 'Failed to parse AI response',
      };
    }
  }
}
