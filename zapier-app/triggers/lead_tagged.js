const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/lead-tagged`,
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
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-tagged/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'lead_tagged',
    },
  });

  return response.data;
};

const performUnsubscribe = async (z, bundle) => {
  // Remove the webhook subscription
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-tagged/subscribe`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'lead_tagged',
    },
  });

  return response.data;
};

const getSample = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/sample/lead-tagged`,
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
  key: 'lead_tagged',
  noun: 'Lead Tag',
  display: {
    label: 'Lead Tagged',
    description: 'Triggers when a tag is assigned to a lead.',
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
      tagId: 1,
      tagName: "Hot Lead",
      tagColor: "#ff0000",
      taggedAt: "2024-01-15T12:00:00Z"
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'tagId', label: 'Tag ID', type: 'integer' },
      { key: 'tagName', label: 'Tag Name', type: 'string' },
      { key: 'tagColor', label: 'Tag Color', type: 'string' },
      { key: 'taggedAt', label: 'Tagged At', type: 'datetime' },
    ],
  },
};
