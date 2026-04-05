const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/run-automation`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      automationId: bundle.inputData.automationId,
      leadId: bundle.inputData.leadId,
      estimateId: bundle.inputData.estimateId,
      autoConfirm: bundle.inputData.autoConfirm,
    },
  });

  return response.data;
};

module.exports = {
  key: 'run_automation',
  noun: 'Automation Run',
  display: {
    label: 'Run CRM Automation',
    description: 'Runs an existing CRM automation from Autobidder against a selected lead or estimate.',
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
        helpText: 'Select an existing CRM automation from /crm/automations.',
      },
      {
        key: 'leadId',
        label: 'Lead',
        type: 'integer',
        required: false,
        dynamic: 'get_recent_leads.id.name',
        helpText: 'Optional lead context for the automation.',
      },
      {
        key: 'estimateId',
        label: 'Estimate',
        type: 'integer',
        required: false,
        dynamic: 'get_recent_estimates.id.name',
        helpText: 'Optional estimate context for the automation.',
      },
      {
        key: 'autoConfirm',
        label: 'Auto Confirm Pending Run',
        type: 'boolean',
        required: false,
        helpText: 'If the automation requires confirmation, confirm and execute it immediately.',
      },
    ],
    sample: {
      automationId: 1,
      automationName: 'Follow Up New Leads',
      runId: 12,
      status: 'pending_confirmation',
      requiresConfirmation: true,
    },
    outputFields: [
      { key: 'automationId', label: 'Automation ID', type: 'integer' },
      { key: 'automationName', label: 'Automation Name', type: 'string' },
      { key: 'runId', label: 'Run ID', type: 'integer' },
      { key: 'status', label: 'Run Status', type: 'string' },
      { key: 'requiresConfirmation', label: 'Requires Confirmation', type: 'boolean' },
    ],
  },
};
