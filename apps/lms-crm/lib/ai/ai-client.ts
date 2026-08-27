import { createAnthropic } from '@ai-sdk/anthropic';

/**
 * Client IA — strictement côté serveur (GSMS-AI-02). La clé n'est jamais lue côté
 * client, jamais stockée sur un profil utilisateur (contrairement à VisioFormation).
 */
export function getAiApiKeyStatus(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant — voir .env (jamais un champ de profil utilisateur).');
  }
  return createAnthropic({ apiKey });
}

export const DEFAULT_AI_MODEL = 'claude-sonnet-4-5';
