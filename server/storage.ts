import { 
  formulas, 
  formulaTemplates,
  leads, 
  multiServiceLeads, 
  businessSettings,
  availabilitySlots,
  recurringAvailability,
  users,
  websites,
  customWebsiteTemplates,
  onboardingProgress,
  customForms,
  customFormLeads,
  supportTickets,
  ticketMessages,
  estimates,
  emailSettings,
  emailTemplates,
  bidRequests,
  bidResponses,
  bidEmailTemplates,
  icons,
  type Formula, 
  type InsertFormula, 
  type FormulaTemplate,
  type InsertFormulaTemplate,
  type Lead, 
  type InsertLead, 
  type MultiServiceLead, 
  type InsertMultiServiceLead, 
  type BusinessSettings, 
  type InsertBusinessSettings,
  type AvailabilitySlot,
  type InsertAvailabilitySlot,
  type RecurringAvailability,
  type InsertRecurringAvailability,
  type User,
  type UpsertUser,
  type InsertUser,
  type UpdateUser,
  type Website,
  type InsertWebsite,
  type CustomWebsiteTemplate,
  type InsertCustomWebsiteTemplate,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type CustomForm,
  type InsertCustomForm,
  type CustomFormLead,
  type InsertCustomFormLead,
  type SupportTicket,
  type InsertSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type Estimate,
  type InsertEstimate,
  type EmailSettings,
  type InsertEmailSettings,
  type EmailTemplate,
  type InsertEmailTemplate,
  type BidRequest,
  type InsertBidRequest,
  type BidResponse,
  type InsertBidResponse,
  type BidEmailTemplate,
  type InsertBidEmailTemplate,
  type Icon,
  type InsertIcon
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, gte, lte, count, desc, sql, lt } from "drizzle-orm";

export interface IStorage {
  // Formula operations
  getFormula(id: number): Promise<Formula | undefined>;
  getFormulaByEmbedId(embedId: string): Promise<Formula | undefined>;
  getAllFormulas(): Promise<Formula[]>;
  getAllDisplayedFormulas(): Promise<Formula[]>;
  getFormulasByUserId(userId: string): Promise<Formula[]>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<boolean>;
  
  // Formula Template operations
  getFormulaTemplate(id: number): Promise<FormulaTemplate | undefined>;
  getAllFormulaTemplates(): Promise<FormulaTemplate[]>;
  getActiveFormulaTemplates(): Promise<FormulaTemplate[]>;
  getFormulaTemplatesByCategory(category: string): Promise<FormulaTemplate[]>;
  createFormulaTemplate(template: InsertFormulaTemplate): Promise<FormulaTemplate>;
  updateFormulaTemplate(id: number, template: Partial<InsertFormulaTemplate>): Promise<FormulaTemplate | undefined>;
  deleteFormulaTemplate(id: number): Promise<boolean>;
  incrementTemplateUsage(id: number): Promise<void>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByFormulaId(formulaId: number): Promise<Lead[]>;
  getLeadsByUserId(userId: string): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  deleteLead(id: number): Promise<boolean>;
  
  // Multi-service lead operations
  getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined>;
  getAllMultiServiceLeads(): Promise<MultiServiceLead[]>;
  getMultiServiceLeadsByUserId(userId: string): Promise<MultiServiceLead[]>;
  createMultiServiceLead(lead: InsertMultiServiceLead): Promise<MultiServiceLead>;
  deleteMultiServiceLead(id: number): Promise<boolean>;
  
  // Estimate operations
  getEstimate(id: number): Promise<Estimate | undefined>;
  getEstimateByNumber(estimateNumber: string): Promise<Estimate | undefined>;
  getAllEstimates(): Promise<Estimate[]>;
  getEstimatesByLeadId(leadId: number): Promise<Estimate[]>;
  getEstimatesByMultiServiceLeadId(multiServiceLeadId: number): Promise<Estimate[]>;
  createEstimate(estimate: InsertEstimate): Promise<Estimate>;
  updateEstimate(id: number, estimate: Partial<InsertEstimate>): Promise<Estimate | undefined>;
  deleteEstimate(id: number): Promise<boolean>;
  
  // Business settings operations
  getBusinessSettings(): Promise<BusinessSettings | undefined>;
  getBusinessSettingsByUserId(userId: string): Promise<BusinessSettings | undefined>;
  createBusinessSettings(settings: InsertBusinessSettings): Promise<BusinessSettings>;
  updateBusinessSettings(id: number, settings: Partial<InsertBusinessSettings>): Promise<BusinessSettings | undefined>;
  
  // Calendar operations
  getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined>;
  getAvailabilitySlotsByDate(date: string): Promise<AvailabilitySlot[]>;
  getAvailableSlotsByDateRange(startDate: string, endDate: string): Promise<AvailabilitySlot[]>;
  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot | undefined>;
  deleteAvailabilitySlot(id: number): Promise<boolean>;
  bookSlot(slotId: number, leadId: number): Promise<AvailabilitySlot | undefined>;
  
  // Recurring availability operations
  getRecurringAvailability(): Promise<RecurringAvailability[]>;
  createRecurringAvailability(availability: InsertRecurringAvailability): Promise<RecurringAvailability>;
  updateRecurringAvailability(id: number, availability: Partial<InsertRecurringAvailability>): Promise<RecurringAvailability | undefined>;
  deleteRecurringAvailability(id: number): Promise<boolean>;
  
  // User operations (IMPORTANT) these are mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management operations
  getUsersByOwner(ownerId: string): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: string, user: Partial<UpdateUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createEmployee(employee: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<any>;
  
  // Recurring availability operations (missing)
  clearAllRecurringAvailability(): Promise<number>;
  saveWeeklySchedule(schedule: Record<string, any>): Promise<RecurringAvailability[]>;
  
  // Website operations
  getWebsite(id: number): Promise<Website | undefined>;
  getWebsitesByUserId(userId: string): Promise<Website[]>;
  getAllWebsites(): Promise<Website[]>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: number, website: Partial<InsertWebsite>): Promise<Website | undefined>;
  deleteWebsite(id: number): Promise<boolean>;
  getWebsiteBySiteName(siteName: string): Promise<Website | undefined>;
  
  // Custom Website Template operations
  getCustomWebsiteTemplate(id: number): Promise<CustomWebsiteTemplate | undefined>;
  getAllCustomWebsiteTemplates(): Promise<CustomWebsiteTemplate[]>;
  getActiveCustomWebsiteTemplates(): Promise<CustomWebsiteTemplate[]>;
  getCustomWebsiteTemplatesByIndustry(industry: string): Promise<CustomWebsiteTemplate[]>;
  createCustomWebsiteTemplate(template: InsertCustomWebsiteTemplate): Promise<CustomWebsiteTemplate>;
  updateCustomWebsiteTemplate(id: number, template: Partial<InsertCustomWebsiteTemplate>): Promise<CustomWebsiteTemplate | undefined>;
  deleteCustomWebsiteTemplate(id: number): Promise<boolean>;

  // Onboarding operations
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, progress: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined>;
  updateUserOnboardingStep(userId: string, step: number, businessInfo?: any): Promise<User | undefined>;

  // Custom Forms operations
  getCustomFormById(id: number): Promise<CustomForm | undefined>;
  getCustomFormByEmbedId(embedId: string): Promise<CustomForm | undefined>;
  getAllCustomForms(): Promise<CustomForm[]>;
  createCustomForm(form: InsertCustomForm): Promise<CustomForm>;
  updateCustomForm(id: number, form: Partial<InsertCustomForm>): Promise<CustomForm | undefined>;
  deleteCustomForm(id: number): Promise<boolean>;

  // Custom Form Leads operations
  getCustomFormLeads(formId: number): Promise<CustomFormLead[]>;
  createCustomFormLead(lead: InsertCustomFormLead): Promise<CustomFormLead>;

  // Support Ticket operations
  getSupportTicket(id: number): Promise<SupportTicket | undefined>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  deleteSupportTicket(id: number): Promise<boolean>;

  // Ticket Message operations
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  getTicketMessage(id: number): Promise<TicketMessage | undefined>;

  // Email Settings operations
  getEmailSettings(userId: string): Promise<EmailSettings | undefined>;
  createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings>;
  updateEmailSettings(userId: string, settings: Partial<InsertEmailSettings>): Promise<EmailSettings | undefined>;

  // Email Template operations
  getEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // BidRequest operations
  getBidRequest(id: number): Promise<BidRequest | undefined>;
  getBidRequestByToken(token: string): Promise<BidRequest | undefined>;
  getAllBidRequests(): Promise<BidRequest[]>;
  getBidRequestsByBusinessOwner(businessOwnerId: string): Promise<BidRequest[]>;
  createBidRequest(bidRequest: InsertBidRequest): Promise<BidRequest>;
  updateBidRequest(id: number, bidRequest: Partial<InsertBidRequest>): Promise<BidRequest | undefined>;
  deleteBidRequest(id: number): Promise<boolean>;
  markEmailOpened(id: number): Promise<BidRequest | undefined>;

  // Bid Response operations
  getBidResponse(id: number): Promise<BidResponse | undefined>;
  getBidResponsesByBidRequestId(bidRequestId: number): Promise<BidResponse[]>;
  createBidResponse(response: InsertBidResponse): Promise<BidResponse>;
  updateBidResponse(id: number, response: Partial<InsertBidResponse>): Promise<BidResponse | undefined>;

  // Bid Email Template operations
  getBidEmailTemplate(id: number): Promise<BidEmailTemplate | undefined>;
  getBidEmailTemplatesByUserId(userId: string): Promise<BidEmailTemplate[]>;
  getBidEmailTemplateByType(userId: string, templateType: string): Promise<BidEmailTemplate | undefined>;
  createBidEmailTemplate(template: InsertBidEmailTemplate): Promise<BidEmailTemplate>;
  updateBidEmailTemplate(id: number, template: Partial<InsertBidEmailTemplate>): Promise<BidEmailTemplate | undefined>;
  deleteBidEmailTemplate(id: number): Promise<boolean>;

  // Icon operations
  getAllIcons(): Promise<Icon[]>;
  getActiveIcons(): Promise<Icon[]>;
  getIconsByCategory(category: string): Promise<Icon[]>;
  getIcon(id: number): Promise<Icon | undefined>;
  createIcon(icon: InsertIcon): Promise<Icon>;
  updateIcon(id: number, icon: Partial<InsertIcon>): Promise<Icon | undefined>;
  deleteIcon(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Formula operations
  async getFormula(id: number): Promise<Formula | undefined> {
    const [formula] = await db.select().from(formulas).where(eq(formulas.id, id));
    return formula || undefined;
  }

  async getFormulaByEmbedId(embedId: string): Promise<Formula | undefined> {
    const [formula] = await db.select().from(formulas).where(eq(formulas.embedId, embedId));
    return formula || undefined;
  }

  async getAllFormulas(): Promise<Formula[]> {
    return await db.select().from(formulas);
  }

  async getAllDisplayedFormulas(): Promise<Formula[]> {
    return await db.select().from(formulas).where(eq(formulas.isDisplayed, true));
  }

  async getFormulasByUserId(userId: string): Promise<Formula[]> {
    return await db.select().from(formulas).where(eq(formulas.userId, userId));
  }

  async createFormula(insertFormula: InsertFormula): Promise<Formula> {
    const [formula] = await db
      .insert(formulas)
      .values(insertFormula)
      .returning();
    return formula;
  }

  async updateFormula(id: number, updateData: Partial<InsertFormula>): Promise<Formula | undefined> {
    const [formula] = await db
      .update(formulas)
      .set(updateData)
      .where(eq(formulas.id, id))
      .returning();
    return formula || undefined;
  }

  async deleteFormula(id: number): Promise<boolean> {
    const result = await db.delete(formulas).where(eq(formulas.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Formula Template operations
  async getFormulaTemplate(id: number): Promise<FormulaTemplate | undefined> {
    const [template] = await db.select().from(formulaTemplates).where(eq(formulaTemplates.id, id));
    return template || undefined;
  }

  async getAllFormulaTemplates(): Promise<FormulaTemplate[]> {
    return await db.select().from(formulaTemplates).orderBy(desc(formulaTemplates.timesUsed));
  }

  async getActiveFormulaTemplates(): Promise<FormulaTemplate[]> {
    return await db.select().from(formulaTemplates)
      .where(eq(formulaTemplates.isActive, true))
      .orderBy(desc(formulaTemplates.timesUsed));
  }

  async getFormulaTemplatesByCategory(category: string): Promise<FormulaTemplate[]> {
    return await db.select().from(formulaTemplates)
      .where(and(eq(formulaTemplates.category, category), eq(formulaTemplates.isActive, true)))
      .orderBy(desc(formulaTemplates.timesUsed));
  }

  async createFormulaTemplate(insertTemplate: InsertFormulaTemplate): Promise<FormulaTemplate> {
    const [template] = await db
      .insert(formulaTemplates)
      .values({
        ...insertTemplate,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return template;
  }

  async updateFormulaTemplate(id: number, updateData: Partial<InsertFormulaTemplate>): Promise<FormulaTemplate | undefined> {
    const [template] = await db
      .update(formulaTemplates)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(formulaTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteFormulaTemplate(id: number): Promise<boolean> {
    const result = await db.delete(formulaTemplates).where(eq(formulaTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    await db
      .update(formulaTemplates)
      .set({
        timesUsed: sql`${formulaTemplates.timesUsed} + 1`,
        updatedAt: new Date()
      })
      .where(eq(formulaTemplates.id, id));
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByFormulaId(formulaId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.formulaId, formulaId));
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async getLeadsByUserId(userId: string): Promise<Lead[]> {
    // Get leads by joining with formulas to filter by userId
    const userLeads = await db.select({
      id: leads.id,
      formulaId: leads.formulaId,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      calculatedPrice: leads.calculatedPrice,
      variables: leads.variables,
      stage: leads.stage,
      address: leads.address,
      notes: leads.notes,
      createdAt: leads.createdAt,
      formulaName: formulas.name,
    })
    .from(leads)
    .leftJoin(formulas, eq(leads.formulaId, formulas.id))
    .where(eq(formulas.userId, userId))
    .orderBy(desc(leads.createdAt));

    return userLeads.map(lead => ({
      ...lead,
      formulaName: lead.formulaName || 'Unknown',
    }));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        createdAt: new Date()
      })
      .returning();
    return lead;
  }

  async updateLeadStage(id: number, stage: string): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ stage })
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Multi-service lead operations
  async getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined> {
    const [lead] = await db.select().from(multiServiceLeads).where(eq(multiServiceLeads.id, id));
    return lead || undefined;
  }

  async getAllMultiServiceLeads(): Promise<MultiServiceLead[]> {
    return await db.select().from(multiServiceLeads);
  }

  async getMultiServiceLeadsByUserId(userId: string): Promise<MultiServiceLead[]> {
    // Multi-service leads need to be filtered by the userId in the services field
    // Since services contain formulaId, we need to check if any of the formula IDs belong to the user
    const allLeads = await db.select().from(multiServiceLeads).orderBy(desc(multiServiceLeads.createdAt));
    
    // Get all formula IDs for this user
    const userFormulas = await db.select({ id: formulas.id }).from(formulas).where(eq(formulas.userId, userId));
    const userFormulaIds = userFormulas.map(f => f.id);
    
    // Filter leads that contain at least one service from this user
    const userLeads = allLeads.filter(lead => {
      if (!lead.services || !Array.isArray(lead.services)) return false;
      return lead.services.some((service: any) => userFormulaIds.includes(service.formulaId));
    });
    
    return userLeads;
  }

  async createMultiServiceLead(insertLead: InsertMultiServiceLead): Promise<MultiServiceLead> {
    const [lead] = await db
      .insert(multiServiceLeads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateMultiServiceLeadStage(id: number, stage: string): Promise<MultiServiceLead | undefined> {
    const [lead] = await db
      .update(multiServiceLeads)
      .set({ stage })
      .where(eq(multiServiceLeads.id, id))
      .returning();
    return lead || undefined;
  }

  async deleteMultiServiceLead(id: number): Promise<boolean> {
    const result = await db.delete(multiServiceLeads).where(eq(multiServiceLeads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Estimate operations
  async getEstimate(id: number): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.id, id));
    return estimate || undefined;
  }

  async getEstimateByNumber(estimateNumber: string): Promise<Estimate | undefined> {
    const [estimate] = await db.select().from(estimates).where(eq(estimates.estimateNumber, estimateNumber));
    return estimate || undefined;
  }

  async getAllEstimates(): Promise<Estimate[]> {
    return await db.select().from(estimates).orderBy(desc(estimates.createdAt));
  }

  async getEstimatesByLeadId(leadId: number): Promise<Estimate[]> {
    return await db.select().from(estimates).where(eq(estimates.leadId, leadId));
  }

  async getEstimatesByMultiServiceLeadId(multiServiceLeadId: number): Promise<Estimate[]> {
    return await db.select().from(estimates).where(eq(estimates.multiServiceLeadId, multiServiceLeadId));
  }

  async createEstimate(insertEstimate: InsertEstimate): Promise<Estimate> {
    const [estimate] = await db
      .insert(estimates)
      .values({
        ...insertEstimate,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return estimate;
  }

  async updateEstimate(id: number, updateData: Partial<InsertEstimate>): Promise<Estimate | undefined> {
    const [estimate] = await db
      .update(estimates)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(estimates.id, id))
      .returning();
    return estimate || undefined;
  }

  async deleteEstimate(id: number): Promise<boolean> {
    const result = await db.delete(estimates).where(eq(estimates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Business settings operations
  async getBusinessSettings(): Promise<BusinessSettings | undefined> {
    const [settings] = await db.select().from(businessSettings).limit(1);
    return settings || undefined;
  }

  async getBusinessSettingsByUserId(userId: string): Promise<BusinessSettings | undefined> {
    const [settings] = await db.select().from(businessSettings).where(eq(businessSettings.userId, userId)).limit(1);
    return settings || undefined;
  }

  async createBusinessSettings(insertSettings: InsertBusinessSettings): Promise<BusinessSettings> {
    const [settings] = await db
      .insert(businessSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateBusinessSettings(id: number, updateData: Partial<InsertBusinessSettings>): Promise<BusinessSettings | undefined> {
    const [settings] = await db
      .update(businessSettings)
      .set(updateData)
      .where(eq(businessSettings.id, id))
      .returning();
    return settings || undefined;
  }

  // Calendar operations
  async getAvailabilitySlot(id: number): Promise<AvailabilitySlot | undefined> {
    const [slot] = await db.select().from(availabilitySlots).where(eq(availabilitySlots.id, id));
    return slot || undefined;
  }

  async getAvailabilitySlotsByDate(date: string): Promise<AvailabilitySlot[]> {
    // First check for existing availability slots in the database
    const existingSlots = await db.select().from(availabilitySlots).where(eq(availabilitySlots.date, date));
    
    // If we have existing slots, return them
    if (existingSlots.length > 0) {
      return existingSlots;
    }
    
    // Otherwise, generate slots from recurring availability
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get recurring availability for this day of week
    const recurringSlots = await db.select()
      .from(recurringAvailability)
      .where(and(
        eq(recurringAvailability.dayOfWeek, dayOfWeek),
        eq(recurringAvailability.isActive, true)
      ));
    
    // Generate availability slots from recurring availability
    const generatedSlots: AvailabilitySlot[] = [];
    let slotId = Date.now(); // Use timestamp as unique ID for generated slots
    
    for (const recurring of recurringSlots) {
      // Parse start and end times
      const [startHour, startMinute] = recurring.startTime.split(':').map(Number);
      const [endHour, endMinute] = recurring.endTime.split(':').map(Number);
      
      // Generate time slots based on duration
      const durationMinutes = recurring.slotDuration || 120; // Default 2 hours
      let currentTime = startHour * 60 + startMinute; // Convert to minutes
      const endTimeMinutes = endHour * 60 + endMinute;
      
      while (currentTime + durationMinutes <= endTimeMinutes) {
        const slotStartHour = Math.floor(currentTime / 60);
        const slotStartMinute = currentTime % 60;
        const slotEndTime = currentTime + durationMinutes;
        const slotEndHour = Math.floor(slotEndTime / 60);
        const slotEndMinuteValue = slotEndTime % 60;
        
        const startTimeString = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
        const endTimeString = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinuteValue.toString().padStart(2, '0')}`;
        
        generatedSlots.push({
          id: slotId++,
          date: date,
          startTime: startTimeString,
          endTime: endTimeString,
          title: recurring.title || 'Available',
          isBooked: false,
          bookedBy: null,
          notes: null,
          createdAt: new Date()
        });
        
        currentTime += durationMinutes;
      }
    }
    
    return generatedSlots;
  }

  async getAvailableSlotsByDateRange(startDate: string, endDate: string): Promise<AvailabilitySlot[]> {
    return await db.select().from(availabilitySlots).where(
      and(
        gte(availabilitySlots.date, startDate),
        lte(availabilitySlots.date, endDate),
        eq(availabilitySlots.isBooked, false)
      )
    );
  }

  async getAllSlotsByDateRange(startDate: string, endDate: string): Promise<AvailabilitySlot[]> {
    return await db.select().from(availabilitySlots).where(
      and(
        gte(availabilitySlots.date, startDate),
        lte(availabilitySlots.date, endDate)
      )
    );
  }

  async getAllAvailabilitySlots(): Promise<AvailabilitySlot[]> {
    return await db.select().from(availabilitySlots);
  }

  async createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const [newSlot] = await db
      .insert(availabilitySlots)
      .values(slot)
      .returning();
    return newSlot;
  }

  async updateAvailabilitySlot(id: number, slot: Partial<InsertAvailabilitySlot>): Promise<AvailabilitySlot | undefined> {
    const [updatedSlot] = await db
      .update(availabilitySlots)
      .set(slot)
      .where(eq(availabilitySlots.id, id))
      .returning();
    return updatedSlot || undefined;
  }

  async deleteAvailabilitySlot(id: number): Promise<boolean> {
    const result = await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async bookSlot(slotId: number, leadId: number, slotData?: { date: string; startTime: string; endTime: string; title?: string }): Promise<AvailabilitySlot | undefined> {
    // First try to find existing slot
    const existingSlot = await this.getAvailabilitySlot(slotId);
    
    if (existingSlot) {
      // Update existing slot
      const [bookedSlot] = await db
        .update(availabilitySlots)
        .set({ isBooked: true, bookedBy: leadId })
        .where(eq(availabilitySlots.id, slotId))
        .returning();
      return bookedSlot || undefined;
    } else if (slotData) {
      // Create new slot from generated data and mark as booked
      const [newSlot] = await db
        .insert(availabilitySlots)
        .values({
          date: slotData.date,
          startTime: slotData.startTime,
          endTime: slotData.endTime,
          title: slotData.title || 'Available',
          isBooked: true,
          bookedBy: leadId
        })
        .returning();
      return newSlot;
    }
    
    return undefined;
  }

  // Recurring availability operations
  async getRecurringAvailability(): Promise<RecurringAvailability[]> {
    return await db.select().from(recurringAvailability).where(eq(recurringAvailability.isActive, true));
  }

  async createRecurringAvailability(availability: InsertRecurringAvailability): Promise<RecurringAvailability> {
    const [newAvailability] = await db
      .insert(recurringAvailability)
      .values(availability)
      .returning();
    return newAvailability;
  }

  async updateRecurringAvailability(id: number, availability: Partial<InsertRecurringAvailability>): Promise<RecurringAvailability | undefined> {
    const [updatedAvailability] = await db
      .update(recurringAvailability)
      .set(availability)
      .where(eq(recurringAvailability.id, id))
      .returning();
    return updatedAvailability || undefined;
  }

  async deleteRecurringAvailability(id: number): Promise<boolean> {
    const result = await db.delete(recurringAvailability).where(eq(recurringAvailability.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearAllRecurringAvailability(): Promise<number> {
    // Instead of deleting, set all as inactive
    const result = await db.update(recurringAvailability)
      .set({ isActive: false })
      .where(eq(recurringAvailability.isActive, true));
    return result.rowCount ?? 0;
  }

  async saveWeeklySchedule(schedule: Record<number, { enabled: boolean; startTime: string; endTime: string; slotDuration: number }>): Promise<RecurringAvailability[]> {
    // First, clear all existing availability
    await this.clearAllRecurringAvailability();
    
    // Then create new availability records for enabled days
    const newRecords: RecurringAvailability[] = [];
    
    for (const [dayOfWeek, dayData] of Object.entries(schedule)) {
      if (dayData.enabled) {
        const newRecord = await this.createRecurringAvailability({
          dayOfWeek: parseInt(dayOfWeek),
          startTime: dayData.startTime,
          endTime: dayData.endTime,
          slotDuration: dayData.slotDuration,
          isActive: true
        });
        newRecords.push(newRecord);
      }
    }
    
    return newRecords;
  }

  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const permissions = userData.userType === 'owner' ? {
      canManageUsers: true,
      canEditFormulas: true,
      canViewLeads: true,
      canManageCalendar: true,
      canAccessDesign: true,
      canViewStats: true,
    } : {
      canEditFormulas: true,
      canViewLeads: true,
      canManageCalendar: false,
      canAccessDesign: false,
      canViewStats: false,
    };

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        permissions,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management operations
  async getUsersByOwner(ownerId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.ownerId, ownerId));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    const permissions = userData.userType === 'owner' ? {
      canManageUsers: true,
      canEditFormulas: true,
      canViewLeads: true,
      canManageCalendar: true,
      canAccessDesign: true,
      canViewStats: true,
    } : {
      canEditFormulas: true,
      canViewLeads: true,
      canManageCalendar: false,
      canAccessDesign: false,
      canViewStats: false,
    };

    const [user] = await db
      .insert(users)
      .values({
        id: userData.id || nanoid(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        userType: userData.userType || 'owner',
        ownerId: userData.ownerId,
        organizationName: userData.organizationName,
        isActive: userData.isActive ?? true,
        plan: userData.plan || 'starter',
        permissions,
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createEmployee(employee: InsertUser): Promise<User> {
    const permissions = {
      canEditFormulas: true,
      canViewLeads: true,
      canManageCalendar: false,
      canAccessDesign: false,
      canViewStats: false,
    };

    const [user] = await db
      .insert(users)
      .values({
        id: employee.id || nanoid(),
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        profileImageUrl: employee.profileImageUrl,
        userType: employee.userType || 'employee',
        ownerId: employee.ownerId,
        organizationName: employee.organizationName,
        isActive: employee.isActive ?? true,
        plan: employee.plan || 'starter',
        permissions,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: UpdateUser): Promise<User | undefined> {
    const updateData = { ...userData, updatedAt: new Date() };
    
    // Ensure permissions are properly typed
    if (updateData.permissions) {
      updateData.permissions = {
        canManageUsers: Boolean(updateData.permissions.canManageUsers),
        canEditFormulas: Boolean(updateData.permissions.canEditFormulas),
        canViewLeads: Boolean(updateData.permissions.canViewLeads),
        canManageCalendar: Boolean(updateData.permissions.canManageCalendar),
        canAccessDesign: Boolean(updateData.permissions.canAccessDesign),
        canViewStats: Boolean(updateData.permissions.canViewStats),
      };
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getUserPermissions(userId: string): Promise<any> {
    const [user] = await db.select({ permissions: users.permissions }).from(users).where(eq(users.id, userId));
    return user?.permissions || {};
  }

  // Website operations
  async getWebsite(id: number): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.id, id));
    return website || undefined;
  }

  async getWebsitesByUserId(userId: string): Promise<Website[]> {
    return await db.select().from(websites).where(eq(websites.userId, userId));
  }

  async getAllWebsites(): Promise<Website[]> {
    return await db.select().from(websites);
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const [website] = await db
      .insert(websites)
      .values(insertWebsite)
      .returning();
    return website;
  }

  async updateWebsite(id: number, updateData: Partial<InsertWebsite>): Promise<Website | undefined> {
    const [website] = await db
      .update(websites)
      .set(updateData)
      .where(eq(websites.id, id))
      .returning();
    return website || undefined;
  }

  async deleteWebsite(id: number): Promise<boolean> {
    const result = await db.delete(websites).where(eq(websites.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWebsiteBySiteName(siteName: string): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.siteName, siteName));
    return website || undefined;
  }

  // Custom Website Template operations
  async getCustomWebsiteTemplate(id: number): Promise<CustomWebsiteTemplate | undefined> {
    const [template] = await db.select().from(customWebsiteTemplates).where(eq(customWebsiteTemplates.id, id));
    if (!template) return undefined;
    
    // Map database structure to expected interface
    return {
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    };
  }

  async getAllCustomWebsiteTemplates(): Promise<CustomWebsiteTemplate[]> {
    const results = await db.select().from(customWebsiteTemplates).orderBy(customWebsiteTemplates.displayOrder, customWebsiteTemplates.name);
    
    // Map database structure to expected interface
    return results.map(template => ({
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    }));
  }

  async getActiveCustomWebsiteTemplates(): Promise<CustomWebsiteTemplate[]> {
    const results = await db.select().from(customWebsiteTemplates)
      .where(eq(customWebsiteTemplates.isActive, true))
      .orderBy(customWebsiteTemplates.displayOrder, customWebsiteTemplates.name);
    
    // Map database structure to expected interface
    return results.map(template => ({
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    }));
  }

  async getCustomWebsiteTemplatesByIndustry(industry: string): Promise<CustomWebsiteTemplate[]> {
    const results = await db.select().from(customWebsiteTemplates)
      .where(and(
        eq(customWebsiteTemplates.industry, industry),
        eq(customWebsiteTemplates.isActive, true)
      ))
      .orderBy(customWebsiteTemplates.displayOrder, customWebsiteTemplates.name);
    
    // Map database structure to expected interface
    return results.map(template => ({
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    }));
  }

  async createCustomWebsiteTemplate(templateData: InsertCustomWebsiteTemplate): Promise<CustomWebsiteTemplate> {
    // Convert status to isActive if needed
    const dbData = {
      ...templateData,
      isActive: templateData.status === 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    delete (dbData as any).status; // Remove status field for database insert

    const [template] = await db
      .insert(customWebsiteTemplates)
      .values(dbData)
      .returning();
    
    // Map back to expected interface
    return {
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    };
  }

  async updateCustomWebsiteTemplate(id: number, templateData: Partial<InsertCustomWebsiteTemplate>): Promise<CustomWebsiteTemplate | undefined> {
    // Convert status to isActive if needed
    const dbData: any = {
      ...templateData,
      updatedAt: new Date()
    };
    
    if (templateData.status !== undefined) {
      dbData.isActive = templateData.status === 'active';
      delete dbData.status; // Remove status field for database update
    }

    const [template] = await db
      .update(customWebsiteTemplates)
      .set(dbData)
      .where(eq(customWebsiteTemplates.id, id))
      .returning();
    
    if (!template) return undefined;
    
    // Map back to expected interface
    return {
      ...template,
      status: template.isActive ? 'active' : 'inactive' as 'active' | 'inactive'
    };
  }

  async deleteCustomWebsiteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(customWebsiteTemplates).where(eq(customWebsiteTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Onboarding operations
  async getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined> {
    const [progress] = await db.select().from(onboardingProgress).where(eq(onboardingProgress.userId, userId));
    return progress || undefined;
  }

  async createOnboardingProgress(progressData: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [progress] = await db
      .insert(onboardingProgress)
      .values(progressData)
      .returning();
    return progress;
  }

  async updateOnboardingProgress(userId: string, progressData: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .update(onboardingProgress)
      .set({ ...progressData, updatedAt: new Date() })
      .where(eq(onboardingProgress.userId, userId))
      .returning();
    return progress || undefined;
  }

  async updateUserOnboardingStep(userId: string, step: number, businessInfo?: any): Promise<User | undefined> {
    const updateData: any = { 
      onboardingStep: step,
      updatedAt: new Date()
    };
    
    if (businessInfo) {
      updateData.businessInfo = businessInfo;
    }
    
    if (step >= 5) {
      updateData.onboardingCompleted = true;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }



  async getCustomFormByEmbedId(embedId: string): Promise<CustomForm | undefined> {
    const [form] = await db.select().from(customForms).where(eq(customForms.embedId, embedId));
    return form || undefined;
  }

  // Admin operations
  async getAdminStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalWebsites: number;
    totalFormulas: number;
    totalLeads: number;
    totalRevenue: number;
    activeSubscriptions: number;
    monthlyGrowth: number;
  }> {
    // Get user counts
    const [userStats] = await db.select({
      total: count(users.id),
      active: sql<number>`count(case when ${users.isActive} = true then 1 end)`,
    }).from(users);

    // Get website count
    const [websiteStats] = await db.select({
      total: count(websites.id),
    }).from(websites);

    // Get formula count
    const [formulaStats] = await db.select({
      total: count(formulas.id),
    }).from(formulas);

    // Get lead counts
    const [leadStats] = await db.select({
      total: count(leads.id),
    }).from(leads);

    const [multiLeadStats] = await db.select({
      total: count(multiServiceLeads.id),
    }).from(multiServiceLeads);

    // Get subscription stats
    const [subscriptionStats] = await db.select({
      active: sql<number>`count(case when ${users.subscriptionStatus} = 'active' then 1 end)`,
    }).from(users);

    // Calculate monthly growth (users created in last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentMonthUsers] = await db.select({
      count: count(users.id),
    }).from(users).where(gte(users.createdAt, thirtyDaysAgo));

    const [previousMonthUsers] = await db.select({
      count: count(users.id),
    }).from(users).where(
      and(
        gte(users.createdAt, sixtyDaysAgo),
        lt(users.createdAt, thirtyDaysAgo)
      )
    );

    const monthlyGrowth = previousMonthUsers.count > 0 
      ? Math.round(((currentMonthUsers.count - previousMonthUsers.count) / previousMonthUsers.count) * 100)
      : 0;

    return {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      totalWebsites: websiteStats.total,
      totalFormulas: formulaStats.total,
      totalLeads: leadStats.total + multiLeadStats.total,
      totalRevenue: 0, // Will be calculated from Stripe data
      activeSubscriptions: subscriptionStats.active,
      monthlyGrowth,
    };
  }

  async getAllUsersForAdmin(): Promise<Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    organizationName: string;
    plan: string;
    subscriptionStatus: string;
    isActive: boolean;
    createdAt: Date;
  }>> {
    return await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      userType: users.userType,
      organizationName: users.organizationName,
      plan: users.plan,
      subscriptionStatus: users.subscriptionStatus,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
  }

  async getAllLeadsForAdmin(): Promise<Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    calculatedPrice: number;
    stage: string;
    createdAt: Date;
    formulaName: string;
  }>> {
    const singleLeads = await db.select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      phone: leads.phone,
      calculatedPrice: leads.calculatedPrice,
      stage: leads.stage,
      createdAt: leads.createdAt,
      formulaName: formulas.name,
    })
    .from(leads)
    .leftJoin(formulas, eq(leads.formulaId, formulas.id))
    .orderBy(desc(leads.createdAt));

    const multiLeads = await db.select({
      id: multiServiceLeads.id,
      name: multiServiceLeads.name,
      email: multiServiceLeads.email,
      phone: multiServiceLeads.phone,
      calculatedPrice: multiServiceLeads.totalPrice,
      stage: multiServiceLeads.stage,
      createdAt: multiServiceLeads.createdAt,
    })
    .from(multiServiceLeads)
    .orderBy(desc(multiServiceLeads.createdAt));

    // Combine and sort both types of leads
    const allLeads = [
      ...singleLeads.map(lead => ({
        ...lead,
        formulaName: lead.formulaName || 'Unknown',
      })),
      ...multiLeads.map(lead => ({
        ...lead,
        formulaName: 'Multi-Service',
      })),
    ];

    return allLeads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllWebsitesForAdmin(): Promise<Array<{
    id: number;
    siteName: string;
    userId: string;
    userEmail: string;
    status: string;
    createdAt: Date;
  }>> {
    return await db.select({
      id: websites.id,
      siteName: websites.siteName,
      userId: websites.userId,
      userEmail: users.email,
      status: websites.status,
      createdAt: websites.createdDate,
    })
    .from(websites)
    .leftJoin(users, eq(websites.userId, users.id))
    .orderBy(desc(websites.createdDate));
  }

  // Custom Forms operations
  async getCustomFormById(id: number): Promise<CustomForm | undefined> {
    const [form] = await db.select().from(customForms).where(eq(customForms.id, id));
    return form || undefined;
  }

  async getAllCustomForms(): Promise<CustomForm[]> {
    return await db.select().from(customForms);
  }

  async createCustomForm(formData: InsertCustomForm): Promise<CustomForm> {
    const [form] = await db
      .insert(customForms)
      .values(formData)
      .returning();
    return form;
  }

  async updateCustomForm(id: number, formData: Partial<InsertCustomForm>): Promise<CustomForm | undefined> {
    const [form] = await db
      .update(customForms)
      .set(formData)
      .where(eq(customForms.id, id))
      .returning();
    return form || undefined;
  }

  async deleteCustomForm(id: number): Promise<boolean> {
    const result = await db.delete(customForms).where(eq(customForms.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCustomFormLeads(formId: number): Promise<CustomFormLead[]> {
    return await db.select().from(customFormLeads).where(eq(customFormLeads.customFormId, formId));
  }

  async createCustomFormLead(leadData: InsertCustomFormLead): Promise<CustomFormLead> {
    const [lead] = await db
      .insert(customFormLeads)
      .values(leadData)
      .returning();
    return lead;
  }

  // Support Ticket operations
  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketsByUserId(userId: string): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(ticketData: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db
      .insert(supportTickets)
      .values(ticketData)
      .returning();
    return ticket;
  }

  async updateSupportTicket(id: number, ticketData: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .update(supportTickets)
      .set({
        ...ticketData,
        updatedAt: new Date(),
        ...(ticketData.status === 'resolved' && { resolvedAt: new Date() }),
      })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    const result = await db.delete(supportTickets).where(eq(supportTickets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Ticket Message operations
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return await db.select().from(ticketMessages).where(eq(ticketMessages.ticketId, ticketId)).orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(messageData: InsertTicketMessage): Promise<TicketMessage> {
    const [message] = await db
      .insert(ticketMessages)
      .values(messageData)
      .returning();

    // Update the ticket's lastResponseAt timestamp
    await db
      .update(supportTickets)
      .set({ 
        lastResponseAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, messageData.ticketId));

    return message;
  }

  async getTicketMessage(id: number): Promise<TicketMessage | undefined> {
    const [message] = await db.select().from(ticketMessages).where(eq(ticketMessages.id, id));
    return message || undefined;
  }

  // Email Settings operations
  async getEmailSettings(userId: string): Promise<EmailSettings | undefined> {
    const [settings] = await db.select().from(emailSettings).where(eq(emailSettings.userId, userId));
    return settings || undefined;
  }

  async createEmailSettings(settings: InsertEmailSettings): Promise<EmailSettings> {
    const [newSettings] = await db.insert(emailSettings).values(settings).returning();
    return newSettings;
  }

  async updateEmailSettings(userId: string, settingsUpdate: Partial<InsertEmailSettings>): Promise<EmailSettings | undefined> {
    // Remove any timestamp fields from the update to let database handle them
    const { createdAt, updatedAt, ...cleanUpdate } = settingsUpdate as any;
    
    const [updated] = await db
      .update(emailSettings)
      .set(cleanUpdate)
      .where(eq(emailSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Email Template operations
  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, templateUpdate: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...templateUpdate, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // BidRequest operations
  async getBidRequest(id: number): Promise<BidRequest | undefined> {
    const [bidRequest] = await db.select().from(bidRequests).where(eq(bidRequests.id, id));
    return bidRequest || undefined;
  }

  async getBidRequestByToken(token: string): Promise<BidRequest | undefined> {
    const [bidRequest] = await db.select().from(bidRequests).where(eq(bidRequests.magicToken, token));
    return bidRequest || undefined;
  }

  async getAllBidRequests(): Promise<BidRequest[]> {
    return await db.select().from(bidRequests).orderBy(desc(bidRequests.createdAt));
  }

  async getBidRequestsByBusinessOwner(businessOwnerId: string): Promise<BidRequest[]> {
    return await db.select().from(bidRequests).where(eq(bidRequests.businessOwnerId, businessOwnerId)).orderBy(desc(bidRequests.createdAt));
  }

  async createBidRequest(bidRequest: InsertBidRequest): Promise<BidRequest> {
    const [newBidRequest] = await db.insert(bidRequests).values(bidRequest).returning();
    return newBidRequest;
  }

  async updateBidRequest(id: number, bidRequestUpdate: Partial<InsertBidRequest>): Promise<BidRequest | undefined> {
    const [updated] = await db
      .update(bidRequests)
      .set({ ...bidRequestUpdate, updatedAt: new Date() })
      .where(eq(bidRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBidRequest(id: number): Promise<boolean> {
    const result = await db.delete(bidRequests).where(eq(bidRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async markEmailOpened(id: number): Promise<BidRequest | undefined> {
    const [updated] = await db
      .update(bidRequests)
      .set({ emailOpened: true })
      .where(eq(bidRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Bid Response operations
  async getBidResponse(id: number): Promise<BidResponse | undefined> {
    const [response] = await db.select().from(bidResponses).where(eq(bidResponses.id, id));
    return response || undefined;
  }

  async getBidResponsesByBidRequestId(bidRequestId: number): Promise<BidResponse[]> {
    return await db.select().from(bidResponses).where(eq(bidResponses.bidRequestId, bidRequestId)).orderBy(desc(bidResponses.createdAt));
  }

  async createBidResponse(response: InsertBidResponse): Promise<BidResponse> {
    const [newResponse] = await db.insert(bidResponses).values(response).returning();
    return newResponse;
  }

  async updateBidResponse(id: number, responseUpdate: Partial<InsertBidResponse>): Promise<BidResponse | undefined> {
    const [updated] = await db
      .update(bidResponses)
      .set(responseUpdate)
      .where(eq(bidResponses.id, id))
      .returning();
    return updated || undefined;
  }

  // Bid Email Template operations
  async getBidEmailTemplate(id: number): Promise<BidEmailTemplate | undefined> {
    const [template] = await db.select().from(bidEmailTemplates).where(eq(bidEmailTemplates.id, id));
    return template || undefined;
  }

  async getBidEmailTemplatesByUserId(userId: string): Promise<BidEmailTemplate[]> {
    return await db.select().from(bidEmailTemplates).where(eq(bidEmailTemplates.userId, userId)).orderBy(desc(bidEmailTemplates.createdAt));
  }

  async getBidEmailTemplateByType(userId: string, templateType: string): Promise<BidEmailTemplate | undefined> {
    const [template] = await db.select().from(bidEmailTemplates)
      .where(and(eq(bidEmailTemplates.userId, userId), eq(bidEmailTemplates.templateType, templateType), eq(bidEmailTemplates.isActive, true)));
    return template || undefined;
  }

  async createBidEmailTemplate(template: InsertBidEmailTemplate): Promise<BidEmailTemplate> {
    const [newTemplate] = await db.insert(bidEmailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateBidEmailTemplate(id: number, templateUpdate: Partial<InsertBidEmailTemplate>): Promise<BidEmailTemplate | undefined> {
    const [updated] = await db
      .update(bidEmailTemplates)
      .set({ ...templateUpdate, updatedAt: new Date() })
      .where(eq(bidEmailTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBidEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(bidEmailTemplates).where(eq(bidEmailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Icon operations
  async getAllIcons(): Promise<Icon[]> {
    return await db.select().from(icons).orderBy(icons.name);
  }

  async getActiveIcons(): Promise<Icon[]> {
    return await db.select().from(icons).where(eq(icons.isActive, true)).orderBy(icons.name);
  }

  async getIconsByCategory(category: string): Promise<Icon[]> {
    return await db.select().from(icons)
      .where(and(eq(icons.category, category), eq(icons.isActive, true)))
      .orderBy(icons.name);
  }

  async getIcon(id: number): Promise<Icon | undefined> {
    const [icon] = await db.select().from(icons).where(eq(icons.id, id));
    return icon || undefined;
  }

  async createIcon(iconData: InsertIcon): Promise<Icon> {
    const [icon] = await db.insert(icons).values(iconData).returning();
    return icon;
  }

  async updateIcon(id: number, iconData: Partial<InsertIcon>): Promise<Icon | undefined> {
    const [icon] = await db
      .update(icons)
      .set(iconData)
      .where(eq(icons.id, id))
      .returning();
    return icon || undefined;
  }

  async deleteIcon(id: number): Promise<boolean> {
    const result = await db.delete(icons).where(eq(icons.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
