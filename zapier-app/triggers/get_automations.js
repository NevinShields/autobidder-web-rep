const performList = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/options/automations`,
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
    },
  });

  return response.data;
};

module.exports = {
  key: 'get_automations',
  noun: 'Automation',
  display: {
    label: 'Get Automations',
    description: 'Gets existing CRM automations.',
    hidden: true,
  },
  operation: {
    perform: performList,
    sample: {
      id: 1,
      name: 'Follow Up New Leads',
    },
    outputFields: [
      { key: 'id', label: 'Automation ID', type: 'integer' },
      { key: 'name', label: 'Automation Name', type: 'string' },
    ],
  },
};
