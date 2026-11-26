import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../trent-ai.js', import.meta.url), 'utf8');

function element(id) {
    return {
        id,
        value: '',
        disabled: false,
        textContent: '',
        children: [],
        listeners: {},
        addEventListener(type, handler) { this.listeners[type] = handler; },
        async dispatch(type) { return this.listeners[type]?.({}); },
        appendChild(child) { this.children.push(child); this.scrollTop = this.scrollHeight; },
        focus() {},
        remove() {}
    };
}

function createClient({ prompts = [], postResponses = [] } = {}) {
    const elements = Object.fromEntries(['avatarMessages', 'avatarInput', 'avatarSendBtn'].map((id) => [id, element(id)]));
    const requests = [];
    let promptCount = 0;
    const window = {
        TRENT_CHAT_CONFIG: { endpoint: 'https://example.supabase.co/functions/v1/trent-chat' },
        I18N_DICT: {},
        I18n: {
            getLang: () => 'zh',
            t: (key) => key
        },
        prompt: () => prompts[Math.min(promptCount++, prompts.length - 1)],
        addEventListener() {}
    };
    const document = {
        getElementById(id) { return elements[id] || null; },
        querySelector() { return null; },
        createElement() { return element('created'); }
    };
    const fetch = async (url, options = {}) => {
        requests.push({ url, options });
        if (!options.method || options.method === 'GET') {
            return new Response(JSON.stringify({ status: 'ok', model: 'deepseek-chat' }), { status: 200 });
        }
        const response = postResponses.length > 1 ? postResponses.shift() : postResponses[0];
        return response || new Response(JSON.stringify({
            reply: '动态回答', model: 'deepseek-chat'
        }), { status: 200 });
    };
    const context = {
        window,
        document,
        fetch,
        Response,
        AbortController,
        TextEncoder,
        setTimeout,
        clearTimeout,
        console
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    return { window, elements, requests, getPromptCount: () => promptCount };
}

test('主聊天入口首次询问访问码，随后复用内存值且不保存到存储', async () => {
    const client = createClient({ prompts: ['teacher-code'] });
    client.elements.avatarInput.value = '第一个问题';
    await client.elements.avatarSendBtn.dispatch('click');
    client.elements.avatarInput.value = '第二个问题';
    await client.elements.avatarSendBtn.dispatch('click');

    const posts = client.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(posts.length, 2);
    assert.equal(client.getPromptCount(), 1);
    assert.equal(JSON.parse(posts[0].options.body).accessCode, 'teacher-code');
    assert.equal(JSON.parse(posts[1].options.body).accessCode, 'teacher-code');
    assert.equal(JSON.parse(posts[1].options.body).messages.length, 3);
    assert.equal(client.elements.avatarMessages.children.at(-1).textContent, '动态回答');
});

test('错误访问码会清除内存值，下次提问重新输入', async () => {
    const client = createClient({
        prompts: ['wrong-code', 'teacher-code'],
        postResponses: [
            new Response(JSON.stringify({ error: 'INVALID_ACCESS_CODE' }), { status: 401 }),
            new Response(JSON.stringify({ reply: '有效回答' }), { status: 200 })
        ]
    });
    client.elements.avatarInput.value = '第一次尝试';
    await client.elements.avatarSendBtn.dispatch('click');
    client.elements.avatarInput.value = '第二次尝试';
    await client.elements.avatarSendBtn.dispatch('click');

    const posts = client.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(client.getPromptCount(), 2);
    assert.equal(JSON.parse(posts[0].options.body).accessCode, 'wrong-code');
    assert.equal(JSON.parse(posts[1].options.body).accessCode, 'teacher-code');
    assert.equal(client.elements.avatarMessages.children.at(-1).textContent, '有效回答');
});

test('取消访问码输入不会发送模型请求', async () => {
    const client = createClient({ prompts: [null] });
    client.elements.avatarInput.value = '不应发送的问题';
    await client.elements.avatarSendBtn.dispatch('click');
    const posts = client.requests.filter(({ options }) => options.method === 'POST');
    assert.equal(posts.length, 0);
    assert.equal(client.elements.avatarMessages.children.at(-1).textContent, 'chat.accessCancelled');
});
