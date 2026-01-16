/**
 * Facebook Conversion API (CAPI) Integration
 *
 * This module handles server-side event tracking to Facebook's Conversion API
 * for improved attribution and conversion tracking.
 *
 * Documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto';

const FB_PIXEL_ID = process.env.FB_PIXEL_ID || '878078334667672';
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_API_VERSION = 'v18.0';
const FB_API_URL = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events`;

// Test event code for debugging (set via env var, remove in production)
const FB_TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE;

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
}

interface FacebookEvent {
  eventName: string;
  eventTime: number;
  eventId: string;
  eventSourceUrl?: string;
  userData: Record<string, string>;
  customData?: CustomData;
  actionSource: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
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

/**
 * Send an event to Facebook Conversion API
 */
async function sendEvent(event: FacebookEvent): Promise<{ success: boolean; eventId: string; error?: string }> {
  if (!FB_ACCESS_TOKEN) {
    console.warn('[Facebook CAPI] No access token configured, skipping event:', event.eventName);
    return { success: false, eventId: event.eventId, error: 'No access token configured' };
  }

  const payload: any = {
    data: [event],
    access_token: FB_ACCESS_TOKEN,
  };

  // Add test event code if configured (for debugging in Events Manager)
  if (FB_TEST_EVENT_CODE) {
    payload.test_event_code = FB_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(FB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`[Facebook CAPI] Event sent successfully: ${event.eventName}`, {
        eventId: event.eventId,
        eventsReceived: result.events_received,
      });
      return { success: true, eventId: event.eventId };
    } else {
      console.error(`[Facebook CAPI] Error sending event: ${event.eventName}`, result);
      return { success: false, eventId: event.eventId, error: JSON.stringify(result.error || result) };
    }
  } catch (error) {
    console.error(`[Facebook CAPI] Network error sending event: ${event.eventName}`, error);
    return { success: false, eventId: event.eventId, error: (error as Error).message };
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

  const event: FacebookEvent = {
    eventName: 'CompleteRegistration',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: {
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

  const event: FacebookEvent = {
    eventName: 'Lead',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: options?.customData,
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

  const event: FacebookEvent = {
    eventName: 'StartTrial',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: {
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
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: FacebookEvent = {
    eventName: 'Subscribe',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: {
      currency: options?.currency || 'USD',
      value: options?.value || 0,
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
  }
): Promise<{ success: boolean; eventId: string; error?: string }> {
  const eventId = generateEventId();

  const event: FacebookEvent = {
    eventName: 'Purchase',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: {
      currency: options?.currency || 'USD',
      value: options.value,
      contentIds: options.contentIds,
      contentName: options.contentName,
      contentType: options.contentType,
      numItems: options.numItems,
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

  const event: FacebookEvent = {
    eventName,
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    eventSourceUrl: options?.eventSourceUrl,
    userData: normalizeUserData(userData),
    customData: options?.customData,
    actionSource: 'website',
  };

  return sendEvent(event);
}

// Export types for use in other modules
export type { UserData, CustomData };
