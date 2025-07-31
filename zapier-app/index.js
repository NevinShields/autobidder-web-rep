const authentication = require('./authentication');
const newLeadTrigger = require('./triggers/new_lead');
const newCalculatorTrigger = require('./triggers/new_calculator');
const createLeadAction = require('./creates/create_lead');
const updateLeadAction = require('./creates/update_lead');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  triggers: {
    [newLeadTrigger.key]: newLeadTrigger,
    [newCalculatorTrigger.key]: newCalculatorTrigger,
  },

  creates: {
    [createLeadAction.key]: createLeadAction,
    [updateLeadAction.key]: updateLeadAction,
  },

  searches: {},

  resources: {},
};