import { handleChatRequest } from './core.mjs';

const extraOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const integerEnv = (name: string, fallback: number) => {
    const value = Number(Deno.env.get(name));
    return Number.isInteger(value) && value >= 0 ? value : fallback;
};

Deno.serve((request) => handleChatRequest(request, {
    apiKey: Deno.env.get('DEEPSEEK_API_KEY') || '',
    accessCode: Deno.env.get('TRENT_CHAT_ACCESS_CODE') || '',
    model: Deno.env.get('DEEPSEEK_MODEL') || 'deepseek-chat',
    supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
    supabaseServiceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    allowedOrigins: extraOrigins,
    allowLocalOrigins: Deno.env.get('ALLOW_LOCAL_ORIGINS') === 'true',
    chatEnabled: Deno.env.get('CHAT_ENABLED') !== 'false',
    rateLimit: integerEnv('TRENT_CHAT_IP_MINUTE_LIMIT', 5),
    ipDailyLimit: integerEnv('TRENT_CHAT_IP_DAILY_LIMIT', 10),
    globalDailyLimit: integerEnv('TRENT_CHAT_GLOBAL_DAILY_LIMIT', 100),
    maxOutputTokens: integerEnv('TRENT_CHAT_MAX_OUTPUT_TOKENS', 256),
    timeoutMs: 25_000
}));
