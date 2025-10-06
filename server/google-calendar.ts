import { google } from 'googleapis';
import { storage } from './storage';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface UserTokens {
  accessToken: string;
  refreshToken?: string;
  expiry?: Date;
  calendarId: string;
}

async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (credentials.access_token) {
    await storage.updateUser(userId, {
      googleAccessToken: credentials.access_token,
      googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
    });
    
    return credentials.access_token;
  }
  
  throw new Error('Failed to refresh access token');
}

async function getUserTokens(userId: string): Promise<UserTokens | null> {
  const user = await storage.getUserById(userId);
  
  if (!user?.googleAccessToken) {
    return null;
  }

  let accessToken = user.googleAccessToken;
  
  if (user.googleTokenExpiry && new Date(user.googleTokenExpiry) < new Date()) {
    if (user.googleRefreshToken) {
      accessToken = await refreshAccessToken(userId, user.googleRefreshToken);
    } else {
      return null;
    }
  }

  return {
    accessToken,
    refreshToken: user.googleRefreshToken || undefined,
    expiry: user.googleTokenExpiry || undefined,
    calendarId: user.googleCalendarId || 'primary'
  };
}

export async function getGoogleCalendarClient(userId: string) {
  const tokens = await getUserTokens(userId);
  
  if (!tokens) {
    throw new Error('Google Calendar not connected for this user');
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken
  });

  return {
    client: google.calendar({ version: 'v3', auth: oauth2Client }),
    calendarId: tokens.calendarId
  };
}

export async function getGoogleCalendarBusyTimes(userId: string, startDate: string, endDate: string): Promise<Array<{ start: string; end: string }>> {
  try {
    const { client } = await getGoogleCalendarClient(userId);
    
    // Get user's selected calendars
    const user = await storage.getUserById(userId);
    const selectedCalendarIds = user?.selectedCalendarIds || [];
    const calendarIds = selectedCalendarIds.length > 0 ? selectedCalendarIds : ['primary'];
    
    console.log('🔍 getGoogleCalendarBusyTimes - Selected calendar IDs:', calendarIds);
    
    // Fix for same-date queries: add 1 day to end date if it's the same as start date
    let queryEndDate = endDate;
    if (startDate === endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      queryEndDate = end.toISOString().split('T')[0];
    }
    
    console.log('🔍 Querying freebusy API - timeMin:', new Date(startDate).toISOString(), 'timeMax:', new Date(queryEndDate).toISOString());
    
    // Method 1: Try Freebusy API first
    const freebusyResponse = await client.freebusy.query({
      requestBody: {
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(queryEndDate).toISOString(),
        items: calendarIds.map(id => ({ id })),
      },
    });

    console.log('🔍 Freebusy API response calendars:', Object.keys(freebusyResponse.data.calendars || {}));

    // Collect busy times from freebusy API
    const freebusyTimes: Array<{ start: string; end: string }> = [];
    
    for (const calendarId of calendarIds) {
      const busyTimes = freebusyResponse.data.calendars?.[calendarId]?.busy || [];
      console.log(`🔍 Freebusy times for calendar ${calendarId}:`, busyTimes.length, 'events');
      if (busyTimes.length > 0) {
        console.log('🔍 First busy slot:', busyTimes[0]);
      }
      freebusyTimes.push(...busyTimes.map(slot => ({
        start: slot.start || '',
        end: slot.end || '',
      })));
    }
    
    console.log('🔍 Total freebusy times:', freebusyTimes.length);
    
    // Method 2: Also fetch events directly to catch all-day events and other events that freebusy might miss
    console.log('🔍 Fetching events directly to ensure all-day events are included...');
    const allEvents = await Promise.all(
      calendarIds.map(async (calendarId) => {
        try {
          const response = await client.events.list({
            calendarId: calendarId,
            timeMin: new Date(startDate).toISOString(),
            timeMax: new Date(queryEndDate).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });
          return response.data.items || [];
        } catch (error) {
          console.error(`Error fetching events from calendar ${calendarId}:`, error);
          return [];
        }
      })
    );
    
    const flatEvents = allEvents.flat();
    console.log('🔍 Total events fetched:', flatEvents.length);
    
    // Convert events to busy times
    const eventBusyTimes: Array<{ start: string; end: string }> = [];
    for (const event of flatEvents) {
      // Skip declined events
      if (event.attendees?.some(a => a.self && a.responseStatus === 'declined')) {
        continue;
      }
      
      let busyStart: string;
      let busyEnd: string;
      
      if (event.start?.dateTime) {
        // Regular timed event
        busyStart = event.start.dateTime;
        busyEnd = event.end?.dateTime || event.start.dateTime;
      } else if (event.start?.date) {
        // All-day event - block the entire day
        const startDate = event.start.date;
        const endDate = event.end?.date || startDate;
        
        // For all-day events, Google Calendar end date is exclusive (next day)
        // So we set busy time from start of first day to start of end day
        busyStart = new Date(startDate).toISOString();
        busyEnd = new Date(endDate).toISOString();
        
        console.log('🔍 All-day event found:', {
          title: event.summary,
          startDate,
          endDate,
          busyStart,
          busyEnd
        });
      } else {
        continue;
      }
      
      eventBusyTimes.push({ start: busyStart, end: busyEnd });
    }
    
    console.log('🔍 Busy times from events:', eventBusyTimes.length);
    
    // Merge both sources and deduplicate
    const allBusyTimes = [...freebusyTimes, ...eventBusyTimes];
    
    // Simple deduplication by stringifying
    const uniqueBusyTimes = Array.from(
      new Map(allBusyTimes.map(item => [JSON.stringify(item), item])).values()
    );
    
    console.log('🔍 Total unique busy times after merge:', uniqueBusyTimes.length);
    if (uniqueBusyTimes.length > 0) {
      console.log('🔍 Sample busy times:', uniqueBusyTimes.slice(0, 3));
    }
    
    return uniqueBusyTimes;
  } catch (error) {
    console.error('Error fetching Google Calendar busy times:', error);
    return [];
  }
}

export async function getGoogleCalendarEvents(userId: string, startDate: string, endDate: string) {
  try {
    const { client } = await getGoogleCalendarClient(userId);
    
    const user = await storage.getUserById(userId);
    const selectedCalendarIds = user?.selectedCalendarIds || [];
    
    const calendarIds = selectedCalendarIds.length > 0 ? selectedCalendarIds : ['primary'];
    
    const allEvents = await Promise.all(
      calendarIds.map(async (calendarId) => {
        try {
          const response = await client.events.list({
            calendarId: calendarId,
            timeMin: new Date(startDate).toISOString(),
            timeMax: new Date(endDate).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          });

          const events = response.data.items || [];
          
          return events.map(event => ({
            id: event.id || '',
            title: event.summary || 'Untitled Event',
            description: event.description || '',
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            isAllDay: !event.start?.dateTime,
            location: event.location || '',
            calendarId: calendarId,
          }));
        } catch (error) {
          console.error(`Error fetching events from calendar ${calendarId}:`, error);
          return [];
        }
      })
    );
    
    return allEvents.flat().sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}

export async function getAvailableCalendars(userId: string) {
  try {
    const { client } = await getGoogleCalendarClient(userId);
    
    const response = await client.calendarList.list();
    
    const calendars = response.data.items || [];
    
    return calendars.map(calendar => ({
      id: calendar.id || '',
      summary: calendar.summary || 'Untitled Calendar',
      description: calendar.description || '',
      primary: calendar.primary || false,
      backgroundColor: calendar.backgroundColor || '#4285F4',
      accessRole: calendar.accessRole || 'reader',
    }));
  } catch (error) {
    console.error('Error fetching available calendars:', error);
    return [];
  }
}

export async function checkUserGoogleCalendarConnection(userId: string): Promise<boolean> {
  try {
    const tokens = await getUserTokens(userId);
    return tokens !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Sync Google Calendar events to the unified calendar_events table
 * This allows querying all calendar data from one source
 */
export async function syncGoogleCalendarEvents(userId: string, startDate: string, endDate: string): Promise<void> {
  try {
    const events = await getGoogleCalendarEvents(userId, startDate, endDate);
    
    console.log(`📅 Syncing ${events.length} Google Calendar events for user ${userId}`);
    
    // Get existing Google sync events to avoid duplicates
    const existingEvents = await storage.getUserCalendarEventsByType(userId, 'google_sync');
    
    for (const event of events) {
      // Check if this event already exists (by external ID)
      const exists = existingEvents.some(
        e => e.payload?.googleSync?.externalId === event.id
      );
      
      if (!exists) {
        const startsAt = new Date(event.start);
        const endsAt = new Date(event.end);
        
        await storage.createCalendarEvent({
          userId,
          type: "google_sync",
          source: "google_calendar",
          startsAt,
          endsAt,
          status: "confirmed",
          title: event.title,
          description: event.description,
          payload: {
            googleSync: {
              externalId: event.id,
              calendarId: event.calendarId,
              location: event.location,
              isAllDay: event.isAllDay
            }
          },
          isEditable: false, // Google synced events are read-only
          leadId: null
        });
      }
    }
    
    console.log(`📅 Google Calendar sync complete for user ${userId}`);
  } catch (error) {
    console.error('Error syncing Google Calendar events:', error);
    throw error;
  }
}

export function getGoogleOAuthUrl(userId: string, redirectUri: string): string {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.freebusy'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: userId,
    prompt: 'consent'
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token,
    expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
  };
}
