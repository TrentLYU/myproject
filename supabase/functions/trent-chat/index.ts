import { handleChatRequest } from './core.mjs';

const extraOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

Deno.serve((request) => handleChatRequest(request, {
    apiKey: Deno.env.get('DEEPSEEK_API_KEY') || '',
    model: Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat',
    allowedOrigins: extraOrigins,
    allowLocalOrigins: Deno.env.get('ALLOW_LOCAL_ORIGINS') === 'true',
    rateLimit: 10,
    timeoutMs: 25_000
}));
