#!/usr/bin/env node
/** Helpers partagés — nodes n8n GSMS */

export function pos(x, y) {
  return [x, y];
}

export function httpHeaders(secret) {
  return {
    parameters: [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'X-GSMS-Internal-Secret', value: secret },
    ],
  };
}

export function wf(name, nodes, connections, settings = {}) {
  return { name, nodes, connections, settings: { executionOrder: 'v1', ...settings } };
}

export function dispatchNode(
  id,
  name,
  position,
  ctx,
  eventExpr,
  payloadExpr,
  channels = ['notification', 'email'],
  extraBody = '',
) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'POST',
      url: `${ctx.crmBaseUrl}/api/internal/n8n/dispatch`,
      sendHeaders: true,
      headerParameters: httpHeaders(ctx.webhookSecret),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: `={{ JSON.stringify({ event: ${eventExpr}, channels: ${JSON.stringify(channels)}, payload: ${payloadExpr}${extraBody} }) }}`,
      options: { timeout: 20000 },
    },
  };
}

export function dispatchCandidateNode(
  id,
  name,
  position,
  ctx,
  eventExpr,
  payloadExpr,
  emailExpr,
  subjectExpr,
  bodyExpr,
) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'POST',
      url: `${ctx.crmBaseUrl}/api/internal/n8n/dispatch`,
      sendHeaders: true,
      headerParameters: httpHeaders(ctx.webhookSecret),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: `={{ JSON.stringify({ event: ${eventExpr}, channels: ["email","notification"], payload: ${payloadExpr}, emailTo: ${emailExpr}, emailSubject: ${subjectExpr}, emailBody: ${bodyExpr} }) }}`,
      options: { timeout: 20000 },
    },
  };
}

export function httpGetNode(id, name, position, ctx, url) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'GET',
      url,
      sendHeaders: true,
      headerParameters: httpHeaders(ctx.webhookSecret),
      options: { timeout: 25000 },
    },
  };
}

export function httpPostJsonNode(id, name, position, ctx, url, bodyExpr) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'POST',
      url,
      sendHeaders: true,
      headerParameters: httpHeaders(ctx.webhookSecret),
      sendBody: true,
      specifyBody: 'json',
      jsonBody: bodyExpr,
      options: { timeout: 20000 },
    },
  };
}

export function executeWorkflowTrigger(id = 'exec-trigger') {
  return {
    id,
    name: 'Execute Workflow Trigger',
    type: 'n8n-nodes-base.executeWorkflowTrigger',
    typeVersion: 1,
    position: pos(0, 0),
    parameters: {},
  };
}

export function scheduleTrigger(id, name, position, cron) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    position,
    parameters: {
      rule: { interval: [{ field: 'cronExpression', expression: cron }] },
    },
  };
}

export function waitUntilNode(id, name, position, dateExpr) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position,
    parameters: {
      resume: 'specificTime',
      dateTime: dateExpr,
    },
  };
}

export function waitDaysNode(id, name, position, days) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    position,
    parameters: {
      resume: 'timeInterval',
      amount: days,
      unit: 'days',
    },
  };
}

export function codeNode(id, name, position, jsCode) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: { jsCode },
  };
}

export function splitBatchesNode(id, name, position) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    position,
    parameters: { options: {} },
  };
}

export function executeSub(id, name, position, workflowId) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.executeWorkflow',
    typeVersion: 1.2,
    position,
    parameters: {
      workflowId: { __rl: true, mode: 'id', value: workflowId },
      options: {},
    },
  };
}

export function switchOnEvent(id, position, rules) {
  return {
    id,
    name: 'Switch event',
    type: 'n8n-nodes-base.switch',
    typeVersion: 3.2,
    position,
    parameters: {
      rules: {
        values: rules.map((r) => ({
          conditions: {
            options: { caseSensitive: true, typeValidation: 'strict' },
            conditions: [
              {
                id: crypto.randomUUID(),
                leftValue: '={{ $json.event }}',
                rightValue: r.event,
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
          renameOutput: true,
          outputKey: r.key,
        })),
      },
      options: { fallbackOutput: 'extra' },
    },
  };
}

export function switchOnField(id, name, position, fieldExpr, rules) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.switch',
    typeVersion: 3.2,
    position,
    parameters: {
      rules: {
        values: rules.map((r) => ({
          conditions: {
            conditions: [
              {
                leftValue: fieldExpr,
                rightValue: r.value,
                operator: { type: 'string', operation: 'equals' },
              },
            ],
            combinator: 'and',
          },
          renameOutput: true,
          outputKey: r.key,
        })),
      },
      options: { fallbackOutput: 'extra' },
    },
  };
}

export function unwrapDataNode(id, name, position, triggerNodeName = 'Execute Workflow Trigger') {
  return codeNode(
    id,
    name,
    position,
    `const envelope = $input.first().json;
const data = envelope.data ?? envelope;
const trigger = $('${triggerNodeName}').first().json;
return [{ json: { ...data, triggerPayload: trigger.payload ?? {}, triggerEvent: trigger.event } }];`,
  );
}
