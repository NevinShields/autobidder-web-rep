# Autobidder iOS Mobile App - Technical Specification

**Version:** 1.0
**Date:** 2026-01-18
**Target Pages:** Leads, Calendar, Stats, Form Settings, Design, Formula Builder

---

## Table of Contents

1. [Backend API Reference](#1-backend-api-reference)
2. [Frontend Components/Logic](#2-frontend-componentslogic)
3. [Mobile Implementation Considerations](#3-mobile-implementation-considerations)
4. [Recommended Architecture](#4-recommended-architecture)

---

## 1. Backend API Reference

> **All endpoints can be reused as-is.** The existing Express.js backend serves JSON responses compatible with any client.

### 1.1 Authentication

**Base URL:** `/api`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/user` | GET | Get current authenticated user |
| `/api/login` | POST | Email/password login |
| `/api/logout` | POST | End session |
| `/api/google-auth/callback` | GET | Google OAuth callback |

**Authentication Flow:**
- Session-based authentication via cookies
- Passport.js handles session management
- Mobile app should store session cookie and include in all requests

**User Response Structure:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  plan: 'free' | 'trial' | 'standard' | 'plus' | 'plus_seo';
  role: 'owner' | 'employee' | 'super_admin';
  stripeCustomerId?: string;
  createdAt: string;
}
```

---

### 1.2 Leads Page APIs

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/leads` | GET | - | `Lead[]` |
| `/api/leads` | POST | `CreateLeadDTO` | `Lead` |
| `/api/leads/:id` | PATCH | `Partial<Lead>` | `Lead` |
| `/api/leads/:id` | DELETE | - | `{ success: true }` |
| `/api/leads/:id/stage` | PATCH | `{ stage: string }` | `Lead` |
| `/api/leads/:id/tags` | POST | `{ tagId: string }` | `Lead` |
| `/api/leads/:id/tags/:tagId` | DELETE | - | `Lead` |
| `/api/multi-service-leads` | GET | - | `MultiServiceLead[]` |
| `/api/multi-service-leads/:id` | DELETE | - | `{ success: true }` |
| `/api/lead-tags` | GET | - | `LeadTag[]` |
| `/api/lead-tags` | POST | `{ name, color }` | `LeadTag` |
| `/api/lead-tags/:id` | PATCH | `{ name?, color? }` | `LeadTag` |
| `/api/lead-tags/:id` | DELETE | - | `{ success: true }` |

**Lead Data Models:**

```typescript
// Single Service Lead
interface Lead {
  id: number;
  userId: string;
  formulaId?: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  calculatedPrice: number;  // in cents
  variables: Record<string, any>;
  stage: 'new' | 'pre_estimate' | 'estimate_approved' | 'booked' | 'completed';
  source?: string;
  ipAddress?: string;
  createdAt: string;
  formula?: { name: string; title: string };
}

// Multi-Service Lead
interface MultiServiceLead {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  howDidYouHear?: string;
  services: Array<{
    formulaId: number;
    formulaName: string;
    variables: Record<string, any>;
    calculatedPrice: number;
  }>;
  totalPrice: number;  // cents
  appliedDiscounts?: Array<{
    id: string;
    name: string;
    percentage: number;
    amount: number;
  }>;
  bundleDiscountAmount?: number;
  selectedUpsells?: Array<{
    id: string;
    name: string;
    percentageOfMain: number;
    amount: number;
    category?: string;
  }>;
  stage: string;
  stageHistory?: Array<{
    stage: string;
    changedAt: string;
    notes?: string;
  }>;
  createdAt: string;
}

// Lead Tag
interface LeadTag {
  id: string;
  userId: string;
  name: string;
  color?: string;
  createdAt: string;
}
```

**Estimate/Invoice Lifecycle APIs:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/estimates` | GET | Fetch all estimates |
| `/api/estimates` | POST | Create estimate from lead |
| `/api/estimates/:id/request-revision` | POST | Request customer revision |
| `/api/estimates/:id/mark-customer-approved` | POST | Mark as approved |
| `/api/estimates/:id/convert-to-work-order` | POST | Convert to work order |
| `/api/work-orders` | GET | Fetch all work orders |
| `/api/work-orders/:id` | PATCH | Update/schedule work order |
| `/api/work-orders/:id/convert-to-invoice` | POST | Convert to invoice |
| `/api/invoices` | GET | Fetch all invoices |
| `/api/invoices/:id` | PATCH | Mark paid, update status |
| `/api/invoices/:id/convert-to-work-order` | POST | Revert to work order |

---

### 1.3 Calendar Page APIs

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/recurring-availability` | GET | - | `WeeklySchedule` |
| `/api/recurring-availability/save-schedule` | POST/PATCH | `WeeklySchedule` | `{ success: true }` |
| `/api/availability-slots` | GET | `?date=YYYY-MM-DD` | `AvailabilitySlot[]` |
| `/api/availability-slots/:from/:to` | GET | - | `AvailabilitySlot[]` |
| `/api/availability-slots` | POST | `CreateSlotDTO` | `AvailabilitySlot` |
| `/api/availability-slots/:id` | PATCH | `Partial<Slot>` | `AvailabilitySlot` |
| `/api/blocked-dates` | GET | - | `BlockedDate[]` |
| `/api/blocked-dates` | POST | `{ date, reason? }` | `BlockedDate` |
| `/api/blocked-dates/:id` | DELETE | - | `{ success: true }` |

**Google Calendar Integration:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/google-calendar/status` | GET | Check connection status |
| `/api/google-calendar/connect` | POST | Initiate OAuth flow |
| `/api/google-calendar/disconnect` | POST | Revoke access |
| `/api/google-calendar/calendars` | GET | List available calendars |
| `/api/google-calendar/selected-calendars` | POST | Save selected calendars |
| `/api/google-calendar/events` | GET | Fetch synced events |
| `/api/google-calendar/events` | POST | Create calendar event |

**Calendar Data Models:**

```typescript
interface DayAvailability {
  enabled: boolean;
  startTime: string;      // "09:00"
  endTime: string;        // "17:00"
  slotDuration: number;   // minutes (30, 60, etc.)
}

interface WeeklySchedule {
  [dayOfWeek: number]: DayAvailability;  // 0=Sunday, 6=Saturday
}

interface AvailabilitySlot {
  id: number;
  userId: string;
  date: string;           // ISO date
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: number;      // lead ID
  title?: string;
  notes?: string;
  createdAt: string;
  // Embedded lead data when booked
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  leadServices?: Array<{
    formulaId: number;
    formulaName: string;
    calculatedPrice: number;
  }>;
  leadTotalPrice?: number;
}

interface BlockedDate {
  id: number;
  userId: string;
  date: string;
  reason?: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  googleCalendarId: string;
  googleEventId: string;
  title: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isBusy: boolean;
}
```

---

### 1.4 Stats Page APIs

| Endpoint | Method | Response |
|----------|--------|----------|
| `/api/stats` | GET | `StatsData` |
| `/api/multi-service-leads` | GET | Used for analytics calculations |
| `/api/formulas` | GET | For service breakdown |

**Stats Data Model:**

```typescript
interface StatsData {
  totalCalculators: number;
  leadsThisMonth: number;
  avgQuoteValue: number;
  totalRevenue: number;
  conversionRate: number;
  activeFormulas: number;
  totalCalculatorSessions?: number;
}
```

**Note:** Most stats are calculated client-side from lead data. The `/api/stats` endpoint provides basic KPIs; complex analytics (funnel, trends, service breakdown) are derived from leads.

---

### 1.5 Form Settings APIs

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/business-settings` | GET | - | `BusinessSettings` |
| `/api/business-settings` | PATCH | `Partial<BusinessSettings>` | `BusinessSettings` |

**Business Settings Model:**

```typescript
interface BusinessSettings {
  id: string;
  userId: string;

  // Feature flags
  enableBooking: boolean;
  enableServiceCart: boolean;
  enableAutoExpandCollapse: boolean;
  enableRouteOptimization: boolean;
  routeOptimizationThreshold: number;  // miles

  // Pricing
  showBundleDiscount: boolean;
  bundleDiscountPercent: number;       // 1-50
  bundleMinServices: number;           // 2-5
  enableSalesTax: boolean;
  salesTaxRate: number;

  // Lead capture
  requireName: boolean;
  requireEmail: boolean;
  requirePhone: boolean;
  enablePhone: boolean;
  enableAddress: boolean;
  enableNotes: boolean;
  enableHowDidYouHear: boolean;
  howDidYouHearOptions: string[];
  leadSourceOptions: string[];

  // Messaging
  leadCaptureMessage: string;
  thankYouMessage: string;
  contactEmail: string;

  // Distance pricing
  businessAddress: string;
  serviceRadius: number;               // miles
  enableDistancePricing: boolean;
  distancePricingType: 'dollar' | 'percent';
  distancePricingRate: number;

  // Discounts
  discounts: Array<{
    id: string;
    name: string;
    percentage: number;
    isActive: boolean;
    description?: string;
  }>;
  allowDiscountStacking: boolean;

  // Media
  enableImageUpload: boolean;
  maxImages: number;                   // 1-10
  maxImageSize: number;                // MB
  imageUploadLabel: string;

  // Videos
  guideVideos: {
    introVideo?: string;
    pricingVideo?: string;
    scheduleVideo?: string;
  };

  // Custom styling
  styling: {
    enableDisclaimer: boolean;
    disclaimerText: string;
    selectionTitle: string;
    configurationTitle: string;
    contactTitle: string;
    pricingTitle: string;
    [key: string]: any;
  };

  // Calendar
  maxDaysOut: number;
}
```

---

### 1.6 Design Page APIs

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/design-settings` | GET | - | `DesignSettings` |
| `/api/design-settings` | PUT | `DesignSettings` | `DesignSettings` |
| `/api/design-settings/generate-css` | POST | `{ description: string }` | `{ css: string }` |
| `/api/design-settings/edit-css` | POST | `{ currentCSS, editDescription }` | `{ css: string }` |

**Design Settings Model:**

```typescript
interface DesignSettings {
  id: string;
  userId: string;
  styling: StylingOptions;
  componentStyles: ComponentStyles;
  customCSS?: string;
  createdAt: string;
  updatedAt: string;
}

interface StylingOptions {
  // Container
  containerWidth: number;
  containerBorderRadius: number;
  containerShadow: string;
  containerBorderWidth: number;
  containerBorderColor: string;
  containerPadding: number;
  backgroundColor: string;

  // Typography
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  textColor: string;
  primaryColor: string;

  // Buttons
  buttonStyle: string;
  buttonBorderRadius: number;
  buttonPadding: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  buttonHoverBackgroundColor: string;

  // Inputs
  inputBorderRadius: number;
  inputBorderWidth: number;
  inputBorderColor: string;
  inputFocusColor: string;
  inputBackgroundColor: string;
  inputHeight: number;

  // Component-specific
  multiChoiceImageSize: string;
  multiChoiceSelectedColor: string;
  multiChoiceSelectedBgColor: string;
  serviceSelectorWidth: number;
  serviceSelectorCardSize: string;
  serviceSelectorBorderRadius: number;
  pricingCardBorderRadius: number;
  pricingCardShadow: string;
  pricingTextColor: string;
  pricingAccentColor: string;

  // Feature flags (for preview)
  showPriceBreakdown: boolean;
  includeLedCapture: boolean;
  showProgressGuide: boolean;
  showDisclaimer: boolean;
  enableBooking: boolean;
  enableImageUpload: boolean;
}

interface ComponentStyles {
  serviceSelector: ComponentStyle;
  textInput: ComponentStyle;
  dropdown: ComponentStyle;
  multipleChoice: ComponentStyle;
  slider: ComponentStyle;
  pricingCard: ComponentStyle;
  button: ComponentStyle;
}

interface ComponentStyle {
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  activeBackgroundColor?: string;
  hoverBackgroundColor?: string;
  shadow: string;
  height?: number;
  borderRadius: number;
}
```

---

### 1.7 Formula Builder APIs

| Endpoint | Method | Request Body | Response |
|----------|--------|--------------|----------|
| `/api/formulas` | GET | - | `Formula[]` |
| `/api/formulas/:id` | GET | - | `Formula` |
| `/api/formulas` | POST | `CreateFormulaDTO` | `Formula` |
| `/api/formulas/:id` | PATCH | `{ isActive?: boolean }` | `Formula` |
| `/api/formulas/:id` | DELETE | - | `{ success: true }` |
| `/api/formulas/reorder` | POST | `{ formulas: { id, sortOrder }[] }` | `{ success: true }` |
| `/api/formula-builder/:id` | GET | - | Full formula with all details |

**Formula Data Model:**

```typescript
interface Formula {
  id: number;
  userId: string;
  name: string;
  title: string;
  description?: string;
  bulletPoints: string[];
  variables: Variable[];
  formula: string;              // Mathematical expression
  styling: StylingOptions;
  isActive: boolean;
  isDisplayed: boolean;
  embedId: string;              // Unique public identifier
  guideVideoUrl?: string;
  showImage: boolean;
  imageUrl?: string;
  iconUrl?: string;             // Emoji or URL
  enableMeasureMap: boolean;
  enablePhotoMeasurement: boolean;
  photoMeasurementSetup?: PhotoMeasurementConfig;
  upsellItems: UpsellItem[];
  sortOrder: number;
  enableDistancePricing: boolean;
  distancePricingType?: 'dollar' | 'percent';
  distancePricingRate?: number;
  serviceRadius?: number;
  minPrice?: number;            // cents
  maxPrice?: number;            // cents
  createdAt: string;
  updatedAt: string;
}

interface Variable {
  id: string;
  name: string;
  label: string;
  type: 'number' | 'slider' | 'multiselect' | 'dropdown' | 'text' | 'checkbox';
  value?: string | number;
  default?: string | number;
  unit?: string;
  options?: Array<{ label: string; value: string | number }>;
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  conditionalVisibility?: {
    dependsOn: string;
    operator: 'equals' | 'not_equals' | 'greater' | 'less';
    value: any;
  };
}

interface UpsellItem {
  id: string;
  name: string;
  description?: string;
  percentageOfMain: number;    // e.g., 20 for 20%
  category?: string;
}

interface PhotoMeasurementConfig {
  objectDescription: string;
  customerInstructions?: string;
  measurementType: 'area' | 'length' | 'width';
  referenceImages: Array<{
    image: string;
    description: string;
    measurement: number;
    unit: string;
  }>;
}
```

---

### 1.8 External Service APIs Used

**Google Calendar OAuth Flow:**
```
1. GET /api/google-calendar/connect
   - Redirects to Google OAuth consent screen

2. GET /api/google-calendar/callback?code=xxx
   - Exchanges code for tokens
   - Stores encrypted refresh token

3. Mobile Implementation:
   - Use ASWebAuthenticationSession (iOS)
   - Handle redirect URI: {your-domain}/api/google-calendar/callback
```

**AI CSS Generation:**
```
POST /api/design-settings/generate-css
Body: { description: "Modern neumorphism with soft shadows" }
Response: { css: ".ab-button { box-shadow: 8px 8px 16px #d1d9e6..." }

Uses: Claude API -> Gemini fallback -> OpenAI fallback
```

**Photo Measurement AI:**
```
POST /api/analyze-photo-measurement
Body: {
  imageBase64: string,
  setupConfig: {
    objectDescription: string,
    measurementType: 'area' | 'length' | 'width',
    referenceImages: Array<{ image, measurement, unit }>
  }
}
Response: {
  measuredValue: number,
  unit: string,
  confidence: number,
  analysis: string
}
```

---

## 2. Frontend Components/Logic

### 2.1 Leads Page Components

**Component Hierarchy:**
```
LeadsPage
├── Header (filters, search, view toggle)
├── LeadTagsManager
│   ├── TagChips (color-coded)
│   └── CreateTagDialog
├── LeadsList / LeadsKanban (view modes)
│   └── LeadCard
│       ├── LeadBadge (stage, tags)
│       ├── ServiceSummary
│       └── ActionButtons
├── LeadDetailsModal
│   ├── ContactInfo
│   ├── ServiceBreakdown
│   ├── StageSelector
│   ├── NotesEditor
│   ├── EstimateSection
│   └── ActionButtons (email, call, schedule)
└── BulkActionsBar (when items selected)
```

**Mobile Adaptation Required:**
- Replace Kanban drag-drop with swipe gestures for stage changes
- Bottom sheet instead of modal for lead details
- Pull-to-refresh for lead list
- Native share sheet for lead contact info

**Key State Management:**
```typescript
// React Query hooks to replicate
const { data: leads } = useQuery(['leads'], fetchLeads);
const { data: multiServiceLeads } = useQuery(['multi-service-leads'], fetchMultiServiceLeads);
const { data: tags } = useQuery(['lead-tags'], fetchTags);

// Mutations
const updateStageMutation = useMutation(updateLeadStage, {
  onMutate: (vars) => {
    // Optimistic update
    queryClient.setQueryData(['leads'], old =>
      old.map(l => l.id === vars.id ? {...l, stage: vars.stage} : l)
    );
  }
});
```

---

### 2.2 Calendar Page Components

**Component Hierarchy:**
```
CalendarPage
├── CalendarHeader (month selector, view toggle)
├── RecurringAvailabilityEditor
│   └── DayScheduleRow (per weekday)
├── MonthCalendarView
│   └── CalendarDay
│       ├── AvailabilitySlot
│       └── BlockedIndicator
├── DayDetailSheet (bottom sheet)
│   ├── TimeSlotList
│   ├── BookingDetails
│   └── AddSlotButton
├── GoogleCalendarSync
│   ├── ConnectionStatus
│   ├── CalendarSelector
│   └── SyncedEvents
└── WorkOrderScheduler
```

**Mobile Adaptation Required:**
- Use native iOS calendar components where possible
- Bottom sheet for day details instead of inline expansion
- Haptic feedback on slot selection
- Deep link support for calendar integration

**Key Business Logic:**
```typescript
// Generate time slots from recurring schedule
function generateSlotsForDate(date: Date, schedule: WeeklySchedule): TimeSlot[] {
  const dayOfWeek = date.getDay();
  const dayConfig = schedule[dayOfWeek];

  if (!dayConfig?.enabled) return [];

  const slots: TimeSlot[] = [];
  let current = parseTime(dayConfig.startTime);
  const end = parseTime(dayConfig.endTime);

  while (current < end) {
    slots.push({
      startTime: formatTime(current),
      endTime: formatTime(addMinutes(current, dayConfig.slotDuration))
    });
    current = addMinutes(current, dayConfig.slotDuration);
  }

  return slots;
}

// Check slot availability (exclude booked, blocked, Google busy)
function isSlotAvailable(slot: TimeSlot, date: Date, context: {
  bookedSlots: AvailabilitySlot[],
  blockedDates: BlockedDate[],
  googleEvents: CalendarEvent[]
}): boolean {
  // Check blocked dates
  if (context.blockedDates.some(b => isSameDay(b.date, date))) return false;

  // Check existing bookings
  if (context.bookedSlots.some(b =>
    isSameDay(b.date, date) && overlaps(b, slot)
  )) return false;

  // Check Google Calendar busy times
  if (context.googleEvents.some(e =>
    e.isBusy && isSameDay(e.startTime, date) && overlaps(e, slot)
  )) return false;

  return true;
}
```

---

### 2.3 Stats Page Components

**Component Hierarchy:**
```
StatsPage
├── TimeFilterSelector (7/30/90/365 days)
├── KPICards
│   ├── TotalLeadsCard
│   ├── RevenueCard
│   ├── ConversionRateCard
│   └── AvgQuoteValueCard
├── ConversionFunnel (bar chart)
├── RevenueByService (pie/donut chart)
├── MonthlyTrends (line/area chart)
├── LeadsBySource (horizontal bar)
└── TopServices (ranked list)
```

**Mobile Adaptation Required:**
- Use iOS-native Charts library (DGCharts/Charts)
- Horizontal scroll for wide charts
- Tap-to-expand chart details
- Share/export stats functionality

**Key Calculations (client-side):**
```typescript
// Conversion funnel
function calculateFunnel(stats: StatsData, leads: Lead[]) {
  const totalViews = stats.totalCalculators * 15; // avg page views
  const calculatorStarts = stats.totalCalculatorSessions ||
    Math.floor(totalViews * 0.4);
  const leadsGenerated = leads.length;
  const leadsBooked = leads.filter(l =>
    ['booked', 'completed'].includes(l.stage)
  ).length;

  return [
    { name: 'Page Views', value: totalViews },
    { name: 'Calculator Started', value: calculatorStarts },
    { name: 'Leads Generated', value: leadsGenerated },
    { name: 'Booked', value: leadsBooked }
  ];
}

// Revenue by service
function calculateRevenueByService(leads: MultiServiceLead[]) {
  const byService: Record<string, { count: number; revenue: number }> = {};

  leads.forEach(lead => {
    lead.services?.forEach(service => {
      if (!byService[service.formulaName]) {
        byService[service.formulaName] = { count: 0, revenue: 0 };
      }
      byService[service.formulaName].count++;
      byService[service.formulaName].revenue += service.calculatedPrice / 100;
    });
  });

  return Object.entries(byService)
    .map(([name, data]) => ({ serviceName: name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

// Filter by date range
function filterByDateRange(leads: Lead[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return leads.filter(l => new Date(l.createdAt) >= cutoff);
}
```

---

### 2.4 Form Settings Components

**Component Hierarchy:**
```
FormSettingsPage
├── CustomerFlowSection
│   ├── ToggleSwitch (progress guide)
│   ├── ToggleSwitch (booking)
│   ├── ToggleSwitch (service cart)
│   └── RouteOptimizationSlider
├── BundlePricingSection
│   ├── EnableToggle
│   ├── PercentageSlider (1-50%)
│   └── MinServicesSlider (2-5)
├── DiscountsSection
│   ├── StackingToggle
│   └── DiscountList (add/edit/delete)
├── SalesTaxSection
│   ├── EnableToggle
│   └── RateInput
├── LeadCaptureSection
│   ├── FieldToggles (name, email, phone, address, notes)
│   ├── RequiredToggles
│   └── HowDidYouHearOptions
├── LocationPricingSection
│   ├── AddressAutocomplete (Google Places)
│   ├── RadiusSlider
│   └── PricingRateConfig
├── ImageUploadSection
│   ├── EnableToggle
│   ├── MaxImagesSlider
│   └── MaxSizeSlider
└── SaveButton (sticky bottom)
```

**Mobile Adaptation Required:**
- Native form controls (switches, sliders, pickers)
- Keyboard-aware scrolling for text inputs
- Google Places Autocomplete SDK for address
- Sectioned form with collapsible headers

---

### 2.5 Design Page Components

**Component Hierarchy:**
```
DesignPage
├── PreviewPane (live calculator preview)
├── StyleEditor
│   ├── ColorPickers
│   ├── DimensionSliders
│   ├── FontSelector
│   └── ShadowControls
├── ComponentStylesEditor
│   ├── ServiceSelectorStyles
│   ├── InputStyles
│   ├── ButtonStyles
│   ├── SliderStyles
│   ├── MultiChoiceStyles
│   └── PricingCardStyles
├── CustomCSSEditor
│   ├── CodeEditor
│   └── ValidationStatus
├── AIAssistant
│   ├── PromptInput
│   └── GeneratedPreview
└── ActionButtons (save, reset, AI generate)
```

**Mobile Adaptation Required:**
- Simplified style editor (presets vs granular control)
- Side-by-side preview on iPad only
- Color picker using iOS native component
- Code editor with syntax highlighting (limited on mobile)

---

### 2.6 Formula Builder Components

**Component Hierarchy:**
```
FormulasPage
├── Header (title, create button)
├── FormulaGrid (sortable)
│   └── FormulaCard
│       ├── Icon (emoji or image)
│       ├── Title & Status
│       ├── VariableCount
│       └── ActionMenu (edit, delete, preview)
├── DragOverlay (during reorder)
└── PreviewModal
    └── CalculatorPreview
```

**Mobile Adaptation Required:**
- Long-press to initiate drag for reorder
- Swipe actions for quick toggle/delete
- Full-screen preview modal
- Create button in navigation bar

**Drag-Drop Logic:**
```typescript
// Using @dnd-kit concepts for iOS
// On iOS: Use UICollectionView with drag-drop delegates

// Reorder handler
async function handleReorder(fromIndex: number, toIndex: number) {
  const reordered = arrayMove(formulas, fromIndex, toIndex);

  // Optimistic update
  setFormulas(reordered);

  // API call
  const orderPayload = reordered.map((f, i) => ({
    id: f.id,
    sortOrder: i
  }));

  try {
    await api.post('/api/formulas/reorder', { formulas: orderPayload });
  } catch (error) {
    // Rollback on failure
    setFormulas(formulas);
    showError('Failed to reorder');
  }
}
```

---

## 3. Mobile Implementation Considerations

### 3.1 Authentication Challenges

| Challenge | Solution |
|-----------|----------|
| Session cookie management | Use `URLSession` with persistent cookie storage |
| Google OAuth flow | Use `ASWebAuthenticationSession` for OAuth redirect |
| Token refresh | Implement 401 interceptor to trigger re-auth |
| Biometric login | Store session in Keychain, unlock with Face/Touch ID |

```swift
// iOS session handling example
class APIClient {
    let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        self.session = URLSession(configuration: config)
    }
}
```

### 3.2 Offline Support Strategy

| Data Type | Offline Strategy |
|-----------|------------------|
| Leads | Cache locally (Core Data/Realm), sync on reconnect |
| Calendar | Pre-fetch 2 months, queue new bookings |
| Settings | Cache indefinitely, sync changes when online |
| Formulas | Cache metadata, fetch full details on demand |
| Stats | Cache last fetch, show stale indicator |

```swift
// Offline mutation queue
class OfflineMutationQueue {
    private var pendingMutations: [PendingMutation] = []

    func enqueue(_ mutation: PendingMutation) {
        pendingMutations.append(mutation)
        persistToStorage()
    }

    func sync() async {
        for mutation in pendingMutations {
            do {
                try await executeMutation(mutation)
                removeMutation(mutation)
            } catch {
                // Retry with backoff
            }
        }
    }
}
```

### 3.3 Performance Considerations

| Area | Recommendation |
|------|----------------|
| Lead list scrolling | Use `UICollectionView` with diffable data source |
| Image loading | Lazy load with Kingfisher/SDWebImage |
| Chart rendering | Use DGCharts with data decimation for large datasets |
| Form inputs | Debounce API calls (500ms) |
| Calendar rendering | Pre-compute visible month slots |

### 3.4 Platform-Specific UI Adaptations

| Web Component | iOS Equivalent |
|---------------|----------------|
| Modal dialogs | `UISheetPresentationController` (bottom sheets) |
| Dropdown selects | `UIMenu` or `UIPickerView` |
| Color pickers | `UIColorPickerViewController` |
| Date/time pickers | `UIDatePicker` |
| Drag-and-drop | `UICollectionView` drag delegates |
| Toast notifications | Custom toast or `SPIndicator` |
| Loading spinners | `UIActivityIndicatorView` |
| Pull-to-refresh | `UIRefreshControl` |

### 3.5 Deep Linking Support

```swift
// URL scheme: autobidder://
// Universal links: https://app.autobidder.com/

enum DeepLink {
    case lead(id: Int)
    case calendar(date: Date)
    case formula(id: Int)
    case settings
}

// Example routes:
// autobidder://leads/123
// autobidder://calendar?date=2026-01-20
// autobidder://formulas/456/edit
```

### 3.6 Push Notifications

| Event | Notification |
|-------|--------------|
| New lead created | "New lead: John Doe - Kitchen Cleaning ($500)" |
| Booking confirmed | "Booking confirmed for Jan 20 at 2:00 PM" |
| Estimate approved | "John Doe approved your estimate" |
| Payment received | "Payment received: $500 from John Doe" |

### 3.7 Third-Party SDK Requirements

| Service | iOS SDK |
|---------|---------|
| Google Maps | Google Maps SDK for iOS |
| Google Places | Google Places SDK for iOS |
| Google Calendar | Google Sign-In SDK + Calendar API |
| Stripe | Stripe iOS SDK |
| Charts | DGCharts (formerly Charts) |
| Analytics | Firebase Analytics (optional) |

---

## 4. Recommended Architecture

### 4.1 Shared Code Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                  │
│                    - Unchanged -                         │
│                  Serves both web & mobile                │
└─────────────────────────────────────────────────────────┘
                            │
                            │ REST API (JSON)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Web App     │   │  iOS App      │   │ Android App   │
│   (React)     │   │  (Swift)      │   │  (Future)     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### 4.2 iOS App Architecture (MVVM)

```
┌─────────────────────────────────────────────────────────┐
│                        Views                             │
│   SwiftUI Views / UIKit ViewControllers                 │
└─────────────────────────────────────────────────────────┘
                            │
                            │ @Published / Combine
                            │
┌─────────────────────────────────────────────────────────┐
│                     ViewModels                           │
│   LeadsViewModel, CalendarViewModel, StatsViewModel     │
│   - State management                                     │
│   - Business logic                                       │
│   - API coordination                                     │
└─────────────────────────────────────────────────────────┘
                            │
                            │ async/await
                            │
┌─────────────────────────────────────────────────────────┐
│                      Services                            │
│   APIService, AuthService, CacheService                 │
│   - Network requests                                     │
│   - Local storage                                        │
│   - Third-party SDKs                                     │
└─────────────────────────────────────────────────────────┘
                            │
                            │
┌─────────────────────────────────────────────────────────┐
│                       Models                             │
│   Lead, Formula, AvailabilitySlot, BusinessSettings     │
│   - Codable structs matching API                         │
│   - Core Data entities for offline                       │
└─────────────────────────────────────────────────────────┘
```

### 4.3 File Structure Recommendation

```
AutobidderApp/
├── App/
│   ├── AutobidderApp.swift
│   ├── AppDelegate.swift
│   └── SceneDelegate.swift
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift
│   │   ├── Endpoints.swift
│   │   └── NetworkError.swift
│   ├── Storage/
│   │   ├── CacheManager.swift
│   │   ├── KeychainManager.swift
│   │   └── CoreDataStack.swift
│   └── Auth/
│       ├── AuthService.swift
│       └── GoogleAuthService.swift
├── Models/
│   ├── Lead.swift
│   ├── MultiServiceLead.swift
│   ├── Formula.swift
│   ├── AvailabilitySlot.swift
│   ├── BusinessSettings.swift
│   └── DesignSettings.swift
├── Features/
│   ├── Leads/
│   │   ├── Views/
│   │   │   ├── LeadsView.swift
│   │   │   ├── LeadCardView.swift
│   │   │   └── LeadDetailSheet.swift
│   │   └── LeadsViewModel.swift
│   ├── Calendar/
│   │   ├── Views/
│   │   │   ├── CalendarView.swift
│   │   │   ├── DayDetailSheet.swift
│   │   │   └── RecurringScheduleView.swift
│   │   └── CalendarViewModel.swift
│   ├── Stats/
│   │   ├── Views/
│   │   │   ├── StatsView.swift
│   │   │   └── ChartViews/
│   │   └── StatsViewModel.swift
│   ├── Settings/
│   │   ├── Views/
│   │   │   ├── FormSettingsView.swift
│   │   │   └── DesignSettingsView.swift
│   │   └── SettingsViewModel.swift
│   └── Formulas/
│       ├── Views/
│       │   ├── FormulasGridView.swift
│       │   └── FormulaCardView.swift
│       └── FormulasViewModel.swift
├── Shared/
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   └── EmptyStateView.swift
│   ├── Extensions/
│   │   ├── Date+Extensions.swift
│   │   ├── String+Extensions.swift
│   │   └── Color+Extensions.swift
│   └── Utilities/
│       ├── CurrencyFormatter.swift
│       └── DateFormatter.swift
└── Resources/
    ├── Assets.xcassets
    └── Localizable.strings
```

### 4.4 State Management Pattern

```swift
// ViewModel base pattern
@MainActor
class BaseViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: Error?

    func load() async {
        isLoading = true
        error = nil
        defer { isLoading = false }

        do {
            try await fetchData()
        } catch {
            self.error = error
        }
    }

    func fetchData() async throws {
        fatalError("Override in subclass")
    }
}

// Example: LeadsViewModel
@MainActor
class LeadsViewModel: BaseViewModel {
    @Published var leads: [Lead] = []
    @Published var multiServiceLeads: [MultiServiceLead] = []
    @Published var tags: [LeadTag] = []
    @Published var selectedStageFilter: String?

    private let apiClient: APIClient
    private let cache: CacheManager

    var filteredLeads: [Lead] {
        guard let filter = selectedStageFilter else { return leads }
        return leads.filter { $0.stage == filter }
    }

    override func fetchData() async throws {
        async let leadsTask = apiClient.get("/api/leads", as: [Lead].self)
        async let multiTask = apiClient.get("/api/multi-service-leads", as: [MultiServiceLead].self)
        async let tagsTask = apiClient.get("/api/lead-tags", as: [LeadTag].self)

        let (leads, multi, tags) = try await (leadsTask, multiTask, tagsTask)

        self.leads = leads
        self.multiServiceLeads = multi
        self.tags = tags

        // Cache for offline
        cache.save(leads, forKey: "leads")
        cache.save(multi, forKey: "multi-service-leads")
    }

    func updateStage(leadId: Int, stage: String) async {
        // Optimistic update
        if let index = leads.firstIndex(where: { $0.id == leadId }) {
            leads[index].stage = stage
        }

        do {
            try await apiClient.patch("/api/leads/\(leadId)/stage", body: ["stage": stage])
        } catch {
            // Rollback
            await load()
            self.error = error
        }
    }
}
```

### 4.5 API Client Implementation

```swift
actor APIClient {
    private let session: URLSession
    private let baseURL: URL
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(baseURL: URL) {
        self.baseURL = baseURL

        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpCookieAcceptPolicy = .always
        self.session = URLSession(configuration: config)

        decoder.dateDecodingStrategy = .iso8601
        encoder.dateEncodingStrategy = .iso8601
    }

    func get<T: Decodable>(_ path: String, as type: T.Type) async throws -> T {
        let url = baseURL.appendingPathComponent(path)
        let (data, response) = try await session.data(from: url)
        try validateResponse(response)
        return try decoder.decode(T.self, from: data)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B, as type: T.Type) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await session.data(for: request)
        try validateResponse(response)
        return try decoder.decode(T.self, from: data)
    }

    func patch<B: Encodable>(_ path: String, body: B) async throws {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)

        let (_, response) = try await session.data(for: request)
        try validateResponse(response)
    }

    private func validateResponse(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        switch http.statusCode {
        case 200...299: return
        case 401: throw APIError.unauthorized
        case 400...499: throw APIError.clientError(http.statusCode)
        case 500...599: throw APIError.serverError(http.statusCode)
        default: throw APIError.unknown(http.statusCode)
        }
    }
}

enum APIError: Error {
    case invalidResponse
    case unauthorized
    case clientError(Int)
    case serverError(Int)
    case unknown(Int)
}
```

### 4.6 Replit Mobile Builder Considerations

Since you're using Replit's mobile builder:

1. **API Base URL**: Configure the base URL to point to your deployed backend
2. **CORS**: Ensure backend allows requests from mobile app origin
3. **Cookie Handling**: Verify session cookies work with Replit's mobile runtime
4. **Environment Variables**: Store API URLs and keys securely
5. **Hot Reload**: Test changes incrementally during development

---

## Appendix A: Database Schema Summary

| Table | Key Columns | Relationships |
|-------|-------------|---------------|
| `users` | id, email, plan, role | One-to-many with all other tables |
| `formulas` | id, user_id, name, variables, formula, embed_id | Belongs to user, has many leads |
| `leads` | id, user_id, formula_id, stage, calculated_price | Belongs to user and formula |
| `multi_service_leads` | id, user_id, services (JSONB), total_price | Belongs to user |
| `lead_tags` | id, user_id, name, color | Many-to-many with leads |
| `availability_slots` | id, user_id, date, start_time, is_booked | Belongs to user, optionally to lead |
| `recurring_availability` | id, user_id, day_of_week, enabled, times | Belongs to user |
| `blocked_dates` | id, user_id, date, reason | Belongs to user |
| `business_settings` | id, user_id, settings (JSONB) | One-to-one with user |
| `design_settings` | id, user_id, styling (JSONB), custom_css | One-to-one with user |

---

## Appendix B: API Response Examples

### GET /api/leads
```json
[
  {
    "id": 1,
    "userId": "user_abc123",
    "formulaId": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "address": "123 Main St, City, ST 12345",
    "notes": "Prefers morning appointments",
    "calculatedPrice": 50000,
    "variables": {
      "squareFootage": 2000,
      "rooms": 5,
      "deepClean": true
    },
    "stage": "new",
    "source": "website",
    "createdAt": "2026-01-15T10:30:00Z",
    "formula": {
      "name": "house-cleaning",
      "title": "House Cleaning"
    }
  }
]
```

### GET /api/availability-slots/2026-01-01/2026-01-31
```json
[
  {
    "id": 10,
    "userId": "user_abc123",
    "date": "2026-01-20",
    "startTime": "09:00",
    "endTime": "10:00",
    "isBooked": true,
    "bookedBy": 1,
    "title": "John Doe - House Cleaning",
    "notes": null,
    "createdAt": "2026-01-18T15:00:00Z",
    "leadName": "John Doe",
    "leadEmail": "john@example.com",
    "leadPhone": "555-123-4567",
    "leadServices": [
      {
        "formulaId": 5,
        "formulaName": "House Cleaning",
        "calculatedPrice": 50000
      }
    ],
    "leadTotalPrice": 50000
  }
]
```

### GET /api/formulas
```json
[
  {
    "id": 5,
    "userId": "user_abc123",
    "name": "house-cleaning",
    "title": "House Cleaning",
    "description": "Professional house cleaning service",
    "bulletPoints": ["Eco-friendly products", "Satisfaction guaranteed"],
    "variables": [
      {
        "id": "sqft",
        "name": "squareFootage",
        "label": "Square Footage",
        "type": "slider",
        "min": 500,
        "max": 5000,
        "step": 100,
        "default": 1500,
        "required": true
      }
    ],
    "formula": "squareFootage * 0.15 + (deepClean ? 50 : 0)",
    "isActive": true,
    "embedId": "abc123xyz",
    "sortOrder": 0,
    "iconUrl": "🏠",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

## Appendix C: Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `VALIDATION_ERROR` - 400
- `CONFLICT` - 409
- `RATE_LIMITED` - 429
- `SERVER_ERROR` - 500

---

*End of Technical Specification*
