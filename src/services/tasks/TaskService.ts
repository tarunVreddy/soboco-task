import { DatabaseService, Task } from '../database/DatabaseService';
import { GmailService } from '../gmail/GmailService';
import { OllamaProvider, BatchMessage } from '../../ai/providers/ollama';

export class TaskService {
  private databaseService: DatabaseService;
  private ollamaProvider: OllamaProvider;

  constructor() {
    this.databaseService = new DatabaseService();
    this.ollamaProvider = new OllamaProvider();
  }

  async parseGmailForTasks(userId: string, integrationId: string): Promise<{ extracted: number; created: number; processed: number }> {
    try {
      // Get the Gmail integration
      const integration = await this.databaseService.findIntegrationById(integrationId);
      if (!integration || integration.user_id !== userId || integration.provider !== 'google') {
        throw new Error('Gmail integration not found');
      }

      // Check if Ollama is available
      const isOllamaAvailable = await this.ollamaProvider.isAvailable();
      if (!isOllamaAvailable) {
        throw new Error('Ollama AI service is not available');
      }

      // Get recent Gmail messages
      const gmailService = new GmailService(integration.access_token);
      const messages = await gmailService.getMessages(50, 'in:inbox'); // Get last 50 inbox messages

      let extractedCount = 0;
      let createdCount = 0;
      let processedCount = 0;

      // Filter out already parsed messages
      const unparsedMessages = [];
      for (const message of messages) {
        const isAlreadyParsed = await this.databaseService.isMessageParsed(userId, integrationId, message.id);
        if (!isAlreadyParsed) {
          unparsedMessages.push(message);
        } else {
          console.log(`Message ${message.id} already parsed, skipping`);
        }
      }

      if (unparsedMessages.length === 0) {
        console.log('No new messages to process');
        return { extracted: 0, created: 0, processed: 0 };
      }

      console.log(`🔍 [DEBUG] Processing ${unparsedMessages.length} unparsed messages`);

      // Prepare batch messages for AI processing
      const batchMessages: BatchMessage[] = unparsedMessages.map(message => {
        const content = gmailService.extractEmailContent(message);
        const subject = gmailService.getSubject(message);
        const sender = gmailService.getSenderEmail(message);
        
        // Combine subject and content for AI analysis
        const fullContent = `Subject: ${subject}\nFrom: ${sender}\n\n${content}`;
        
        return {
          id: message.id,
          content: fullContent,
          subject,
          sender
        };
      });

      // Process messages in batch using AI
      console.log(`🔍 [DEBUG] Starting batch processing of ${batchMessages.length} messages`);
      const batchResults = await this.ollamaProvider.extractTasksBatch(batchMessages);
      console.log(`🔍 [DEBUG] Batch processing completed. Got results for ${batchResults.length} messages`);

      // Process results and create tasks
      for (const batchResult of batchResults) {
        try {
          const { messageId, result } = batchResult;
          const message = unparsedMessages.find(m => m.id === messageId);
          
          if (!message) {
            console.warn(`Message ${messageId} not found in original messages`);
            continue;
          }

          extractedCount += result.tasks.length;
          processedCount++;

          // Create tasks in database
          for (const aiTask of result.tasks) {
            // Validate and parse due date
            let dueDate: string | undefined = undefined;
            if (aiTask.dueDate) {
              try {
                // Check if it's a valid date string (not a placeholder)
                if (aiTask.dueDate instanceof Date && !isNaN(aiTask.dueDate.getTime())) {
                  dueDate = aiTask.dueDate.toISOString();
                } else if (typeof aiTask.dueDate === 'string' && aiTask.dueDate !== 'YYYY-MM-DD') {
                  // Try to parse the date string
                  const parsedDate = new Date(aiTask.dueDate);
                  if (!isNaN(parsedDate.getTime())) {
                    dueDate = parsedDate.toISOString();
                  }
                }
              } catch (error) {
                console.warn(`Invalid due date for task "${aiTask.title}": ${aiTask.dueDate}`);
              }
            }

            const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
              user_id: userId,
              integration_id: integration.id,
              account_email: integration.account_email,
              account_name: integration.account_name,
              title: aiTask.title,
              description: aiTask.description,
              priority: aiTask.priority || 'MEDIUM',
              status: 'PENDING',
              due_date: dueDate,
              source: 'gmail',
              source_id: message.id,
            };

            await this.databaseService.createTask(taskData);
            createdCount++;
          }

          // Mark message as parsed
          await this.databaseService.createParsedMessage({
            user_id: userId,
            integration_id: integrationId,
            gmail_message_id: message.id,
            tasks_extracted: result.tasks.length,
          });

        } catch (error) {
          console.error(`Error processing batch result for message ${batchResult.messageId}:`, error);
          // Continue with next result
        }
      }

      console.log(`🔍 [DEBUG] Task extraction completed: ${extractedCount} tasks extracted, ${createdCount} tasks created, ${processedCount} messages processed`);
      return { extracted: extractedCount, created: createdCount, processed: processedCount };
    } catch (error) {
      console.error('Error parsing Gmail for tasks:', error);
      throw error;
    }
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    return await this.databaseService.findTasksByUserId(userId);
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    return await this.databaseService.updateTask(taskId, { status });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.databaseService.deleteTask(taskId);
  }

  async resetMessageTracking(userId: string, integrationId: string): Promise<void> {
    // Delete all tasks for this user (across all accounts)
    await this.databaseService.deleteAllTasksByUserId(userId);
    
    // Clear parsed messages tracking for ALL integrations for this user
    const integrations = await this.databaseService.findIntegrationsByUserId(userId);
    for (const integration of integrations) {
      await this.databaseService.clearParsedMessages(userId, integration.id);
    }
    
    console.log(`🔍 [DEBUG] Reset completed for user ${userId}: deleted all tasks and cleared parsed messages for all ${integrations.length} integrations`);
  }

  async getUnparsedMessageCount(userId: string, integrationId: string): Promise<number> {
    try {
      // Get the Gmail integration
      const integration = await this.databaseService.findIntegrationById(integrationId);
      if (!integration || integration.user_id !== userId || integration.provider !== 'google') {
        throw new Error('Gmail integration not found');
      }

      // Get recent Gmail messages
      const gmailService = new GmailService(integration.access_token);
      const messages = await gmailService.getMessages(500, 'in:inbox'); // Get last 500 inbox messages

      // Get list of already parsed messages
      const parsedMessages = await this.databaseService.findParsedMessagesByIntegration(userId, integrationId);
      const parsedMessageIds = new Set(parsedMessages.map(pm => pm.gmail_message_id));

      // Count unparsed messages
      const unparsedCount = messages.filter(message => !parsedMessageIds.has(message.id)).length;

      console.log('🔍 [DEBUG] Total inbox messages:', messages.length);
      console.log('🔍 [DEBUG] Already parsed messages:', parsedMessages.length);
      console.log('🔍 [DEBUG] Unparsed messages:', unparsedCount);

      return unparsedCount;
    } catch (error) {
      console.error('Error getting unparsed message count:', error);
      throw error;
    }
  }
}
