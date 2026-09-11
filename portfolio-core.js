// Shared configuration and small browser utilities; authentication stays in admin.html.
(function () {
    'use strict';

    const config = Object.freeze({
        supabaseUrl: 'https://ppzosahycxznuxeerfts.supabase.co',
        supabaseKey: 'sb_publishable_ff32PbO6HnaGMkqmEXP_WA_pPc4TMNn',
        mediaBucket: 'media'
    });

    function safeUrl(value, { allowRelative = false } = {}) {
        if (typeof value !== 'string') return '';
        const input = value.trim();
        if (!input || /[\u0000-\u001f\u007f]/.test(input)) return '';
        try {
            const url = allowRelative ? new URL(input, document.baseURI) : new URL(input);
            if (!['https:', 'http:'].includes(url.protocol)) return '';
            return url.href;
        } catch (_) {
            return '';
        }
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    }

    function getPreference(key, fallback = '') {
        try { return localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
    }

    function setPreference(key, value) {
        try { localStorage.setItem(key, value); } catch (_) { /* Preferences are optional. */ }
    }

    function getLanguage() {
        return getPreference('portfolioLang', 'en') === 'vi' ? 'vi' : 'en';
    }

    const dialogs = [];
    let previousOverflow = '';
    const inertState = new Map();

    function syncBackground() {
        // Recompute from original states so nested dialogs restore the outer dialog correctly.
        for (const [element, inert] of inertState) element.inert = inert;
        const top = dialogs.at(-1);
        if (!top) {
            inertState.clear();
            document.body.style.overflow = previousOverflow;
            return;
        }
        for (const element of document.body.children) {
            if (element === top.element || element.contains(top.element) || ['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName) || ['status', 'alert'].includes(element.getAttribute('role'))) continue;
            if (!inertState.has(element)) inertState.set(element, Boolean(element.inert));
            element.inert = true;
        }
        top.element.inert = false;
    }

    function focusableElements(element) {
        return [...element.querySelectorAll('a[href], button, input, select, textarea, iframe, video[controls], audio[controls], [tabindex]')]
            .filter(node => {
                if (node.disabled || node.tabIndex < 0 || node.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
                for (let current = node; current && current !== element.parentElement; current = current.parentElement) {
                    const style = getComputedStyle(current);
                    if (style.display === 'none' || style.visibility === 'hidden') return false;
                }
                return true;
            });
    }

    function createDialog(element, { onClose, canClose = () => true, display = 'flex' } = {}) {
        if (!element) throw new Error('Dialog element is required.');
        let trigger = null;
        let opened = false;
        if (!element.hasAttribute('role')) element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        element.setAttribute('aria-hidden', 'true');
        if (!element.hasAttribute('tabindex')) element.tabIndex = -1;

        const controller = {
            element,
            isOpen: () => opened,
            open(source = document.activeElement) {
                if (opened) return;
                trigger = source;
                opened = true;
                if (dialogs.length === 0) previousOverflow = document.body.style.overflow;
                element.hidden = false;
                element.style.display = display;
                element.setAttribute('aria-hidden', 'false');
                dialogs.push(controller);
                syncBackground();
                document.body.style.overflow = 'hidden';
                (focusableElements(element)[0] || element).focus({ preventScroll: true });
            },
            close() {
                if (!opened || dialogs.at(-1) !== controller || !canClose()) return false;
                dialogs.pop();
                opened = false;
                element.style.display = 'none';
                element.hidden = true;
                element.setAttribute('aria-hidden', 'true');
                syncBackground();
                if (typeof onClose === 'function') onClose();
                const remaining = dialogs.at(-1);
                const target = trigger?.isConnected && !trigger.closest('[hidden], [inert]') ? trigger : remaining?.element;
                if (target?.focus) target.focus({ preventScroll: true });
                return true;
            }
        };
        return controller;
    }

    document.addEventListener('keydown', event => {
        const top = dialogs.at(-1);
        if (!top) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            top.close();
        } else if (event.key === 'Tab') {
            const items = focusableElements(top.element);
            const first = items[0];
            const last = items.at(-1);
            if (!first) {
                event.preventDefault();
                top.element.focus();
            } else if (!top.element.contains(document.activeElement) || document.activeElement === top.element) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    document.addEventListener('focusin', event => {
        const top = dialogs.at(-1);
        if (top && !top.element.contains(event.target)) {
            (focusableElements(top.element)[0] || top.element).focus({ preventScroll: true });
        }
    });

    new MutationObserver(() => { if (dialogs.length) syncBackground(); })
        .observe(document.body, { childList: true });

    window.Portfolio = Object.freeze({ config, safeUrl, escapeHtml, getLanguage, getPreference, setPreference, createDialog });
})();
