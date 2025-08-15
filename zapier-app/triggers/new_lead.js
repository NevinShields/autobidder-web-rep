const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/new-leads`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
    params: {
      limit: bundle.meta.limit || 100,
      since: bundle.meta.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
    },
  });

  // Extract the data field from each wrapped response
  return response.data.map(item => item.data);
};

const performSubscribe = async (z, bundle) => {
  // Create a webhook subscription for instant triggers
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/webhooks/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'new_lead',
    },
  });

  return response.data;
};

const performUnsubscribe = async (z, bundle) => {
  // Remove the webhook subscription
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/webhooks/unsubscribe`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'new_lead',
    },
  });

  return response.data;
};

const getSample = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/sample/new-leads`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  // Extract the data field from each wrapped sample response
  return response.data.map(item => item.data);
};

// Handle webhook data - extract the data field from webhook payload
const performWebhook = (z, bundle) => {
  if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
    // Return the data field from webhook payload
    return [bundle.cleanedRequest.data];
  }
  // Fallback to empty array if no data
  return [];
};

module.exports = {
  key: 'new_lead',
  noun: 'Lead',
  display: {
    label: 'New Lead',
    description: 'Triggers when a new lead is submitted through your Autobidder calculators.',
  },
  operation: {
    type: 'hook',
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,
    perform: performWebhook, // Use webhook-specific handler for instant triggers
    performList: performList, // Use polling handler for polling
    sample: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      serviceType: "Roof Cleaning",
      totalPrice: 250,
      status: "new",
      createdAt: "2023-12-01T12:00:00Z",
      formulaId: 1,
      calculatorName: "Roof Cleaning Calculator",
      variables: "{}",
      notes: "Please call before arrival",
      source: "Calculator Form"
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'phone', label: 'Customer Phone', type: 'string' },
      { key: 'address', label: 'Service Address', type: 'string' },
      { key: 'city', label: 'City', type: 'string' },
      { key: 'state', label: 'State', type: 'string' },
      { key: 'zipCode', label: 'ZIP Code', type: 'string' },
      { key: 'serviceType', label: 'Service Type', type: 'string' },
      { key: 'totalPrice', label: 'Total Price', type: 'integer' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
      { key: 'formulaId', label: 'Calculator ID', type: 'integer' },
      { key: 'calculatorName', label: 'Calculator Name', type: 'string' },
      { key: 'variables', label: 'Calculator Variables', type: 'string' },
      { key: 'notes', label: 'Customer Notes', type: 'string' },
      { key: 'source', label: 'Lead Source', type: 'string' },
      // Service-specific fields
      { key: 'services[]formulaId', label: 'Service Formula ID', type: 'integer' },
      { key: 'services[]formulaName', label: 'Service Name', type: 'string' },
      { key: 'services[]calculatedPrice', label: 'Service Price', type: 'integer' },
      { key: 'services[]variables', label: 'Service Variables', type: 'string' },
      // Discount fields
      { key: 'appliedDiscounts[]name', label: 'Discount Name', type: 'string' },
      { key: 'appliedDiscounts[]percentage', label: 'Discount Percentage', type: 'integer' },
      { key: 'appliedDiscounts[]amount', label: 'Discount Amount', type: 'integer' },
      { key: 'appliedDiscounts[]type', label: 'Discount Type', type: 'string' },
      // Upsell fields
      { key: 'selectedUpsells[]name', label: 'Upsell Name', type: 'string' },
      { key: 'selectedUpsells[]percentage', label: 'Upsell Percentage', type: 'integer' },
      { key: 'selectedUpsells[]amount', label: 'Upsell Amount', type: 'integer' },
      { key: 'selectedUpsells[]category', label: 'Upsell Category', type: 'string' },
      // Additional pricing fields
      { key: 'bundleDiscountAmount', label: 'Bundle Discount Amount', type: 'integer' },
      { key: 'subtotal', label: 'Subtotal', type: 'integer' },
      { key: 'taxAmount', label: 'Tax Amount', type: 'integer' },
    ],
  },
};