const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/pending-automation-runs`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_pending_automation_runs',
  noun: 'Pending Automation Run',
  display: {
    label: 'Get Pending Automation Runs',
    description: 'Gets pending automation runs that require confirmation.',
    hidden: true,
  },
  operation: {
    perform: performList,
    sample: {
      id: 12,
      name: 'Run #12 for automation 3',
    },
    outputFields: [
      { key: 'id', label: 'Run ID', type: 'integer' },
      { key: 'name', label: 'Run Name', type: 'string' },
    ],
  },
};
