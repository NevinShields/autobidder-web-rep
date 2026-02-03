const performList = async (z, bundle) => {
  const params = {
    limit: bundle.meta.limit || 100,
  };

  // Add tag filter if specified
  if (bundle.inputData.tag_id) {
    params.tag_id = bundle.inputData.tag_id;
  }

  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/lead-tagged`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
    params,
  });

  // Extract the data field from each wrapped response
  return response.data.map(item => item.data);
};

const performSubscribe = async (z, bundle) => {
  const body = {
    target_url: bundle.targetUrl,
    event: 'lead_tagged',
  };

  // Add tag filter if specified
  if (bundle.inputData.tag_id) {
    body.filters = {
      tagId: bundle.inputData.tag_id
    };
  }

  // Create a webhook subscription for instant triggers
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-tagged/subscribe`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body,
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
    inputFields: [
      {
        key: 'tag_id',
        label: 'Tag',
        helpText: 'Only trigger when this specific tag is assigned. Leave empty to trigger on any tag assignment.',
        type: 'integer',
        required: false,
        dynamic: 'get_tags.id.name',
        altersDynamicFields: false,
      },
    ],
    sample: {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "555-123-4567",
      address: "123 Main St, Anytown, CA 12345",
      company: "Acme Corp",
      stage: "new",
      calculatedPrice: 250,
      notes: "Customer prefers morning appointments",
      source: "Calculator Form",
      formulaId: 1,
      formulaName: "Roof Cleaning Calculator",
      variables: {},
      appliedDiscounts: [],
      selectedUpsells: [],
      tagId: 1,
      tagName: "Hot Lead",
      tagColor: "#ff0000",
      tagDescription: "High-priority leads ready to convert",
      taggedAt: "2024-01-15T12:00:00Z",
      taggedBy: "user@example.com",
      createdAt: "2024-01-10T08:00:00Z"
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'phone', label: 'Customer Phone', type: 'string' },
      { key: 'address', label: 'Service Address', type: 'string' },
      { key: 'company', label: 'Company Name', type: 'string' },
      { key: 'stage', label: 'Lead Stage', type: 'string' },
      { key: 'calculatedPrice', label: 'Calculated Price (cents)', type: 'integer' },
      { key: 'notes', label: 'Notes', type: 'string' },
      { key: 'source', label: 'Lead Source', type: 'string' },
      { key: 'formulaId', label: 'Calculator ID', type: 'integer' },
      { key: 'formulaName', label: 'Calculator Name', type: 'string' },
      { key: 'variables', label: 'Calculator Variables' },
      { key: 'appliedDiscounts', label: 'Applied Discounts' },
      { key: 'selectedUpsells', label: 'Selected Upsells' },
      { key: 'tagId', label: 'Tag ID', type: 'integer' },
      { key: 'tagName', label: 'Tag Name', type: 'string' },
      { key: 'tagColor', label: 'Tag Color', type: 'string' },
      { key: 'tagDescription', label: 'Tag Description', type: 'string' },
      { key: 'taggedAt', label: 'Tagged At', type: 'datetime' },
      { key: 'taggedBy', label: 'Tagged By', type: 'string' },
      { key: 'createdAt', label: 'Lead Created At', type: 'datetime' },
    ],
  },
};
