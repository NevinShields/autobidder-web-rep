/**
 * Facebook Conversion API (CAPI) Integration
 *
 * This module handles server-side event tracking to Facebook's Conversion API
 * for improved attribution and conversion tracking.
 *
 * Documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto';

const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID || '878078334667672';
const META_ACCESS_TOKEN =
  process.env.META_ACCESS_TOKEN ||
  process.env.FACEBOOK_ACCESS_TOKEN ||
  process.env.FB_ACCESS_TOKEN;
const META_API_VERSION = 'v25.0';

// Test event code for debugging in Events Manager.
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || process.env.FB_TEST_EVENT_CODE;

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // Facebook click ID from cookie
  fbp?: string; // Facebook browser ID from cookie
}

interface CustomData {
  currency?: string;
  value?: number;
  contentName?: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
  numItems?: number;
  status?: string;
  plan_name?: string;
  billing_interval?: string;
  stripe_invoice_id?: string;
  stripe_subscription_id?: string;
  [key: string]: unknown;
}

interface MetaEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  user_data: Record<string, string>;
  custom_data?: CustomData;
  actionSource: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

interface SendEventOptions {
  pixelId?: string;
  accessToken?: string;
  testEventCode?: string | null;
}

/**
 * Hash a value using SHA256 (required by Facebook for PII)
 */
function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Normalize and hash user data for Facebook CAPI
 */
function normalizeUserData(userData: UserData): Record<string, string> {
  const normalized: Record<string, string> = {};

  if (userData.email) {
    normalized.em = hashValue(userData.email);
  }
  if (userData.phone) {
    // Remove all non-numeric characters and hash
    const cleanPhone = userData.phone.replace(/\D/g, '');
    normalized.ph = hashValue(cleanPhone);
  }
  if (userData.firstName) {
    normalized.fn = hashValue(userData.firstName);
  }
  if (userData.lastName) {
    normalized.ln = hashValue(userData.lastName);
  }
  if (userData.city) {
    normalized.ct = hashValue(userData.city.replace(/\s/g, ''));
  }
  if (userData.state) {
    normalized.st = hashValue(userData.state.toLowerCase());
  }
  if (userData.zipCode) {
    normalized.zp = hashValue(userData.zipCode);
  }
  if (userData.country) {
    normalized.country = hashValue(userData.country.toLowerCase());
  }

  // Non-hashed values
  if (userData.clientIpAddress) {
    normalized.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    normalized.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbc) {
    normalized.fbc = userData.fbc;
  }
  if (userData.fbp) {
    normalized.fbp = userData.fbp;
  }

  return normalized;
}

/**
 * Generate a unique event ID for deduplication
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function getMetaApiUrl(pixelId: string): string {
  return `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;
}

function normalizeActionSource(actionSource: MetaEvent["actionSource"]): string {
  return actionSource;
}

function normalizeCustomData(customData?: CustomData) {
  if (!customData) {
    return undefined;
  }

  const {
    contentName,
    contentCategory,
    contentIds,
    contentType,
    numItems,
    ...rest
  } = customData;

  return {
    ...rest,
    ...(contentName !== undefined ? { content_name: contentName } : {}),
    ...(contentCategory !== undefined ? { content_category: contentCategory } : {}),
    ...(contentIds !== undefined ? { content_ids: contentIds } : {}),
    ...(contentType !== undefined ? { content_type: contentType } : {}),
    ...(numItems !== undefined ? { num_items: numItems } : {}),
  };
}

function toMetaPayload(event: MetaEvent) {
  return {
    event_name: event.event_name,
    event_time: event.event_time,
    event_id: event.event_id,
    event_source_url: event.event_source_url,
    user_data: event.user_data,
    custom_data: normalizeCustomData(event.custom_data),
    action_source: normalizeActionSource(event.actionSource),
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Send an event to Facebook Conversion API
 */
async function sendEvent(
  event: MetaEvent,
  options: SendEventOptions = {},
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const pixelId = options.pixelId || META_PIXEL_ID;
  const accessToken = options.accessToken || META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('[Meta CAPI] Missing pixel or access token, skipping event:', event.event_name);
    return { success: false, eventId: event.event_id, error: 'Missing Meta credentials' };
  }

  const payload: any = {
    data: [toMetaPayload(event)],
  };

  // Add test event code if configured (for debugging in Events Manager)
  const testEventCode = options.testEventCode ?? META_TEST_EVENT_CODE;
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(`${getMetaApiUrl(pixelId)}?access_token=${encodeURIComponent(accessToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await readResponseBody(response);

    if (response.ok) {
      console.log(`[Meta CAPI] Event sent successfully: ${event.event_name}`, {
        eventId: event.event_id,
        pixelId,
        response: result,
      });
      return { success: true, eventId: event.event_id };
    } else {
      console.error(`[Meta CAPI] Error sending event: ${event.event_name}`, {
        eventId: event.event_id,
        pixelId,
        status: response.status,
        body: result,
      });
      return {
        success: false,
        eventId: event.event_id,
        error: typeof result === 'string' ? result : JSON.stringify(result),
      };
    }
  } catch (error) {
    console.error(`[Meta CAPI] Network error sending event: ${event.event_name}`, error);
    return { success: false, eventId: event.event_id, error: (error as Error).message };
  }
}

/**
 * Track a CompleteRegistration event (new user signup)
 */
export async function trackCompleteRegistration(
  userData: UserData,
  options?: {
    eventSourceUrl?: string;
    customData?: CustomData;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: MetaEvent = {
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: {
      currency: 'USD',
      status: 'registered',
      ...options?.customData,
    },
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Track a Lead event (form submission, quote request, etc.)
 */
export async function trackLead(
  userData: UserData,
  options?: {
    eventSourceUrl?: string;
    customData?: CustomData;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: MetaEvent = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: options?.customData,
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Track a StartTrial event (when user starts a free trial)
 */
export async function trackStartTrial(
  userData: UserData,
  options?: {
    eventSourceUrl?: string;
    value?: number;
    currency?: string;
    predictedLtv?: number;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: MetaEvent = {
    event_name: 'StartTrial',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: {
      currency: options?.currency || 'USD',
      value: options?.value || 0,
    },
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Track a Subscribe event (when user converts to paid subscription)
 */
export async function trackSubscribe(
  userData: UserData,
  options?: {
    eventSourceUrl?: string;
    value: number;
    currency?: string;
    predictedLtv?: number;
    eventId?: string;
    eventTime?: number;
    customData?: CustomData;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = options?.eventId || generateEventId();

  const event: MetaEvent = {
    event_name: 'Subscribe',
    event_time: options?.eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: {
      currency: options?.currency || 'USD',
      value: options?.value || 0,
      ...options?.customData,
    },
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Track a Purchase event (one-time purchase or subscription payment)
 */
export async function trackPurchase(
  userData: UserData,
  options: {
    eventSourceUrl?: string;
    value: number;
    currency?: string;
    contentIds?: string[];
    contentName?: string;
    contentType?: string;
    numItems?: number;
    eventId?: string;
    eventTime?: number;
    customData?: CustomData;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = options.eventId || generateEventId();

  const event: MetaEvent = {
    event_name: 'Purchase',
    event_time: options.eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: {
      currency: options?.currency || 'USD',
      value: options.value,
      contentIds: options.contentIds,
      contentName: options.contentName,
      contentType: options.contentType,
      numItems: options.numItems,
      ...options.customData,
    },
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Track a custom event
 */
export async function trackCustomEvent(
  eventName: string,
  userData: UserData,
  options?: {
    eventSourceUrl?: string;
    customData?: CustomData;
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: MetaEvent = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    user_data: normalizeUserData(userData),
    custom_data: options?.customData,
    actionSource: 'website',
  };

  return sendEvent(event);
}

/**
 * Options for sending user-specific Lead events (per-business owner credentials)
 */
interface UserEventOptions {
  pixelId: string;
  accessToken: string;
  testEventCode?: string | null;
  eventId: string;
  userData: UserData;
  customData?: CustomData;
  eventSourceUrl?: string | null;
}

/**
 * Send a Lead event using per-user Facebook credentials (for embedded calculators)
 * This enables business owners to track conversions on their own Facebook Ads account
 */
export async function sendUserLeadEvent(options: UserEventOptions): Promise<{ success: boolean; eventId: string; error?: string }> {
  const event: MetaEvent = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    event_id: options.eventId,
    event_source_url: options.eventSourceUrl || undefined,
    user_data: normalizeUserData(options.userData),
    custom_data: options.customData,
    actionSource: 'website',
  };

  return sendEvent(event, {
    pixelId: options.pixelId,
    accessToken: options.accessToken,
    testEventCode: options.testEventCode,
  });
}

// Export types for use in other modules
export type { UserData, CustomData };
