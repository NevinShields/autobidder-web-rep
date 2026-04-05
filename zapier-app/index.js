const authentication = require('./authentication');
const newLeadTrigger = require('./triggers/new_lead');
const newCalculatorTrigger = require('./triggers/new_calculator');
const leadStageChangedTrigger = require('./triggers/lead_stage_changed');
const leadTaggedTrigger = require('./triggers/lead_tagged');
const estimateCreatedTrigger = require('./triggers/estimate_created');
const estimateSentTrigger = require('./triggers/estimate_sent');
const estimateViewedTrigger = require('./triggers/estimate_viewed');
const estimateAcceptedTrigger = require('./triggers/estimate_accepted');
// Dynamic dropdown triggers for filtering
const getStagesTrigger = require('./triggers/get_stages');
const getTagsTrigger = require('./triggers/get_tags');
const getAutomationsTrigger = require('./triggers/get_automations');
const getRecentLeadsTrigger = require('./triggers/get_recent_leads');
const getRecentEstimatesTrigger = require('./triggers/get_recent_estimates');
const getPendingAutomationRunsTrigger = require('./triggers/get_pending_automation_runs');
const createLeadAction = require('./creates/create_lead');
const addImagesToLeadByEmailAction = require('./creates/add_images_to_lead_by_email');
const updateLeadAction = require('./creates/update_lead');
const runAutomationAction = require('./creates/run_automation');
const confirmPendingAutomationRunAction = require('./creates/confirm_pending_automation_run');
const toggleAutomationAction = require('./creates/toggle_automation');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  flags: {
    cleanInputData: false,
  },

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
    // Dynamic dropdown triggers (hidden)
    [getStagesTrigger.key]: getStagesTrigger,
    [getTagsTrigger.key]: getTagsTrigger,
    [getAutomationsTrigger.key]: getAutomationsTrigger,
    [getRecentLeadsTrigger.key]: getRecentLeadsTrigger,
    [getRecentEstimatesTrigger.key]: getRecentEstimatesTrigger,
    [getPendingAutomationRunsTrigger.key]: getPendingAutomationRunsTrigger,
  },

  creates: {
    [createLeadAction.key]: createLeadAction,
    [addImagesToLeadByEmailAction.key]: addImagesToLeadByEmailAction,
    [updateLeadAction.key]: updateLeadAction,
    [runAutomationAction.key]: runAutomationAction,
    [confirmPendingAutomationRunAction.key]: confirmPendingAutomationRunAction,
    [toggleAutomationAction.key]: toggleAutomationAction,
  },

  searches: {},

  resources: {},
};
