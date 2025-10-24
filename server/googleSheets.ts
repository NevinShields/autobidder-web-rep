import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

interface UserSignupData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  signupDate: Date;
  plan: string;
  trialEndDate?: Date;
}

export async function addUserToGoogleSheet(userData: UserSignupData): Promise<void> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    
    // Get the spreadsheet ID from environment variable (you'll need to set this)
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!spreadsheetId) {
      console.error('GOOGLE_SHEET_ID environment variable is not set');
      return;
    }

    // Prepare the row data
    const values = [
      [
        userData.userId,
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.businessName || '',
        userData.signupDate.toISOString(),
        userData.plan,
        userData.trialEndDate ? userData.trialEndDate.toISOString() : ''
      ]
    ];

    // Check if the sheet has a header row, if not, add it
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A1:H1',
      });

      // If no data exists, add header row first
      if (!response.data.values || response.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sheet1!A1:H1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['User ID', 'Email', 'First Name', 'Last Name', 'Business Name', 'Signup Date', 'Plan', 'Trial End Date']]
          }
        });
      }
    } catch (error) {
      console.error('Error checking/creating header row:', error);
    }

    // Append the new user data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values
      }
    });

    console.log(`User ${userData.email} added to Google Sheet successfully`);
  } catch (error) {
    console.error('Error adding user to Google Sheet:', error);
    // Don't throw the error - we don't want to fail the signup if Google Sheets fails
  }
}
