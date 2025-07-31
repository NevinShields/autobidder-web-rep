# Autobidder Zapier App - Deployment Guide

This guide will help you deploy the Autobidder integration to the Zapier App Store so users can easily connect Autobidder to thousands of other apps.

## Prerequisites

1. **Zapier Developer Account**: Sign up at https://developer.zapier.com/
2. **Node.js**: Version 18 or higher
3. **Zapier CLI**: Install globally with `npm install -g zapier-platform-cli`

## Quick Start

### 1. Install Zapier CLI and Login

```bash
# Install Zapier CLI globally
npm install -g zapier-platform-cli

# Login to your Zapier developer account
zapier login
```

### 2. Navigate to the Zapier App Directory

```bash
cd zapier-app
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your test server details
# TEST_SERVER_URL=https://your-autobidder-app.replit.app
# TEST_API_KEY=your-test-api-key
```

### 5. Test the App Locally

```bash
# Run all tests
npm test

# Test specific functionality
zapier test --grep "authentication"
zapier test --grep "new_lead"
```

### 6. Register the App with Zapier

```bash
# Register your app (first time only)
zapier register "Autobidder"

# Or push updates to existing app
zapier push
```

### 7. Validate and Build

```bash
# Validate the app structure
zapier validate

# Build the app
zapier build
```

## App Structure

```
zapier-app/
├── index.js                 # Main app definition
├── authentication.js        # API key authentication
├── package.json             # Dependencies and scripts
├── triggers/
│   ├── new_lead.js          # New lead trigger
│   └── new_calculator.js    # New calculator trigger
├── creates/
│   ├── create_lead.js       # Create lead action
│   └── update_lead.js       # Update lead action
└── test/                    # Test files
    ├── authentication.test.js
    ├── triggers/
    └── creates/
```

## Key Features

### Authentication
- **Type**: API Key authentication
- **Fields**: Server URL + API Key
- **Test Endpoint**: `/api/zapier/auth/test`

### Triggers
1. **New Lead**: Fires when customers submit quote requests
2. **New Calculator**: Fires when new pricing calculators are created

### Actions
1. **Create Lead**: Add leads from external sources
2. **Update Lead Status**: Change lead status and add notes

### Webhook Support
- Instant triggers via REST hooks
- Automatic subscription/unsubscription
- Secure webhook validation

## API Endpoints Required

Your Autobidder backend must support these endpoints:

### Authentication
- `GET /api/zapier/auth/test` - Verify API key

### Triggers
- `GET /api/zapier/triggers/new-leads` - List recent leads
- `GET /api/zapier/triggers/new-calculators` - List recent calculators
- `GET /api/zapier/sample/new-leads` - Sample lead data
- `GET /api/zapier/sample/new-calculators` - Sample calculator data

### Actions
- `POST /api/zapier/actions/create-lead` - Create new lead
- `POST /api/zapier/actions/update-lead` - Update lead status

### Webhooks
- `POST /api/zapier/webhooks/subscribe` - Subscribe to events
- `DELETE /api/zapier/webhooks/unsubscribe` - Unsubscribe from events

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test files
npm test test/authentication.test.js
npm test test/triggers/new_lead.test.js
```

### Manual Testing
```bash
# Test authentication
zapier test --grep "should authenticate"

# Test triggers
zapier test --grep "new_lead"

# Test actions
zapier test --grep "create_lead"
```

## Publishing Process

### 1. Private App (Beta Testing)

```bash
# Push to Zapier for private testing
zapier push

# Invite beta testers
zapier invite user@example.com
```

### 2. Public App Submission

1. **Complete App Testing**
   - All tests passing
   - Manual testing with real data
   - Beta user feedback addressed

2. **Submit for Review**
   ```bash
   zapier promote 1.0.0 --public
   ```

3. **Zapier Review Process**
   - App functionality review
   - UI/UX evaluation
   - Security assessment
   - Documentation review

### 3. App Store Listing

After approval, your app will be available in the Zapier App Store at:
`https://zapier.com/apps/autobidder/integrations`

## App Store Requirements

### Required Information
- **App Name**: Autobidder
- **App Description**: AI-powered contractor platform for intelligent service quotes
- **App Logo**: High-resolution logo (provided in assets)
- **Screenshots**: App interface screenshots
- **Categories**: Business Intelligence, CRM, Lead Management

### Documentation
- **Setup Guide**: How to connect Autobidder to Zapier
- **Use Cases**: Common automation workflows
- **Troubleshooting**: Common issues and solutions

## Monitoring and Maintenance

### Analytics
- Monitor app usage via Zapier Developer dashboard
- Track popular triggers and actions
- Review user feedback and feature requests

### Updates
```bash
# Push app updates
zapier push

# Promote to production
zapier promote 1.1.0
```

### Support
- Monitor Zapier Developer forums
- Respond to user questions
- Maintain API endpoint compatibility

## Advanced Features

### Custom Fields
- Dynamic dropdown options from Autobidder API
- Field validation and help text
- Conditional field display

### Error Handling
- Meaningful error messages
- Retry logic for temporary failures
- Graceful degradation

### Performance
- Efficient pagination for large datasets
- Webhook deduplication
- Rate limit handling

## Security Considerations

### API Security
- HTTPS-only communication
- API key validation
- Rate limiting
- Request signing (optional)

### Data Privacy
- Minimal data collection
- Secure data transmission
- GDPR compliance
- Data retention policies

## Support and Resources

- **Zapier CLI Documentation**: https://github.com/zapier/zapier-platform
- **Zapier Developer Platform**: https://developer.zapier.com/
- **App Review Guidelines**: https://developer.zapier.com/docs/review-guidelines
- **Best Practices**: https://developer.zapier.com/docs/best-practices

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify API endpoint is accessible
   - Check API key format and validation
   - Ensure HTTPS is enabled

2. **Trigger Not Firing**
   - Verify webhook endpoints are working
   - Check data format matches expected schema
   - Test with polling fallback

3. **Action Failures**
   - Validate required fields
   - Check API response format
   - Test error handling

### Debug Commands
```bash
# View app logs
zapier logs

# Test specific functionality
zapier test --debug

# Validate app structure
zapier validate --debug
```

## Next Steps

1. Set up your development environment
2. Test the app locally with your Autobidder instance
3. Register the app with Zapier
4. Invite beta testers
5. Submit for public review
6. Maintain and update based on user feedback

Your Autobidder Zapier integration will help users automate their contractor business workflows and connect to thousands of other apps in the Zapier ecosystem!