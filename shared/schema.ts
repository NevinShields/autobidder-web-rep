import { pgTable, text, serial, integer, boolean, timestamp, jsonb, json, varchar, index } from "drizzle-orm/pg-core";
import { isNull } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const formulas = pgTable("formulas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
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
  iconId: integer("icon_id").references(() => icons.id),
  enableMeasureMap: boolean("enable_measure_map").notNull().default(false),
  measureMapType: text("measure_map_type").default("area"), // "area" or "distance"
  measureMapUnit: text("measure_map_unit").default("sqft"), // "sqft", "sqm", "ft", "m"
  enablePhotoMeasurement: boolean("enable_photo_measurement").notNull().default(false),
  photoMeasurementSetup: jsonb("photo_measurement_setup").$type<{
    objectDescription: string;
    customerInstructions?: string;
    measurementType: 'area' | 'length' | 'width' | 'height' | 'perimeter';
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  }>(),
  upsellItems: jsonb("upsell_items").$type<UpsellItem[]>().default([]),
  sortOrder: integer("sort_order").notNull().default(0), // For drag and drop reordering
  // Location-based pricing per formula
  enableDistancePricing: boolean("enable_distance_pricing").notNull().default(false),
  distancePricingType: text("distance_pricing_type").default("dollar"), // "dollar" or "percent"
  distancePricingRate: integer("distance_pricing_rate").default(0), // Rate per mile (cents for dollar, basis points for percent)
  serviceRadius: integer("service_radius").default(25), // Override business default for this formula
  minPrice: integer("min_price"), // Minimum price in cents (optional)
  maxPrice: integer("max_price"), // Maximum price in cents (optional)
});

// Formula Templates - Public templates available to all users
export const formulaTemplates = pgTable("formula_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  bulletPoints: jsonb("bullet_points").$type<string[]>(),
  variables: jsonb("variables").notNull().$type<Variable[]>(),
  formula: text("formula").notNull(),
  category: text("category").notNull(), // e.g., "Cleaning", "Construction", "Landscaping"
  isActive: boolean("is_active").notNull().default(true),
  guideVideoUrl: text("guide_video_url"),
  iconUrl: text("icon_url"),
  iconId: integer("icon_id").references(() => icons.id),
  enableMeasureMap: boolean("enable_measure_map").notNull().default(false),
  measureMapType: text("measure_map_type").default("area"), // "area" or "distance"
  measureMapUnit: text("measure_map_unit").default("sqft"), // "sqft", "sqm", "ft", "m"
  enablePhotoMeasurement: boolean("enable_photo_measurement").notNull().default(false),
  photoMeasurementSetup: jsonb("photo_measurement_setup").$type<{
    objectDescription: string;
    customerInstructions?: string;
    measurementType: 'area' | 'length' | 'width' | 'height' | 'perimeter';
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  }>(),
  upsellItems: jsonb("upsell_items").$type<UpsellItem[]>().default([]),
  // Location-based pricing per template
  enableDistancePricing: boolean("enable_distance_pricing").notNull().default(false),
  distancePricingType: text("distance_pricing_type").default("dollar"), // "dollar" or "percent"
  distancePricingRate: integer("distance_pricing_rate").default(0), // Rate per mile (cents for dollar, basis points for percent)
  serviceRadius: integer("service_radius").default(25), // Override business default for this template
  minPrice: integer("min_price"), // Minimum price in cents (optional)
  maxPrice: integer("max_price"), // Maximum price in cents (optional)
  // Template design settings - complete styling that gets applied when template is selected
  templateStyling: jsonb("template_styling").$type<StylingOptions>(),
  templateComponentStyles: jsonb("template_component_styles").$type<{
    serviceSelector: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      activeBackgroundColor?: string;
      activeBorderColor?: string;
      hoverBackgroundColor?: string;
      hoverBorderColor?: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      iconPosition?: string;
      iconSize?: number;
      showImage?: boolean;
      fontSize?: string;
      textColor?: string;
      selectedTextColor?: string;
    };
    textInput: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      fontSize?: string;
      textColor?: string;
    };
    dropdown: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      fontSize?: string;
      textColor?: string;
    };
    multipleChoice: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      activeBackgroundColor?: string;
      activeBorderColor?: string;
      hoverBackgroundColor?: string;
      hoverBorderColor?: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      showImage?: boolean;
    };
    pricingCard: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
    };
  }>(),
  createdBy: varchar("created_by").references(() => users.id), // Admin who created it
  timesUsed: integer("times_used").notNull().default(0), // Track usage count
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Template Categories - For organizing formula templates
export const templateCategories = pgTable("template_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const businessSettings = pgTable("business_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  businessName: text("business_name").notNull(),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessAddress: text("business_address"), // Business location for distance calculations
  businessLatitude: text("business_latitude"), // Stored as string for precision
  businessLongitude: text("business_longitude"), // Stored as string for precision
  serviceRadius: integer("service_radius").default(25), // Service area radius in miles
  enableDistancePricing: boolean("enable_distance_pricing").notNull().default(false),
  distancePricingType: text("distance_pricing_type").default("dollar"), // "dollar" or "percent"
  distancePricingRate: integer("distance_pricing_rate").default(0), // Rate per mile (cents for dollar, basis points for percent)
  // Discount system
  discounts: jsonb("discounts").notNull().default([]).$type<Array<{
    id: string;
    name: string;
    percentage: number;
    isActive: boolean;
    description?: string;
  }>>(),
  allowDiscountStacking: boolean("allow_discount_stacking").notNull().default(false),
  // Guide Videos
  guideVideos: jsonb("guide_videos").notNull().default({}).$type<{
    introVideo?: string;
    pricingVideo?: string;
    scheduleVideo?: string;
  }>(),
  styling: jsonb("styling").notNull().$type<StylingOptions>(),
  enableLeadCapture: boolean("enable_lead_capture").notNull().default(true),
  enableBooking: boolean("enable_booking").notNull().default(false),
  maxDaysOut: integer("max_days_out").default(90), // Maximum days in advance customers can book (null = no limit)
  enableServiceCart: boolean("enable_service_cart").notNull().default(false), // Allow users to select which services to proceed with when multiple are selected
  enableAutoExpandCollapse: boolean("enable_auto_expand_collapse").notNull().default(true), // Auto-expand/collapse services in multi-service forms
  // Route optimization for bookings
  enableRouteOptimization: boolean("enable_route_optimization").notNull().default(false), // Enable route optimization to prevent bookings too far from existing jobs
  routeOptimizationThreshold: integer("route_optimization_threshold").default(20), // Maximum distance in miles from existing jobs on same day (default 20 miles)
  // Twilio configuration (each business brings their own Twilio account)
  // SECURITY NOTE: These credentials should be encrypted at rest in production
  // For MVP, storing in plaintext but should migrate to encryption or secrets vault
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"), // Should be encrypted
  twilioPhoneNumber: text("twilio_phone_number"),
  // Stripe configuration
  stripeConfig: jsonb("stripe_config").$type<{
    standard: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
    plus: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
    plusSeo: {
      monthlyPriceId?: string;
      yearlyPriceId?: string;
    };
  }>(),
  // Custom form content
  configurationTitle: text("configuration_title").default("Service Configuration"),
  configurationSubtitle: text("configuration_subtitle").default("Please provide details for your selected services"),
  contactTitle: text("contact_title").default("Contact Information"),
  contactSubtitle: text("contact_subtitle").default("We need your contact details to send you the quote"),
  pricingTitle: text("pricing_title").default("Your Quote is Ready!"),
  pricingSubtitle: text("pricing_subtitle").default("Here's your personalized pricing breakdown"),
  estimatePageSettings: jsonb("estimate_page_settings").notNull().default({}).$type<{
    defaultLayoutId?: string;
    defaultTheme?: {
      primaryColor?: string;
      accentColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    defaultAttachments?: Array<{
      url: string;
      name?: string;
      type: "image" | "pdf";
    }>;
    defaultVideoUrl?: string;
    defaultIncludeAttachments?: boolean;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Separate design settings table - completely separate from business logic
export const designSettings = pgTable("design_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  
  // Theme and general styling
  styling: jsonb("styling").notNull().$type<StylingOptions>(),
  
  // Component-specific styles with full detail
  componentStyles: jsonb("component_styles").notNull().$type<{
    serviceSelector: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      activeBackgroundColor?: string;
      activeBorderColor?: string;
      hoverBackgroundColor?: string;
      hoverBorderColor?: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      iconPosition?: string;
      iconSize?: number;
      showImage?: boolean;
      fontSize?: string;
      textColor?: string;
      selectedTextColor?: string;
    };
    textInput: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      fontSize?: string;
      textColor?: string;
    };
    dropdown: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      fontSize?: string;
      textColor?: string;
    };
    multipleChoice: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      activeBackgroundColor?: string;
      activeBorderColor?: string;
      hoverBackgroundColor?: string;
      hoverBorderColor?: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
      showImage?: boolean;
    };
    pricingCard: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
    };
    questionCard: {
      borderColor: string;
      borderWidth: number;
      backgroundColor: string;
      shadow: string;
      height: number;
      width: string;
      padding: number;
      margin: number;
      borderRadius: number;
    };
  }>(),
  
  // Custom CSS for advanced styling overrides
  customCSS: text("custom_css"),
  
  deviceView: text("device_view").default("desktop"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  leadId: integer("lead_id"),
  multiServiceLeadId: integer("multi_service_lead_id"),
  estimateType: text("estimate_type").notNull().default("confirmed"), // "pre_estimate" | "confirmed"
  estimateNumber: text("estimate_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  businessMessage: text("business_message"),
  customMessage: text("custom_message"),
  layoutId: text("layout_id"),
  theme: jsonb("theme").default({}).$type<{
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  }>(),
  attachments: jsonb("attachments").default([]).$type<Array<{
    url: string;
    name?: string;
    type: "image" | "pdf";
  }>>(),
  videoUrl: text("video_url"),
  revisionReason: text("revision_reason"),
  services: jsonb("services").notNull().$type<EstimateService[]>(),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").default(0),
  discountAmount: integer("discount_amount").default(0),
  distanceFee: integer("distance_fee").default(0), // Travel fee in cents
  totalAmount: integer("total_amount").notNull(),
  validUntil: timestamp("valid_until"),
  status: text("status").notNull().default("draft"), // "draft", "pending_owner_approval", "approved", "sent", "viewed", "accepted", "rejected", "expired"
  ownerApprovalStatus: text("owner_approval_status").default("pending"), // "pending", "approved", "revision_requested"
  ownerApprovedBy: varchar("owner_approved_by").references(() => users.id),
  ownerApprovedAt: timestamp("owner_approved_at"),
  ownerNotes: text("owner_notes"),
  revisionNotes: text("revision_notes"),
  sentToCustomerAt: timestamp("sent_to_customer_at"),
  isSentLocked: boolean("is_sent_locked").notNull().default(false),
  viewedByCustomerAt: timestamp("viewed_by_customer_at"),
  customerResponseAt: timestamp("customer_response_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Business owner who receives the lead
  formulaId: integer("formula_id"), // Made nullable since Duda leads don't have formulas
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  addressLatitude: text("address_latitude"), // Stored as string for precision
  addressLongitude: text("address_longitude"), // Stored as string for precision
  distanceFromBusiness: integer("distance_from_business"), // Distance in miles (integer)
  distanceFee: integer("distance_fee").default(0), // Additional fee for distance (in cents)
  notes: text("notes"),
  calculatedPrice: integer("calculated_price").default(0), // Made nullable/default for Duda leads without calculations
  variables: jsonb("variables").$type<Record<string, any>>().default({}), // Made nullable for Duda leads
  uploadedImages: jsonb("uploaded_images").$type<string[]>().default([]), // Array of image URLs
  distanceInfo: jsonb("distance_info").$type<DistanceInfo>(), // Distance calculation details
  appliedDiscounts: jsonb("applied_discounts").$type<Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number; // Discount amount in cents
  }>>().default([]), // Customer discounts applied to this lead
  selectedUpsells: jsonb("selected_upsells").$type<Array<{
    id: string;
    name: string;
    description?: string;
    percentageOfMain: number;
    amount: number; // Upsell amount in cents
    category?: string;
  }>>().default([]), // Customer upsells selected for this lead
  ipAddress: text("ip_address"), // IP address of the form submitter
  source: text("source").default("calculator"), // "calculator", "duda", "custom_form", "manual" - tracks where the lead originated
  dudaSiteId: text("duda_site_id"), // Duda site ID if lead came from Duda
  dudaSubmissionId: text("duda_submission_id"), // Unique ID from Duda to prevent duplicates
  dudaUtmData: jsonb("duda_utm_data").$type<{
    campaign?: string;
    source?: string;
    medium?: string;
    term?: string;
    content?: string;
  }>(), // UTM tracking data from Duda forms
  // CRM Pipeline stages: new → estimate_sent → estimate_viewed → estimate_approved → booked → completed → paid → lost
  // Legacy stages also supported for backward compatibility: open → booked → completed → lost
  stage: text("stage").notNull().default("open"), // Keep legacy default
  stageHistory: jsonb("stage_history").$type<Array<{
    stage: string;
    changedAt: string;
    changedBy?: string;
    notes?: string;
  }>>().default([]),
  lastStageChange: timestamp("last_stage_change"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Calculator sessions tracking - track when calculators are started
export const calculatorSessions = pgTable("calculator_sessions", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull().references(() => formulas.id),
  sessionId: text("session_id").notNull().unique(), // Unique identifier to avoid duplicate tracking
  ipAddress: text("ip_address"), // To help identify unique sessions
  // Enhanced engagement tracking
  userAgent: text("user_agent"), // Browser/device info
  referrer: text("referrer"), // Where user came from
  deviceType: text("device_type"), // 'mobile', 'tablet', 'desktop'
  completedAt: timestamp("completed_at"), // When form was submitted (null if abandoned)
  lastStepReached: integer("last_step_reached").default(1), // Track drop-off point
  totalSteps: integer("total_steps"), // Total steps in the calculator
  durationSeconds: integer("duration_seconds"), // Time spent on calculator
  priceCalculations: integer("price_calculations").default(0), // Number of times price was calculated
  converted: boolean("converted").default(false), // Whether this session resulted in a lead
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Page views tracking - track actual calculator page views
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").references(() => formulas.id), // null for service selector page
  userId: varchar("user_id").references(() => users.id), // Business owner whose calculator was viewed
  sessionId: text("session_id"), // Links to calculator session if they start calculator
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  deviceType: text("device_type"), // 'mobile', 'tablet', 'desktop'
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  pageType: text("page_type").notNull().default("calculator"), // 'calculator', 'service_selector', 'booking'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const multiServiceLeads = pgTable("multi_service_leads", {
  id: serial("id").primaryKey(),
  businessOwnerId: text("business_owner_id").references(() => users.id), // Associate with business owner
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  addressLatitude: text("address_latitude"), // Stored as string for precision
  addressLongitude: text("address_longitude"), // Stored as string for precision
  distanceFromBusiness: integer("distance_from_business"), // Distance in miles (integer)
  totalDistanceFee: integer("total_distance_fee").default(0), // Combined distance fee for all services (in cents)
  notes: text("notes"),
  howDidYouHear: text("how_did_you_hear"),
  source: text("source").default("calculator"), // "calculator", "duda", "custom_form", "manual" - tracks where the lead originated
  services: jsonb("services").notNull().$type<ServiceCalculation[]>(),
  totalPrice: integer("total_price").notNull(),
  bookingSlotId: integer("booking_slot_id"),
  uploadedImages: jsonb("uploaded_images").$type<string[]>().default([]), // Array of image URLs
  distanceInfo: jsonb("distance_info").$type<DistanceInfo>(), // Distance calculation details
  appliedDiscounts: jsonb("applied_discounts").$type<Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number; // Discount amount in cents
  }>>().default([]), // Customer discounts applied to this lead
  bundleDiscountAmount: integer("bundle_discount_amount").default(0), // Bundle discount in cents
  selectedUpsells: jsonb("selected_upsells").$type<Array<{
    id: string;
    name: string;
    description?: string;
    percentageOfMain: number;
    amount: number; // Upsell amount in cents
    category?: string;
  }>>().default([]), // Customer upsells selected for this lead
  taxAmount: integer("tax_amount"), // Tax amount in cents
  subtotal: integer("subtotal"), // Subtotal before discounts and tax in cents
  ipAddress: text("ip_address"), // IP address of the form submitter
  // CRM Pipeline stages: new → estimate_sent → estimate_viewed → estimate_approved → booked → completed → paid → lost
  // Legacy stages also supported for backward compatibility: open → booked → completed → lost
  stage: text("stage").notNull().default("open"), // Keep legacy default
  stageHistory: jsonb("stage_history").$type<Array<{
    stage: string;
    changedAt: string;
    changedBy?: string;
    notes?: string;
  }>>().default([]),
  lastStageChange: timestamp("last_stage_change"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Proposals table for customizing customer proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull().default("Service Proposal"),
  subtitle: text("subtitle"),
  headerText: text("header_text"),
  videoUrl: text("video_url"), // Embedded video URL
  customText: text("custom_text"), // Custom text content
  termsAndConditionsPdfUrl: text("terms_conditions_pdf_url"), // PDF document URL
  insurancePdfUrl: text("insurance_pdf_url"), // Insurance document URL
  additionalDocuments: jsonb("additional_documents").$type<Array<{
    id: string;
    name: string;
    url: string;
    type: string; // 'pdf', 'image', 'document'
  }>>().default([]),
  showCompanyLogo: boolean("show_company_logo").notNull().default(true),
  showServiceBreakdown: boolean("show_service_breakdown").notNull().default(true),
  showDiscounts: boolean("show_discounts").notNull().default(true),
  showUpsells: boolean("show_upsells").notNull().default(true),
  showTotal: boolean("show_total").notNull().default(true),
  enableAcceptReject: boolean("enable_accept_reject").notNull().default(true),
  acceptButtonText: text("accept_button_text").default("Accept Proposal"),
  rejectButtonText: text("reject_button_text").default("Decline Proposal"),
  styling: jsonb("styling").$type<{
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    fontFamily: string;
  }>().default({
    primaryColor: "#2563EB",
    backgroundColor: "#FFFFFF", 
    textColor: "#1F2937",
    borderRadius: 12,
    fontFamily: "inter"
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
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
  userId: varchar("user_id").notNull().references(() => users.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isActive: boolean("is_active").notNull().default(true),
  slotDuration: integer("slot_duration").notNull().default(60), // minutes
  title: text("title").default("Available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const blockedDates = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date").notNull(), // YYYY-MM-DD format (same as startDate for single day)
  reason: text("reason"), // Optional reason for blocking
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Unified calendar events - consolidates bookings, blocked dates, and external syncs
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["booking", "blocked", "google_sync", "other"] }).notNull(),
  source: varchar("source", { enum: ["internal", "google_calendar", "other"] }).notNull().default("internal"),
  startsAt: timestamp("starts_at").notNull(), // UTC timestamp
  endsAt: timestamp("ends_at").notNull(), // UTC timestamp
  status: varchar("status", { enum: ["confirmed", "tentative", "cancelled"] }).notNull().default("confirmed"),
  title: text("title"),
  description: text("description"),
  // Type-specific payload stored as JSON
  payload: jsonb("payload").$type<{
    // For booking type
    booking?: {
      leadId?: number;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      serviceDetails?: string;
    };
    // For blocked type
    blocked?: {
      reason?: string;
      createdBy?: string;
      isRecurring?: boolean;
    };
    // For google_sync type
    googleSync?: {
      externalId: string;
      calendarId: string;
      location?: string;
      attendees?: string[];
      isAllDay?: boolean;
    };
  }>(),
  isEditable: boolean("is_editable").notNull().default(true), // false for synced events
  leadId: integer("lead_id"), // Direct reference for bookings
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Index for efficient queries
  userStartsAtIdx: index("calendar_events_user_starts_at_idx").on(table.userId, table.startsAt),
  userTypeIdx: index("calendar_events_user_type_idx").on(table.userId, table.type),
}));

export const icons = pgTable("icons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull().unique(),
  category: text("category").notNull().default("general"), // "general", "construction", "cleaning", "automotive", etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const iconTags = pgTable("icon_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI display
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const iconTagAssignments = pgTable("icon_tag_assignments", {
  id: serial("id").primaryKey(),
  iconId: integer("icon_id").notNull().references(() => icons.id),
  tagId: integer("tag_id").notNull().references(() => iconTags.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Duda Template Management System
export const dudaTemplateTags = pgTable("duda_template_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI display
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dudaTemplateMetadata = pgTable("duda_template_metadata", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull().unique(), // Duda template ID
  templateName: text("template_name").notNull(),
  isVisible: boolean("is_visible").notNull().default(true), // Admin can hide templates
  displayOrder: integer("display_order").notNull().default(0),
  previewUrl: text("preview_url"),
  thumbnailUrl: text("thumbnail_url"),
  desktopThumbnailUrl: text("desktop_thumbnail_url"),
  tabletThumbnailUrl: text("tablet_thumbnail_url"),
  mobileThumbnailUrl: text("mobile_thumbnail_url"),
  vertical: text("vertical"), // From Duda API
  templateType: text("template_type"), // From Duda API
  visibility: text("visibility"), // From Duda API
  canBuildFromUrl: boolean("can_build_from_url").default(false),
  hasStore: boolean("has_store").default(false),
  hasBlog: boolean("has_blog").default(false),
  hasNewFeatures: boolean("has_new_features").default(false),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const dudaTemplateTagAssignments = pgTable("duda_template_tag_assignments", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull().references(() => dudaTemplateMetadata.templateId),
  tagId: integer("tag_id").notNull().references(() => dudaTemplateTags.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
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

export const emailSettings = pgTable("email_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  businessEmail: text("business_email"),
  replyToEmail: text("reply_to_email"),
  fromName: text("from_name"),
  emailSignature: text("email_signature"),
  notifications: jsonb("notifications").notNull().$type<{
    newLeads: boolean;
    estimateRequests: boolean;
    appointmentBookings: boolean;
    systemUpdates: boolean;
    weeklyReports: boolean;
  }>().default({
    newLeads: true,
    estimateRequests: true,
    appointmentBookings: true,
    systemUpdates: false,
    weeklyReports: true,
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content").notNull(),
  triggerType: text("trigger_type").notNull(), // "lead_submitted", "estimate_sent", "appointment_booked", "custom"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const emailSendLog = pgTable("email_send_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  emailType: text("email_type").notNull(), // "welcome", "onboarding_complete", "subscription_confirmation", "website_activation", "booking_notification", "bid_request", "custom"
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("sent"), // "sent", "delivered", "failed", "bounced"
  provider: text("provider"), // "resend", "gmail"
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bidRequests = pgTable("bid_requests", {
  id: serial("id").primaryKey(),
  businessOwnerId: text("business_owner_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  address: text("address"),
  streetViewUrl: text("street_view_url"),
  autoPrice: integer("auto_price").notNull(),
  finalPrice: integer("final_price"),
  bidStatus: text("bid_status").notNull().default("pending"), // "pending", "approved", "revised", "need_more_info"
  customerResponseStatus: text("customer_response_status").default("awaiting"), // "awaiting", "approved", "denied", "edit_requested"
  customerResponseNotes: text("customer_response_notes"), // Notes when requesting edits or denying
  emailSubject: text("email_subject"),
  emailBody: text("email_body"),
  pdfText: text("pdf_text"),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  magicToken: text("magic_token"), // For authentication if user not logged in
  tokenExpiresAt: timestamp("token_expires_at"),
  emailOpened: boolean("email_opened").notNull().default(false),
  leadId: integer("lead_id"), // Optional reference to original lead
  multiServiceLeadId: integer("multi_service_lead_id"), // Optional reference to multi-service lead
  services: jsonb("services").$type<BidRequestService[]>().default([]), // Services included in bid
  appliedDiscounts: jsonb("applied_discounts").$type<Array<{name: string; type: 'percentage' | 'fixed'; value: number; amount: number}>>().default([]),
  selectedUpsells: jsonb("selected_upsells").$type<Array<{id: string; name: string; description: string; price: number}>>().default([]),
  bundleDiscount: integer("bundle_discount"), // Bundle discount amount in cents
  taxAmount: integer("tax_amount"), // Tax amount in cents
  subtotal: integer("subtotal"), // Subtotal before discounts and tax in cents
  customerRespondedAt: timestamp("customer_responded_at"), // When customer responded
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customer bid responses - track customer interactions with bids
export const bidResponses = pgTable("bid_responses", {
  id: serial("id").primaryKey(),
  bidRequestId: integer("bid_request_id").notNull().references(() => bidRequests.id),
  responseType: text("response_type").notNull(), // "approved", "denied", "edit_requested"
  responseNotes: text("response_notes"), // Customer's notes/feedback
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  ipAddress: text("ip_address"), // Track IP for security
  userAgent: text("user_agent"), // Track browser for analytics
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bid-related email templates for customization
export const bidEmailTemplates = pgTable("bid_email_templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  templateType: text("template_type").notNull(), // "initial_bid", "updated_bid", "booking_confirmation"
  subject: text("subject").notNull(),
  emailBody: text("email_body").notNull(),
  fromName: text("from_name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// DFY Services - Premium add-on services with Stripe integration
export const dfyServices = pgTable("dfy_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"), // Brief description for cards
  price: integer("price").notNull(), // Price in cents
  stripePriceId: text("stripe_price_id"), // Stripe Price ID for payments
  features: jsonb("features").$type<string[]>().default([]), // List of features/benefits
  category: text("category").notNull().default("website"), // "website", "seo", "setup", "custom"
  videoUrl: text("video_url"), // YouTube or video URL
  thumbnailUrl: text("thumbnail_url"), // Service thumbnail image
  estimatedDelivery: text("estimated_delivery"), // e.g., "3-5 business days"
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  popularService: boolean("popular_service").notNull().default(false), // Highlight popular services
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// DFY Service Purchases - Track user purchases
export const dfyServicePurchases = pgTable("dfy_service_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => dfyServices.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"), // Stripe Payment Intent ID
  stripeCustomerId: text("stripe_customer_id"), // Stripe Customer ID
  amountPaid: integer("amount_paid").notNull(), // Amount paid in cents
  currency: text("currency").notNull().default("usd"),
  paymentStatus: text("payment_status").notNull().default("pending"), // "pending", "paid", "failed", "refunded"
  serviceStatus: text("service_status").notNull().default("pending"), // "pending", "in_progress", "completed", "cancelled"
  purchaseNotes: text("purchase_notes"), // Customer notes during purchase
  deliveryNotes: text("delivery_notes"), // Admin notes about delivery
  completedAt: timestamp("completed_at"), // When service was completed
  refundedAt: timestamp("refunded_at"), // When service was refunded
  refundAmount: integer("refund_amount"), // Refund amount in cents
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}), // Additional purchase metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Password Reset Codes Table for 6-digit OTP system
export const passwordResetCodes = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  codeHash: text("code_hash").notNull(), // SHA-256 hash of the 6-digit code
  expiresAt: timestamp("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  consumedAt: timestamp("consumed_at"), // null = active, timestamp = used
  lastSentAt: timestamp("last_sent_at").notNull().defaultNow(),
  requestIp: varchar("request_ip", { length: 45 }), // IPv4/IPv6
}, (table) => ({
  userExpiresIdx: index("password_reset_codes_user_expires_idx").on(table.userId, table.expiresAt),
  // Partial unique index for one active code per user
  activeCodeUnique: index("password_reset_codes_active_unique_idx").on(table.userId).where(isNull(table.consumedAt)),
}));

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For email/password authentication
  googleId: varchar("google_id"), // For Google OAuth authentication
  authProvider: varchar("auth_provider", { enum: ["replit", "email", "google"] }).default("email"), // Track auth method
  emailVerified: boolean("email_verified").default(false), // Email verification status
  emailVerificationToken: varchar("email_verification_token"), // For email verification
  passwordResetToken: varchar("password_reset_token"), // For password reset
  passwordResetTokenExpires: timestamp("password_reset_token_expires"), // Password reset token expiry
  inviteToken: varchar("invite_token"), // For team member invitations
  inviteTokenExpires: timestamp("invite_token_expires"), // Invite token expiry
  userType: varchar("user_type", { enum: ["owner", "employee", "super_admin"] }).notNull().default("owner"),
  ownerId: varchar("owner_id"),
  organizationName: varchar("organization_name"),
  isActive: boolean("is_active").notNull().default(true),
  plan: varchar("plan", { enum: ["free", "trial", "standard", "plus", "plus_seo"] }).default("trial"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { enum: ["trialing", "active", "inactive", "canceled", "canceling", "past_due"] }).default("trialing"),
  billingPeriod: varchar("billing_period", { enum: ["monthly", "yearly"] }).default("monthly"),
  trialStartDate: timestamp("trial_start_date"), // When trial started
  trialEndDate: timestamp("trial_end_date"), // When trial ends
  trialUsed: boolean("trial_used").default(false), // Whether user has used their trial
  permissions: jsonb("permissions").$type<{
    // Core Features
    canEditFormulas?: boolean;
    canViewLeads?: boolean;
    canManageLeads?: boolean;
    canAccessDesign?: boolean;
    canViewStats?: boolean;
    canManageCalendar?: boolean;
    
    // Advanced Features
    canCreateWebsites?: boolean;
    canManageWebsites?: boolean;
    canAccessAI?: boolean;
    canUseMeasureMap?: boolean;
    canCreateUpsells?: boolean;
    canAccessZapier?: boolean;
    canManageEmailTemplates?: boolean;
    canViewReports?: boolean;
    canExportData?: boolean;
    
    // Business Features
    canManageTeam?: boolean;
    canManageBilling?: boolean;
    canAccessAPI?: boolean;
    canManageIntegrations?: boolean;
    canCustomizeBranding?: boolean;
    
    // Admin Features (for super admins)
    canManageUsers?: boolean;
    canImpersonateUsers?: boolean;
    canViewSystemLogs?: boolean;
    canManageSystemSettings?: boolean;
    
    // Feature Limits
    maxFormulas?: number;
    maxLeadsPerMonth?: number;
    maxWebsites?: number;
    maxTeamMembers?: number;
  }>(),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  onboardingStep: integer("onboarding_step").notNull().default(1), // 1-5 steps
  businessInfo: jsonb("business_info").$type<BusinessInfo>(),
  isBetaTester: boolean("is_beta_tester").notNull().default(false), // Beta testers get free access
  googleCalendarConnected: boolean("google_calendar_connected").default(false),
  googleCalendarConnectionId: text("google_calendar_connection_id"),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  googleCalendarId: text("google_calendar_id").default("primary"),
  selectedCalendarIds: jsonb("selected_calendar_ids").$type<string[]>().default([]),
  pushSubscription: jsonb("push_subscription").$type<{
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }>(),
  welcomeModalShown: boolean("welcome_modal_shown").notNull().default(false), // Track if user has seen welcome modal
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
  createdTemplates: many(formulaTemplates, {
    relationName: "CreatedTemplates",
  }),
}));

// Formula Template relations
export const formulaTemplateRelations = relations(formulaTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [formulaTemplates.createdBy],
    references: [users.id],
    relationName: "CreatedTemplates",
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

// Custom Website Templates - Admin managed templates
export const customWebsiteTemplates = pgTable("custom_website_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  templateId: text("template_id").notNull(), // Duda template ID
  industry: text("industry").notNull(), // e.g., "Construction", "Cleaning", "Landscaping"
  templateProperties: json("template_properties").default({ type: "custom" }), // JSON field for template properties
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

// Custom Website Template relations
export const customWebsiteTemplateRelations = relations(customWebsiteTemplates, ({ one }) => ({
  createdBy: one(users, {
    fields: [customWebsiteTemplates.createdBy],
    references: [users.id],
  }),
}));

// Website relations
export const websiteRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
}));

// Email settings relations
export const emailSettingsRelations = relations(emailSettings, ({ one }) => ({
  user: one(users, {
    fields: [emailSettings.userId],
    references: [users.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [emailTemplates.userId],
    references: [users.id],
  }),
}));

// Bid request relations
export const bidRequestRelations = relations(bidRequests, ({ one, many }) => ({
  lead: one(leads, {
    fields: [bidRequests.leadId],
    references: [leads.id],
  }),
  multiServiceLead: one(multiServiceLeads, {
    fields: [bidRequests.multiServiceLeadId],
    references: [multiServiceLeads.id],
  }),
  responses: many(bidResponses),
}));

export const bidResponseRelations = relations(bidResponses, ({ one }) => ({
  bidRequest: one(bidRequests, {
    fields: [bidResponses.bidRequestId],
    references: [bidRequests.id],
  }),
}));

export const bidEmailTemplateRelations = relations(bidEmailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [bidEmailTemplates.userId],
    references: [users.id],
  }),
}));

// Custom Forms System
export const customForms = pgTable("custom_forms", {
  id: serial("id").primaryKey(),
  accountId: varchar("account_id").notNull().references(() => users.id), // Link to account owner
  name: text("name").notNull(), // Human-friendly label
  slug: text("slug").notNull(), // URL-safe slug, unique per accountId
  description: text("description"), // Optional short description
  enabled: boolean("enabled").notNull().default(true), // Can be toggled on/off
  serviceIds: jsonb("service_ids").$type<number[]>().notNull(), // Array of formula IDs (must be non-empty)
  inheritsDesignFromPrimary: boolean("inherits_design_from_primary").notNull().default(true),
  overrides: jsonb("overrides").$type<Record<string, any>>().default({}), // Future use for per-form overrides
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for accountId + slug
  accountSlugIdx: index("custom_forms_account_slug_idx").on(table.accountId, table.slug),
}));

export const customFormLeads = pgTable("custom_form_leads", {
  id: serial("id").primaryKey(),
  customFormId: integer("custom_form_id").notNull().references(() => customForms.id),
  customFormSlug: text("custom_form_slug").notNull(), // Store slug for analytics
  customFormName: text("custom_form_name").notNull(), // Store name for analytics
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  addressLatitude: text("address_latitude"), // Stored as string for precision
  addressLongitude: text("address_longitude"), // Stored as string for precision
  distanceFromBusiness: integer("distance_from_business"), // Distance in miles
  notes: text("notes"),
  howDidYouHear: text("how_did_you_hear"),
  services: jsonb("services").notNull().$type<ServiceCalculation[]>(),
  totalPrice: integer("total_price").notNull(),
  uploadedImages: jsonb("uploaded_images").$type<string[]>().default([]), // Array of image URLs
  distanceInfo: jsonb("distance_info").$type<DistanceInfo>(), // Distance calculation details
  appliedDiscounts: jsonb("applied_discounts").$type<Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number; // Discount amount in cents
  }>>().default([]),
  selectedUpsells: jsonb("selected_upsells").$type<Array<{
    id: string;
    name: string;
    description?: string;
    percentageOfMain: number;
    amount: number; // Upsell amount in cents
    category?: string;
  }>>().default([]),
  taxAmount: integer("tax_amount").default(0), // Tax amount in cents
  subtotal: integer("subtotal"), // Subtotal before discounts and tax
  bundleDiscountAmount: integer("bundle_discount_amount").default(0),
  ipAddress: text("ip_address"), // IP address of the form submitter
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

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'new_lead', 'new_booking', 'system'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  data: jsonb("data"), // Additional data like lead ID, booking ID, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
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

export interface BidRequestService {
  formulaId: number;
  formulaName: string;
  variables: Record<string, any>;
  calculatedPrice: number;
  category?: string;
  description?: string;
  appliedDiscounts?: Array<{
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  }>;
  selectedUpsells?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
  }>;
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

export interface DistanceInfo {
  distance: number; // Total distance in miles
  serviceRadius: number; // Business service radius
  excessDistance: number; // Distance beyond service radius
  distanceFee: number; // Additional fee charged
  pricingType: 'dollar' | 'percent'; // Type of pricing used
  pricingRate: number; // Rate used for calculation
}

// Zod schemas for validation
export const variableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'select', 'checkbox', 'text', 'multiple-choice', 'dropdown', 'slider']),
  unit: z.string().optional(),
  tooltip: z.string().optional(), // Optional description/help text for the question
  tooltipVideoUrl: z.string().optional(), // Optional video URL for tooltip (YouTube, Vimeo, etc.)
  tooltipImageUrl: z.string().optional(), // Optional image URL for tooltip
  options: z.array(z.object({
    id: z.string().optional(), // Unique ID for this option (used in formulas for multi-select)
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    multiplier: z.number().optional(),
    image: z.string().optional(), // URL or base64 image data
    numericValue: z.number().optional(), // For formula calculations
    defaultUnselectedValue: z.number().optional() // Value when option is NOT selected (0 for addition, 1 for multiplication formulas)
  })).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  allowMultipleSelection: z.boolean().optional(), // For multiple-choice type
  connectionKey: z.string().optional(), // Key to identify shared variables across services (e.g., "house_sqft", "property_height")
  // Slider specific properties
  min: z.number().optional(), // Minimum value for slider
  max: z.number().optional(), // Maximum value for slider
  step: z.number().optional(), // Step increment for slider (default: 1)
  // Checkbox specific properties
  checkedValue: z.union([z.string(), z.number()]).optional(), // Value when checkbox is checked
  uncheckedValue: z.union([z.string(), z.number()]).optional(), // Value when checkbox is unchecked
  // Conditional logic
  conditionalLogic: z.object({
    enabled: z.boolean(),
    operator: z.enum(['AND', 'OR']).default('AND'), // How to combine multiple conditions
    conditions: z.array(z.object({
      id: z.string(), // Unique ID for this condition
      dependsOnVariable: z.string(), // ID of the variable this depends on
      condition: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty', 'is_not_empty']),
      expectedValue: z.union([z.string(), z.number(), z.boolean()]).optional(), // Value to compare against
      expectedValues: z.array(z.union([z.string(), z.number()])).optional(), // For multiple values (e.g., contains any of these)
    })).default([]),
    // Legacy single condition support (for backward compatibility)
    dependsOnVariable: z.string().optional(), // ID of the variable this depends on
    condition: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'is_empty', 'is_not_empty']).optional(),
    expectedValue: z.union([z.string(), z.number(), z.boolean()]).optional(), // Value to compare against
    expectedValues: z.array(z.union([z.string(), z.number()])).optional(), // For multiple values (e.g., contains any of these)
    defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]).optional(), // Default value when hidden
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
  containerPadding: z.number().min(0).max(100).default(8),
  containerMargin: z.number().min(0).max(100).default(0),
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
  buttonBackgroundColor: z.string().default('#2563EB'),
  buttonTextColor: z.string().default('#FFFFFF'),
  buttonBorderWidth: z.number().min(0).max(10).default(0),
  buttonBorderColor: z.string().default('#2563EB'),
  buttonHoverBackgroundColor: z.string().default('#1d4ed8'),
  buttonHoverTextColor: z.string().default('#FFFFFF'),
  buttonHoverBorderColor: z.string().default('#1d4ed8'),
  
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
  multiChoiceImageSize: z.union([
    z.enum(['sm', 'md', 'lg', 'xl']), // Predefined sizes
    z.number().min(10).max(100) // Percentage from 10% to 100%
  ]).default('lg'),
  multiChoiceImageShadow: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  multiChoiceImageBorderRadius: z.number().min(0).max(50).default(12),
  multiChoiceCardBorderRadius: z.number().min(0).max(50).default(12),
  multiChoiceCardShadow: z.enum(['none', 'sm', 'md', 'lg']).default('sm'),
  multiChoiceSelectedColor: z.string().default('#2563EB'),
  multiChoiceSelectedBgColor: z.string().default('#EFF6FF'),
  multiChoiceHoverBgColor: z.string().default('#F8FAFC'),
  multiChoiceLayout: z.enum(['grid', 'single']).default('grid'),
  // Active and hover states for multiple choice
  multipleChoiceActiveBackgroundColor: z.string().default('#3B82F6'),
  multipleChoiceActiveBorderColor: z.string().default('#2563EB'),
  multipleChoiceHoverBackgroundColor: z.string().default('#F3F4F6'),
  multipleChoiceHoverBorderColor: z.string().default('#D1D5DB'),
  
  // Question card styling
  questionCardBackgroundColor: z.string().default('#FFFFFF'),
  questionCardBorderRadius: z.number().min(0).max(50).default(12),
  questionCardBorderWidth: z.number().min(0).max(10).default(1),
  questionCardBorderColor: z.string().default('#E5E7EB'),
  questionCardShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('sm'),
  questionCardPadding: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  
  // Service selector styling
  serviceSelectorWidth: z.number().min(300).max(1200).default(900),
  serviceSelectorCardSize: z.enum(['sm', 'md', 'lg', 'xl', '2xl']).default('lg'),
  serviceSelectorCardsPerRow: z.enum(['auto', '1', '2', '3', '4']).default('auto'),
  serviceSelectorBorderRadius: z.number().min(0).max(50).default(16),
  serviceSelectorShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorBackgroundColor: z.string().default('#FFFFFF'),
  serviceSelectorBorderWidth: z.number().min(0).max(10).default(0),
  serviceSelectorBorderColor: z.string().default('#E5E7EB'),
  serviceSelectorSelectedBgColor: z.string().default('#EFF6FF'),
  serviceSelectorSelectedBorderColor: z.string().default('#2563EB'),
  serviceSelectorTitleFontSize: z.enum(['sm', 'base', 'lg', 'xl', '2xl']).default('xl'),
  serviceSelectorDescriptionFontSize: z.enum(['xs', 'sm', 'base', 'lg']).default('base'),
  serviceSelectorTitleLineHeight: z.enum(['tight', 'snug', 'normal', 'relaxed', 'loose']).default('normal'),
  serviceSelectorDescriptionLineHeight: z.enum(['tight', 'snug', 'normal', 'relaxed', 'loose']).default('normal'),
  serviceSelectorTitleLetterSpacing: z.enum(['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']).default('normal'),
  serviceSelectorDescriptionLetterSpacing: z.enum(['tighter', 'tight', 'normal', 'wide', 'wider', 'widest']).default('normal'),
  serviceSelectorIconSize: z.enum(['sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorIconPosition: z.enum(['left', 'right', 'top', 'bottom']).default('top'),
  serviceSelectorIconSizeUnit: z.enum(['preset', 'pixels', 'percent']).default('preset'),
  serviceSelectorIconPixelSize: z.number().min(16).max(120).default(48),
  serviceSelectorIconPercentSize: z.number().min(10).max(80).default(30),
  serviceSelectorMaxHeight: z.number().min(100).max(800).default(300),
  serviceSelectorLineHeight: z.number().min(0).max(100).default(20),
  serviceSelectorPadding: z.enum(['sm', 'md', 'lg', 'xl']).default('xl'),
  serviceSelectorGap: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
  serviceSelectorContentAlignment: z.enum(['top', 'center', 'bottom']).default('center'),
  // Active and hover states for service selector
  serviceSelectorActiveBackgroundColor: z.string().default('#3B82F6'),
  serviceSelectorActiveBorderColor: z.string().default('#2563EB'),
  serviceSelectorHoverBackgroundColor: z.string().default('#F3F4F6'),
  serviceSelectorHoverBorderColor: z.string().default('#D1D5DB'),
  
  // Pricing card styling
  pricingCardBorderRadius: z.number().min(0).max(50).default(12),
  pricingCardShadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('lg'),
  pricingCardBorderWidth: z.number().min(0).max(10).default(0),
  pricingCardBorderColor: z.string().default('#E5E7EB'),
  pricingCardBackgroundColor: z.string().default('#FFFFFF'),
  pricingTextColor: z.string().default('#1F2937'),
  pricingAccentColor: z.string().default('#2563EB'),
  pricingIconVisible: z.boolean().default(true),
  pricingTextAlignment: z.enum(['left', 'center', 'right']).default('left'),
  
  // Pricing card layout
  pricingCardLayout: z.enum(['classic', 'modern', 'minimal', 'compact']).default('classic'),
  
  // Pricing card bullet point icons
  pricingBulletIconType: z.enum(['checkmark', 'star', 'circle', 'arrow', 'plus', 'diamond', 'heart']).default('checkmark'),
  pricingBulletIconColor: z.string().optional(),
  pricingBulletIconSize: z.number().min(12).max(32).default(20),
  
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
  
  // Custom form content
  selectionTitle: z.string().default('Select Your Services'),
  selectionSubtitle: z.string().default("Choose the services you'd like a quote for"),
  configurationTitle: z.string().default('Service Configuration'),
  configurationSubtitle: z.string().default('Please provide details for your selected services'),
  contactTitle: z.string().default('Contact Information'),
  contactSubtitle: z.string().default('We need your contact details to send you the quote'),
  pricingTitle: z.string().default('Your Quote is Ready!'),
  pricingSubtitle: z.string().default("Here's your personalized pricing breakdown"),
  
  // Disclaimer settings
  enableDisclaimer: z.boolean().default(false),
  disclaimerText: z.string().default('Prices are estimates and may vary based on specific requirements. Final pricing will be confirmed after consultation.'),
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
  
  // Image upload settings
  enableImageUpload: z.boolean().default(false),
  requireImageUpload: z.boolean().default(false),
  imageUploadLabel: z.string().default('Upload Images'),
  imageUploadDescription: z.string().default('Please upload relevant images to help us provide an accurate quote'),
  maxImages: z.number().min(1).max(10).default(5),
  maxImageSize: z.number().min(1).max(50).default(10), // MB
  allowedImageTypes: z.array(z.string()).default(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  imageUploadHelperText: z.string().default('Upload clear photos showing the area or items that need service. This helps us provide more accurate pricing.'),
  
  // Form behavior settings
  showOneQuestionAtTime: z.boolean().default(false),
  showOneSectionAtTime: z.boolean().default(false),
  requireNextButtonClick: z.boolean().default(false), // If false, auto-advance when answered
  formAnimationStyle: z.enum(['slide', 'fade', 'scale', 'none']).default('slide'),
  
  // Custom secondary button on pricing page
  enableCustomButton: z.boolean().default(false),
  customButtonText: z.string().default('Get Another Quote'),
  customButtonUrl: z.string().default(''),
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
}).partial();

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertCalculatorSessionSchema = createInsertSchema(calculatorSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
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

export const insertBlockedDateSchema = createInsertSchema(blockedDates).omit({
  id: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertCustomWebsiteTemplateSchema = createInsertSchema(customWebsiteTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomFormSchema = createInsertSchema(customForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Add validation for slug format and serviceIds
  slug: z.string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be no more than 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  serviceIds: z.array(z.number()).min(1, "At least one service must be selected"),
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

export const insertEstimateSchema = createInsertSchema(estimates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormulaTemplateSchema = createInsertSchema(formulaTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  timesUsed: true,
}).extend({
  variables: z.array(variableSchema),
});

export const insertTemplateCategorySchema = createInsertSchema(templateCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const estimateServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  variables: z.record(z.any()).optional(),
  price: z.number(),
  category: z.string().optional(),
});

export type Variable = z.infer<typeof variableSchema>;
export type StylingOptions = z.infer<typeof stylingOptionsSchema>;
export type Formula = typeof formulas.$inferSelect;
export type InsertFormula = z.infer<typeof insertFormulaSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type CalculatorSession = typeof calculatorSessions.$inferSelect;
export type InsertCalculatorSession = z.infer<typeof insertCalculatorSessionSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type MultiServiceLead = typeof multiServiceLeads.$inferSelect;
export type InsertMultiServiceLead = z.infer<typeof insertMultiServiceLeadSchema>;
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type InsertBusinessSettings = z.infer<typeof insertBusinessSettingsSchema>;

export interface StageUpdatePayload {
  stage: string;
  changedBy?: string;
  notes?: string;
  changedAt?: string;
}
export type DesignSettings = typeof designSettings.$inferSelect;
export type InsertDesignSettings = typeof designSettings.$inferInsert;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type RecurringAvailability = typeof recurringAvailability.$inferSelect;
export type InsertRecurringAvailability = z.infer<typeof insertRecurringAvailabilitySchema>;
export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = z.infer<typeof insertBlockedDateSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

// Password Reset Code types
export type PasswordResetCode = typeof passwordResetCodes.$inferSelect;
export type InsertPasswordResetCode = typeof passwordResetCodes.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Email settings and templates types
export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export const insertEmailSettingsSchema = createInsertSchema(emailSettings);
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates);

// Bid request types
export type BidRequest = typeof bidRequests.$inferSelect;
export type InsertBidRequest = typeof bidRequests.$inferInsert;
export const insertBidRequestSchema = createInsertSchema(bidRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Bid response types
export type BidResponse = typeof bidResponses.$inferSelect;
export type InsertBidResponse = typeof bidResponses.$inferInsert;
export const insertBidResponseSchema = createInsertSchema(bidResponses).omit({
  id: true,
  createdAt: true,
});

// Bid email template types
export type BidEmailTemplate = typeof bidEmailTemplates.$inferSelect;
export type InsertBidEmailTemplate = typeof bidEmailTemplates.$inferInsert;
export const insertBidEmailTemplateSchema = createInsertSchema(bidEmailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type CustomWebsiteTemplate = typeof customWebsiteTemplates.$inferSelect;
export type InsertCustomWebsiteTemplate = z.infer<typeof insertCustomWebsiteTemplateSchema>;
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
export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = z.infer<typeof insertEstimateSchema>;
export type EstimateService = z.infer<typeof estimateServiceSchema>;
export type FormulaTemplate = typeof formulaTemplates.$inferSelect;
export type InsertFormulaTemplate = z.infer<typeof insertFormulaTemplateSchema>;

// Template Category types
export type TemplateCategory = typeof templateCategories.$inferSelect;
export type InsertTemplateCategory = z.infer<typeof insertTemplateCategorySchema>;

// Icon types
export type Icon = typeof icons.$inferSelect;
export type InsertIcon = typeof icons.$inferInsert;
export const insertIconSchema = createInsertSchema(icons).omit({
  id: true,
  createdAt: true,
});

export type IconTag = typeof iconTags.$inferSelect;
export type InsertIconTag = z.infer<typeof insertIconTagSchema>;
export const insertIconTagSchema = createInsertSchema(iconTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type IconTagAssignment = typeof iconTagAssignments.$inferSelect;
export type InsertIconTagAssignment = z.infer<typeof insertIconTagAssignmentSchema>;
export const insertIconTagAssignmentSchema = createInsertSchema(iconTagAssignments).omit({
  id: true,
  createdAt: true,
});

// Icon Tag Relations
export const iconTagsRelations = relations(iconTags, ({ many, one }) => ({
  assignments: many(iconTagAssignments),
  createdBy: one(users, {
    fields: [iconTags.createdBy],
    references: [users.id],
  }),
}));

export const iconsRelations = relations(icons, ({ many }) => ({
  tagAssignments: many(iconTagAssignments),
}));

export const iconTagAssignmentsRelations = relations(iconTagAssignments, ({ one }) => ({
  icon: one(icons, {
    fields: [iconTagAssignments.iconId],
    references: [icons.id],
  }),
  tag: one(iconTags, {
    fields: [iconTagAssignments.tagId],
    references: [iconTags.id],
  }),
  assignedBy: one(users, {
    fields: [iconTagAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Duda Template Management System relations
export const dudaTemplateTagsRelations = relations(dudaTemplateTags, ({ many, one }) => ({
  assignments: many(dudaTemplateTagAssignments),
  createdBy: one(users, {
    fields: [dudaTemplateTags.createdBy],
    references: [users.id],
  }),
}));

export const dudaTemplateMetadataRelations = relations(dudaTemplateMetadata, ({ many }) => ({
  tagAssignments: many(dudaTemplateTagAssignments),
}));

export const dudaTemplateTagAssignmentsRelations = relations(dudaTemplateTagAssignments, ({ one }) => ({
  template: one(dudaTemplateMetadata, {
    fields: [dudaTemplateTagAssignments.templateId],
    references: [dudaTemplateMetadata.templateId],
  }),
  tag: one(dudaTemplateTags, {
    fields: [dudaTemplateTagAssignments.tagId],
    references: [dudaTemplateTags.id],
  }),
  assignedBy: one(users, {
    fields: [dudaTemplateTagAssignments.assignedBy],
    references: [users.id],
  }),
}));

// Duda Template Management System types and schemas
export type DudaTemplateTag = typeof dudaTemplateTags.$inferSelect;
export type InsertDudaTemplateTag = typeof dudaTemplateTags.$inferInsert;
export const insertDudaTemplateTagSchema = createInsertSchema(dudaTemplateTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DudaTemplateMetadata = typeof dudaTemplateMetadata.$inferSelect;
export type InsertDudaTemplateMetadata = typeof dudaTemplateMetadata.$inferInsert;
export const insertDudaTemplateMetadataSchema = createInsertSchema(dudaTemplateMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});

export type DudaTemplateTagAssignment = typeof dudaTemplateTagAssignments.$inferSelect;
export type InsertDudaTemplateTagAssignment = typeof dudaTemplateTagAssignments.$inferInsert;
export const insertDudaTemplateTagAssignmentSchema = createInsertSchema(dudaTemplateTagAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertDfyServiceSchema = createInsertSchema(dfyServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDfyServicePurchaseSchema = createInsertSchema(dfyServicePurchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// DFY Services types
export type DfyService = typeof dfyServices.$inferSelect;
export type InsertDfyService = z.infer<typeof insertDfyServiceSchema>;
export type DfyServicePurchase = typeof dfyServicePurchases.$inferSelect;
export type InsertDfyServicePurchase = z.infer<typeof insertDfyServicePurchaseSchema>;

// Zapier Integration Tables
export const zapierApiKeys = pgTable("zapier_api_keys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(), // Hashed API key
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const zapierWebhooks = pgTable("zapier_webhooks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  targetUrl: text("target_url").notNull(), // Zapier webhook URL
  event: text("event").notNull(), // e.g., "new_lead", "new_calculator", "lead_updated"
  filters: text("filters").default("{}"), // JSON string for filtering criteria
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CRM System Tables
export const crmSettings = pgTable("crm_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id),
  // Twilio SMS configuration
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"),
  twilioPhoneNumber: text("twilio_phone_number"),
  twilioEnabled: boolean("twilio_enabled").notNull().default(false),
  // Zapier invoice webhook
  invoiceWebhookUrl: text("invoice_webhook_url"),
  invoiceWebhookEnabled: boolean("invoice_webhook_enabled").notNull().default(false),
  // Pipeline configuration
  pipelineStages: jsonb("pipeline_stages").$type<Array<{
    id: string;
    name: string;
    color: string;
    order: number;
  }>>().default([
    { id: "new", name: "New Lead", color: "#3B82F6", order: 1 },
    { id: "estimate_sent", name: "Estimate Sent", color: "#8B5CF6", order: 2 },
    { id: "estimate_viewed", name: "Estimate Viewed", color: "#EC4899", order: 3 },
    { id: "estimate_approved", name: "Estimate Approved", color: "#10B981", order: 4 },
    { id: "booked", name: "Booked", color: "#F59E0B", order: 5 },
    { id: "completed", name: "Completed", color: "#06B6D4", order: 6 },
    { id: "paid", name: "Paid", color: "#22C55E", order: 7 },
    { id: "lost", name: "Lost", color: "#EF4444", order: 8 }
  ]),
  // Notification preferences
  notifyOnNewLead: boolean("notify_on_new_lead").notNull().default(true),
  notifyOnEstimateViewed: boolean("notify_on_estimate_viewed").notNull().default(true),
  notifyOnBooking: boolean("notify_on_booking").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  leadId: integer("lead_id").references(() => leads.id),
  multiServiceLeadId: integer("multi_service_lead_id").references(() => multiServiceLeads.id),
  estimateId: integer("estimate_id").references(() => estimates.id),
  workOrderNumber: text("work_order_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  scheduledDate: text("scheduled_date"), // YYYY-MM-DD format
  scheduledTime: text("scheduled_time"), // HH:MM format
  duration: integer("duration"), // duration in minutes
  assignedTo: varchar("assigned_to").references(() => users.id),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  instructions: text("instructions"),
  internalNotes: text("internal_notes"),
  totalAmount: integer("total_amount").notNull(), // in cents
  laborCost: integer("labor_cost"), // in cents
  materialCost: integer("material_cost"), // in cents
  completedDate: timestamp("completed_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  leadId: integer("lead_id").references(() => leads.id),
  multiServiceLeadId: integer("multi_service_lead_id").references(() => multiServiceLeads.id),
  workOrderId: integer("work_order_id").references(() => workOrders.id),
  estimateId: integer("estimate_id").references(() => estimates.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  services: jsonb("services").notNull().$type<EstimateService[]>(),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").default(0),
  discountAmount: integer("discount_amount").default(0),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").default(0),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  paymentMethod: text("payment_method"),
  paymentDate: timestamp("payment_date"),
  notes: text("notes"),
  sentViaZapier: boolean("sent_via_zapier").notNull().default(false),
  zapierSentAt: timestamp("zapier_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmAutomations = pgTable("crm_automations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  requiresConfirmation: boolean("requires_confirmation").notNull().default(false), // Requires user confirmation before running (for manual triggers)
  triggerType: text("trigger_type").notNull(), // new_lead, estimate_sent, estimate_viewed, estimate_approved, job_booked, job_completed, payment_confirmed
  triggerConfig: jsonb("trigger_config").$type<{
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    delay?: number; // delay in minutes before automation runs
  }>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const crmAutomationSteps = pgTable("crm_automation_steps", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => crmAutomations.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // send_email, send_sms, wait, update_stage, create_task
  stepConfig: jsonb("step_config").$type<{
    // For send_email
    emailTemplateId?: number;
    emailSubject?: string;
    emailBody?: string;
    fromName?: string;
    replyToEmail?: string;
    // For send_sms
    smsMessage?: string;
    // For wait
    waitDuration?: number; // in minutes
    // For update_stage
    newStage?: string;
    // For create_task
    taskTitle?: string;
    taskDescription?: string;
  }>().notNull(),
});

export const crmAutomationRuns = pgTable("crm_automation_runs", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => crmAutomations.id),
  userId: text("user_id").notNull().references(() => users.id),
  leadId: integer("lead_id"),
  multiServiceLeadId: integer("multi_service_lead_id"),
  estimateId: integer("estimate_id"),
  status: text("status").notNull().default("running"), // pending_confirmation, running, completed, failed, cancelled
  pendingStepsData: jsonb("pending_steps_data").$type<Array<{
    stepId: number;
    stepType: string;
    stepOrder: number;
    renderedConfig: {
      subject?: string;
      body?: string;
      fromName?: string;
      replyToEmail?: string;
      duration?: number;
      durationUnit?: string;
      newStage?: string;
      taskTitle?: string;
      taskDescription?: string;
    };
  }>>(), // Pre-rendered step content for confirmation
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const crmAutomationStepRuns = pgTable("crm_automation_step_runs", {
  id: serial("id").primaryKey(),
  automationRunId: integer("automation_run_id").notNull().references(() => crmAutomationRuns.id, { onDelete: "cascade" }),
  stepId: integer("step_id").notNull().references(() => crmAutomationSteps.id),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, skipped
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  resultData: jsonb("result_data").$type<{
    messageId?: string;
    sentTo?: string;
    success?: boolean;
    details?: any;
  }>(),
});

export const crmCommunications = pgTable("crm_communications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  leadId: integer("lead_id").references(() => leads.id),
  multiServiceLeadId: integer("multi_service_lead_id").references(() => multiServiceLeads.id),
  workOrderId: integer("work_order_id").references(() => workOrders.id),
  automationStepRunId: integer("automation_step_run_id").references(() => crmAutomationStepRuns.id),
  medium: text("medium").notNull(), // email, sms
  direction: text("direction").notNull(), // outbound, inbound
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  subject: text("subject"),
  body: text("body").notNull(),
  templateId: integer("template_id"),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed, bounced
  provider: text("provider"), // sendgrid, resend, twilio
  providerMessageId: text("provider_message_id"),
  providerStatus: text("provider_status"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Lead Tags - for categorizing and organizing leads
export const leadTags = pgTable("lead_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"), // Hex color for UI display
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  businessOwnerId: varchar("business_owner_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leadTagAssignments = pgTable("lead_tag_assignments", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  multiServiceLeadId: integer("multi_service_lead_id"),
  tagId: integer("tag_id").notNull().references(() => leadTags.id),
  assignedBy: varchar("assigned_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Photo Measurement Tables
export const photoMeasurements = pgTable("photo_measurements", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => multiServiceLeads.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  formulaName: text("formula_name"), // Service/formula name for tagging
  
  // Setup configuration used for this measurement
  setupConfig: jsonb("setup_config").notNull().$type<{
    objectDescription: string;
    measurementType: string;
    referenceImages: Array<{
      image: string;
      description: string;
      measurement: string;
      unit: string;
    }>;
  }>(),
  
  // Customer images uploaded
  customerImageUrls: jsonb("customer_image_urls").notNull().$type<string[]>(), // URLs to images in object storage
  
  // AI measurement result
  estimatedValue: integer("estimated_value").notNull(), // Stored as integer (e.g., cents for currency, or value * 100 for 2 decimal precision)
  estimatedUnit: text("estimated_unit").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  explanation: text("explanation").notNull(),
  warnings: jsonb("warnings").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]), // User-defined tags for filtering
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const measurementFeedback = pgTable("measurement_feedback", {
  id: serial("id").primaryKey(),
  photoMeasurementId: integer("photo_measurement_id").notNull().references(() => photoMeasurements.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // User feedback
  accuracyRating: integer("accuracy_rating").notNull(), // 1-5 stars
  actualValue: integer("actual_value"), // Actual measured value (if user provides it)
  actualUnit: text("actual_unit"),
  comments: text("comments"), // Optional user comments
  
  // Metadata for training
  wasAccurate: boolean("was_accurate").notNull(), // Derived from rating (4-5 stars = true)
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Photo measurement schema exports
export const insertPhotoMeasurementSchema = createInsertSchema(photoMeasurements).omit({
  id: true,
  createdAt: true,
});

export const insertMeasurementFeedbackSchema = createInsertSchema(measurementFeedback).omit({
  id: true,
  createdAt: true,
});

// Photo measurement types
export type PhotoMeasurement = typeof photoMeasurements.$inferSelect;
export type InsertPhotoMeasurement = z.infer<typeof insertPhotoMeasurementSchema>;
export type MeasurementFeedback = typeof measurementFeedback.$inferSelect;
export type InsertMeasurementFeedback = z.infer<typeof insertMeasurementFeedbackSchema>;

// Blocked IPs table - for blocking spam leads
export const blockedIps = pgTable("blocked_ips", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Business owner who blocked this IP
  ipAddress: text("ip_address").notNull(), // The blocked IP address
  reason: text("reason"), // Optional reason for blocking (e.g., "spam", "abuse")
  notes: text("notes"), // Optional notes about this block
  blockedBy: varchar("blocked_by").references(() => users.id), // User who created the block (could be employee)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Blocked IP schema exports
export const insertBlockedIpSchema = createInsertSchema(blockedIps).omit({
  id: true,
  createdAt: true,
});

export type BlockedIp = typeof blockedIps.$inferSelect;
export type InsertBlockedIp = z.infer<typeof insertBlockedIpSchema>;

// Email send log schema exports
export const insertEmailSendLogSchema = createInsertSchema(emailSendLog).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

// Email send log types
export type EmailSendLog = typeof emailSendLog.$inferSelect;
export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;

// Zapier schema exports
export const insertZapierApiKeySchema = createInsertSchema(zapierApiKeys).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export const insertZapierWebhookSchema = createInsertSchema(zapierWebhooks).omit({
  id: true,
  createdAt: true,
});

// Zapier types
export type ZapierApiKey = typeof zapierApiKeys.$inferSelect;
export type InsertZapierApiKey = z.infer<typeof insertZapierApiKeySchema>;
export type ZapierWebhook = typeof zapierWebhooks.$inferSelect;
export type InsertZapierWebhook = z.infer<typeof insertZapierWebhookSchema>;

// SEO Tracker Tables
export const seoCycles = pgTable("seo_cycles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  keywords: jsonb("keywords").notNull().$type<string[]>(),
  status: text("status").notNull().default("active"), // "active" or "completed"
  completionPercentage: integer("completion_percentage").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const seoTasks = pgTable("seo_tasks", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => seoCycles.id),
  type: text("type").notNull(), // "blog", "gmb", "facebook", "location"
  title: text("title"),
  proofLink: text("proof_link"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const seoContentIdeas = pgTable("seo_content_ideas", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  keyword: text("keyword").notNull(),
  type: text("type").notNull(), // "blog", "gmb", "facebook"
  title: text("title").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SEO Tracker schema exports
export const insertSeoCycleSchema = createInsertSchema(seoCycles).omit({
  id: true,
  createdAt: true,
  completionPercentage: true,
});

export const insertSeoTaskSchema = createInsertSchema(seoTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertSeoContentIdeaSchema = createInsertSchema(seoContentIdeas).omit({
  id: true,
  createdAt: true,
});

// SEO Setup Checklist - One-time setup items for website SEO optimization
export const seoSetupChecklist = pgTable("seo_setup_checklist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  websiteId: integer("website_id").references(() => websites.id), // Optional: associate with specific website
  category: text("category").notNull(), // "best_practices", "seo_boosted", "after_publishing"
  itemName: text("item_name").notNull(),
  description: text("description"),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"), // User can add notes about completion
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSeoSetupChecklistSchema = createInsertSchema(seoSetupChecklist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

// SEO Tracker types
export type SeoCycle = typeof seoCycles.$inferSelect;
export type InsertSeoCycle = z.infer<typeof insertSeoCycleSchema>;
export type SeoTask = typeof seoTasks.$inferSelect;
export type InsertSeoTask = z.infer<typeof insertSeoTaskSchema>;
export type SeoContentIdea = typeof seoContentIdeas.$inferSelect;
export type InsertSeoContentIdea = z.infer<typeof insertSeoContentIdeaSchema>;
export type SeoSetupChecklistItem = typeof seoSetupChecklist.$inferSelect;
export type InsertSeoSetupChecklistItem = z.infer<typeof insertSeoSetupChecklistSchema>;

// Call Bookings - For account setup calls
export const callBookings = pgTable("call_bookings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  scheduledDate: text("scheduled_date").notNull(), // YYYY-MM-DD format
  scheduledTime: text("scheduled_time").notNull(), // HH:MM format
  timezone: text("timezone").notNull().default("America/New_York"),
  notes: text("notes"),
  status: text("status").notNull().default("scheduled"), // "scheduled", "completed", "cancelled", "no_show"
  meetingLink: text("meeting_link"), // Optional video call link
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Call Availability Slots - Admin-defined available time slots for calls
export const callAvailabilitySlots = pgTable("call_availability_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  isBooked: boolean("is_booked").notNull().default(false),
  bookedBy: integer("booked_by").references(() => callBookings.id), // Reference to call booking
  maxBookings: integer("max_bookings").notNull().default(1), // Allow multiple bookings per slot if needed
  currentBookings: integer("current_bookings").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Call Booking schema exports
export const insertCallBookingSchema = createInsertSchema(callBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallAvailabilitySlotSchema = createInsertSchema(callAvailabilitySlots).omit({
  id: true,
  createdAt: true,
});

// Default Call Availability - Recurring weekly availability patterns
export const defaultCallAvailability = pgTable("default_call_availability", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  duration: integer("duration").notNull().default(30), // Duration in minutes for each slot
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDefaultCallAvailabilitySchema = createInsertSchema(defaultCallAvailability).omit({
  id: true,
  createdAt: true,
});

// Call Booking types
export type CallBooking = typeof callBookings.$inferSelect;
export type InsertCallBooking = z.infer<typeof insertCallBookingSchema>;
export type CallAvailabilitySlot = typeof callAvailabilitySlots.$inferSelect;
export type InsertCallAvailabilitySlot = z.infer<typeof insertCallAvailabilitySlotSchema>;
export type DefaultCallAvailability = typeof defaultCallAvailability.$inferSelect;
export type InsertDefaultCallAvailability = z.infer<typeof insertDefaultCallAvailabilitySchema>;

// CRM System schema exports
export const insertCrmSettingsSchema = createInsertSchema(crmSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  duration: z.number().positive().optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paymentDate: true,
  zapierSentAt: true,
});

export const insertCrmAutomationSchema = createInsertSchema(crmAutomations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmAutomationStepSchema = createInsertSchema(crmAutomationSteps).omit({
  id: true,
  createdAt: true,
});

export const insertCrmAutomationRunSchema = createInsertSchema(crmAutomationRuns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertCrmAutomationStepRunSchema = createInsertSchema(crmAutomationStepRuns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertCrmCommunicationSchema = createInsertSchema(crmCommunications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
});

// CRM System types
export type CrmSettings = typeof crmSettings.$inferSelect;
export type InsertCrmSettings = z.infer<typeof insertCrmSettingsSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type CrmAutomation = typeof crmAutomations.$inferSelect;
export type InsertCrmAutomation = z.infer<typeof insertCrmAutomationSchema>;
export type CrmAutomationStep = typeof crmAutomationSteps.$inferSelect;
export type InsertCrmAutomationStep = z.infer<typeof insertCrmAutomationStepSchema>;
export type CrmAutomationRun = typeof crmAutomationRuns.$inferSelect;
export type InsertCrmAutomationRun = z.infer<typeof insertCrmAutomationRunSchema>;
export type CrmAutomationStepRun = typeof crmAutomationStepRuns.$inferSelect;
export type InsertCrmAutomationStepRun = z.infer<typeof insertCrmAutomationStepRunSchema>;
export type CrmCommunication = typeof crmCommunications.$inferSelect;
export type InsertCrmCommunication = z.infer<typeof insertCrmCommunicationSchema>;

// Work Order Notification Schema
export const workOrderNotificationSchema = z.object({
  estimateId: z.number().int().positive(),
  notifyEmail: z.boolean(),
  notifySms: z.boolean(),
  message: z.string().min(1, "Message is required"),
});

export type WorkOrderNotification = z.infer<typeof workOrderNotificationSchema>;

export const sendEstimateToCustomerSchema = z.object({
  notifyEmail: z.boolean(),
  notifySms: z.boolean(),
  message: z.string().min(1, "Message is required"),
  subject: z.string().optional(),
  customMessage: z.string().optional(),
  layoutId: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    accentColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  attachments: z.array(z.object({
    url: z.string().min(1),
    name: z.string().optional(),
    type: z.enum(["image", "pdf"]),
  })).optional(),
  videoUrl: z.string().optional(),
});

export type SendEstimateToCustomer = z.infer<typeof sendEstimateToCustomerSchema>;

// Lead Tags schemas
export const insertLeadTagSchema = createInsertSchema(leadTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadTagAssignmentSchema = createInsertSchema(leadTagAssignments).omit({
  id: true,
  createdAt: true,
});

// Lead Tags types
export type LeadTag = typeof leadTags.$inferSelect;
export type InsertLeadTag = z.infer<typeof insertLeadTagSchema>;
export type LeadTagAssignment = typeof leadTagAssignments.$inferSelect;
export type InsertLeadTagAssignment = z.infer<typeof insertLeadTagAssignmentSchema>;

// Leads with Tags response types
export type LeadWithTags = Lead & { tags?: LeadTag[] };
export type MultiServiceLeadWithTags = MultiServiceLead & { tags?: LeadTag[] };

// Tutorials table for video tutorials
export const tutorials = pgTable("tutorials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeUrl: text("youtube_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTutorialSchema = createInsertSchema(tutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Tutorial = typeof tutorials.$inferSelect;
export type InsertTutorial = z.infer<typeof insertTutorialSchema>;

// White Label Videos table
export const whiteLabelVideos = pgTable("white_label_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeUrl: text("youtube_url"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  category: text("category").default("general"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWhiteLabelVideoSchema = createInsertSchema(whiteLabelVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WhiteLabelVideo = typeof whiteLabelVideos.$inferSelect;
export type InsertWhiteLabelVideo = z.infer<typeof insertWhiteLabelVideoSchema>;

// White Label Video Downloads tracking table
export const whiteLabelVideoDownloads = pgTable("white_label_video_downloads", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").notNull().references(() => whiteLabelVideos.id),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
  // Store the month/year for easy querying of monthly limits
  downloadMonth: integer("download_month").notNull(), // 1-12
  downloadYear: integer("download_year").notNull(),
});

export type WhiteLabelVideoDownload = typeof whiteLabelVideoDownloads.$inferSelect;

// ==================== Support Videos System ====================

// Support Videos Library - all support videos that can be assigned to pages
export const supportVideos = pgTable("support_videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeUrl: text("youtube_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSupportVideoSchema = createInsertSchema(supportVideos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SupportVideo = typeof supportVideos.$inferSelect;
export type InsertSupportVideo = z.infer<typeof insertSupportVideoSchema>;

// Page Support Configurations - configuration for each page's support modal
export const pageSupportConfigs = pgTable("page_support_configs", {
  id: serial("id").primaryKey(),
  pageKey: text("page_key").notNull().unique(), // e.g., "dashboard", "formulas", "leads"
  pageName: text("page_name").notNull(), // Human-readable name: "Dashboard", "Formulas"
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPageSupportConfigSchema = createInsertSchema(pageSupportConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PageSupportConfig = typeof pageSupportConfigs.$inferSelect;
export type InsertPageSupportConfig = z.infer<typeof insertPageSupportConfigSchema>;

// Page Support Video Assignments - join table linking videos to pages
export const pageSupportVideoAssignments = pgTable("page_support_video_assignments", {
  id: serial("id").primaryKey(),
  pageConfigId: integer("page_config_id").notNull().references(() => pageSupportConfigs.id, { onDelete: 'cascade' }),
  videoId: integer("video_id").notNull().references(() => supportVideos.id, { onDelete: 'cascade' }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PageSupportVideoAssignment = typeof pageSupportVideoAssignments.$inferSelect;

// Welcome Modal Configuration - single row table for welcome modal settings
export const welcomeModalConfig = pgTable("welcome_modal_config", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Welcome to Autobidder!"),
  description: text("description"),
  youtubeUrl: text("youtube_url"),
  isEnabled: boolean("is_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WelcomeModalConfig = typeof welcomeModalConfig.$inferSelect;

// Relations for support videos system
export const supportVideoRelations = relations(supportVideos, ({ many }) => ({
  pageAssignments: many(pageSupportVideoAssignments),
}));

export const pageSupportConfigRelations = relations(pageSupportConfigs, ({ many }) => ({
  videoAssignments: many(pageSupportVideoAssignments),
}));

export const pageSupportVideoAssignmentRelations = relations(pageSupportVideoAssignments, ({ one }) => ({
  pageConfig: one(pageSupportConfigs, {
    fields: [pageSupportVideoAssignments.pageConfigId],
    references: [pageSupportConfigs.id],
  }),
  video: one(supportVideos, {
    fields: [pageSupportVideoAssignments.videoId],
    references: [supportVideos.id],
  }),
}));
