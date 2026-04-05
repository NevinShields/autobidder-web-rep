const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/confirm-pending-automation-run`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      runId: bundle.inputData.runId,
    },
  });

  return response.data;
};

module.exports = {
  key: 'confirm_pending_automation_run',
  noun: 'Automation Run',
  display: {
    label: 'Confirm Pending Automation Run',
    description: 'Confirms and executes a CRM automation run that is waiting for confirmation.',
  },
  operation: {
    perform,
    inputFields: [
      {
        key: 'runId',
        label: 'Pending Run',
        type: 'integer',
        required: true,
        dynamic: 'get_pending_automation_runs.id.name',
      },
    ],
    sample: {
      runId: 12,
      automationId: 1,
      status: 'completed',
    },
    outputFields: [
      { key: 'runId', label: 'Run ID', type: 'integer' },
      { key: 'automationId', label: 'Automation ID', type: 'integer' },
      { key: 'status', label: 'Run Status', type: 'string' },
    ],
  },
};
