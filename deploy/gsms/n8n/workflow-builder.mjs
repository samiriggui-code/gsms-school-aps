#!/usr/bin/env node
/** Point d'entrée legacy — délègue à deploy/gsms/n8n/workflows/ */
export { buildSubWorkflows, buildRouter } from './workflows/index.mjs';
