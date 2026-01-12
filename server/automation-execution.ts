import { db } from './db';
import { crmAutomations, crmAutomationSteps, crmAutomationRuns, crmAutomationStepRuns, leads, multiServiceLeads, crmSettings, leadTagAssignments } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import Twilio from 'twilio';
import { Resend } from 'resend';
import { decrypt } from './encryption';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get the correct base URL for links
function getBaseUrl(): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return process.env.DOMAIN || 'https://localhost:5000';
}

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
  fromName?: string;
  replyToEmail?: string;
  duration?: number;
  durationUnit?: 'minutes' | 'hours' | 'days';
  newStage?: string;
  taskTitle?: string;
  taskDescription?: string;
  tagId?: number;
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
    
    // Lead pricing link variables (if estimate number is available)
    result = result.replace(/\{lead\.pricingLink\}/g, 
      (context.leadData as any)?.estimateNumber
        ? `${getBaseUrl()}/estimate/${(context.leadData as any).estimateNumber}`
        : ''
    );
    result = result.replace(/\{lead\.pricingButton\}/g, 
      (context.leadData as any)?.estimateNumber
        ? `<div style="text-align: center; margin: 30px 0;"><a href="${getBaseUrl()}/estimate/${(context.leadData as any).estimateNumber}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">View Your Pricing</a></div>`
        : ''
    );
    
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
    result = result.replace(/\{estimate\.link\}/g, 
      context.estimateData?.estimateNumber
        ? `${getBaseUrl()}/estimate/${context.estimateData.estimateNumber}`
        : ''
    );
    result = result.replace(/\{estimate\.button\}/g, 
      context.estimateData?.estimateNumber
        ? `<div style="text-align: center; margin: 30px 0;"><a href="${getBaseUrl()}/estimate/${context.estimateData.estimateNumber}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">View Estimate</a></div>`
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
    result = result.replace(/\{invoice\.link\}/g, 
      context.invoiceData?.hostedInvoiceUrl || ''
    );
    result = result.replace(/\{invoice\.button\}/g, 
      context.invoiceData?.hostedInvoiceUrl
        ? `<div style="text-align: center; margin: 30px 0;"><a href="${context.invoiceData.hostedInvoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.3);">Pay Invoice</a></div>`
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
    businessSettings: any,
    crmSettings: any
  ): Promise<void> {
    const config = (step.stepConfig ?? step.config ?? {}) as StepConfig;

    switch (step.stepType) {
      case 'send_email':
        await this.executeSendEmail(config, context, businessSettings);
        break;
      
      case 'send_sms':
        await this.executeSendSms(config, context, crmSettings);
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
      
      case 'add_tag':
        await this.executeAddTag(config, context);
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

    // Use step-level overrides if provided, otherwise fall back to business settings
    const fromName = config.fromName || businessSettings?.emailFromName || businessSettings?.businessName || 'Autobidder';
    const replyToEmail = config.replyToEmail || businessSettings?.replyToEmail;

    try {
      // Use the unified email system with fallback support
      const { sendEmailWithFallback } = await import('./email-providers');
      
      const success = await sendEmailWithFallback({
        fromName: fromName,
        to: recipientEmail,
        replyTo: replyToEmail,
        subject: subject,
        html: body.replace(/\n/g, '<br>'),
      });

      if (!success) {
        throw new Error('Failed to send email through all providers');
      }

      console.log(`Email sent to ${recipientEmail}: ${subject} (from: ${fromName}${replyToEmail ? ', reply-to: ' + replyToEmail : ''})`);
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
    crmSettings: any
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

    // Check if Twilio is configured for this business (from CRM settings)
    if (!crmSettings?.twilioAccountSid || 
        !crmSettings?.twilioAuthToken || 
        !crmSettings?.twilioPhoneNumber) {
      console.warn('Cannot send SMS: Twilio not configured for this business');
      return;
    }

    const message = this.replaceVariables(config.body, context);

    try {
      // Decrypt the auth token
      const authToken = decrypt(crmSettings.twilioAuthToken);
      
      // Validate decrypted credentials
      if (!authToken || authToken.trim() === '') {
        console.warn('Cannot send SMS: Twilio auth token is empty after decryption');
        return;
      }
      
      const client = Twilio(crmSettings.twilioAccountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: crmSettings.twilioPhoneNumber,
        to: recipientPhone,
      });

      console.log(`SMS sent to ${recipientPhone}: ${message}`);
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
   * Add tag step - assigns a tag to the lead
   */
  private async executeAddTag(
    config: StepConfig,
    context: AutomationContext
  ): Promise<void> {
    if (!config.tagId) {
      console.warn('Cannot add tag: tagId not specified in step config');
      return;
    }

    try {
      const isMultiService = !!context.multiServiceLeadId;
      const leadId = isMultiService ? context.multiServiceLeadId : context.leadId;

      if (!leadId) {
        console.warn('Cannot add tag: no lead ID found in context');
        return;
      }

      // Insert the tag assignment
      await db.insert(leadTagAssignments).values({
        leadId: isMultiService ? null : leadId,
        multiServiceLeadId: isMultiService ? leadId : null,
        tagId: config.tagId,
        assignedBy: context.userId,
      }).onConflictDoNothing();

      console.log(`Tag ${config.tagId} added to ${isMultiService ? 'multi-service ' : ''}lead ${leadId}`);
    } catch (error) {
      console.error('Failed to add tag to lead:', error);
      throw error;
    }
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

      // Get CRM settings for Twilio configuration
      const userCrmSettings = await db.query.crmSettings.findFirst({
        where: (crmSettings, { eq }) => eq(crmSettings.userId, context.userId),
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
          await this.executeStep(step, context, businessSettings, userCrmSettings);
          
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
   * Create a pending automation run with pre-rendered content
   */
  async createPendingAutomationRun(
    automationId: number,
    context: AutomationContext
  ): Promise<number | null> {
    try {
      // Get automation details
      const automation = await db.query.crmAutomations.findFirst({
        where: eq(crmAutomations.id, automationId),
      });

      if (!automation || !automation.isActive) {
        console.log(`Automation ${automationId} not found or inactive`);
        return null;
      }

      // Get automation steps in order
      const steps = await db.query.crmAutomationSteps.findMany({
        where: eq(crmAutomationSteps.automationId, automationId),
        orderBy: (steps, { asc }) => [asc(steps.stepOrder)],
      });

      // Pre-render step content with variable replacement
      const pendingStepsData = steps.map(step => {
        const config = (step.stepConfig ?? {}) as StepConfig;
        const renderedConfig: any = {};

        // Render variables for email/SMS steps
        if (step.stepType === 'send_email') {
          renderedConfig.subject = config.subject ? this.replaceVariables(config.subject, context) : '';
          renderedConfig.body = config.body ? this.replaceVariables(config.body, context) : '';
          renderedConfig.fromName = config.fromName || '';
          renderedConfig.replyToEmail = config.replyToEmail || '';
        } else if (step.stepType === 'send_sms') {
          renderedConfig.body = config.body ? this.replaceVariables(config.body, context) : '';
        } else if (step.stepType === 'wait') {
          renderedConfig.duration = config.duration || 1;
          renderedConfig.durationUnit = config.durationUnit || 'hours';
        } else if (step.stepType === 'update_stage') {
          renderedConfig.newStage = config.newStage || '';
        } else if (step.stepType === 'create_task') {
          renderedConfig.taskTitle = config.taskTitle ? this.replaceVariables(config.taskTitle, context) : '';
          renderedConfig.taskDescription = config.taskDescription ? this.replaceVariables(config.taskDescription, context) : '';
        }

        return {
          stepId: step.id,
          stepType: step.stepType,
          stepOrder: step.stepOrder,
          renderedConfig,
        };
      });

      // Create pending automation run
      const [automationRun] = await db.insert(crmAutomationRuns).values({
        automationId,
        userId: context.userId,
        leadId: context.leadId || null,
        multiServiceLeadId: context.multiServiceLeadId || null,
        estimateId: context.estimateId || null,
        status: 'pending_confirmation',
        pendingStepsData,
      }).returning();

      console.log(`Created pending automation run ${automationRun.id} for automation "${automation.name}"`);
      return automationRun.id;
    } catch (error) {
      console.error(`Error creating pending automation run:`, error);
      throw error;
    }
  }

  /**
   * Confirm and execute a pending automation run
   */
  async confirmPendingRun(
    runId: number,
    editedStepsData?: Array<{
      stepId: number;
      renderedConfig: any;
    }>
  ): Promise<void> {
    try {
      // Get the pending run
      const run = await db.query.crmAutomationRuns.findFirst({
        where: eq(crmAutomationRuns.id, runId),
      });

      if (!run || run.status !== 'pending_confirmation') {
        throw new Error('Pending run not found or already processed');
      }

      // Get automation and steps
      const automation = await db.query.crmAutomations.findFirst({
        where: eq(crmAutomations.id, run.automationId),
      });

      if (!automation) {
        throw new Error('Automation not found');
      }

      const steps = await db.query.crmAutomationSteps.findMany({
        where: eq(crmAutomationSteps.automationId, run.automationId),
        orderBy: (steps, { asc }) => [asc(steps.stepOrder)],
      });

      // Get business settings for email/SMS
      const businessSettings = await db.query.businessSettings.findFirst({
        where: (businessSettings, { eq }) => eq(businessSettings.userId, run.userId),
      });

      // Get CRM settings for Twilio configuration
      const userCrmSettings = await db.query.crmSettings.findFirst({
        where: (crmSettings, { eq }) => eq(crmSettings.userId, run.userId),
      });

      // Update status to running
      await db.update(crmAutomationRuns)
        .set({ status: 'running' })
        .where(eq(crmAutomationRuns.id, runId));

      // Reconstruct context from run data
      const context: AutomationContext = {
        userId: run.userId,
        leadId: run.leadId || undefined,
        multiServiceLeadId: run.multiServiceLeadId || undefined,
        estimateId: run.estimateId || undefined,
      };

      // Execute each step with edited or original content
      for (const step of steps) {
        const [stepRun] = await db.insert(crmAutomationStepRuns).values({
          automationRunId: run.id,
          stepId: step.id,
          status: 'running',
          startedAt: new Date(),
        }).returning();

        try {
          // Find edited config if provided
          const editedStep = editedStepsData?.find(s => s.stepId === step.id);
          const configToUse = editedStep?.renderedConfig || 
            (run.pendingStepsData as any[])?.find((s: any) => s.stepId === step.id)?.renderedConfig;

          if (configToUse) {
            // Execute step with the confirmed/edited config
            console.log(`Executing step ${step.stepOrder}: ${step.stepType} with confirmed content`);
            
            if (step.stepType === 'send_email' && configToUse.subject && configToUse.body) {
              await this.executeSendEmail(configToUse as StepConfig, context, businessSettings);
            } else if (step.stepType === 'send_sms' && configToUse.body) {
              await this.executeSendSms(configToUse as StepConfig, context, userCrmSettings);
            } else if (step.stepType === 'wait') {
              await this.executeWait(configToUse as StepConfig);
            } else if (step.stepType === 'update_stage') {
              await this.executeUpdateStage(configToUse as StepConfig, context);
            } else if (step.stepType === 'create_task') {
              await this.executeCreateTask(configToUse as StepConfig, context);
            }
          }

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
        .where(eq(crmAutomationRuns.id, runId));

      console.log(`Completed pending automation run ${runId}`);
    } catch (error) {
      console.error(`Error confirming pending run ${runId}:`, error);
      
      // Mark as failed
      await db.update(crmAutomationRuns)
        .set({ 
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : String(error),
        })
        .where(eq(crmAutomationRuns.id, runId));

      throw error;
    }
  }

  /**
   * Cancel a pending automation run
   */
  async cancelPendingRun(runId: number): Promise<void> {
    await db.update(crmAutomationRuns)
      .set({ 
        status: 'cancelled',
        completedAt: new Date(),
      })
      .where(eq(crmAutomationRuns.id, runId));

    console.log(`Cancelled pending automation run ${runId}`);
  }

  /**
   * Trigger automations based on an event
   */
  async triggerAutomations(
    triggerType: string,
    context: AutomationContext,
    isManualTrigger: boolean = false
  ): Promise<number[]> {
    const pendingRunIds: number[] = [];

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

      for (const automation of automations) {
        // If automation requires confirmation and this is a manual trigger, create pending run
        if (automation.requiresConfirmation && isManualTrigger) {
          const runId = await this.createPendingAutomationRun(automation.id, context);
          if (runId) {
            pendingRunIds.push(runId);
          }
        } else {
          // Execute immediately
          await this.executeAutomation(automation.id, context).catch(error => {
            console.error(`Failed to execute automation ${automation.id}:`, error);
          });
        }
      }

      return pendingRunIds;
    } catch (error) {
      console.error(`Error triggering automations for ${triggerType}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const automationService = new AutomationExecutionService();
