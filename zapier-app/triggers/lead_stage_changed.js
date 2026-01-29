const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/lead-stage-changed`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
    params: {
      limit: bundle.meta.limit || 100,
    },
  });

  // Extract the data field from each wrapped response
  return response.data.map(item => item.data);
};

const performSubscribe = async (z, bundle) => {
  // Create a webhook subscription for instant triggers
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-stage-changed/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'lead_stage_changed',
    },
  });

  return response.data;
};

const performUnsubscribe = async (z, bundle) => {
  // Remove the webhook subscription
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-stage-changed/subscribe`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'lead_stage_changed',
    },
  });

  return response.data;
};

const getSample = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/sample/lead-stage-changed`,
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
  key: 'lead_stage_changed',
  noun: 'Lead Stage Change',
  display: {
    label: 'Lead Stage Changed',
    description: 'Triggers when a lead moves between stages (new, contacted, booked, completed, etc.).',
  },
  operation: {
    type: 'hook',
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,
    perform: performWebhook,
    performList: performList,
    sample: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      stage: "booked",
      previousStage: "new",
      calculatedPrice: 250,
      changedAt: "2024-01-15T12:00:00Z"
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'phone', label: 'Customer Phone', type: 'string' },
      { key: 'stage', label: 'Current Stage', type: 'string' },
      { key: 'previousStage', label: 'Previous Stage', type: 'string' },
      { key: 'calculatedPrice', label: 'Calculated Price', type: 'number' },
      { key: 'changedAt', label: 'Changed At', type: 'datetime' },
    ],
  },
};
