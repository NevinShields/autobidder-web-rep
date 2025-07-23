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
  plan: varchar("plan", { enum: ["Starter", "Professional", "Enterprise"] }).default("Starter"),
  permissions: jsonb("permissions").$type<{
    canManageUsers?: boolean;
    canEditFormulas?: boolean;
    canViewLeads?: boolean;
    canManageCalendar?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
  }>(),
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
  dudaSSOUrl: text("duda_sso_url"), // Direct SSO link to editor
});

// Website relations
export const websiteRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
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

// Zod schemas for validation
export const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'select', 'checkbox', 'text', 'multiple-choice', 'dropdown']),
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
