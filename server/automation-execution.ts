import { db } from './db';
import { crmAutomations, crmAutomationSteps, crmAutomationRuns, crmAutomationStepRuns, leads, multiServiceLeads } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import Twilio from 'twilio';
import { Resend } from 'resend';
import { decrypt } from './encryption';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AutomationContext {
  userId: string;
  leadId?: number;
  multiServiceLeadId?: number;
  leadData: {
    name: string;
    email: string;
    phone?: string;
    calculatedPrice: number;
    [key: string]: any;
  };
}

interface StepConfig {
  subject?: string;
  body?: string;
  duration?: number;
  durationUnit?: 'minutes' | 'hours' | 'days';
  newStage?: string;
  taskTitle?: string;
  taskDescription?: string;
}

export class AutomationExecutionService {
  
  /**
   * Replace variables in text with actual values from lead data
   */
  private replaceVariables(text: string, context: AutomationContext): string {
    let result = text;
    
    // Replace common variables
    result = result.replace(/\{name\}/g, context.leadData.name || '');
    result = result.replace(/\{email\}/g, context.leadData.email || '');
    result = result.replace(/\{phone\}/g, context.leadData.phone || '');
    result = result.replace(/\{calculatedPrice\}/g, 
      `$${((context.leadData.calculatedPrice || 0) / 100).toFixed(2)}`
    );
    
    return result;
  }

  /**
   * Execute a single automation step
   */
  private async executeStep(
    step: any,
    context: AutomationContext,
    businessSettings: any
  ): Promise<void> {
    const config: StepConfig = step.config || {};

    switch (step.stepType) {
      case 'send_email':
        await this.executeSendEmail(config, context, businessSettings);
        break;
      
      case 'send_sms':
        await this.executeSendSms(config, context, businessSettings);
        break;
      
      case 'wait':
        await this.executeWait(config);
        break;
      
      case 'update_stage':
        await this.executeUpdateStage(config, context);
        break;
      
      case 'create_task':
        await this.executeCreateTask(config, context);
        break;
      
      default:
        console.warn(`Unknown step type: ${step.stepType}`);
    }
  }

  /**
   * Send email step
   */
  private async executeSendEmail(
    config: StepConfig,
    context: AutomationContext,
    businessSettings: any
  ): Promise<void> {
    if (!config.subject || !config.body) {
      throw new Error('Email subject and body are required');
    }

    const subject = this.replaceVariables(config.subject, context);
    const body = this.replaceVariables(config.body, context);

    try {
      await resend.emails.send({
        from: businessSettings?.emailFrom || 'noreply@autobidder.org',
        to: context.leadData.email,
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log(`Email sent to ${context.leadData.email}: ${subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send SMS step
   */
  private async executeSendSms(
    config: StepConfig,
    context: AutomationContext,
    businessSettings: any
  ): Promise<void> {
    if (!config.body) {
      throw new Error('SMS message body is required');
    }

    if (!context.leadData.phone) {
      console.warn('Cannot send SMS: lead has no phone number');
      return;
    }

    // Check if Twilio is configured for this business
    if (!businessSettings?.twilioAccountSid || 
        !businessSettings?.twilioAuthToken || 
        !businessSettings?.twilioPhoneNumber) {
      console.warn('Cannot send SMS: Twilio not configured for this business');
      return;
    }

    const message = this.replaceVariables(config.body, context);

    try {
      // Decrypt the auth token
      const authToken = decrypt(businessSettings.twilioAuthToken);
      
      // Validate decrypted credentials
      if (!authToken || authToken.trim() === '') {
        console.warn('Cannot send SMS: Twilio auth token is empty after decryption');
        return;
      }
      
      const client = Twilio(businessSettings.twilioAccountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: businessSettings.twilioPhoneNumber,
        to: context.leadData.phone,
      });

      console.log(`SMS sent to ${context.leadData.phone}`);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Wait/Delay step
   */
  private async executeWait(config: StepConfig): Promise<void> {
    const duration = config.duration || 1;
    const unit = config.durationUnit || 'hours';
    
    let milliseconds = 0;
    switch (unit) {
      case 'minutes':
        milliseconds = duration * 60 * 1000;
        break;
      case 'hours':
        milliseconds = duration * 60 * 60 * 1000;
        break;
      case 'days':
        milliseconds = duration * 24 * 60 * 60 * 1000;
        break;
    }

    console.log(`Waiting ${duration} ${unit}...`);
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Update lead stage step
   */
  private async executeUpdateStage(
    config: StepConfig,
    context: AutomationContext
  ): Promise<void> {
    if (!config.newStage) {
      throw new Error('New stage is required');
    }

    try {
      if (context.leadId) {
        // Update single-service lead
        await db
          .update(leads)
          .set({ stage: config.newStage })
          .where(eq(leads.id, context.leadId));
        
        console.log(`Updated lead ${context.leadId} to stage: ${config.newStage}`);
      } else if (context.multiServiceLeadId) {
        // Update multi-service lead
        await db
          .update(multiServiceLeads)
          .set({ stage: config.newStage })
          .where(eq(multiServiceLeads.id, context.multiServiceLeadId));
        
        console.log(`Updated multi-service lead ${context.multiServiceLeadId} to stage: ${config.newStage}`);
      }
    } catch (error) {
      console.error('Failed to update lead stage:', error);
      throw error;
    }
  }

  /**
   * Create task step
   */
  private async executeCreateTask(
    config: StepConfig,
    context: AutomationContext
  ): Promise<void> {
    if (!config.taskTitle) {
      throw new Error('Task title is required');
    }

    const title = this.replaceVariables(config.taskTitle, context);
    const description = config.taskDescription 
      ? this.replaceVariables(config.taskDescription, context)
      : '';

    // TODO: Integrate with task management system when it's built
    // For now, just log the task creation
    console.log(`Task created: ${title}`);
    if (description) {
      console.log(`Description: ${description}`);
    }
    console.log(`Associated with lead: ${context.leadId || context.multiServiceLeadId}`);
  }

  /**
   * Execute an entire automation workflow
   */
  async executeAutomation(
    automationId: number,
    context: AutomationContext
  ): Promise<void> {
    let automationRunId: number | null = null;
    
    try {
      // Get automation details
      const automation = await db.query.crmAutomations.findFirst({
        where: eq(crmAutomations.id, automationId),
      });

      if (!automation || !automation.isActive) {
        console.log(`Automation ${automationId} not found or inactive`);
        return;
      }

      // Create automation run record
      const [automationRun] = await db.insert(crmAutomationRuns).values({
        automationId,
        userId: context.userId,
        triggerContext: {
          leadId: context.leadId,
          multiServiceLeadId: context.multiServiceLeadId,
        },
        status: 'running',
      }).returning();
      
      automationRunId = automationRun.id;

      // Get business settings for email/SMS
      const businessSettings = await db.query.businessSettings.findFirst({
        where: (businessSettings, { eq }) => eq(businessSettings.userId, context.userId),
      });

      // Get automation steps in order
      const steps = await db.query.crmAutomationSteps.findMany({
        where: eq(crmAutomationSteps.automationId, automationId),
        orderBy: (steps, { asc }) => [asc(steps.stepOrder)],
      });

      console.log(`Executing automation "${automation.name}" with ${steps.length} steps`);

      // Execute each step in sequence
      for (const step of steps) {
        // Create step run record
        const [stepRun] = await db.insert(crmAutomationStepRuns).values({
          automationRunId: automationRun.id,
          automationStepId: step.id,
          status: 'running',
          startedAt: new Date(),
        }).returning();

        try {
          console.log(`Executing step ${step.stepOrder}: ${step.stepType}`);
          await this.executeStep(step, context, businessSettings);
          
          // Mark step as completed
          await db.update(crmAutomationStepRuns)
            .set({ 
              status: 'completed',
              completedAt: new Date(),
            })
            .where(eq(crmAutomationStepRuns.id, stepRun.id));
          
        } catch (stepError) {
          // Mark step as failed
          await db.update(crmAutomationStepRuns)
            .set({ 
              status: 'failed',
              completedAt: new Date(),
              error: stepError instanceof Error ? stepError.message : String(stepError),
            })
            .where(eq(crmAutomationStepRuns.id, stepRun.id));
          
          throw stepError;
        }
      }

      // Mark automation run as completed
      await db.update(crmAutomationRuns)
        .set({ 
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(crmAutomationRuns.id, automationRun.id));

      console.log(`Automation "${automation.name}" completed successfully`);
    } catch (error) {
      console.error(`Error executing automation ${automationId}:`, error);
      
      // Mark automation run as failed
      if (automationRunId) {
        await db.update(crmAutomationRuns)
          .set({ 
            status: 'failed',
            completedAt: new Date(),
            error: error instanceof Error ? error.message : String(error),
          })
          .where(eq(crmAutomationRuns.id, automationRunId));
      }
      
      throw error;
    }
  }

  /**
   * Trigger automations based on an event
   */
  async triggerAutomations(
    triggerType: string,
    context: AutomationContext
  ): Promise<void> {
    try {
      // Find all active automations for this user and trigger type
      const automations = await db.query.crmAutomations.findMany({
        where: and(
          eq(crmAutomations.userId, context.userId),
          eq(crmAutomations.triggerType, triggerType),
          eq(crmAutomations.isActive, true)
        ),
      });

      console.log(`Found ${automations.length} automations for trigger: ${triggerType}`);

      // Execute each automation (in parallel for better performance)
      await Promise.all(
        automations.map(automation => 
          this.executeAutomation(automation.id, context)
            .catch(error => {
              console.error(`Failed to execute automation ${automation.id}:`, error);
              // Don't throw - continue with other automations
            })
        )
      );
    } catch (error) {
      console.error(`Error triggering automations for ${triggerType}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const automationService = new AutomationExecutionService();
