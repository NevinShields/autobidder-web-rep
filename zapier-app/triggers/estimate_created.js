const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/estimate-created`,
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
    url: `${bundle.authData.server_url}/api/zapier/hooks/estimate-created/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'estimate_created',
    },
  });

  return response.data;
};

const performUnsubscribe = async (z, bundle) => {
  // Remove the webhook subscription
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/estimate-created/subscribe`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'estimate_created',
    },
  });

  return response.data;
};

const getSample = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/sample/estimate-created`,
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
  key: 'estimate_created',
  noun: 'Estimate',
  display: {
    label: 'Estimate Created',
    description: 'Triggers when a new estimate is generated.',
  },
  operation: {
    type: 'hook',
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,
    perform: performWebhook,
    performList: performList,
    sample: {
      id: 1,
      estimateNumber: "EST-2024-001",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "555-123-4567",
      totalAmount: 450,
      status: "draft",
      createdAt: "2024-01-15T12:00:00Z"
    },
    outputFields: [
      { key: 'id', label: 'Estimate ID', type: 'integer' },
      { key: 'estimateNumber', label: 'Estimate Number', type: 'string' },
      { key: 'customerName', label: 'Customer Name', type: 'string' },
      { key: 'customerEmail', label: 'Customer Email', type: 'string' },
      { key: 'customerPhone', label: 'Customer Phone', type: 'string' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],
  },
};
