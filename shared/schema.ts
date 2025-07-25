import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const formulas = pgTable("formulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  bulletPoints: jsonb("bullet_points").$type<string[]>(),
  variables: jsonb("variables").notNull().$type<Variable[]>(),
  formula: text("formula").notNull(),
  styling: jsonb("styling").notNull().$type<StylingOptions>(),
  isActive: boolean("is_active").notNull().default(true),
  isDisplayed: boolean("is_displayed").notNull().default(true),
  embedId: text("embed_id").notNull().unique(),
  guideVideoUrl: text("guide_video_url"),
  showImage: boolean("show_image").notNull().default(false),
  imageUrl: text("image_url"),
  iconUrl: text("icon_url"),
  enableMeasureMap: boolean("enable_measure_map").notNull().default(false),
  measureMapType: text("measure_map_type").default("area"), // "area" or "distance"
  measureMapUnit: text("measure_map_unit").default("sqft"), // "sqft", "sqm", "ft", "m"
  upsellItems: jsonb("upsell_items").$type<UpsellItem[]>().default([]),
});

export const businessSettings = pgTable("business_settings", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  styling: jsonb("styling").notNull().$type<StylingOptions>(),
  enableLeadCapture: boolean("enable_lead_capture").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  calculatedPrice: integer("calculated_price").notNull(),
  variables: jsonb("variables").notNull().$type<Record<string, any>>(),
  stage: text("stage").notNull().default("open"), // "open", "booked", "completed", "lost"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const multiServiceLeads = pgTable("multi_service_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  howDidYouHear: text("how_did_you_hear"),
  services: jsonb("services").notNull().$type<ServiceCalculation[]>(),
  totalPrice: integer("total_price").notNull(),
  bookingSlotId: integer("booking_slot_id"),
  stage: text("stage").notNull().default("open"), // "open", "booked", "completed", "lost"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isBooked: boolean("is_booked").notNull().default(false),
  bookedBy: integer("booked_by"), // Reference to multiServiceLeads.id
  title: text("title").default("Available"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringAvailability = pgTable("recurring_availability", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").notNull().default(true),
  slotDuration: integer("slot_duration").notNull().default(60), // minutes
  title: text("title").default("Available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["owner", "employee"] }).notNull().default("owner"),
  ownerId: varchar("owner_id"),
  organizationName: varchar("organization_name"),
  isActive: boolean("is_active").notNull().default(true),
  plan: varchar("plan", { enum: ["starter", "professional", "enterprise"] }).default("starter"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { enum: ["active", "inactive", "canceled", "past_due"] }).default("inactive"),
  billingPeriod: varchar("billing_period", { enum: ["monthly", "yearly"] }).default("monthly"),
  permissions: jsonb("permissions").$type<{
    canManageUsers?: boolean;
    canEditFormulas?: boolean;
    canViewLeads?: boolean;
    canManageCalendar?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
  }>(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(1), // 1-5 steps
  businessInfo: jsonb("business_info").$type<BusinessInfo>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User relations
export const userRelations = relations(users, ({ one, many }) => ({
  owner: one(users, {
    fields: [users.ownerId],
    references: [users.id],
    relationName: "EmployeeToOwner",
  }),
  employees: many(users, {
    relationName: "EmployeeToOwner",
  }),
}));

// Onboarding progress tracking
export const onboardingProgress = pgTable("onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  completedSteps: jsonb("completed_steps").notNull().$type<OnboardingStep[]>().default([]),
  currentStep: integer("current_step").notNull().default(1),
  businessSetupCompleted: boolean("business_setup_completed").notNull().default(false),
  firstCalculatorCreated: boolean("first_calculator_created").notNull().default(false),
  designCustomized: boolean("design_customized").notNull().default(false),
  embedCodeGenerated: boolean("embed_code_generated").notNull().default(false),
  firstLeadReceived: boolean("first_lead_received").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Onboarding relations
export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  user: one(users, {
    fields: [onboardingProgress.userId],
    references: [users.id],
  }),
}));

export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  siteName: text("site_name").notNull(),
  accountName: text("account_name"),
  siteDomain: text("site_domain"),
  previewUrl: text("preview_url"),
  lastPublished: timestamp("last_published"),
  createdDate: timestamp("created_date").notNull().defaultNow(),
  status: varchar("status", { enum: ["active", "draft", "published"] }).notNull().default("draft"),
  templateId: text("template_id"),
  dudaSiteId: text("duda_site_id").unique(), // Duda's internal site ID
  dudaAccountName: text("duda_account_name"), // Duda user account name
  dudaUserEmail: text("duda_user_email"), // Email of Duda user
});

// Website relations
export const websiteRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
}));

// Custom Forms System
export const customForms = pgTable("custom_forms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  embedId: text("embed_id").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  selectedServices: jsonb("selected_services").$type<number[]>().notNull().default([]),
  styling: jsonb("styling").notNull().$type<StylingOptions>(),
  formSettings: jsonb("form_settings").notNull().$type<CustomFormSettings>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customFormLeads = pgTable("custom_form_leads", {
  id: serial("id").primaryKey(),
  customFormId: integer("custom_form_id").notNull().references(() => customForms.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  howDidYouHear: text("how_did_you_hear"),
  services: jsonb("services").notNull().$type<ServiceCalculation[]>(),
  totalPrice: integer("total_price").notNull(),
  stage: text("stage").notNull().default("open"), // "open", "booked", "completed", "lost"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Custom form relations
export const customFormRelations = relations(customForms, ({ many }) => ({
  leads: many(customFormLeads),
}));

export const customFormLeadRelations = relations(customFormLeads, ({ one }) => ({
  customForm: one(customForms, {
    fields: [customFormLeads.customFormId],
    references: [customForms.id],
  }),
}));

// Support Ticket System
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  status: varchar("status", { enum: ["open", "in_progress", "resolved", "closed"] }).notNull().default("open"),
  category: varchar("category", { enum: ["technical", "billing", "feature_request", "bug_report", "general"] }).notNull().default("general"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  lastResponseAt: timestamp("last_response_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id),
  senderId: varchar("sender_id").references(() => users.id),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  isFromCustomer: boolean("is_from_customer").notNull().default(true),
  attachments: jsonb("attachments").$type<TicketAttachment[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Support ticket relations
export const supportTicketRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
    relationName: "TicketUser",
  }),
  assignedUser: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
    relationName: "TicketAssignee",
  }),
  messages: many(ticketMessages),
}));

export const ticketMessageRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(supportTickets, {
    fields: [ticketMessages.ticketId],
    references: [supportTickets.id],
  }),
  sender: one(users, {
    fields: [ticketMessages.senderId],
    references: [users.id],
  }),
}));

// Types
export interface ServiceCalculation {
  formulaId: number;
  formulaName: string;
  variables: Record<string, any>;
  calculatedPrice: number;
}

export interface UpsellItem {
  id: string;
  name: string;
  description: string;
  category: string;
  percentageOfMain: number;
  isPopular?: boolean;
  iconUrl?: string; // URL to uploaded icon
  imageUrl?: string; // URL to uploaded image
  tooltip?: string; // Tooltip text for additional information
}

export interface TicketAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface BusinessInfo {
  businessName?: string;
  businessType?: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
  servicesOffered?: string[];
  targetMarket?: string;
  yearsInBusiness?: number;
}

export interface OnboardingStep {
  step: number;
  name: string;
  completed: boolean;
  completedAt?: Date;
}

export interface CustomFormSettings {
  requireContactFirst: boolean;
  showProgressGuide: boolean;
  showBundleDiscount: boolean;
  bundleDiscountPercent: number;
  bundleMinServices: number;
  enableSalesTax: boolean;
  salesTaxRate: number;
  salesTaxLabel: string;
  leadCaptureMessage: string;
  thankYouMessage: string;
  contactEmail: string;
  businessDescription: string;
  requireName: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  enablePhone: boolean;
  enableAddress: boolean;
  requireAddress: boolean;
  enableNotes: boolean;
  enableHowDidYouHear: boolean;
  requireHowDidYouHear: boolean;
  howDidYouHearOptions: string[];
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  addressLabel: string;
  notesLabel: string;
  howDidYouHearLabel: string;
}

// Zod schemas for validation
export const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'select', 'checkbox', 'text', 'multiple-choice', 'dropdown', 'slider']),
  unit: z.string().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    multiplier: z.number().optional(),
    image: z.string().optional(), // URL or base64 image data
    numericValue: z.number().optional() // For formula calculations
  })).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  allowMultipleSelection: z.boolean().optional(), // For multiple-choice type
  connectionKey: z.string().optional(), // Key to identify shared variables across services (e.g., "house_sqft", "property_height")
  // Slider specific properties
  min: z.number().optional(), // Minimum value for slider
  max: z.number().optional(), // Maximum value for slider
  step: z.number().optional(), // Step increment for slider (default: 1)
  // Conditional logic
  conditionalLogic: z.object({
    enabled: z.boolean(),
    dependsOnVariable: z.string().optional(), // ID of the variable this depends on
    condition: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty', 'is_not_empty']).optional(),
    expectedValue: z.union([z.string(), z.number(), z.boolean()]).optional(), // Value to compare against
    expectedValues: z.array(z.union([z.string(), z.number()])).optional(), // For multiple values (e.g., contains any of these)
  }).optional(),
});

export const stylingOptionsSchema = z.object({
  // Container styling
  containerWidth: z.number().min(300).max(800).default(700),
  containerHeight: z.number().min(400).max(1200).default(850),
  containerBorderRadius: z.number().min(0).max(50).default(16),
  containerShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('xl'),
  containerBorderWidth: z.number().min(0).max(10).default(0),
  containerBorderColor: z.string().default('#E5E7EB'),
  backgroundColor: z.string().default('#FFFFFF'),
  
  // Typography
  fontFamily: z.enum(['inter', 'roboto', 'open-sans', 'lato', 'montserrat']).default('inter'),
  fontSize: z.enum(['sm', 'base', 'lg']).default('base'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('medium'),
  textColor: z.string().default('#1F2937'),
  
  // Button styling
  primaryColor: z.string().default('#2563EB'),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).default('rounded'),
  buttonBorderRadius: z.number().min(0).max(50).default(12),
  buttonPadding: z.enum(['sm', 'md', 'lg']).default('lg'),
  buttonFontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('semibold'),
  buttonShadow: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  
  // Input styling
  inputBorderRadius: z.number().min(0).max(50).default(10),
  inputBorderWidth: z.number().min(1).max(5).default(2),
  inputBorderColor: z.string().default('#E5E7EB'),
  inputFocusColor: z.string().default('#2563EB'),
  inputPadding: z.enum(['sm', 'md', 'lg']).default('lg'),
  inputBackgroundColor: z.string().default('#F9FAFB'),
  inputShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('sm'),
  inputFontSize: z.enum(['xs', 'sm', 'base', 'lg', 'xl']).default('base'),
  inputTextColor: z.string().default('#1F2937'),
  inputHeight: z.number().min(30).max(80).default(40),
  inputWidth: z.enum(['sm', 'md', 'lg', 'xl', 'full']).default('full'),
  
  // Multiple choice styling
  multiChoiceImageSize: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  multiChoiceImageShadow: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  multiChoiceImageBorderRadius: z.number().min(0).max(50).default(12),
  multiChoiceCardBorderRadius: z.number().min(0).max(50).default(12),
  multiChoiceCardShadow: z.enum(['none', 'sm', 'md', 'lg']).default('sm'),
  multiChoiceSelectedColor: z.string().default('#2563EB'),
  multiChoiceSelectedBgColor: z.string().default('#EFF6FF'),
  multiChoiceHoverBgColor: z.string().default('#F8FAFC'),
  multiChoiceLayout: z.enum(['grid', 'single']).default('grid'),
  
  // Service selector styling
  serviceSelectorWidth: z.number().min(300).max(1200).default(900),
  serviceSelectorCardSize: z.enum(['sm', 'md', 'lg', 'xl', '2xl']).default('lg'),
  serviceSelectorCardsPerRow: z.enum(['auto', '1', '2', '3', '4']).default('auto'),
  serviceSelectorBorderRadius: z.number().min(0).max(50).default(16),
  serviceSelectorShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorBackgroundColor: z.string().default('#FFFFFF'),
  serviceSelectorBorderWidth: z.number().min(0).max(10).default(0),
  serviceSelectorBorderColor: z.string().default('#E5E7EB'),
  serviceSelectorHoverBgColor: z.string().default('#F8FAFC'),
  serviceSelectorHoverBorderColor: z.string().default('#C7D2FE'),
  serviceSelectorSelectedBgColor: z.string().default('#EFF6FF'),
  serviceSelectorSelectedBorderColor: z.string().default('#2563EB'),
  serviceSelectorTitleFontSize: z.enum(['sm', 'base', 'lg', 'xl', '2xl']).default('xl'),
  serviceSelectorDescriptionFontSize: z.enum(['xs', 'sm', 'base', 'lg']).default('base'),
  serviceSelectorTitleLineHeight: z.enum(['tight', 'snug', 'normal', 'relaxed', 'loose']).default('normal'),
  serviceSelectorDescriptionLineHeight: z.enum(['tight', 'snug', 'normal', 'relaxed', 'loose']).default('normal'),
  serviceSelectorTitleLetterSpacing: z.enum(['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']).default('normal'),
  serviceSelectorDescriptionLetterSpacing: z.enum(['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']).default('normal'),
  serviceSelectorIconSize: z.enum(['sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorPadding: z.enum(['sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorGap: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  
  // Pricing card styling
  pricingCardBorderRadius: z.number().min(0).max(50).default(12),
  pricingCardShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('lg'),
  pricingCardBorderWidth: z.number().min(0).max(10).default(0),
  pricingCardBorderColor: z.string().default('#E5E7EB'),
  pricingCardBackgroundColor: z.string().default('#FFFFFF'),
  pricingTextColor: z.string().default('#1F2937'),
  pricingAccentColor: z.string().default('#2563EB'),
  
  // Feature toggles
  showPriceBreakdown: z.boolean().default(true),
  includeLedCapture: z.boolean().default(true),
  requireContactFirst: z.boolean().default(false),
  showBundleDiscount: z.boolean().default(false),
  bundleDiscountPercent: z.number().min(0).max(50).default(10),
  enableSalesTax: z.boolean().default(false),
  salesTaxRate: z.number().min(0).max(20).default(8.25),
  salesTaxLabel: z.string().default('Sales Tax'),
  showProgressGuide: z.boolean().default(true),
  showFormTitle: z.boolean().default(true),
  showFormSubtitle: z.boolean().default(true),
  showSectionTitles: z.boolean().default(true),
  showStepDescriptions: z.boolean().default(true),
  enableBooking: z.boolean().default(true),
  
  // Lead contact intake customization
  requireName: z.boolean().default(true),
  requireEmail: z.boolean().default(true),
  requirePhone: z.boolean().default(false),
  enablePhone: z.boolean().default(true),
  enableAddress: z.boolean().default(false),
  requireAddress: z.boolean().default(false),
  enableNotes: z.boolean().default(false),
  enableHowDidYouHear: z.boolean().default(false),
  requireHowDidYouHear: z.boolean().default(false),
  howDidYouHearOptions: z.array(z.string()).default(['Google Search', 'Social Media', 'Word of Mouth', 'Advertisement', 'Other']),
  nameLabel: z.string().default('Full Name'),
  emailLabel: z.string().default('Email Address'),
  phoneLabel: z.string().default('Phone Number'),
  addressLabel: z.string().default('Address'),
  notesLabel: z.string().default('Additional Notes'),
  howDidYouHearLabel: z.string().default('How did you hear about us?'),
});

export const insertFormulaSchema = createInsertSchema(formulas).omit({
  id: true,
  embedId: true,
}).extend({
  variables: z.array(variableSchema),
  styling: stylingOptionsSchema,
});

export const insertBusinessSettingsSchema = createInsertSchema(businessSettings).omit({
  id: true,
  createdAt: true,
}).extend({
  styling: stylingOptionsSchema,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertMultiServiceLeadSchema = createInsertSchema(multiServiceLeads).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilitySlotSchema = createInsertSchema(availabilitySlots).omit({
  id: true,
  createdAt: true,
});

export const insertRecurringAvailabilitySchema = createInsertSchema(recurringAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = insertUserSchema.partial();

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdDate: true,
});

export const insertCustomFormSchema = createInsertSchema(customForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFormLeadSchema = createInsertSchema(customFormLeads).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export type Variable = z.infer<typeof variableSchema>;
export type StylingOptions = z.infer<typeof stylingOptionsSchema>;
export type Formula = typeof formulas.$inferSelect;
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type MultiServiceLead = typeof multiServiceLeads.$inferSelect;
export type InsertMultiServiceLead = z.infer<typeof insertMultiServiceLeadSchema>;
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type InsertBusinessSettings = z.infer<typeof insertBusinessSettingsSchema>;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type RecurringAvailability = typeof recurringAvailability.$inferSelect;
export type InsertRecurringAvailability = z.infer<typeof insertRecurringAvailabilitySchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = typeof onboardingProgress.$inferInsert;
export type CustomForm = typeof customForms.$inferSelect;
export type InsertCustomForm = z.infer<typeof insertCustomFormSchema>;
export type CustomFormLead = typeof customFormLeads.$inferSelect;
export type InsertCustomFormLead = z.infer<typeof insertCustomFormLeadSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
