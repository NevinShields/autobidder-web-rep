# Zapier Authentication Setup Guide

## Current Issue
You're getting the error: "You need to choose a connected account or send something in the authData property."

This means Zapier isn't properly receiving the authentication credentials when testing your integration.

## Root Cause
The issue is with the authentication configuration in Zapier's web interface. Here's what's happening:

1. **Authentication Header Format**: Zapier sends API keys in the `Authorization: Bearer <key>` format
2. **Field Mapping**: The authentication fields need to be properly mapped to the API endpoints
3. **Test Request Configuration**: The authentication test needs the correct headers

## Solution: Fix Zapier Web Interface Configuration

### Step 1: Authentication Configuration

In Zapier's web interface, configure authentication as follows:

**Authentication Type**: API Key

**Input Fields:**
- **Field 1:**
  - Key: `api_key`
  - Label: "API Key" 
  - Type: Password
  - Required: Yes
  - Help Text: "Get this from Autobidder: Settings > Integrations > Generate API Key"

- **Field 2:**
  - Key: `server_url`
  - Label: "Server URL"
  - Type: String
  - Required: Yes
  - Help Text: "Your Autobidder app URL (e.g., https://your-app.replit.app)"
  - Default: `https://{{bundle.authData.server_url}}`

### Step 2: Authentication Test Request

**Method**: GET
**URL**: `{{bundle.authData.server_url}}/api/zapier/auth/test`

**Headers**:
- **Authorization**: `Bearer {{bundle.authData.api_key}}`
- **Content-Type**: `application/json`

**Important**: Make sure the headers section is properly configured with the Authorization header using the template variable.

### Step 3: Trigger Configuration

For the "New Lead" trigger:

**REST Hook Subscribe:**
- **URL**: `{{bundle.authData.server_url}}/api/zapier/webhooks/subscribe`
- **Method**: POST
- **Headers**: 
  - `Authorization`: `Bearer {{bundle.authData.api_key}}`
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "target_url": "{{bundle.targetUrl}}",
  "event": "new_lead"
}
```

**REST Hook Unsubscribe:**
- **URL**: `{{bundle.authData.server_url}}/api/zapier/webhooks/unsubscribe`
- **Method**: DELETE
- **Headers**: 
  - `Authorization`: `Bearer {{bundle.authData.api_key}}`
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "target_url": "{{bundle.targetUrl}}",
  "event": "new_lead"
}
```

**Polling (Fallback):**
- **URL**: `{{bundle.authData.server_url}}/api/zapier/triggers/new-leads`
- **Method**: GET
- **Headers**: 
  - `Authorization`: `Bearer {{bundle.authData.api_key}}`

### Step 4: Testing Steps

1. **Save Configuration**: Save all authentication settings in Zapier
2. **Test Authentication**: Click "Test Authentication" - it should return success
3. **Test Trigger**: Try testing the New Lead trigger
4. **Check Headers**: Ensure all requests include the Authorization header

## Common Issues & Solutions

### Issue 1: "authData property" Error
**Cause**: Zapier isn't receiving the authentication fields
**Solution**: Verify field keys are exactly `api_key` and `server_url`

### Issue 2: 401 Authentication Required
**Cause**: API key not being sent in correct format
**Solution**: Ensure Authorization header uses `Bearer {{bundle.authData.api_key}}`

### Issue 3: Headers Not Working
**Cause**: Headers section might be hidden or not configured
**Solution**: Look for "Advanced Options", "Headers", or "Request Settings" sections

## Backend Status
✅ Authentication middleware supports both Authorization Bearer and X-API-Key headers
✅ API key creation and management working
✅ Webhook subscription/unsubscribe endpoints fixed
✅ All endpoints properly configured

## Testing Your Setup

1. **Manual Test**: Use curl to test the auth endpoint:
```bash
curl -H "Authorization: Bearer your-api-key" \
     https://your-app.replit.app/api/zapier/auth/test
```

2. **Expected Response**:
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com"
  },
  "message": "Authentication successful"
}
```

If you're still getting the error after following these steps, the issue is likely in the Zapier web interface configuration rather than the backend code.