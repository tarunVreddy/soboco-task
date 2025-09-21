import { DatabaseService, Task } from '../database/DatabaseService';
import { OllamaProvider } from '../../ai/providers/ollama';
import { GmailService } from '../gmail/GmailService';

export class TaskService {
  private databaseService: DatabaseService;
  private ollamaProvider: OllamaProvider;

  constructor() {
    this.databaseService = new DatabaseService();
    this.ollamaProvider = new OllamaProvider();
  }

  async parseGmailForTasks(
    userId: string, 
    integrationId: string, 
    progressCallback?: (progress: any) => void
  ): Promise<{ extracted: number; created: number; processed: number }> {
    try {
      // Get integration details
      const integration = await this.databaseService.findIntegrationById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }

      if (integration.user_id !== userId) {
        throw new Error('Integration does not belong to user');
      }

      if (!integration.is_active) {
        throw new Error('Integration is not active');
      }

      console.log(`🔍 [DEBUG] Starting task extraction for user ${userId}, integration ${integrationId}`);

      // Check if Ollama is available
      console.log(`🔍 [DEBUG] Checking Ollama availability...`);
      const isOllamaAvailable = await this.ollamaProvider.isAvailable();
      if (!isOllamaAvailable) {
        console.error(`❌ [DEBUG] Ollama is not available`);
        throw new Error('Ollama AI service is not available');
      }
      console.log(`✅ [DEBUG] Ollama is available`);

      // Get recent Gmail messages
      console.log(`🔍 [DEBUG] Creating Gmail service and fetching messages...`);
      const gmailService = new GmailService(integration.access_token);
      const messages = await gmailService.getMessages(50, 'label:INBOX -label:archive -label:trash -label:spam'); // Get last 50 inbox messages (excluding archived, trash, spam)
      console.log(`✅ [DEBUG] Fetched ${messages.length} messages from Gmail`);
      
      // Debug: Log labels for first few messages to see what we're getting
      if (messages.length > 0) {
        console.log(`🔍 [DEBUG] Sample message labels:`);
        messages.slice(0, 3).forEach((msg, index) => {
          console.log(`  Message ${index + 1}: ${msg.labelIds?.join(', ') || 'No labels'}`);
        });
      }

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

      // Process messages in batches for efficiency
      const BATCH_SIZE = 5; // Process 5 messages at a time
      const batches = [];
      for (let i = 0; i < unparsedMessages.length; i += BATCH_SIZE) {
        batches.push(unparsedMessages.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`🔍 [DEBUG] Processing ${unparsedMessages.length} messages in ${batches.length} batches of ${BATCH_SIZE}`);
      
      if (progressCallback) {
        progressCallback({ 
          type: 'progress', 
          message: `Processing ${unparsedMessages.length} messages in ${batches.length} batches...`,
          current: 0,
          total: unparsedMessages.length
        });
      }
      
      let currentMessageIndex = 0;
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`🔍 [DEBUG] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} messages`);
        
        if (progressCallback) {
          progressCallback({ 
            type: 'batch', 
            message: `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} messages)`,
            current: currentMessageIndex,
            total: unparsedMessages.length,
            batchIndex: batchIndex + 1,
            totalBatches: batches.length
          });
        }
        
        try {
          // Prepare batch content for AI processing
          const batchContent = [];
          const batchMetadata = [];
          
          for (const message of batch) {
            const content = gmailService.extractEmailContent(message);
            const subject = gmailService.getSubject(message);
            const sender = gmailService.getSenderEmail(message);
            
            batchContent.push(`--- Message ${batchContent.length + 1} ---\nSubject: ${subject}\nFrom: ${sender}\n\n${content}`);
            batchMetadata.push({
              messageId: message.id,
              senderEmail: sender,
              emailReceivedAt: new Date(parseInt(message.internalDate)).toISOString(),
              recipients: gmailService.getRecipients(message)
            });
          }
          
          const fullBatchContent = batchContent.join('\n\n');
          
          // Process batch with AI
          console.log(`🔍 [DEBUG] Processing batch ${batchIndex + 1} with Ollama...`);
          const batchResult = await this.ollamaProvider.extractTasks(fullBatchContent);
          
          console.log(`🔍 [DEBUG] Batch ${batchIndex + 1} - Extracted ${batchResult.tasks.length} total tasks`);
          
          // Distribute tasks across messages in the batch
          const tasksPerMessage = Math.ceil(batchResult.tasks.length / batch.length);
          let taskIndex = 0;
          
          for (let messageIndex = 0; messageIndex < batch.length; messageIndex++) {
            const message = batch[messageIndex];
            const messageMetadata = batchMetadata[messageIndex];
            currentMessageIndex++;
            
            // Assign tasks to this message (distribute evenly)
            const messageTasks = batchResult.tasks.slice(taskIndex, taskIndex + tasksPerMessage);
            taskIndex += tasksPerMessage;
            
            console.log(`🔍 [DEBUG] Message ${currentMessageIndex}/${unparsedMessages.length} (${message.id}) - Assigned ${messageTasks.length} tasks`);
            
            if (progressCallback) {
              progressCallback({ 
                type: 'message', 
                message: `Processed message ${currentMessageIndex}/${unparsedMessages.length}`,
                current: currentMessageIndex,
                total: unparsedMessages.length,
                messageId: message.id,
                extracted: messageTasks.length
              });
            }
            
            extractedCount += messageTasks.length;
            processedCount++;

            // Create tasks in database for this message
            for (const aiTask of messageTasks) {
              // Validate and parse due date
              let dueDate: string | undefined = undefined;
              if (aiTask.dueDate) {
                try {
                  if (aiTask.dueDate instanceof Date && !isNaN(aiTask.dueDate.getTime())) {
                    dueDate = aiTask.dueDate.toISOString();
                  } else if (typeof aiTask.dueDate === 'string' && aiTask.dueDate !== 'YYYY-MM-DD') {
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
                integration_id: integrationId,
                title: aiTask.title,
                description: aiTask.description,
                status: 'PENDING',
                priority: aiTask.priority || 'MEDIUM',
                due_date: dueDate,
                source: 'gmail',
                source_id: message.id,
                message_id: message.id,
                account_email: integration.account_email,
                account_name: integration.account_name,
                email_received_at: messageMetadata.emailReceivedAt,
                email_sender: messageMetadata.senderEmail,
                email_recipients: messageMetadata.recipients,
              };

              const createdTask = await this.databaseService.createTask(taskData);
              createdCount++;
              console.log(`✅ [DEBUG] Created task: "${createdTask.title}" (Priority: ${createdTask.priority})`);
            }

            // Mark message as parsed
            await this.databaseService.createParsedMessage({
              user_id: userId,
              integration_id: integrationId,
              gmail_message_id: message.id,
              tasks_extracted: messageTasks.length
            });
          }

        } catch (error) {
          console.error(`❌ [DEBUG] Error processing batch ${batchIndex + 1}:`, error);
          // Mark all messages in this batch as parsed with 0 tasks to avoid reprocessing
          for (const message of batch) {
            try {
              await this.databaseService.createParsedMessage({
                user_id: userId,
                integration_id: integrationId,
                gmail_message_id: message.id,
                tasks_extracted: 0
              });
              currentMessageIndex++;
              processedCount++;
            } catch (parseError) {
              console.error(`❌ [DEBUG] Error marking message ${message.id} as parsed:`, parseError);
            }
          }
        }
      }

      console.log(`✅ [DEBUG] Task extraction completed: ${extractedCount} tasks extracted, ${createdCount} tasks created, ${processedCount} messages processed`);
      
      return { extracted: extractedCount, created: createdCount, processed: processedCount };

    } catch (error) {
      console.error('❌ [DEBUG] Task extraction failed:', error);
      throw error;
    }
  }

  async getUnparsedMessageCount(userId: string, integrationId: string): Promise<number> {
    try {
      const gmailService = new GmailService('');
      const integration = await this.databaseService.findIntegrationById(integrationId);
      
      if (!integration || integration.user_id !== userId) {
        return 0;
      }

      const gmail = new GmailService(integration.access_token);
      const messages = await gmail.getMessages(50, 'label:INBOX -label:archive -label:trash -label:spam');
      
      let unparsedCount = 0;
      for (const message of messages) {
        const isAlreadyParsed = await this.databaseService.isMessageParsed(userId, integrationId, message.id);
        if (!isAlreadyParsed) {
          unparsedCount++;
        }
      }
      
      return unparsedCount;
    } catch (error) {
      console.error('Error getting unparsed message count:', error);
      return 0;
    }
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    return await this.databaseService.findTasksByUserId(userId);
  }

  async updateTask(userId: string, taskId: string, updates: Partial<Task>): Promise<Task> {
    const task = await this.databaseService.findTaskById(taskId);
    if (!task || task.user_id !== userId) {
      throw new Error('Task not found or does not belong to user');
    }
    
    return await this.databaseService.updateTask(taskId, updates);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const task = await this.databaseService.findTaskById(taskId);
    if (!task || task.user_id !== userId) {
      throw new Error('Task not found or does not belong to user');
    }
    
    await this.databaseService.deleteTask(taskId);
  }

  // Additional methods for TaskController compatibility
  async getUserTasks(userId: string): Promise<Task[]> {
    return await this.getTasksByUserId(userId);
  }

  async updateTaskStatus(taskId: string, status: string): Promise<Task> {
    // For backward compatibility, we'll need the userId from the task
    const task = await this.databaseService.findTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    return await this.updateTask(task.user_id, taskId, { status: status as any });
  }

  async resetMessageTracking(userId: string, integrationId: string): Promise<void> {
    await this.databaseService.clearParsedMessages(userId, integrationId);
  }

  async getIntegrationsForUser(userId: string): Promise<any[]> {
    return await this.databaseService.findIntegrationsByUserId(userId);
  }

  async isOllamaAvailable(): Promise<boolean> {
    return await this.ollamaProvider.isAvailable();
  }
}
