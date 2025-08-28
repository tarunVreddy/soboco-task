export interface Task {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date;
}

export interface AIExtractionResult {
  tasks: Task[];
  confidence: number;
  reasoning?: string;
}

export interface IAIProvider {
  extractTasks(message: string): Promise<AIExtractionResult>;
  isAvailable(): Promise<boolean>;
}
