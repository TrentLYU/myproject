/* Trent AI：两个聊天入口共用同一个 DeepSeek 服务端代理，不在浏览器保存任何密钥。 */
(function () {
    'use strict';

    const config = window.TRENT_CHAT_CONFIG || {};
    const endpoint = config.endpoint || '';
    const timeoutMs = Number(config.timeoutMs) || 35000;
    const mainHistory = [];
    const popupHistory = [];
    let serviceOnline = null;
    let accessCode = '';

    function t(key) {
        return window.I18n ? window.I18n.t(key) : key;
    }

    function language() {
        return window.I18n ? window.I18n.getLang() : 'zh';
    }

    class ChatError extends Error {
        constructor(code, status) {
            super(code);
            this.code = code;
            this.status = status || 0;
        }
    }

    function ensureAccessCode() {
        if (accessCode) return accessCode;
        const value = window.prompt(t('chat.accessPrompt'), '');
        if (value === null || !value.trim()) throw new ChatError('ACCESS_CODE_CANCELLED', 0);
        accessCode = value.trim();
        return accessCode;
    }

    async function readJson(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    async function request(messages) {
        if (!endpoint) throw new ChatError('SERVICE_NOT_CONFIGURED', 503);
        ensureAccessCode();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages.slice(-12),
                    language: language(),
                    accessCode
                }),
                signal: controller.signal
            });
            const data = await readJson(response);
            if (!response.ok) {
                if (data?.error === 'INVALID_ACCESS_CODE') accessCode = '';
                throw new ChatError(data?.error || 'UPSTREAM_UNAVAILABLE', response.status);
            }
            if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
                throw new ChatError('UPSTREAM_EMPTY_RESPONSE', 502);
            }
            serviceOnline = true;
            updateServiceStatus();
            return data;
        } catch (error) {
            if (error instanceof ChatError) throw error;
            if (error?.name === 'AbortError') throw new ChatError('LOCAL_TIMEOUT', 504);
            throw new ChatError('NETWORK_ERROR', 0);
        } finally {
            clearTimeout(timer);
        }
    }

    async function health() {
        if (!endpoint) return false;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });
            const data = await readJson(response);
            serviceOnline = Boolean(response.ok && data?.status === 'ok');
        } catch {
            serviceOnline = false;
        } finally {
            clearTimeout(timer);
        }
        updateServiceStatus();
        return serviceOnline;
    }

    function errorText(error) {
        const code = error?.code || '';
        if (code === 'RATE_LIMITED') return t('chat.rateLimited');
        if (code === 'IP_DAILY_LIMIT') return t('chat.ipDailyLimit');
        if (code === 'GLOBAL_DAILY_LIMIT') return t('chat.globalDailyLimit');
        if (code === 'INVALID_ACCESS_CODE') return t('chat.accessInvalid');
        if (code === 'ACCESS_CODE_CANCELLED') return t('chat.accessCancelled');
        if (code === 'QUOTA_UNAVAILABLE') return t('chat.quotaUnavailable');
        if (code === 'SERVICE_NOT_CONFIGURED' || code === 'SERVICE_DISABLED') return t('chat.serviceUnavailable');
        if (code === 'UPSTREAM_TIMEOUT' || code === 'LOCAL_TIMEOUT') return t('chat.timeout');
        if (code === 'ORIGIN_NOT_ALLOWED') return t('chat.originDenied');
        if (code === 'NETWORK_ERROR') return t('chat.netFail');
        if (error?.status) return t('chat.reqFail').replace('%{status}', error.status);
        return t('chat.netFail');
    }

    function markServiceOfflineIfNeeded(error) {
        const visitorErrors = [
            'INVALID_ACCESS_CODE', 'ACCESS_CODE_CANCELLED', 'RATE_LIMITED',
            'IP_DAILY_LIMIT', 'GLOBAL_DAILY_LIMIT'
        ];
        if (visitorErrors.includes(error?.code)) return;
        serviceOnline = false;
        updateServiceStatus();
    }

    function updateServiceStatus() {
        const online = serviceOnline === true;
        const checking = serviceOnline === null;
        const mainText = document.querySelector('.avatar-chat__status-text');
        const mainBadge = document.querySelector('#avatar .avatar-status');
        const popupText = document.querySelector('.trent-modal__status');
        if (mainText) {
            mainText.textContent = checking ? t('chat.checking') : t(online ? 'chat.online' : 'chat.offline');
            mainText.style.color = online ? '#34C759' : '#FF9500';
        }
        if (mainBadge) {
            mainBadge.textContent = checking ? t('chat.checking') : t(online ? 'chat.status' : 'chat.statusOffline');
        }
        if (popupText) {
            popupText.textContent = checking ? t('chat.checking') : t(online ? 'trent.status' : 'chat.offline');
            popupText.style.color = online ? '#30D158' : '#FF9F0A';
        }
    }

    function appendMessage(container, className, text, isUser) {
        const element = document.createElement('div');
        element.className = `${className} ${isUser ? `${className}--user` : `${className}--bot`}`;
        element.textContent = text;
        container.appendChild(element);
        container.scrollTop = container.scrollHeight;
    }

    function wireMainChat() {
        const container = document.getElementById('avatarMessages');
        const input = document.getElementById('avatarInput');
        const sendButton = document.getElementById('avatarSendBtn');
        if (!container || !input || !sendButton) return;

        function addMessage(text, isUser) {
            appendMessage(container, 'avatar-msg', text, isUser);
        }

        function showTyping() {
            if (document.getElementById('typingIndicator')) return;
            const element = document.createElement('div');
            element.className = 'typing-indicator';
            element.id = 'typingIndicator';
            element.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
            container.appendChild(element);
            container.scrollTop = container.scrollHeight;
        }

        function removeTyping() {
            document.getElementById('typingIndicator')?.remove();
        }

        function setSending(sending) {
            sendButton.disabled = sending;
            input.disabled = sending;
            sendButton.textContent = sending ? t('chat.thinking') : t('chat.send');
        }

        async function send() {
            const question = input.value.trim();
            if (!question || sendButton.disabled) return;
            addMessage(question, true);
            input.value = '';
            mainHistory.push({ role: 'user', content: question });
            setSending(true);
            showTyping();
            try {
                const data = await request(mainHistory);
                mainHistory.push({ role: 'assistant', content: data.reply.trim() });
                addMessage(data.reply.trim(), false);
            } catch (error) {
                mainHistory.pop();
                markServiceOfflineIfNeeded(error);
                addMessage(errorText(error), false);
            } finally {
                removeTyping();
                setSending(false);
                input.focus();
            }
        }

        sendButton.addEventListener('click', send);
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.isComposing) send();
        });
        window.addEventListener('trent-langchange', () => setSending(sendButton.disabled));
    }

    function wirePopupChat() {
        const overlay = document.getElementById('trentOverlay');
        const avatar = document.getElementById('floatingAvatar');
        const closeButton = document.getElementById('trentClose');
        const sendButton = document.getElementById('trentSendBtn');
        const input = document.getElementById('trentInput');
        const container = document.getElementById('trentMessages');
        const chips = document.getElementById('trentChips');
        if (!overlay || !avatar || !closeButton || !sendButton || !input || !container) return;

        function open() {
            overlay.classList.add('is-open');
            setTimeout(() => input.focus(), 120);
        }

        function close() {
            overlay.classList.remove('is-open');
        }

        function addMessage(text, isUser) {
            appendMessage(container, 'trent-msg', text, isUser);
        }

        function showTyping() {
            if (document.getElementById('trentTyping')) return;
            const element = document.createElement('div');
            element.className = 'trent-typing';
            element.id = 'trentTyping';
            element.innerHTML = '<span></span><span></span><span></span>';
            container.appendChild(element);
            container.scrollTop = container.scrollHeight;
        }

        function removeTyping() {
            document.getElementById('trentTyping')?.remove();
        }

        function setSending(sending) {
            sendButton.disabled = sending;
            input.disabled = sending;
            sendButton.textContent = sending ? t('chat.thinking') : t('trent.send');
            if (chips) chips.style.pointerEvents = sending ? 'none' : '';
        }

        async function ask(value) {
            const question = String(value || '').trim();
            if (!question || sendButton.disabled) return;
            addMessage(question, true);
            input.value = '';
            popupHistory.push({ role: 'user', content: question });
            setSending(true);
            showTyping();
            try {
                const data = await request(popupHistory);
                popupHistory.push({ role: 'assistant', content: data.reply.trim() });
                addMessage(data.reply.trim(), false);
            } catch (error) {
                popupHistory.pop();
                markServiceOfflineIfNeeded(error);
                addMessage(errorText(error), false);
            } finally {
                removeTyping();
                setSending(false);
                input.focus();
            }
        }

        avatar.addEventListener('click', open);
        avatar.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
        closeButton.addEventListener('click', close);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && overlay.classList.contains('is-open')) close();
        });
        sendButton.addEventListener('click', () => ask(input.value));
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.isComposing) ask(input.value);
        });
        chips?.addEventListener('click', (event) => {
            const chip = event.target?.closest?.('.trent-chip');
            if (chip) ask(chip.textContent);
        });
        window.addEventListener('trent-langchange', () => setSending(sendButton.disabled));
    }

    window.TrentAI = { request, health };
    wireMainChat();
    wirePopupChat();
    updateServiceStatus();
    health();
})();
