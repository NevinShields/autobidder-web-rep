export function getChatWidgetScript(): string {
  return `(function() {
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    currentScript = scripts[scripts.length - 1];
  }
  if (!currentScript) return;

  var dataset = currentScript.dataset || {};
  var accountId = dataset.accountId || '';
  var previewMode = dataset.previewMode === 'app';
  var calculatorId = Number(dataset.calculatorId || 0);
  var configuredCalculatorIds = (dataset.calculatorIds || '')
    .split(',')
    .map(function(value) { return Number(String(value || '').trim()); })
    .filter(function(value) { return Number.isInteger(value) && value > 0; });
  if (configuredCalculatorIds.length === 0 && calculatorId > 0) {
    configuredCalculatorIds = [calculatorId];
  }
  var baseUrl = (dataset.baseUrl || new URL(currentScript.src, window.location.href).origin).replace(/\\/$/, '');
  if (!accountId) return;

  var serviceKey = configuredCalculatorIds.length > 0 ? configuredCalculatorIds.join('-') : 'all';
  var storageKey = 'ab-chat-estimator:' + accountId + ':' + serviceKey;
  var rootEl = document.createElement('div');
  rootEl.id = 'ab-chat-estimator-root-' + serviceKey;
  var mountTarget = previewMode && document.getElementById('ab-chat-preview-host')
    ? document.getElementById('ab-chat-preview-host')
    : document.body;
  mountTarget.appendChild(rootEl);
  if (previewMode) {
    rootEl.style.height = '100%';
  }
  var shadow = rootEl.attachShadow ? rootEl.attachShadow({ mode: 'open' }) : rootEl;

  var state = {
    config: null,
    snapshot: null,
    sessionId: null,
    visitorId: 'visitor_' + Math.random().toString(36).slice(2),
    open: previewMode,
    started: false,
    completed: false,
    loading: false,
    inputValue: '',
    multiValues: [],
    selectedServiceIds: [],
    messages: []
  };

  function restore() {
    try {
      var raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      state.sessionId = parsed.sessionId || state.sessionId;
      state.visitorId = parsed.visitorId || state.visitorId;
      state.open = parsed.open === true;
      state.started = parsed.started === true;
      state.completed = parsed.completed === true;
      state.selectedServiceIds = Array.isArray(parsed.selectedServiceIds) ? parsed.selectedServiceIds : [];
      state.messages = Array.isArray(parsed.messages) ? parsed.messages : [];
      if (previewMode) {
        state.open = true;
      }
    } catch (error) {
      console.warn('[chat-estimator] restore failed', error);
    }
  }

  function persist() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({
        sessionId: state.sessionId,
        visitorId: state.visitorId,
        open: state.open,
        started: state.started,
        completed: state.completed,
        selectedServiceIds: state.selectedServiceIds,
        messages: state.messages
      }));
    } catch (error) {
      console.warn('[chat-estimator] persist failed', error);
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function api(path, init) {
    return fetch(baseUrl + path, init).then(function(response) {
      return response.json().then(function(data) {
        if (!response.ok) {
          var error = new Error(data && data.message ? data.message : 'Request failed');
          error.data = data;
          throw error;
        }
        return data;
      });
    });
  }

  function track(eventName, questionKey, metadata) {
    if (!state.sessionId) return Promise.resolve();
    return api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: eventName,
        questionKey: questionKey || undefined,
        metadata: metadata || {}
      })
    }).catch(function() {});
  }

  function activePrompt() {
    if (!state.snapshot) return null;
    if (state.snapshot.currentQuestion) {
      return {
        key: state.snapshot.currentQuestion.key,
        prompt: state.snapshot.currentQuestion.prompt,
        inputKind: state.snapshot.currentQuestion.inputKind,
        options: state.snapshot.currentQuestion.options || [],
        min: state.snapshot.currentQuestion.min,
        max: state.snapshot.currentQuestion.max,
        step: state.snapshot.currentQuestion.step,
        placeholder: 'Type your answer'
      };
    }
    if (state.snapshot.nextContactField) {
      var fieldKey = state.snapshot.nextContactField.key;
      return {
        key: 'contact.' + fieldKey,
        prompt: state.snapshot.nextContactField.label,
        inputKind: state.snapshot.nextContactField.inputKind,
        options: state.snapshot.nextContactField.options || [],
        placeholder: fieldKey === 'email'
          ? 'name@example.com'
          : fieldKey === 'phone'
            ? '(555) 555-5555'
            : fieldKey === 'address'
              ? '123 Main St'
              : 'Type your answer',
        htmlInputType: fieldKey === 'email'
          ? 'email'
          : fieldKey === 'phone'
            ? 'tel'
            : 'text',
        autocomplete: fieldKey === 'name'
          ? 'name'
          : fieldKey === 'email'
            ? 'email'
            : fieldKey === 'phone'
              ? 'tel'
              : fieldKey === 'address'
                ? 'street-address'
                : 'off'
      };
    }
    return null;
  }

  function appendMessage(message) {
    state.messages.push(message);
    persist();
  }

  function upsertMessage(message) {
    var index = state.messages.findIndex(function(entry) { return entry.id === message.id; });
    if (index >= 0) {
      state.messages[index] = message;
    } else {
      state.messages.push(message);
    }
    persist();
  }

  function applySnapshot(snapshot) {
    state.snapshot = snapshot;
    state.completed = Boolean(snapshot && snapshot.completed);
    persist();
  }

  function ensurePromptMessage(prompt) {
    if (!prompt) return;
    var last = state.messages[state.messages.length - 1];
    var promptId = 'prompt:' + prompt.key;
    if (last && last.id === promptId) return;
    appendMessage({
      id: promptId,
      role: 'bot',
      kind: 'text',
      text: prompt.prompt
    });
  }

  function ensureResultMessage(result) {
    if (!result) return;
    var exists = state.messages.some(function(message) {
      return message.kind === 'result' && message.value === result.displayText;
    });
    if (exists) return;
    appendMessage({
      id: 'result:' + result.displayText,
      role: 'bot',
      kind: 'result',
      text: 'Your estimate is ready.',
      value: result.displayText
    });
  }

  function ensureServiceResultMessage(serviceSummary) {
    if (!serviceSummary || !serviceSummary.result) return;
    var resultId = 'service-result:' + serviceSummary.id + ':' + serviceSummary.result.displayText;
    var exists = state.messages.some(function(message) { return message.id === resultId; });
    if (exists) return;
    appendMessage({
      id: resultId,
      role: 'bot',
      kind: 'text',
      text: serviceSummary.name + ' estimate: ' + serviceSummary.result.displayText
    });
  }

  function getConfiguredServices() {
    return (state.config && state.config.services ? state.config.services : []).filter(function(service) {
      return service && service.supported;
    });
  }

  function getServiceById(serviceId) {
    return getConfiguredServices().find(function(service) { return Number(service.id) === Number(serviceId); }) || null;
  }

  function getServiceSelectionMessage(serviceIds) {
    var names = (serviceIds || []).map(function(serviceId) {
      var service = getServiceById(serviceId);
      return service ? service.name : null;
    }).filter(Boolean);

    if (names.length === 0) return 'Estimate';
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + ' and ' + names[1];
    return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
  }

  function ensureServiceSelectionMessage(serviceIds) {
    if (!serviceIds || !serviceIds.length) return;
    var normalized = serviceIds.slice().map(function(id) { return Number(id); }).filter(function(id) {
      return Number.isInteger(id) && id > 0;
    });
    if (!normalized.length) return;

    state.messages = state.messages.filter(function(message) {
      return String(message.id || '').indexOf('service-selection:') !== 0;
    });
    var messageId = 'service-selection:' + normalized.join('-');
    upsertMessage({
      id: messageId,
      role: 'user',
      kind: 'text',
      text: getServiceSelectionMessage(normalized)
    });
  }

  function syncTranscript() {
    if (state.messages.length === 0 && state.config && state.config.greetingMessage) {
      appendMessage({
        id: 'greeting',
        role: 'bot',
        kind: 'text',
        text: state.config.greetingMessage
      });
    }
    if (!state.snapshot) return;
    (state.snapshot.selectedServices || []).forEach(function(serviceSummary) {
      ensureServiceResultMessage(serviceSummary);
    });
    ensureResultMessage(state.snapshot.result);
    ensurePromptMessage(activePrompt());
  }

  function hydrateSession() {
    if (!state.sessionId) return Promise.resolve();
    return api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId))
      .then(function(snapshot) {
        applySnapshot(snapshot);
        syncTranscript();
        render();
      })
      .catch(function() {
        state.sessionId = null;
        state.started = false;
        state.completed = false;
        persist();
      });
  }

  function loadConfig() {
    var query = '/api/chat-estimator/config?accountId=' + encodeURIComponent(accountId);
    if (configuredCalculatorIds.length > 0) {
      query += '&calculatorIds=' + encodeURIComponent(configuredCalculatorIds.join(','));
    }
    return api(query)
      .then(function(config) {
        state.config = config;
        if (state.selectedServiceIds.length === 0 && config.configuredServiceIds && config.configuredServiceIds.length === 1) {
          state.selectedServiceIds = config.configuredServiceIds.slice();
        }
        if (config.supported === false && state.messages.length === 0) {
          state.messages = [{
            id: 'unsupported',
            role: 'bot',
            kind: 'text',
            text: (config.warnings && config.warnings[0]) || 'This calculator is not supported in Chat Estimator yet.'
          }];
        }
        syncTranscript();
        render();
        if (state.sessionId) return hydrateSession();
      })
      .catch(function(error) {
        console.warn('[chat-estimator] config unavailable', error);
      });
  }

  function startSession(selectedServiceIds) {
    var serviceIds = Array.isArray(selectedServiceIds) && selectedServiceIds.length > 0
      ? selectedServiceIds
      : (state.selectedServiceIds || []);
    if (!serviceIds.length) {
      appendMessage({
        id: 'error-no-services',
        role: 'bot',
        kind: 'text',
        text: 'Choose at least one service to continue.'
      });
      render();
      return Promise.resolve();
    }
    ensureServiceSelectionMessage(serviceIds);
    state.loading = true;
    render();
    return api('/api/chat-estimator/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: accountId,
        calculatorId: serviceIds[0],
        selectedCalculatorIds: serviceIds,
        visitorId: state.visitorId,
        sessionId: state.sessionId || undefined,
        pageUrl: window.location.href,
        referrer: document.referrer || ''
      })
    }).then(function(data) {
      state.loading = false;
      state.started = true;
      state.selectedServiceIds = serviceIds.slice();
      state.sessionId = data.sessionId;
      applySnapshot(data);
      syncTranscript();
      render();
    }).catch(function(error) {
      state.loading = false;
      appendMessage({
        id: 'error-start',
        role: 'bot',
        kind: 'text',
        text: error.message || 'Unable to start chat right now.'
      });
      render();
    });
  }

  function submitAnswer(answer) {
    var prompt = activePrompt();
    if (!prompt || !state.sessionId) return;

    appendMessage({
      id: 'answer:' + Date.now(),
      role: 'user',
      kind: 'text',
      text: Array.isArray(answer)
        ? answer.join(', ')
        : answer === true
          ? 'Yes'
          : answer === false
            ? 'No'
            : String(answer)
    });

    state.loading = true;
    render();

    api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionKey: prompt.key,
        answer: answer
      })
    }).then(function(data) {
      state.loading = false;
      applySnapshot(data);
      if (data.readyToCalculate) {
        calculate();
        return;
      }
      if (data.readyToComplete) {
        render();
        return;
      }
      ensurePromptMessage(activePrompt());
      render();
    }).catch(function(error) {
      state.loading = false;
      appendMessage({
        id: 'error-answer:' + Date.now(),
        role: 'bot',
        kind: 'text',
        text: error.message || 'Please try that again.'
      });
      render();
    });
  }

  function serviceSelectionHtml() {
    if (!state.config || state.started || state.completed) return '';
    var services = getConfiguredServices();
    if (!services.length) {
      return '<div class="footer-note">No supported services are available in this chat.</div>';
    }
    return '<div class="service-picker">' +
      '<div class="chip-grid service-chip-grid">' +
      services.map(function(service) {
        var selected = state.selectedServiceIds.indexOf(service.id) >= 0;
        return '<button class="choice-chip service-chip ' + (selected ? 'selected' : '') + '" data-service-chip="' + escapeHtml(service.id) + '" data-selected="' + (selected ? '1' : '0') + '">' + escapeHtml(service.name) + '</button>';
      }).join('') +
      '</div>' +
      '<button class="submit-button service-continue" data-start-chat="1"' + (state.selectedServiceIds.length === 0 ? ' disabled' : '') + '>Continue</button>' +
    '</div>';
  }

  function goBack() {
    if (!state.sessionId || state.loading) return;
    state.loading = true;
    render();
    api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'back' })
    }).then(function(data) {
      state.loading = false;
      applySnapshot(data);
      state.messages = state.messages.filter(function(message) {
        return message.kind !== 'result';
      });
      state.messages = state.messages.slice(0, Math.max(1, state.messages.length - 2));
      syncTranscript();
      render();
    }).catch(function() {
      state.loading = false;
      render();
    });
  }

  function calculate() {
    if (!state.sessionId) return;
    state.loading = true;
    render();
    api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(function(data) {
      state.loading = false;
      applySnapshot(data);
      ensureResultMessage(data.result);
      ensurePromptMessage(activePrompt());
      render();
    }).catch(function(error) {
      state.loading = false;
      appendMessage({
        id: 'error-calc',
        role: 'bot',
        kind: 'text',
        text: error.message || 'Unable to calculate the estimate right now.'
      });
      render();
    });
  }

  function complete() {
    if (!state.sessionId) return;
    state.loading = true;
    render();
    api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(function(data) {
      state.loading = false;
      applySnapshot(data);
      appendMessage({
        id: 'complete:' + Date.now(),
        role: 'bot',
        kind: 'text',
        text: 'Your estimate has been saved.'
      });
      render();
    }).catch(function(error) {
      state.loading = false;
      appendMessage({
        id: 'error-complete:' + Date.now(),
        role: 'bot',
        kind: 'text',
        text: error.message || 'Unable to save your estimate yet.'
      });
      render();
    });
  }

  function sendEstimate() {
    if (!state.sessionId) return;
    state.loading = true;
    render();
    api('/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/send-estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    }).then(function() {
      state.loading = false;
      appendMessage({
        id: 'sent-estimate',
        role: 'bot',
        kind: 'text',
        text: 'Estimate sent.'
      });
      render();
    }).catch(function(error) {
      state.loading = false;
      appendMessage({
        id: 'error-send-estimate',
        role: 'bot',
        kind: 'text',
        text: error.message || 'Unable to send the estimate.'
      });
      render();
    });
  }

  function launcherLabel() {
    return (state.config && state.config.launcherText) || 'Chat';
  }

  function primaryColor() {
    return (state.config && state.config.primaryColor) || '#2563eb';
  }

  function ctaButtonsHtml() {
    if (!state.snapshot || !state.snapshot.completed) return '';
    var order = ['book_now', 'send_estimate', 'contact_us'];
    var primary = state.config && state.config.finalCtaBehavior ? state.config.finalCtaBehavior : 'contact_us';
    order.sort(function(a, b) {
      return a === primary ? -1 : b === primary ? 1 : 0;
    });
    return order.map(function(action) {
      var label = action === 'book_now' ? 'Book Now' : action === 'send_estimate' ? 'Send Me This Estimate' : 'Contact Company';
      return '<button class="cta" data-cta="' + action + '" data-primary="' + (action === primary ? '1' : '0') + '">' + escapeHtml(label) + '</button>';
    }).join('');
  }

  function renderComposerPrompt(prompt) {
    if (state.config && state.config.supported === false) return '';
    if (!state.started && !state.completed) {
      return '<div class="composer-prompt"><div class="composer-label">Start here</div><div class="composer-question">Choose the service or services you want included in this estimate.</div></div>';
    }
    if (!prompt || state.completed) return '';
    var label = state.snapshot && state.snapshot.nextContactField ? 'Your details' : 'Your answer';
    return '<div class="composer-prompt"><div class="composer-label">' + escapeHtml(label) + '</div><div class="composer-question">' + escapeHtml(prompt.prompt) + '</div></div>';
  }

  function renderInput(prompt) {
    if (state.config && state.config.supported === false) return '';
    if (!state.started && !state.completed) {
      return serviceSelectionHtml();
    }
    if (state.snapshot && state.snapshot.result && !state.snapshot.nextContactField && !state.snapshot.completed) {
      return '<button class="submit-button" data-complete="1">Finish</button>';
    }
    if (!prompt || !state.started || state.completed) return '';
    if (state.loading) {
      return '<div class="footer-note">Working...</div>';
    }
    if (prompt.inputKind === 'yes_no') {
      return '<div class="chip-grid"><button class="choice-chip" data-answer="yes">Yes</button><button class="choice-chip" data-answer="no">No</button></div>';
    }
    if (prompt.inputKind === 'single_select') {
      return '<div class="chip-grid">' + (prompt.options || []).map(function(option) {
        return '<button class="choice-chip" data-option="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</button>';
      }).join('') + '</div>';
    }
    if (prompt.inputKind === 'multi_select') {
      return '<div class="multi-select"><div class="chip-grid">' + (prompt.options || []).map(function(option) {
        var checked = state.multiValues.indexOf(String(option.value)) >= 0 ? 'checked' : '';
        var selectedClass = checked ? 'selected' : '';
        return '<label class="choice-chip ' + selectedClass + '"><input type="checkbox" value="' + escapeHtml(option.value) + '" ' + checked + ' /><span>' + escapeHtml(option.label) + '</span></label>';
      }).join('') + '</div><button class="submit-button service-continue" data-submit-multi="1">Continue</button></div>';
    }
    var type = prompt.inputKind === 'number' ? 'number' : 'text';
    if (prompt.htmlInputType) {
      type = prompt.htmlInputType;
    }
    var minAttr = prompt.min !== undefined ? ' min="' + escapeHtml(prompt.min) + '"' : '';
    var maxAttr = prompt.max !== undefined ? ' max="' + escapeHtml(prompt.max) + '"' : '';
    var stepAttr = prompt.step !== undefined ? ' step="' + escapeHtml(prompt.step) + '"' : '';
    var autocompleteAttr = prompt.autocomplete ? ' autocomplete="' + escapeHtml(prompt.autocomplete) + '"' : '';
    var placeholder = prompt.placeholder || 'Type your answer';
    var useTextarea = type === 'text';
    var fieldHtml = useTextarea
      ? '<textarea id="ab-chat-input" rows="2"' + autocompleteAttr + ' placeholder="' + escapeHtml(placeholder) + '"></textarea>'
      : '<input id="ab-chat-input" type="' + type + '"' + minAttr + maxAttr + stepAttr + autocompleteAttr + ' placeholder="' + escapeHtml(placeholder) + '" />';
    return '<div class="input-row">' + fieldHtml + '<button class="submit-button send-button" aria-label="Send message" data-submit-text="1">Send</button></div>';
  }

  function render() {
    if (!state.config) return;
    var prompt = activePrompt();
    var progress = state.snapshot && state.snapshot.progress && state.snapshot.progress.total
      ? '<div class="progress">Question ' + state.snapshot.progress.current + ' of ' + state.snapshot.progress.total + '</div>'
      : '';
    var serviceProgress = state.snapshot && state.snapshot.currentService
      ? '<div class="service-progress">Service ' + state.snapshot.currentService.index + ' of ' + state.snapshot.currentService.total + ': ' + escapeHtml(state.snapshot.currentService.name) + '</div>'
      : '';
    var avatar = state.config.avatarLogoUrl
      ? '<img class="avatar-img" src="' + escapeHtml(state.config.avatarLogoUrl) + '" alt="" />'
      : '<div class="avatar-fallback">A</div>';
    var transcript = state.messages.map(function(message) {
      if (message.kind === 'result') {
        return '<div class="message-row bot-row"><div class="message bot result-card"><div class="message-text">' + escapeHtml(message.text) + '</div><div class="result-value">' + escapeHtml(message.value) + '</div></div></div>';
      }
      return '<div class="message-row ' + escapeHtml(message.role) + '-row"><div class="message ' + escapeHtml(message.role) + '"><div class="message-text">' + escapeHtml(message.text) + '</div></div></div>';
    }).join('');

    shadow.innerHTML = '<style>' +
      ':host{all:initial}' +
      ':host{all:initial;display:block;height:100%}' +
      '.wrap{position:' + (previewMode ? 'relative' : 'fixed') + ';right:' + (previewMode ? 'auto' : '16px') + ';left:' + (previewMode ? 'auto' : 'auto') + ';bottom:' + (previewMode ? 'auto' : '16px') + ';top:' + (previewMode ? '0' : 'auto') + ';z-index:' + (previewMode ? '1' : '2147483000') + ';font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Arial,sans-serif;height:' + (previewMode ? '100%' : 'auto') + ';display:flex;align-items:stretch;justify-content:center}' +
      '.launcher{border:none;border-radius:999px;background:linear-gradient(180deg,' + primaryColor() + ',color-mix(in srgb,' + primaryColor() + ' 82%, #0f172a 18%));color:#fff;padding:13px 18px;font-size:14px;font-weight:600;box-shadow:0 14px 32px rgba(15,23,42,.24);cursor:pointer;letter-spacing:.01em}' +
      '.panel{width:' + (previewMode ? '100%' : 'min(420px,calc(100vw - 24px))') + ';height:' + (previewMode ? '100%' : 'min(690px,calc(100vh - 72px))') + ';background:#f5f5f7;border-radius:' + (previewMode ? '30px' : '28px') + ';box-shadow:' + (previewMode ? '0 20px 60px rgba(15,23,42,.16)' : '0 28px 80px rgba(15,23,42,.24)') + ';overflow:hidden;display:flex;flex-direction:column;border:1px solid rgba(15,23,42,.08);min-height:0}' +
      '.hidden{display:none}' +
      '.header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:14px 16px 12px;background:rgba(255,255,255,.86);backdrop-filter:blur(18px);border-bottom:1px solid rgba(15,23,42,.08)}' +
      '.avatar{width:38px;height:38px;border-radius:999px;background:linear-gradient(180deg,#ffffff,#e5e7eb);display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;box-shadow:inset 0 0 0 1px rgba(15,23,42,.06)}' +
      '.avatar-img{width:100%;height:100%;object-fit:cover}' +
      '.avatar-fallback{font-weight:700;color:#0f172a}' +
      '.title-wrap{min-width:0;text-align:center}' +
      '.title{font-size:15px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.subtitle{font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.header-action{justify-self:end;font-size:11px;font-weight:600;color:#10b981;background:#ecfdf5;border:1px solid rgba(16,185,129,.18);border-radius:999px;padding:5px 9px}' +
      '.meta{padding:10px 16px 0;display:flex;flex-direction:column;gap:6px;background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(245,245,247,0));flex:none}' +
      '.progress,.service-progress{font-size:12px;color:#6b7280;text-align:center}' +
      '.panel-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}' +
      '.messages{flex:1;min-height:0;overflow:auto;padding:18px 14px 10px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#e9edf3 0%,#f5f5f7 20%,#f5f5f7 100%);scrollbar-width:thin;scrollbar-color:rgba(100,116,139,.55) transparent}' +
      '.messages::-webkit-scrollbar{width:10px}' +
      '.messages::-webkit-scrollbar-track{background:transparent}' +
      '.messages::-webkit-scrollbar-thumb{background:rgba(100,116,139,.38);border-radius:999px;border:2px solid transparent;background-clip:padding-box}' +
      '.message-row{display:flex;width:100%}' +
      '.bot-row{justify-content:flex-start}' +
      '.user-row{justify-content:flex-end}' +
      '.message{position:relative;max-width:82%;padding:10px 14px;border-radius:20px;line-height:1.42;font-size:14px;word-break:break-word}' +
      '.message.bot{background:#e5e5ea;color:#111827;border-bottom-left-radius:6px}' +
      '.message.user{background:' + primaryColor() + ';color:#fff;border-bottom-right-radius:6px;box-shadow:0 10px 24px color-mix(in srgb,' + primaryColor() + ' 28%, transparent)}' +
      '.message-text{white-space:pre-wrap}' +
      '.result-card{padding:14px 16px 16px;background:#fff;color:#0f172a;border-radius:22px;border-bottom-left-radius:10px;box-shadow:0 10px 24px rgba(15,23,42,.08)}' +
      '.result-value{font-size:30px;font-weight:800;margin-top:8px;color:' + primaryColor() + ';letter-spacing:-.03em}' +
      '.composer{padding:10px 12px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(15,23,42,.08);background:rgba(248,248,248,.92);backdrop-filter:blur(18px);flex:none}' +
      '.composer-prompt{margin-bottom:10px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.78);border:1px solid rgba(15,23,42,.06)}' +
      '.composer-label{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:4px}' +
      '.composer-question{font-size:14px;line-height:1.4;font-weight:600;color:#111827}' +
      '.button-row,.button-col,.multi-select{display:flex;flex-direction:column;gap:8px}' +
      '.button-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}' +
      '.button-row button,.button-col button,.submit-button,.cta,.choice-chip{appearance:none;border:1px solid rgba(15,23,42,.08);background:#fff;color:#0f172a;border-radius:18px;padding:12px 14px;font-size:14px;font-weight:600;cursor:pointer;min-height:46px;box-shadow:0 1px 0 rgba(255,255,255,.9) inset;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease,color .18s ease}' +
      '.button-row button:hover,.button-col button:hover,.submit-button:hover,.cta:hover{filter:brightness(.98)}' +
      '.button-row button:active,.button-col button:active,.submit-button:active,.cta:active,.choice-chip:active{transform:scale(.985)}' +
      '.cta[data-primary="1"]{background:' + primaryColor() + ';color:#fff;border-color:' + primaryColor() + ';box-shadow:0 12px 24px color-mix(in srgb,' + primaryColor() + ' 22%, transparent)}' +
      '.chip-grid{display:flex;flex-wrap:wrap;gap:8px}' +
      '.choice-chip{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 14px;border-radius:999px;background:rgba(255,255,255,.88);font-size:13px;line-height:1.2;box-shadow:0 8px 18px rgba(15,23,42,.05)}' +
      '.choice-chip.selected{background:color-mix(in srgb,' + primaryColor() + ' 12%, #fff);border-color:color-mix(in srgb,' + primaryColor() + ' 36%, rgba(15,23,42,.08));color:color-mix(in srgb,' + primaryColor() + ' 72%, #0f172a);box-shadow:0 10px 24px color-mix(in srgb,' + primaryColor() + ' 12%, transparent)}' +
      '.choice-chip input{position:absolute;opacity:0;pointer-events:none}' +
      '.service-chip-grid{gap:10px}' +
      '.service-chip{font-size:14px;padding:12px 16px}' +
      '.input-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:end;padding:6px;border-radius:24px;background:#fff;border:1px solid rgba(15,23,42,.08);box-shadow:0 6px 20px rgba(15,23,42,.06)}' +
      '.input-row input,.input-row textarea{flex:1;border:none;outline:none;border-radius:18px;padding:11px 12px;font-size:16px;box-sizing:border-box;width:100%;background:transparent;color:#111827}' +
      '.input-row input{min-height:44px}' +
      '.input-row textarea{min-height:44px;max-height:120px;resize:none;line-height:1.35;font-family:inherit}' +
      '.send-button{background:' + primaryColor() + ';color:#fff;border-color:' + primaryColor() + ';border-radius:999px;min-width:44px;min-height:44px;padding:0 16px;box-shadow:0 10px 24px color-mix(in srgb,' + primaryColor() + ' 22%, transparent)}' +
      '.footer-note{font-size:12px;color:#6b7280;padding:8px 4px 2px}' +
      '.toolbar{display:flex;justify-content:space-between;align-items:center;padding:10px 4px 2px}' +
      '.toolbar button{border:none;background:transparent;color:' + primaryColor() + ';font-size:13px;font-weight:600;cursor:pointer;padding:4px 8px;border-radius:999px}' +
      '.cta-row{display:flex;flex-wrap:wrap;gap:8px;padding-top:10px}' +
      '.service-picker{display:flex;flex-direction:column;gap:8px}' +
      '.service-continue[disabled]{opacity:.5;cursor:not-allowed;box-shadow:none}' +
      '@media (max-width:640px){.wrap{right:' + (previewMode ? 'auto' : '12px') + ';left:' + (previewMode ? 'auto' : '12px') + ';bottom:' + (previewMode ? 'auto' : '12px') + '}.panel{width:100%;height:' + (previewMode ? '100%' : 'min(80vh,680px)') + ';border-radius:24px}.header{padding:12px 14px 10px}.header-action{display:none}.meta{padding:8px 12px 0}.messages{padding:14px 10px 8px}.message{max-width:88%}.composer{padding:10px 10px calc(16px + env(safe-area-inset-bottom))}.input-row{grid-template-columns:minmax(0,1fr) auto}.button-row{grid-template-columns:repeat(2,minmax(0,1fr))}.toolbar button{font-size:13px}}' +
      '</style>' +
      '<div class="wrap">' +
        (previewMode ? '' : '<button class="launcher ' + (state.open ? 'hidden' : '') + '" id="ab-launcher">' + escapeHtml(launcherLabel()) + '</button>') +
        '<div class="panel ' + (!state.open ? 'hidden' : '') + '">' +
          '<div class="header"><div class="avatar">' + avatar + '</div><div class="title-wrap"><div class="title">' + escapeHtml(state.config.widgetTitle) + '</div><div class="subtitle">' + escapeHtml(state.config.businessName || "Business") + '</div></div><div class="header-action">Online</div></div>' +
          '<div class="panel-body">' +
            '<div class="meta">' +
              progress +
              serviceProgress +
            '</div>' +
            '<div class="messages" id="ab-messages">' + transcript + '</div>' +
            '<div class="composer">' +
              renderComposerPrompt(prompt) +
              renderInput(prompt) +
              '<div class="cta-row">' + ctaButtonsHtml() + '</div>' +
              '<div class="toolbar"><button id="ab-back">Back</button>' + (previewMode ? '<button id="ab-reset">Reset</button>' : '<button id="ab-close">Minimize</button>') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var launcher = shadow.getElementById('ab-launcher');
    if (launcher) {
      launcher.onclick = function() {
        state.open = true;
        persist();
        render();
        if (state.config && state.config.supported === false) return;
        if (!state.started && state.selectedServiceIds.length === 1) startSession(state.selectedServiceIds);
      };
    }

    var close = shadow.getElementById('ab-close');
    if (close) {
      close.onclick = function() {
        state.open = false;
        persist();
        render();
      };
    }

    var reset = shadow.getElementById('ab-reset');
    if (reset) {
      reset.onclick = function() {
        state.sessionId = null;
        state.snapshot = null;
        state.started = false;
        state.completed = false;
        state.loading = false;
        state.multiValues = [];
        state.selectedServiceIds = [];
        state.messages = state.config && state.config.greetingMessage ? [{
          id: 'greeting',
          role: 'bot',
          kind: 'text',
          text: state.config.greetingMessage
        }] : [];
        persist();
        render();
      };
    }

    var back = shadow.getElementById('ab-back');
    if (back) {
      back.onclick = function() { goBack(); };
    }

    shadow.querySelectorAll('[data-answer]').forEach(function(button) {
      button.addEventListener('click', function() {
        submitAnswer(button.getAttribute('data-answer') === 'yes');
      });
    });

    shadow.querySelectorAll('[data-option]').forEach(function(button) {
      button.addEventListener('click', function() {
        submitAnswer(button.getAttribute('data-option'));
      });
    });

    shadow.querySelectorAll('[data-service-chip]').forEach(function(button) {
      button.addEventListener('click', function() {
        var value = Number(button.getAttribute('data-service-chip'));
        if (!Number.isInteger(value) || value <= 0) return;
        var nextSelection;
        if (state.selectedServiceIds.indexOf(value) >= 0) {
          nextSelection = state.selectedServiceIds.filter(function(item) { return item !== value; });
        } else {
          nextSelection = state.selectedServiceIds.concat([value]);
        }
        state.selectedServiceIds = nextSelection;
        if (state.selectedServiceIds.length > 0) {
          ensureServiceSelectionMessage(state.selectedServiceIds.slice());
        } else {
          state.messages = state.messages.filter(function(message) {
            return String(message.id || '').indexOf('service-selection:') !== 0;
          });
        }
        persist();
        render();

        var services = getConfiguredServices();
        if (services.length === 1 && state.selectedServiceIds.length === 1) {
          startSession(state.selectedServiceIds.slice());
        }
      });
    });

    shadow.querySelectorAll('.multi-select input[type="checkbox"]').forEach(function(input) {
      input.addEventListener('change', function() {
        var value = input.value;
        if (input.checked) {
          if (state.multiValues.indexOf(value) < 0) state.multiValues.push(value);
        } else {
          state.multiValues = state.multiValues.filter(function(item) { return item !== value; });
        }
      });
    });

    shadow.querySelectorAll('.service-picker input[type="checkbox"]').forEach(function(input) {
      input.addEventListener('change', function() {
        var value = Number(input.value);
        if (!Number.isInteger(value) || value <= 0) return;
        if (input.checked) {
          if (state.selectedServiceIds.indexOf(value) < 0) state.selectedServiceIds.push(value);
        } else {
          state.selectedServiceIds = state.selectedServiceIds.filter(function(item) { return item !== value; });
        }
        persist();
      });
    });

    var startChatButton = shadow.querySelector('[data-start-chat="1"]');
    if (startChatButton) {
      startChatButton.addEventListener('click', function() {
        startSession(state.selectedServiceIds.slice());
      });
    }

    var multiSubmit = shadow.querySelector('[data-submit-multi="1"]');
    if (multiSubmit) {
      multiSubmit.addEventListener('click', function() {
        submitAnswer(state.multiValues.slice());
        state.multiValues = [];
      });
    }

    var textSubmit = shadow.querySelector('[data-submit-text="1"]');
    if (textSubmit) {
      var submitTextInput = function() {
        var input = shadow.getElementById('ab-chat-input');
        if (!input || !input.value) return;
        submitAnswer(input.value);
        input.value = '';
      };
      textSubmit.addEventListener('click', submitTextInput);
      var textInput = shadow.getElementById('ab-chat-input');
      if (textInput) {
        textInput.addEventListener('keydown', function(event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            submitTextInput();
          }
        });
      }
    }

    var completeButton = shadow.querySelector('[data-complete="1"]');
    if (completeButton) {
      completeButton.addEventListener('click', function() { complete(); });
    }

    shadow.querySelectorAll('[data-cta]').forEach(function(button) {
      button.addEventListener('click', function() {
        var action = button.getAttribute('data-cta');
        if (!action || !state.sessionId) return;
        track(action === 'book_now' ? 'booking_cta_click' : action + '_click', state.snapshot && state.snapshot.currentQuestionKey, {});
        if (action === 'send_estimate') {
          sendEstimate();
          return;
        }
        if (action === 'contact_us') {
          if (state.config.businessPhone) {
            window.location.href = 'tel:' + state.config.businessPhone;
            return;
          }
          if (state.config.businessEmail) {
            window.location.href = 'mailto:' + state.config.businessEmail;
          }
          return;
        }
        if (action === 'book_now' && state.snapshot && state.snapshot.bookUrl) {
          window.open(state.snapshot.bookUrl, '_blank');
        } else if (state.config.bookUrl) {
          window.open(state.config.bookUrl, '_blank');
        }
      });
    });

    var messages = shadow.getElementById('ab-messages');
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  window.addEventListener('pagehide', function() {
    if (!state.sessionId || state.completed || !state.snapshot || !state.snapshot.currentQuestionKey) return;
    try {
      navigator.sendBeacon(baseUrl + '/api/chat-estimator/session/' + encodeURIComponent(state.sessionId) + '/track', new Blob([JSON.stringify({
        eventName: 'question_dropoff',
        questionKey: state.snapshot.currentQuestionKey,
        metadata: {}
      })], { type: 'application/json' }));
    } catch (error) {}
  });

  restore();
  loadConfig();
})();`;
}
