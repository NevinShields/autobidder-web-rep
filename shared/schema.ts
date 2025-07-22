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
  embedId: text("embed_id").notNull().unique(),
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
  
  // Feature toggles
  showPriceBreakdown: z.boolean().default(true),
  includeLedCapture: z.boolean().default(true),
});

export const insertFormulaSchema = createInsertSchema(formulas).omit({
  id: true,
  embedId: true,
}).extend({
  variables: z.array(variableSchema),
  styling: stylingOptionsSchema,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type Variable = z.infer<typeof variableSchema>;
export type StylingOptions = z.infer<typeof stylingOptionsSchema>;
export type Formula = typeof formulas.$inferSelect;
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
