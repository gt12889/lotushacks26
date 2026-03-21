/**
 * LotusHacks sponsor integrations (see docs/SPONSORS.md).
 * Brand names stay in English; roles are i18n via `landing.sponsor.<key>`.
 */
export const LANDING_SPONSOR_KEYS = [
  'tinyfish',
  'brightdata',
  'openrouter',
  'exa',
  'elevenlabs',
  'openai',
  'supermemory',
] as const;

export type LandingSponsorKey = (typeof LANDING_SPONSOR_KEYS)[number];

export const LANDING_SPONSOR_BRAND: Record<LandingSponsorKey, string> = {
  tinyfish: 'TinyFish',
  brightdata: 'BrightData',
  openrouter: 'OpenRouter',
  exa: 'Exa',
  elevenlabs: 'ElevenLabs',
  openai: 'OpenAI',
  supermemory: 'Supermemory',
};
