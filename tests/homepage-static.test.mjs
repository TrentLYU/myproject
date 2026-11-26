import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const page = readFileSync(new URL('../2.2.1.html', import.meta.url), 'utf8');
const client = readFileSync(new URL('../trent-ai.js', import.meta.url), 'utf8');
const config = readFileSync(new URL('../trent-chat-config.js', import.meta.url), 'utf8');
const dictionarySource = readFileSync(new URL('../i18n-dict.js', import.meta.url), 'utf8');
const quotaMigration = readFileSync(new URL('../supabase/migrations/20261126150000_trent_chat_quota.sql', import.meta.url), 'utf8');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(dictionarySource, context);
const dictionary = context.window.I18N_DICT;

test('当前主页不再包含浏览器密钥、直连模型或关键词固定答案逻辑', () => {
    assert.doesNotMatch(page, /deepseek_api_key|setApiKeyBtn|api\.deepseek\.com|findAnswer\(|__TRENT_TEST__/);
    assert.doesNotMatch(client, /deepseek_api_key|api\.deepseek\.com|findAnswer\(|setTimeout\([^)]*findAnswer/);
    assert.doesNotMatch(page, /<script src="trent-knowledge/);
});

test('两个聊天入口都接入统一的真实 API 客户端', () => {
    for (const id of ['avatarMessages', 'avatarInput', 'avatarSendBtn', 'trentMessages', 'trentInput', 'trentSendBtn']) {
        assert.match(page, new RegExp(`id="${id}"`));
    }
    assert.ok(page.indexOf('src="trent-chat-config.js"') < page.indexOf('src="trent-ai.js"'));
    assert.match(client, /wireMainChat\(\)/);
    assert.match(client, /wirePopupChat\(\)/);
    assert.match(client, /method:\s*'POST'/);
    assert.match(client, /messages:\s*messages\.slice\(-12\)/);
    assert.match(client, /accessCode/);
    assert.match(client, /window\.prompt\(t\('chat\.accessPrompt'\)/);
    assert.doesNotMatch(client, /localStorage|sessionStorage|document\.cookie/);
    assert.match(config, /supabase\.co\/functions\/v1\/trent-chat/);
});

test('页面明确披露 AI 身份并限制输入长度', () => {
    assert.match(page, /data-i18n="chat\.disclosure"/);
    assert.match(page, /data-i18n="chat\.disclosureShort"/);
    assert.match(page, /id="avatarInput" maxlength="500"/);
    assert.match(page, /id="trentInput" maxlength="500"/);
    assert.match(page, /id="avatarMessages" role="log" aria-live="polite"/);
    assert.match(page, /id="trentMessages" role="log" aria-live="polite"/);
});

test('三种语言都包含完整的聊天状态和错误文案', () => {
    const keys = [
        'chat.disclosure', 'chat.disclosureShort', 'chat.checking', 'chat.offline',
        'chat.statusOffline', 'chat.rateLimited', 'chat.serviceUnavailable',
        'chat.accessPrompt', 'chat.accessInvalid', 'chat.accessCancelled',
        'chat.ipDailyLimit', 'chat.globalDailyLimit', 'chat.quotaUnavailable',
        'chat.timeout', 'chat.originDenied', 'chat.reqFail', 'chat.netFail'
    ];
    for (const lang of ['zh', 'tw', 'en']) {
        assert.ok(dictionary[lang], `missing language ${lang}`);
        for (const key of keys) {
            assert.equal(typeof dictionary[lang][key], 'string', `${lang}:${key}`);
            assert.ok(dictionary[lang][key].length > 0, `${lang}:${key} is empty`);
        }
        for (const obsolete of ['chat.systemPrompt', 'chat.setKey', 'chat.noKey', 'chat.keyExpired']) {
            assert.equal(dictionary[lang][obsolete], undefined, `${lang}:${obsolete} should be removed`);
        }
    }
});

test('数据库硬限额启用 RLS、原子锁并只授权 service_role 执行', () => {
    assert.match(quotaMigration, /enable row level security/i);
    assert.match(quotaMigration, /pg_advisory_xact_lock/i);
    assert.match(quotaMigration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
    assert.match(quotaMigration, /grant execute on function[\s\S]*to service_role/i);
    assert.doesNotMatch(quotaMigration, /create table[\s\S]*\bip\s+text\b/i);
});

test('前端文件不包含疑似 DeepSeek 私钥', () => {
    for (const source of [page, client, config, dictionarySource]) {
        assert.doesNotMatch(source, /sk-[A-Za-z0-9]{20,}/);
    }
});
