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
    const { client, calendarId } = await getGoogleCalendarClient(userId);
    
    const response = await client.freebusy.query({
      requestBody: {
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        items: [{ id: calendarId }],
      },
    });

    const busyTimes = response.data.calendars?.[calendarId]?.busy || [];
    
    return busyTimes.map(slot => ({
      start: slot.start || '',
      end: slot.end || '',
    }));
  } catch (error) {
    console.error('Error fetching Google Calendar busy times:', error);
    return [];
  }
}

export async function getGoogleCalendarEvents(userId: string, startDate: string, endDate: string) {
  try {
    const { client, calendarId } = await getGoogleCalendarClient(userId);
    
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
    }));
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
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
