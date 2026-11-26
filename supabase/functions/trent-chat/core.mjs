import { buildSystemPrompt, normalizeLanguage } from './profile.mjs';

export const DEFAULT_MODEL = 'deepseek-chat';
export const DEFAULT_API_URL = 'https://api.deepseek.com/chat/completions';
export const MAX_MESSAGE_CHARS = 500;
export const MAX_MESSAGES = 12;
export const MAX_TOTAL_CHARS = 6000;
export const DEFAULT_MAX_OUTPUT_TOKENS = 256;
export const DEFAULT_GLOBAL_DAILY_LIMIT = 100;
export const DEFAULT_IP_DAILY_LIMIT = 10;

const DEFAULT_ORIGINS = ['https://trentlyu.github.io'];
const rateBuckets = new Map();

function requestId() {
    return globalThis.crypto?.randomUUID?.() || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function allowedOrigins(env) {
    const extra = Array.isArray(env.allowedOrigins) ? env.allowedOrigins : [];
    return new Set([...DEFAULT_ORIGINS, ...extra].filter(Boolean));
}

export function isOriginAllowed(origin, env = {}) {
    if (!origin) return false;
    if (allowedOrigins(env).has(origin)) return true;
    if (env.allowLocalOrigins === true) {
        return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    }
    return false;
}

function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

function json(status, payload, origin, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...corsHeaders(origin),
            ...extraHeaders
        }
    });
}

function clientKey(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

function consumeRateLimit(request, env) {
    const limit = Number.isInteger(env.rateLimit) ? env.rateLimit : 10;
    if (limit <= 0) return { ok: true, retryAfter: 0 };
    const windowMs = 60_000;
    const now = Date.now();
    const key = clientKey(request);
    const previous = rateBuckets.get(key);
    const bucket = !previous || now - previous.startedAt >= windowMs
        ? { startedAt: now, count: 0 }
        : previous;
    bucket.count += 1;
    rateBuckets.set(key, bucket);
    if (rateBuckets.size > 5000) {
        for (const [ip, value] of rateBuckets) {
            if (now - value.startedAt >= windowMs) rateBuckets.delete(ip);
        }
    }
    return {
        ok: bucket.count <= limit,
        retryAfter: Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000))
    };
}

function positiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 ? number : fallback;
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    return new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
}

export async function isAccessCodeValid(provided, expected) {
    if (typeof provided !== 'string' || typeof expected !== 'string' || !expected) return false;
    const candidate = provided.trim();
    if (!candidate || candidate.length > 128) return false;
    const [left, right] = await Promise.all([sha256(candidate), sha256(expected)]);
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left[index] ^ right[index];
    }
    return difference === 0;
}

function serviceConfigured(env) {
    const quotaConfigured = typeof env.consumeQuota === 'function'
        || Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
    return Boolean(env.apiKey && env.accessCode && quotaConfigured && env.chatEnabled !== false);
}

async function clientFingerprint(request, env) {
    const hash = await sha256(`${env.supabaseServiceRoleKey || env.accessCode}|${clientKey(request)}`);
    return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function consumePersistentQuota(request, env) {
    const fetchImpl = env.quotaFetchImpl || env.fetchImpl || globalThis.fetch;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(env.quotaTimeoutMs) || 5000);
    try {
        const response = await fetchImpl(`${env.supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/consume_trent_chat_quota`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': env.supabaseServiceRoleKey,
                'Authorization': `Bearer ${env.supabaseServiceRoleKey}`
            },
            body: JSON.stringify({
                p_client_id: await clientFingerprint(request, env),
                p_ip_minute_limit: positiveInteger(env.rateLimit, 10),
                p_ip_daily_limit: positiveInteger(env.ipDailyLimit, DEFAULT_IP_DAILY_LIMIT),
                p_global_daily_limit: positiveInteger(env.globalDailyLimit, DEFAULT_GLOBAL_DAILY_LIMIT)
            }),
            signal: controller.signal
        });
        if (!response.ok) throw new Error('QUOTA_RPC_FAILED');
        const result = await response.json();
        if (!result || typeof result.ok !== 'boolean') throw new Error('INVALID_QUOTA_RESPONSE');
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

export function validateChatPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { ok: false, code: 'INVALID_BODY' };
    }
    if (!Array.isArray(payload.messages) || payload.messages.length < 1) {
        return { ok: false, code: 'MESSAGES_REQUIRED' };
    }
    if (payload.messages.length > MAX_MESSAGES) {
        return { ok: false, code: 'TOO_MANY_MESSAGES' };
    }
    let total = 0;
    const messages = [];
    for (const message of payload.messages) {
        if (!message || typeof message !== 'object' || !['user', 'assistant'].includes(message.role)) {
            return { ok: false, code: 'INVALID_ROLE' };
        }
        if (typeof message.content !== 'string') {
            return { ok: false, code: 'INVALID_CONTENT' };
        }
        const content = message.content.trim();
        if (!content || content.length > MAX_MESSAGE_CHARS) {
            return { ok: false, code: 'INVALID_MESSAGE_LENGTH' };
        }
        total += content.length;
        messages.push({ role: message.role, content });
    }
    if (messages[messages.length - 1].role !== 'user') {
        return { ok: false, code: 'LAST_MESSAGE_MUST_BE_USER' };
    }
    if (total > MAX_TOTAL_CHARS) {
        return { ok: false, code: 'CONVERSATION_TOO_LONG' };
    }
    return {
        ok: true,
        messages,
        language: normalizeLanguage(payload.language)
    };
}

export function buildModelMessages(payload) {
    const checked = validateChatPayload(payload);
    if (!checked.ok) return checked;
    return {
        ok: true,
        language: checked.language,
        messages: [
            { role: 'system', content: buildSystemPrompt(checked.language) },
            ...checked.messages
        ]
    };
}

async function parseUpstreamJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function handleChatRequest(request, env = {}) {
    const origin = request.headers.get('origin') || '';
    const id = requestId();

    if (!isOriginAllowed(origin, env)) {
        return new Response(JSON.stringify({ error: 'ORIGIN_NOT_ALLOWED', requestId: id }), {
            status: 403,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET') {
        const configured = serviceConfigured(env);
        return json(configured ? 200 : 503, {
            status: configured ? 'ok' : (env.chatEnabled === false ? 'disabled' : 'not_configured'),
            model: env.model || DEFAULT_MODEL,
            accessRequired: true,
            requestId: id
        }, origin);
    }

    if (request.method !== 'POST') {
        return json(405, { error: 'METHOD_NOT_ALLOWED', requestId: id }, origin, { Allow: 'POST, GET, OPTIONS' });
    }

    if (env.chatEnabled === false) {
        return json(503, { error: 'SERVICE_DISABLED', requestId: id }, origin);
    }

    if (!serviceConfigured(env)) {
        return json(503, { error: 'SERVICE_NOT_CONFIGURED', requestId: id }, origin);
    }

    const rate = consumeRateLimit(request, env);
    if (!rate.ok) {
        return json(429, { error: 'RATE_LIMITED', requestId: id }, origin, {
            'Retry-After': String(rate.retryAfter)
        });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 24_000) {
        return json(413, { error: 'PAYLOAD_TOO_LARGE', requestId: id }, origin);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return json(400, { error: 'INVALID_JSON', requestId: id }, origin);
    }

    if (!await isAccessCodeValid(payload?.accessCode, env.accessCode)) {
        return json(401, { error: 'INVALID_ACCESS_CODE', requestId: id }, origin);
    }

    const built = buildModelMessages(payload);
    if (!built.ok) {
        return json(400, { error: built.code, requestId: id }, origin);
    }

    let quota;
    try {
        const consumeQuota = env.consumeQuota || consumePersistentQuota;
        quota = await consumeQuota(request, env);
    } catch {
        return json(503, { error: 'QUOTA_UNAVAILABLE', requestId: id }, origin);
    }
    if (!quota?.ok) {
        const code = ['RATE_LIMITED', 'IP_DAILY_LIMIT', 'GLOBAL_DAILY_LIMIT'].includes(quota?.code)
            ? quota.code
            : 'QUOTA_UNAVAILABLE';
        const limited = code !== 'QUOTA_UNAVAILABLE';
        return json(limited ? 429 : 503, { error: code, requestId: id }, origin, limited ? {
            'Retry-After': String(Math.max(1, Number(quota.retryAfter) || 60))
        } : {});
    }

    const fetchImpl = env.fetchImpl || globalThis.fetch;
    const model = env.model || DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(env.timeoutMs) || 25_000);

    try {
        const upstream = await fetchImpl(env.apiUrl || DEFAULT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: built.messages,
                max_tokens: Math.max(1, positiveInteger(env.maxOutputTokens, DEFAULT_MAX_OUTPUT_TOKENS)),
                temperature: 0.3,
                top_p: 0.9,
                stream: false
            }),
            signal: controller.signal
        });

        if (!upstream.ok) {
            return json(502, { error: 'UPSTREAM_UNAVAILABLE', requestId: id }, origin);
        }

        const data = await parseUpstreamJson(upstream);
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply) {
            return json(502, { error: 'UPSTREAM_EMPTY_RESPONSE', requestId: id }, origin);
        }

        return json(200, {
            reply,
            model: data.model || model,
            requestId: id,
            usage: data.usage ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens
            } : undefined
        }, origin);
    } catch (error) {
        const timedOut = error?.name === 'AbortError';
        return json(timedOut ? 504 : 502, {
            error: timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
            requestId: id
        }, origin);
    } finally {
        clearTimeout(timeout);
    }
}
