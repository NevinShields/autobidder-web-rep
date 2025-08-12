# Pre-Launch Testing Checklist for Autobidder

## Critical Systems to Test Before Launch

### 1. Authentication & User Management
- [ ] **New User Signup**
  - Sign up with valid email
  - Verify email confirmation works
  - Check user is created in database
  
- [ ] **Login System**
  - Login with correct credentials
  - Try invalid credentials (should fail gracefully)
  - Test logout functionality
  
- [ ] **Password Reset**
  - Request password reset
  - Check email is received
  - Reset password and verify login works

### 2. Subscription & Payment System (CRITICAL)
- [ ] **Free Trial**
  - Sign up new account
  - Verify 14-day trial period
  - Test trial expiration behavior
  
- [ ] **Stripe Integration**
  - Test subscription purchase
  - Try upgrading/downgrading plans
  - Test payment method updates
  - Verify invoices are generated
  
- [ ] **Plan Limits**
  - Test formula creation limits per plan
  - Verify lead storage limits
  - Check feature restrictions work

### 3. Formula Calculator System
- [ ] **Formula Creation**
  - Create formula with text inputs
  - Create formula with dropdowns
  - Create formula with multiple choice
  - Create formula with checkboxes
  
- [ ] **Price Calculation**
  - Test simple arithmetic formulas
  - Test conditional logic (if statements)
  - Verify price displays correctly in dollars
  - Test with large numbers (avoid $32.48 vs $3248 bug)
  
- [ ] **Design Customization**
  - Change colors and styling
  - Test different themes
  - Verify live preview works
  
- [ ] **Embed System**
  - Generate embed code
  - Test embed on external website
  - Verify submissions come through

### 4. Lead Management
- [ ] **Lead Capture**
  - Submit test lead through calculator
  - Verify lead appears in dashboard
  - Check all form data is captured
  
- [ ] **Price Storage**
  - Submit lead with price $100.00
  - Verify stored as 10000 cents in database
  - Confirm displays as $100.00 in dashboard
  
- [ ] **Lead Notifications**
  - Submit test lead
  - Verify business owner receives email
  - Check email template formatting

### 5. Email System
- [ ] **Template Consistency**
  - Send welcome email
  - Send lead notification
  - Send booking confirmation
  - Verify all use unified template (no emojis)
  
- [ ] **Email Delivery**
  - Test with Resend API
  - Verify Gmail fallback works
  - Check emails don't go to spam

### 6. Maps & Location Features
- [ ] **Google Maps Integration**
  - Test address autocomplete
  - Verify map displays correctly
  - Test area measurement tool
  
- [ ] **Distance Pricing**
  - Enable distance-based pricing
  - Test calculation accuracy
  - Verify service radius limits

### 7. Multi-Service System
- [ ] **Service Selection**
  - Create multiple services
  - Test service selector interface
  - Submit multi-service lead
  
- [ ] **Upsell Items**
  - Add optional upsell items
  - Test selection and pricing
  - Verify total calculation

### 8. API Integrations
- [ ] **AI Formula Generation**
  - Test Gemini API integration
  - Test OpenAI fallback
  - Verify formula quality
  
- [ ] **Zapier Integration** (if used by customers)
  - Test lead webhook triggers
  - Verify data format consistency

## Database Testing
- [ ] **Data Integrity**
  - Check all tables have proper foreign keys
  - Verify cascading deletes work correctly
  - Test with large datasets
  
- [ ] **Performance**
  - Test with 1000+ leads
  - Check dashboard load times
  - Verify search functionality

## Security Testing
- [ ] **Access Control**
  - Try accessing admin pages without permission
  - Test employee vs owner permissions
  - Verify API endpoints require authentication
  
- [ ] **Data Validation**
  - Submit invalid form data
  - Test SQL injection attempts
  - Verify XSS protection

## Error Handling
- [ ] **Network Failures**
  - Test with poor internet connection
  - Verify graceful degradation
  - Check error messages are user-friendly
  
- [ ] **API Failures**
  - Test when Stripe is down
  - Test when email APIs fail
  - Verify fallback systems work

## Performance Testing
- [ ] **Load Testing**
  - Test with multiple concurrent users
  - Submit many leads simultaneously
  - Check database performance
  
- [ ] **Mobile Performance**
  - Test calculators on slow connections
  - Verify mobile responsiveness
  - Check touch interactions

## User Experience Testing
- [ ] **New User Onboarding**
  - Complete full onboarding flow
  - Verify tutorial/guidance is clear
  - Test first formula creation
  
- [ ] **Dashboard Usability**
  - Navigate all main sections
  - Test search and filtering
  - Verify mobile navigation

## Final Deployment Tests
- [ ] **Production Environment**
  - Test on actual production domain
  - Verify SSL certificates work
  - Check all environment variables are set
  
- [ ] **Monitoring**
  - Set up error tracking
  - Configure uptime monitoring
  - Test alert notifications

## Testing Notes
- Test with different browsers (Chrome, Firefox, Safari, Edge)
- Test on different devices (desktop, tablet, mobile)
- Use real email addresses for email testing
- Test with actual payment methods (use Stripe test mode)
- Document any issues found during testing

## Issues Found During Testing
| Issue | Severity | Description | Fix Status |
|-------|----------|-------------|------------|
|       |          |             |            |

## Sign-off
- [ ] All critical tests passed
- [ ] Performance is acceptable
- [ ] Security tests passed
- [ ] Ready for launch

**Tested by:** ________________  
**Date:** ________________  
**Launch approved:** [ ] Yes [ ] No