const authentication = require('./authentication');
const newLeadTrigger = require('./triggers/new_lead');
const newCalculatorTrigger = require('./triggers/new_calculator');
const leadStageChangedTrigger = require('./triggers/lead_stage_changed');
const leadTaggedTrigger = require('./triggers/lead_tagged');
const estimateCreatedTrigger = require('./triggers/estimate_created');
const estimateSentTrigger = require('./triggers/estimate_sent');
const estimateViewedTrigger = require('./triggers/estimate_viewed');
const estimateAcceptedTrigger = require('./triggers/estimate_accepted');
const createLeadAction = require('./creates/create_lead');
const updateLeadAction = require('./creates/update_lead');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  triggers: {
    [newLeadTrigger.key]: newLeadTrigger,
    [newCalculatorTrigger.key]: newCalculatorTrigger,
    [leadStageChangedTrigger.key]: leadStageChangedTrigger,
    [leadTaggedTrigger.key]: leadTaggedTrigger,
    [estimateCreatedTrigger.key]: estimateCreatedTrigger,
    [estimateSentTrigger.key]: estimateSentTrigger,
    [estimateViewedTrigger.key]: estimateViewedTrigger,
    [estimateAcceptedTrigger.key]: estimateAcceptedTrigger,
  },

  creates: {
    [createLeadAction.key]: createLeadAction,
    [updateLeadAction.key]: updateLeadAction,
  },

  searches: {},

  resources: {},
};