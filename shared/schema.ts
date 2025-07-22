import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const formulas = pgTable("formulas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
});

export const stylingOptionsSchema = z.object({
  // Container styling
  containerWidth: z.number().min(300).max(800).default(400),
  containerHeight: z.number().min(400).max(1200).default(600),
  containerBorderRadius: z.number().min(0).max(50).default(8),
  containerShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  containerBorderWidth: z.number().min(0).max(10).default(1),
  containerBorderColor: z.string().default('#E5E7EB'),
  backgroundColor: z.string().default('#FFFFFF'),
  
  // Typography
  fontFamily: z.enum(['inter', 'roboto', 'open-sans', 'lato', 'montserrat']).default('inter'),
  fontSize: z.enum(['sm', 'base', 'lg']).default('base'),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
  textColor: z.string().default('#374151'),
  
  // Button styling
  primaryColor: z.string().default('#1976D2'),
  buttonStyle: z.enum(['rounded', 'square', 'pill']).default('rounded'),
  buttonBorderRadius: z.number().min(0).max(50).default(6),
  buttonPadding: z.enum(['sm', 'md', 'lg']).default('md'),
  buttonFontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('medium'),
  buttonShadow: z.enum(['none', 'sm', 'md', 'lg']).default('sm'),
  
  // Input styling
  inputBorderRadius: z.number().min(0).max(50).default(4),
  inputBorderWidth: z.number().min(1).max(5).default(1),
  inputBorderColor: z.string().default('#D1D5DB'),
  inputFocusColor: z.string().default('#3B82F6'),
  inputPadding: z.enum(['sm', 'md', 'lg']).default('md'),
  inputBackgroundColor: z.string().default('#FFFFFF'),
  inputShadow: z.enum(['none', 'sm', 'md', 'lg']).default('none'),
  inputFontSize: z.enum(['xs', 'sm', 'base', 'lg', 'xl']).default('base'),
  inputTextColor: z.string().default('#374151'),
  
  // Multiple choice styling
  multiChoiceImageSize: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
  multiChoiceImageShadow: z.enum(['none', 'sm', 'md', 'lg']).default('sm'),
  multiChoiceImageBorderRadius: z.number().min(0).max(50).default(8),
  multiChoiceCardBorderRadius: z.number().min(0).max(50).default(8),
  multiChoiceCardShadow: z.enum(['none', 'sm', 'md', 'lg']).default('none'),
  multiChoiceSelectedColor: z.string().default('#3B82F6'),
  multiChoiceSelectedBgColor: z.string().default('#EBF8FF'),
  multiChoiceHoverBgColor: z.string().default('#F7FAFC'),
  
  // Feature toggles
  showPriceBreakdown: z.boolean().default(true),
  includeLedCapture: z.boolean().default(true),
  requireContactFirst: z.boolean().default(false),
  showBundleDiscount: z.boolean().default(false),
  bundleDiscountPercent: z.number().min(0).max(50).default(10),
  enableSalesTax: z.boolean().default(false),
  salesTaxRate: z.number().min(0).max(20).default(8.25),
  salesTaxLabel: z.string().default('Sales Tax'),
  
  // Lead contact intake customization
  requireName: z.boolean().default(true),
  requireEmail: z.boolean().default(true),
  requirePhone: z.boolean().default(false),
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
