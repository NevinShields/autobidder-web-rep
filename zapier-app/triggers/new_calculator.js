const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/new-calculators`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
    params: {
      limit: bundle.meta.limit || 100,
      since: bundle.meta.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  return response.data;
};

const performSubscribe = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/webhooks/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'new_calculator',
    },
  });

  return response.data;
};

const performUnsubscribe = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/webhooks/unsubscribe`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      target_url: bundle.targetUrl,
      event: 'new_calculator',
    },
  });

  return response.data;
};

const getSample = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/sample/new-calculators`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'new_calculator',
  noun: 'Calculator',
  display: {
    label: 'New Calculator',
    description: 'Triggers when a new pricing calculator is created in your Autobidder account.',
  },
  operation: {
    type: 'hook',
    performSubscribe: performSubscribe,
    performUnsubscribe: performUnsubscribe,
    perform: performList,
    performList: performList,
    sample: getSample,
    outputFields: [
      { key: 'id', label: 'Calculator ID', type: 'string' },
      { key: 'name', label: 'Calculator Name', type: 'string' },
      { key: 'description', label: 'Description', type: 'string' },
      { key: 'serviceType', label: 'Service Type', type: 'string' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
      { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
      { key: 'embedId', label: 'Embed ID', type: 'string' },
      { key: 'variables', label: 'Calculator Variables', type: 'object' },
      { key: 'formula', label: 'Pricing Formula', type: 'string' },
    ],
  },
};