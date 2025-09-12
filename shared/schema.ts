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
  upsellItems: jsonb("upsell_items").$type<UpsellItem[]>().default([]),
  sortOrder: integer("sort_order").notNull().default(0), // For drag and drop reordering
  // Location-based pricing per formula
  enableDistancePricing: boolean("enable_distance_pricing").notNull().default(false),
  distancePricingType: text("distance_pricing_type").default("dollar"), // "dollar" or "percent"
  distancePricingRate: integer("distance_pricing_rate").default(0), // Rate per mile (cents for dollar, basis points for percent)
  serviceRadius: integer("service_radius").default(25), // Override business default for this formula
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
  upsellItems: jsonb("upsell_items").$type<UpsellItem[]>().default([]),
  // Location-based pricing per template
  enableDistancePricing: boolean("enable_distance_pricing").notNull().default(false),
  distancePricingType: text("distance_pricing_type").default("dollar"), // "dollar" or "percent"
  distancePricingRate: integer("distance_pricing_rate").default(0), // Rate per mile (cents for dollar, basis points for percent)
  serviceRadius: integer("service_radius").default(25), // Override business default for this template
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
  
  deviceView: text("device_view").default("desktop"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id"),
  multiServiceLeadId: integer("multi_service_lead_id"),
  estimateNumber: text("estimate_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  businessMessage: text("business_message"),
  services: jsonb("services").notNull().$type<EstimateService[]>(),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").default(0),
  discountAmount: integer("discount_amount").default(0),
  totalAmount: integer("total_amount").notNull(),
  validUntil: timestamp("valid_until"),
  status: text("status").notNull().default("draft"), // "draft", "sent", "viewed", "accepted", "expired"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  formulaId: integer("formula_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  addressLatitude: text("address_latitude"), // Stored as string for precision
  addressLongitude: text("address_longitude"), // Stored as string for precision
  distanceFromBusiness: integer("distance_from_business"), // Distance in miles (integer)
  distanceFee: integer("distance_fee").default(0), // Additional fee for distance (in cents)
  notes: text("notes"),
  calculatedPrice: integer("calculated_price").notNull(),
  variables: jsonb("variables").notNull().$type<Record<string, any>>(),
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
  stage: text("stage").notNull().default("open"), // "open", "booked", "completed", "lost"
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
  stage: text("stage").notNull().default("open"), // "open", "booked", "completed", "lost"
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
  authProvider: varchar("auth_provider", { enum: ["replit", "email"] }).default("email"), // Track auth method
  emailVerified: boolean("email_verified").default(false), // Email verification status
  emailVerificationToken: varchar("email_verification_token"), // For email verification
  passwordResetToken: varchar("password_reset_token"), // For password reset
  passwordResetTokenExpires: timestamp("password_reset_token_expires"), // Password reset token expiry
  userType: varchar("user_type", { enum: ["owner", "employee", "super_admin"] }).notNull().default("owner"),
  ownerId: varchar("owner_id"),
  organizationName: varchar("organization_name"),
  isActive: boolean("is_active").notNull().default(true),
  plan: varchar("plan", { enum: ["trial", "standard", "plus", "plus_seo"] }).default("trial"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status", { enum: ["trialing", "active", "inactive", "canceled", "past_due"] }).default("trialing"),
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
export type MultiServiceLead = typeof multiServiceLeads.$inferSelect;
export type InsertMultiServiceLead = z.infer<typeof insertMultiServiceLeadSchema>;
export type BusinessSettings = typeof businessSettings.$inferSelect;
export type InsertBusinessSettings = z.infer<typeof insertBusinessSettingsSchema>;
export type DesignSettings = typeof designSettings.$inferSelect;
export type InsertDesignSettings = typeof designSettings.$inferInsert;
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = z.infer<typeof insertAvailabilitySlotSchema>;
export type RecurringAvailability = typeof recurringAvailability.$inferSelect;
export type InsertRecurringAvailability = z.infer<typeof insertRecurringAvailabilitySchema>;
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
