const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/toggle-automation`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      automationId: bundle.inputData.automationId,
      isActive: bundle.inputData.isActive,
    },
  });

  return response.data;
};

module.exports = {
  key: 'toggle_automation',
  noun: 'Automation',
  display: {
    label: 'Activate or Pause CRM Automation',
    description: 'Turns an existing CRM automation on or off.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'automationId',
        label: 'Automation',
        type: 'integer',
        required: true,
        dynamic: 'get_automations.id.name',
      },
      {
        key: 'isActive',
        label: 'Active',
        type: 'boolean',
        required: true,
        helpText: 'Set to true to activate the automation or false to pause it.',
      },
    ],
    sample: {
      id: 1,
      name: 'Follow Up New Leads',
      triggerType: 'lead_created',
      isActive: true,
    },
    outputFields: [
      { key: 'id', label: 'Automation ID', type: 'integer' },
      { key: 'name', label: 'Automation Name', type: 'string' },
      { key: 'triggerType', label: 'Trigger Type', type: 'string' },
      { key: 'isActive', label: 'Is Active', type: 'boolean' },
    ],
  },
};
