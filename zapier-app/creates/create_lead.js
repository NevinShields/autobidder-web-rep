const perform = async (z, bundle) => {
  const response = await z.request({
    url: `${bundle.authData.server_url}/api/zapier/actions/create-lead`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
    },
    body: {
      name: bundle.inputData.name,
      email: bundle.inputData.email,
      phone: bundle.inputData.phone,
      address: bundle.inputData.address,
      city: bundle.inputData.city,
      state: bundle.inputData.state,
      zipCode: bundle.inputData.zipCode,
      serviceType: bundle.inputData.serviceType,
      totalPrice: bundle.inputData.totalPrice,
      notes: bundle.inputData.notes,
      source: bundle.inputData.source || 'Zapier',
      formulaId: bundle.inputData.formulaId,
      variables: bundle.inputData.variables ? JSON.parse(bundle.inputData.variables) : {},
    },
  });

  return response.data;
};

module.exports = {
  key: 'create_lead',
  noun: 'Lead',
  display: {
    label: 'Create Lead',
    description: 'Creates a new lead in your Autobidder account.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'name',
        label: 'Customer Name',
        type: 'string',
        required: true,
        helpText: 'The name of the customer submitting the lead.',
      },
      {
        key: 'email',
        label: 'Customer Email',
        type: 'string',
        required: true,
        helpText: 'The email address of the customer.',
      },
      {
        key: 'phone',
        label: 'Customer Phone',
        type: 'string',
        required: false,
        helpText: 'The phone number of the customer.',
      },
      {
        key: 'address',
        label: 'Service Address',
        type: 'string',
        required: false,
        helpText: 'The address where the service will be performed.',
      },
      {
        key: 'city',
        label: 'City',
        type: 'string',
        required: false,
      },
      {
        key: 'state',
        label: 'State',
        type: 'string',
        required: false,
      },
      {
        key: 'zipCode',
        label: 'ZIP Code',
        type: 'string',
        required: false,
      },
      {
        key: 'serviceType',
        label: 'Service Type',
        type: 'string',
        required: false,
        helpText: 'The type of service requested (e.g., Roof Cleaning, Pressure Washing).',
      },
      {
        key: 'totalPrice',
        label: 'Total Price',
        type: 'number',
        required: false,
        helpText: 'The calculated price for the service.',
      },
      {
        key: 'notes',
        label: 'Customer Notes',
        type: 'text',
        required: false,
        helpText: 'Any additional notes or comments from the customer.',
      },
      {
        key: 'source',
        label: 'Lead Source',
        type: 'string',
        required: false,
        helpText: 'Where the lead came from (defaults to "Zapier").',
      },
      {
        key: 'formulaId',
        label: 'Calculator ID',
        type: 'string',
        required: false,
        helpText: 'The ID of the calculator used to generate this lead.',
      },
      {
        key: 'variables',
        label: 'Calculator Variables',
        type: 'text',
        required: false,
        helpText: 'JSON string of calculator variables and their values.',
      },
    ],
    outputFields: [
      { key: 'id', label: 'Lead ID', type: 'string' },
      { key: 'name', label: 'Customer Name', type: 'string' },
      { key: 'email', label: 'Customer Email', type: 'string' },
      { key: 'phone', label: 'Customer Phone', type: 'string' },
      { key: 'address', label: 'Service Address', type: 'string' },
      { key: 'city', label: 'City', type: 'string' },
      { key: 'state', label: 'State', type: 'string' },
      { key: 'zipCode', label: 'ZIP Code', type: 'string' },
      { key: 'serviceType', label: 'Service Type', type: 'string' },
      { key: 'totalPrice', label: 'Total Price', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
      { key: 'source', label: 'Lead Source', type: 'string' },
    ],
  },
};