/* ============================================================
 *  i18n.js —— 全站三语引擎（简体中文 / 繁體中文 / English）
 *  ------------------------------------------------------------
 *  · 字典在 i18n-dict.js（window.I18N_DICT = { zh, en, tw }）
 *  · HTML 上打标记即可翻译：
 *      data-i18n="key"          替换文本
 *      data-i18n-html="key"     替换 innerHTML（仅用于自己维护的字典文案）
 *      data-i18n-ph="key"       替换 placeholder
 *      data-i18n-title="key"    替换 title 属性
 *  · 语言选择保存在 localStorage['trent-lang']；首次访问弹出选择框
 *  · 切换语言时派发 window 事件 'trent-langchange'，
 *    动态模块（Trent 弹窗、旅行地球等）监听它自行刷新
 * ============================================================ */
(function () {
    'use strict';

    var STORAGE_KEY = 'trent-lang';
    var HTML_LANG = { zh: 'zh-CN', tw: 'zh-TW', en: 'en' };     // <html lang>
    var NATIVE_NAME = { zh: '简体中文', tw: '繁體中文', en: 'English' };

    var DICT = window.I18N_DICT || { zh: {}, en: {}, tw: {} };
    var current = localStorage.getItem(STORAGE_KEY);
    if (!HTML_LANG[current]) current = 'zh';

    function t(key) {
        var d = DICT[current] || {}, zh = DICT.zh || {};
        if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
        if (Object.prototype.hasOwnProperty.call(zh, key)) return zh[key];
        return key; // 兜底：键名本身（开发期可及时发现漏翻）
    }

    // Trent 知识库按当前语言选择（zh 为源文件，en/tw 为翻译文件）
    function getTrentKB() {
        if (current === 'en' && window.TRENT_KNOWLEDGE_EN) return window.TRENT_KNOWLEDGE_EN;
        if (current === 'tw' && window.TRENT_KNOWLEDGE_TW) return window.TRENT_KNOWLEDGE_TW;
        return window.TRENT_KNOWLEDGE || {};
    }

    // 重建"chips"容器内的建议按钮：按 ${prefix}1、${prefix}2…依次取词，键不存在即停。
    // 容器上可加 data-i18n-chips-class 指定按钮样式类。
    function rebuildChips(container) {
        var prefix = container.getAttribute('data-i18n-chips');
        var btnClass = container.getAttribute('data-i18n-chips-class') || '';
        var parts = [];
        for (var n = 1; n <= 12; n++) {
            var val = t(prefix + n);
            if (val === prefix + n) break; // 键不存在，停止
            parts.push(val);
        }
        container.innerHTML = '';
        for (var p = 0; p < parts.length; p++) {
            var b = document.createElement('button');
            if (btnClass) b.className = btnClass;
            b.textContent = parts[p];
            container.appendChild(b);
        }
    }

    function applyDOM() {
        document.documentElement.setAttribute('lang', HTML_LANG[current] || 'zh-CN');
        document.title = t('siteTitle');

        var i, els;
        els = document.querySelectorAll('[data-i18n]');
        for (i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-i18n'));
        els = document.querySelectorAll('[data-i18n-html]');
        for (i = 0; i < els.length; i++) els[i].innerHTML = t(els[i].getAttribute('data-i18n-html'));
        els = document.querySelectorAll('[data-i18n-ph]');
        for (i = 0; i < els.length; i++) els[i].setAttribute('placeholder', t(els[i].getAttribute('data-i18n-ph')));
        els = document.querySelectorAll('[data-i18n-title]');
        for (i = 0; i < els.length; i++) els[i].setAttribute('title', t(els[i].getAttribute('data-i18n-title')));
        els = document.querySelectorAll('[data-i18n-aria]');
        for (i = 0; i < els.length; i++) els[i].setAttribute('aria-label', t(els[i].getAttribute('data-i18n-aria')));
        els = document.querySelectorAll('[data-i18n-alt]');
        for (i = 0; i < els.length; i++) els[i].setAttribute('alt', t(els[i].getAttribute('data-i18n-alt')));
        els = document.querySelectorAll('[data-i18n-chips]');
        for (i = 0; i < els.length; i++) rebuildChips(els[i]);

        refreshSwitchBtn();
    }

    function setLang(code, persist) {
        if (!HTML_LANG[code]) code = 'zh';
        var changed = code !== current;
        current = code;
        if (persist !== false) { try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {} }
        applyDOM();
        if (changed) {
            window.dispatchEvent(new CustomEvent('trent-langchange', { detail: code }));
        }
    }

    // ---------- 右上角语言切换器 ----------
    function refreshSwitchBtn() {
        var btn = document.getElementById('langSwitchBtn');
        if (!btn) return;
        var label = btn.querySelector('.lang-switch__label');
        if (label) label.textContent = NATIVE_NAME[current];
        btn.setAttribute('aria-label', t('lang.switch') + '：' + NATIVE_NAME[current]);
        var menu = document.getElementById('langSwitchMenu');
        if (menu) {
            var items = menu.querySelectorAll('[data-lang]');
            for (var i = 0; i < items.length; i++) {
                items[i].classList.toggle('is-active', items[i].getAttribute('data-lang') === current);
            }
        }
    }

    function closeMenu() {
        var box = document.getElementById('langSwitch');
        if (box) box.classList.remove('is-open');
    }

    function wireSwitcher() {
        var box = document.getElementById('langSwitch');
        var btn = document.getElementById('langSwitchBtn');
        var menu = document.getElementById('langSwitchMenu');
        if (!box || !btn || !menu) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            box.classList.toggle('is-open');
        });
        menu.addEventListener('click', function (e) {
            var item = e.target && e.target.closest ? e.target.closest('[data-lang]') : null;
            if (!item) return;
            e.stopPropagation();
            setLang(item.getAttribute('data-lang'));
            closeMenu();
        });
        document.addEventListener('click', function (e) {
            if (!box.contains(e.target)) closeMenu();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ---------- 首次访问：语言选择弹窗 ----------
    function wireLangModal() {
        var modal = document.getElementById('langModal');
        if (!modal) return;
        var saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
        if (saved && HTML_LANG[saved]) { modal.hidden = true; return; } // 已选择过，不再打扰
        modal.hidden = false;
        var btns = modal.querySelectorAll('[data-lang]');
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', function () {
                setLang(this.getAttribute('data-lang'));
                modal.hidden = true;
            });
        }
    }

    // ---------- 启动 ----------
    applyDOM();          // 先按当前语言渲染一遍（即使 zh 也保证一致）
    wireSwitcher();
    wireLangModal();

    window.I18n = {
        t: t,
        getLang: function () { return current; },
        setLang: setLang,
        getTrentKB: getTrentKB,
        nativeName: function (code) { return NATIVE_NAME[code] || code; }
    };
})();
