const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/update-lead`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      leadId: bundle.inputData.leadId,
      status: bundle.inputData.status,
      notes: bundle.inputData.notes,
      totalPrice: bundle.inputData.totalPrice,
    },
  });

  return response.data;
};

module.exports = {
  key: 'update_lead',
  noun: 'Lead',
  display: {
    label: 'Update Lead Status',
    description: 'Updates the status or details of an existing lead in your Autobidder account.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'leadId',
        label: 'Lead ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the lead to update.',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        choices: [
          'new',
          'contacted', 
          'quoted',
          'booked',
          'completed',
          'cancelled'
        ],
        helpText: 'The new status for the lead.',
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        required: false,
        helpText: 'Additional notes to add to the lead.',
      },
      {
        key: 'totalPrice',
        label: 'Total Price',
        type: 'number',
        required: false,
        helpText: 'Updated price for the service.',
      },
    ],
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'totalPrice', label: 'Total Price', type: 'number' },
      { key: 'updatedAt', label: 'Updated At', type: 'datetime' },
    ],
  },
};