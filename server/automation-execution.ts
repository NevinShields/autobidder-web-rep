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
  estimateId?: number;
  workOrderId?: number;
  invoiceId?: number;
  leadData?: {
    name: string;
    email: string;
    phone?: string;
    calculatedPrice?: number;
    stage?: string;
    source?: string;
    [key: string]: any;
  };
  estimateData?: {
    id: number;
    total: number;
    status: string;
    customerName?: string;
    customerEmail?: string;
    validUntil?: Date;
    [key: string]: any;
  };
  workOrderData?: {
    id: number;
    title: string;
    description?: string;
    scheduledDate?: Date;
    status: string;
    [key: string]: any;
  };
  invoiceData?: {
    id: number;
    amount: number;
    status: string;
    dueDate?: Date;
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
   * Replace variables in text with actual values from context data
   * Always replaces ALL tokens to prevent placeholders leaking to customers
   */
  private replaceVariables(text: string, context: AutomationContext): string {
    let result = text;
    
    // Lead data variables - always replace, even if context.leadData is missing
    result = result.replace(/\{lead\.name\}/g, context.leadData?.name || '');
    result = result.replace(/\{lead\.email\}/g, context.leadData?.email || '');
    result = result.replace(/\{lead\.phone\}/g, context.leadData?.phone || '');
    result = result.replace(/\{lead\.stage\}/g, context.leadData?.stage || '');
    result = result.replace(/\{lead\.source\}/g, context.leadData?.source || '');
    result = result.replace(/\{lead\.price\}/g, 
      context.leadData?.calculatedPrice !== undefined
        ? `$${((context.leadData.calculatedPrice) / 100).toFixed(2)}`
        : ''
    );
    result = result.replace(/\{lead\.totalPrice\}/g, 
      context.leadData?.calculatedPrice !== undefined
        ? `$${((context.leadData.calculatedPrice) / 100).toFixed(2)}`
        : ''
    );
    
    // Services table variable - format as HTML table
    result = result.replace(/\{lead\.servicesTable\}/g, () => {
      if (!context.leadData?.services || !Array.isArray(context.leadData.services)) {
        return '';
      }
      
      const services = context.leadData.services as Array<{ formulaName: string; calculatedPrice: number }>;
      if (services.length === 0) return '';
      
      let table = '\n\nServices:\n';
      table += '─'.repeat(50) + '\n';
      
      services.forEach((service: any) => {
        const serviceName = service.formulaName || 'Service';
        const price = service.calculatedPrice !== undefined 
          ? `$${((service.calculatedPrice) / 100).toFixed(2)}`
          : '$0.00';
        table += `${serviceName.padEnd(35)} ${price.padStart(10)}\n`;
      });
      
      table += '─'.repeat(50) + '\n';
      const total = context.leadData?.calculatedPrice !== undefined
        ? `$${((context.leadData.calculatedPrice) / 100).toFixed(2)}`
        : '$0.00';
      table += `${'TOTAL'.padEnd(35)} ${total.padStart(10)}\n`;
      
      return table;
    });
    
    // Legacy support for old variable format
    result = result.replace(/\{name\}/g, context.leadData?.name || '');
    result = result.replace(/\{email\}/g, context.leadData?.email || '');
    result = result.replace(/\{phone\}/g, context.leadData?.phone || '');
    result = result.replace(/\{calculatedPrice\}/g, 
      context.leadData?.calculatedPrice !== undefined
        ? `$${((context.leadData.calculatedPrice) / 100).toFixed(2)}`
        : ''
    );
    
    // Estimate data variables - always replace
    result = result.replace(/\{estimate\.id\}/g, context.estimateData?.id ? String(context.estimateData.id) : '');
    result = result.replace(/\{estimate\.total\}/g, 
      context.estimateData?.total !== undefined
        ? `$${((context.estimateData.total) / 100).toFixed(2)}`
        : ''
    );
    result = result.replace(/\{estimate\.status\}/g, context.estimateData?.status || '');
    result = result.replace(/\{estimate\.customerName\}/g, context.estimateData?.customerName || '');
    result = result.replace(/\{estimate\.customerEmail\}/g, context.estimateData?.customerEmail || '');
    result = result.replace(/\{estimate\.validUntil\}/g, 
      context.estimateData?.validUntil
        ? new Date(context.estimateData.validUntil).toLocaleDateString()
        : ''
    );
    
    // Work order data variables - always replace
    result = result.replace(/\{workOrder\.id\}/g, context.workOrderData?.id ? String(context.workOrderData.id) : '');
    result = result.replace(/\{workOrder\.title\}/g, context.workOrderData?.title || '');
    result = result.replace(/\{workOrder\.description\}/g, context.workOrderData?.description || '');
    result = result.replace(/\{workOrder\.status\}/g, context.workOrderData?.status || '');
    result = result.replace(/\{workOrder\.scheduledDate\}/g, 
      context.workOrderData?.scheduledDate
        ? new Date(context.workOrderData.scheduledDate).toLocaleDateString()
        : ''
    );
    
    // Invoice data variables - always replace
    result = result.replace(/\{invoice\.id\}/g, context.invoiceData?.id ? String(context.invoiceData.id) : '');
    result = result.replace(/\{invoice\.amount\}/g, 
      context.invoiceData?.amount !== undefined
        ? `$${((context.invoiceData.amount) / 100).toFixed(2)}`
        : ''
    );
    result = result.replace(/\{invoice\.status\}/g, context.invoiceData?.status || '');
    result = result.replace(/\{invoice\.dueDate\}/g, 
      context.invoiceData?.dueDate
        ? new Date(context.invoiceData.dueDate).toLocaleDateString()
        : ''
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
    const config = (step.stepConfig ?? step.config ?? {}) as StepConfig;

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

    // Determine recipient email from context
    const recipientEmail = 
      context.estimateData?.customerEmail || 
      context.leadData?.email;
    
    if (!recipientEmail) {
      throw new Error('No recipient email found in context');
    }

    try {
      await resend.emails.send({
        from: businessSettings?.emailFrom || 'noreply@autobidder.org',
        to: recipientEmail,
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log(`Email sent to ${recipientEmail}: ${subject}`);
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

    // Determine recipient phone from context
    const recipientPhone = context.leadData?.phone;
    
    if (!recipientPhone) {
      console.warn('Cannot send SMS: no phone number found in context');
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
        to: recipientPhone,
      });

      console.log(`SMS sent to ${recipientPhone}`);
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
        leadId: context.leadId || null,
        multiServiceLeadId: context.multiServiceLeadId || null,
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
          stepId: step.id,
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
              errorMessage: stepError instanceof Error ? stepError.message : String(stepError),
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
            errorMessage: error instanceof Error ? error.message : String(error),
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
