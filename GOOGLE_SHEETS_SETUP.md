# Google Sheets Integration Setup

Your application now automatically saves new user signup information to a Google Sheet!

## How It Works

Every time a new user signs up through your application, the following information is automatically saved to your Google Sheet:

- User ID
- Email
- First Name
- Last Name
- Business Name (if provided)
- Signup Date
- Plan
- Trial End Date

## Setup Instructions

### 1. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. You can name it anything you like (e.g., "User Signups", "New Users", etc.)
4. The first row (headers) will be automatically created the first time a user signs up

### 2. Get Your Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL in your browser. It will look like this:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```
3. Copy the `YOUR_SPREADSHEET_ID_HERE` part (the long string between `/d/` and `/edit`)

### 3. Add the Spreadsheet ID to Your Environment

1. In your Replit project, go to the **Secrets** tab (the lock icon in the sidebar)
2. Click **"New Secret"**
3. For the key, enter: `GOOGLE_SHEET_ID`
4. For the value, paste your spreadsheet ID from step 2
5. Click **"Add Secret"**

### 4. Restart Your Application

After adding the secret, restart your application to apply the changes. The workflow will restart automatically.

## What Happens Next

- The first time a user signs up after setup, the system will automatically create header rows in your Google Sheet
- Each subsequent signup will add a new row with that user's information
- If there's any issue connecting to Google Sheets, it won't affect the signup process - users will still be able to sign up normally, and an error will be logged for you to review

## Troubleshooting

If users aren't appearing in your Google Sheet:

1. **Check that you've set the `GOOGLE_SHEET_ID` secret** - Without this, the integration won't know where to send data
2. **Verify the spreadsheet ID is correct** - Make sure you copied the entire ID from the URL
3. **Check the console logs** - Any errors will be logged with the message "Failed to add user to Google Sheet"
4. **Ensure the Google Sheets integration is connected** - The Google Sheets connector should be active in your integrations

## Sheet Structure

Your Google Sheet will have the following columns:

| User ID | Email | First Name | Last Name | Business Name | Signup Date | Plan | Trial End Date |
|---------|-------|------------|-----------|---------------|-------------|------|----------------|
| user_... | user@example.com | John | Doe | Acme Corp | 2025-01-15T10:30:00Z | trial | 2025-01-29T10:30:00Z |

The dates are stored in ISO format (UTC timezone).
