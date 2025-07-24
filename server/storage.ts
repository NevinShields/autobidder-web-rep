import { 
  formulas, 
  leads, 
  multiServiceLeads, 
  businessSettings,
  availabilitySlots,
  recurringAvailability,
  users,
  websites,
  onboardingProgress,
  type Formula, 
  type InsertFormula, 
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
  type OnboardingProgress,
  type InsertOnboardingProgress
} from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Formula operations
  getFormula(id: number): Promise<Formula | undefined>;
  getFormulaByEmbedId(embedId: string): Promise<Formula | undefined>;
  getAllFormulas(): Promise<Formula[]>;
  createFormula(formula: InsertFormula): Promise<Formula>;
  updateFormula(id: number, formula: Partial<InsertFormula>): Promise<Formula | undefined>;
  deleteFormula(id: number): Promise<boolean>;
  
  // Lead operations
  getLead(id: number): Promise<Lead | undefined>;
  getLeadsByFormulaId(formulaId: number): Promise<Lead[]>;
  getAllLeads(): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  
  // Multi-service lead operations
  getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined>;
  getAllMultiServiceLeads(): Promise<MultiServiceLead[]>;
  createMultiServiceLead(lead: InsertMultiServiceLead): Promise<MultiServiceLead>;
  
  // Business settings operations
  getBusinessSettings(): Promise<BusinessSettings | undefined>;
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
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createEmployee(employee: InsertUser): Promise<User>;
  updateUser(id: string, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<any>;
  
  // Website operations
  getWebsite(id: number): Promise<Website | undefined>;
  getWebsitesByUserId(userId: string): Promise<Website[]>;
  getAllWebsites(): Promise<Website[]>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: number, website: Partial<InsertWebsite>): Promise<Website | undefined>;
  deleteWebsite(id: number): Promise<boolean>;
  getWebsiteBySiteName(siteName: string): Promise<Website | undefined>;

  // Onboarding operations
  getOnboardingProgress(userId: string): Promise<OnboardingProgress | undefined>;
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  updateOnboardingProgress(userId: string, progress: Partial<InsertOnboardingProgress>): Promise<OnboardingProgress | undefined>;
  updateUserOnboardingStep(userId: string, step: number, businessInfo?: any): Promise<User | undefined>;
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

  async createFormula(insertFormula: InsertFormula): Promise<Formula> {
    const [formula] = await db
      .insert(formulas)
      .values({
        ...insertFormula,
        isActive: insertFormula.isActive ?? true
      })
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

  // Multi-service lead operations
  async getMultiServiceLead(id: number): Promise<MultiServiceLead | undefined> {
    const [lead] = await db.select().from(multiServiceLeads).where(eq(multiServiceLeads.id, id));
    return lead || undefined;
  }

  async getAllMultiServiceLeads(): Promise<MultiServiceLead[]> {
    return await db.select().from(multiServiceLeads);
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

  // Business settings operations
  async getBusinessSettings(): Promise<BusinessSettings | undefined> {
    const [settings] = await db.select().from(businessSettings).limit(1);
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
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        permissions: userData.userType === 'owner' ? {
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
        }
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createEmployee(employee: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...employee,
        permissions: {
          canEditFormulas: true,
          canViewLeads: true,
          canManageCalendar: false,
          canAccessDesign: false,
          canViewStats: false,
        }
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
}

export const storage = new DatabaseStorage();
