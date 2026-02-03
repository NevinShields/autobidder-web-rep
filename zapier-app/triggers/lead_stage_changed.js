const performList = async (z, bundle) => {
  const params = {
    limit: bundle.meta.limit || 100,
  };

  // Add stage filter if specified
  if (bundle.inputData.stage && bundle.inputData.stage !== 'any') {
    params.stage = bundle.inputData.stage;
  }

  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/triggers/lead-stage-changed`,
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
    event: 'lead_stage_changed',
  };

  // Add stage filter if specified
  if (bundle.inputData.stage && bundle.inputData.stage !== 'any') {
    body.filters = {
      stage: bundle.inputData.stage
    };
  }

  // Create a webhook subscription for instant triggers
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/hooks/lead-stage-changed/subscribe`,
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

// Dynamic dropdown for stages
const getStages = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/stages`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
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
    inputFields: [
      {
        key: 'stage',
        label: 'Stage',
        helpText: 'Only trigger when lead moves to this specific stage. Leave empty to trigger on any stage change.',
        type: 'string',
        required: false,
        dynamic: 'get_stages.id.name',
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
      stage: "booked",
      previousStage: "new",
      calculatedPrice: 250,
      notes: "Customer prefers morning appointments",
      source: "Calculator Form",
      formulaId: 1,
      formulaName: "Roof Cleaning Calculator",
      variables: {},
      appliedDiscounts: [],
      selectedUpsells: [],
      changedAt: "2024-01-15T12:00:00Z",
      createdAt: "2024-01-10T08:00:00Z"
    },
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'phone', label: 'Customer Phone', type: 'string' },
      { key: 'address', label: 'Service Address', type: 'string' },
      { key: 'company', label: 'Company Name', type: 'string' },
      { key: 'stage', label: 'Current Stage', type: 'string' },
      { key: 'previousStage', label: 'Previous Stage', type: 'string' },
      { key: 'calculatedPrice', label: 'Calculated Price (cents)', type: 'integer' },
      { key: 'notes', label: 'Notes', type: 'string' },
      { key: 'source', label: 'Lead Source', type: 'string' },
      { key: 'formulaId', label: 'Calculator ID', type: 'integer' },
      { key: 'formulaName', label: 'Calculator Name', type: 'string' },
      { key: 'variables', label: 'Calculator Variables' },
      { key: 'appliedDiscounts', label: 'Applied Discounts' },
      { key: 'selectedUpsells', label: 'Selected Upsells' },
      { key: 'changedAt', label: 'Stage Changed At', type: 'datetime' },
      { key: 'createdAt', label: 'Lead Created At', type: 'datetime' },
    ],
  },
};
