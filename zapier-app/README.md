# Autobidder Zapier Integration

Connect your Autobidder account to thousands of apps through Zapier to automate your contractor business workflows.

## About Autobidder

Autobidder is an AI-powered contractor platform that helps service professionals create intelligent pricing calculators, manage leads, and automate customer communications. With dynamic pricing mechanisms and comprehensive lead management, Autobidder streamlines your entire sales process.

## Features

### Triggers
- **New Lead**: Triggered when a customer submits a quote request through your calculators
- **New Calculator**: Triggered when you create a new pricing calculator

### Actions
- **Create Lead**: Add new leads to your Autobidder account from other apps
- **Update Lead Status**: Change lead status and add notes from your CRM or other tools

## Setup Instructions

### 1. Get Your API Credentials

1. Log into your Autobidder dashboard
2. Navigate to Settings > Zapier Integration
3. Click "New API Key" and give it a name
4. Copy your API key (save it securely - it won't be shown again)
5. Note your Autobidder app URL (e.g., https://your-app.replit.app)

### 2. Connect to Zapier

1. In Zapier, search for "Autobidder" when creating a new Zap
2. When prompted, enter:
   - **Server URL**: Your Autobidder app URL
   - **API Key**: The API key you generated

### 3. Test Your Connection

Zapier will automatically test your connection by verifying your API key with your Autobidder account.

## Common Use Cases

### Lead Management
- **New Lead → Google Sheets**: Automatically add new leads to a spreadsheet
- **New Lead → Slack**: Get instant notifications in your team channel
- **New Lead → CRM**: Sync leads with Salesforce, HubSpot, or other CRMs

### Customer Communication
- **New Lead → Email**: Send follow-up emails through Gmail or Mailchimp
- **New Lead → SMS**: Send instant text notifications via Twilio

### Project Management
- **New Lead → Trello/Asana**: Create tasks or cards for each new quote request
- **Lead Status Change → Team Chat**: Notify your team when leads are updated

### Analytics & Reporting
- **New Lead → Analytics**: Track lead sources and conversion rates
- **Calculator Created → Documentation**: Auto-update service catalogs

## Available Data Fields

### Lead Data
- Customer information (name, email, phone)
- Service address and location details
- Service type and pricing
- Calculator variables and responses
- Lead status and timestamps
- Custom notes and source tracking

### Calculator Data
- Calculator name and description
- Service type and pricing formula
- Variables and configuration
- Creation and update timestamps
- Embed ID for tracking

## Security

- All data is transmitted securely via HTTPS
- API keys use bearer token authentication
- Webhooks support instant triggers for real-time automation
- Rate limiting protects against abuse

## Support

Need help setting up your integration? Contact our support team or visit our documentation for detailed guides and examples.

## Development

This Zapier app is built using the Zapier CLI platform. To contribute or modify:

1. Install Zapier CLI: `npm install -g zapier-platform-cli`
2. Clone this repository
3. Run `npm install`
4. Test locally with `zapier test`
5. Push updates with `zapier push`

For more information, see the [Zapier CLI documentation](https://github.com/zapier/zapier-platform).