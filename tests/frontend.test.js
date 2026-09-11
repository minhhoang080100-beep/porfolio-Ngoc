const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const response = data => ({ ok: true, status: 200, json: async () => data });
const fixture = () => ({
    settings: [{ key: 'contact_phone', value: '090 000 0000' }, { key: 'cv_url', value: 'https://media.example/cv.pdf' }],
    experience_items: [{ id: 1, company: 'Studio', role_vi: 'Diễn viên', role_en: 'Actress', year: '2026' }],
    skill_items: [{ id: 1, title_en: 'Editing', icon_class: 'fas fa-video', desc_vi: 'Dựng phim', desc_en: 'Video editing' }],
    album_items: [{ id: 1, type: 'image', url: 'https://media.example/photo.jpg', file_path: 'photo.jpg' }]
});

function setup(t, options = {}) {
    const html = read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', error => errors.push(error.message));
    const dom = new JSDOM(html, { url: 'https://portfolio.example/', runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
    t.after(() => dom.window.close());
    const w = dom.window;
    const data = options.data || fixture();
    const calls = [];
    const observers = [];
    const mediaListeners = new Set();
    const motion = { matches: Boolean(options.reducedMotion), addEventListener: (_, callback) => mediaListeners.add(callback) };
    w.matchMedia = query => query.includes('prefers-reduced-motion') ? motion : { matches: true, addEventListener() {} };
    let hidden = false;
    Object.defineProperty(w.document, 'hidden', { get: () => hidden });
    w.HTMLMediaElement.prototype.play = function () { this._playing = true; return Promise.resolve(); };
    w.HTMLMediaElement.prototype.pause = function () { this._playing = false; };
    w.HTMLMediaElement.prototype.load = function () {};
    w.IntersectionObserver = class {
        constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this); }
        observe(target) { this.targets.add(target); }
        unobserve(target) { this.targets.delete(target); }
        disconnect() { this.targets.clear(); }
    };
    if (options.storageDisabled) Object.defineProperty(w, 'localStorage', { get() { throw new Error('Storage disabled'); } });
    if (options.adminMode) w.sessionStorage.setItem('adminMode', 'true');
    if (options.timeoutMs) {
        const nativeTimeout = w.setTimeout.bind(w);
        w.setTimeout = (callback, delay, ...args) => nativeTimeout(callback, delay === 12000 ? options.timeoutMs : delay, ...args);
    }
    w.fetch = (url, request) => {
        const table = /\/rest\/v1\/([^?]+)/.exec(url)?.[1];
        assert.ok(table, 'Only mocked portfolio reads are allowed');
        calls.push({ table, signal: request.signal });
        return options.fetch ? options.fetch(table, request, calls) : Promise.resolve(response(data[table]));
    };
    w.eval(read('portfolio-core.js'));
    const ready = new Promise(resolve => w.addEventListener('dynamicDataLoaded', resolve, { once: true }));
    w.eval(read('main.js'));
    return { w, doc: w.document, data, ready, errors, calls, observers,
        setHidden(value) { hidden = value; w.document.dispatchEvent(new w.Event('visibilitychange')); },
        setReducedMotion(value) { motion.matches = value; mediaListeners.forEach(callback => callback()); }
    };
}

test('API content remains literal text, quoted translations survive, executable URLs are rejected', async t => {
    const data = fixture();
    data.experience_items[0].company = '<img id="injected" src=x onerror="alert(1)">';
    data.experience_items[0].role_en = 'Lead "actress" & creator';
    data.skill_items[0].desc_en = 'Edit "videos" <professionally>';
    data.skill_items[0].icon_class = 'x" onmouseover="alert(1)';
    data.album_items.push(
        { id: 2, type: 'text_link', experience_id: 1, url: 'javascript:alert(1)', file_path: '{}' },
        { id: 3, type: 'text_link', experience_id: 1, url: 'https://project.example/', file_path: JSON.stringify({ title: '<svg onload=alert(1)>', preview_image: 'javascript:alert(1)' }) },
        { id: 4, type: 'image', url: 'data:text/html,<script>alert(1)</script>' }
    );
    const { doc, ready, errors } = setup(t, { data });
    await ready;
    assert.equal(doc.getElementById('injected'), null);
    assert.equal(doc.querySelector('.bento-card h3').textContent, data.experience_items[0].company);
    assert.equal(doc.querySelector('.role').textContent, data.experience_items[0].role_en);
    assert.equal(doc.querySelector('.skill-card p').textContent, data.skill_items[0].desc_en);
    assert.equal(doc.querySelector('.skill-icon').getAttribute('onmouseover'), null);
    assert.equal(doc.querySelectorAll('.bento-project-link').length, 1);
    assert.equal(doc.querySelector('.bento-project-link').textContent, '<svg onload=alert(1)>');
    assert.equal(doc.querySelector('.bento-card svg'), null);
    assert.equal(doc.querySelectorAll('.album-open')[1].disabled, true);
    assert.equal(doc.querySelector('[src^="data:"], [href^="javascript:"]'), null);
    assert.deepEqual(errors, []);
});

test('one failed section leaves other data usable and its retry only refetches that section', async t => {
    const data = fixture();
    let failing = true;
    const app = setup(t, { data, fetch: async table => table === 'skill_items' && failing ? { ok: false, status: 503 } : response(data[table]) });
    await app.ready;
    assert.ok(app.doc.getElementById('phoneItem'));
    assert.equal(app.doc.querySelectorAll('.bento-card').length, 1);
    assert.equal(app.doc.querySelectorAll('.album-open').length, 1);
    assert.ok(app.doc.querySelector('#status-skill_items button'));
    assert.equal(app.doc.getElementById('errorOverlay'), null);
    const before = app.calls.length;
    failing = false;
    const retried = new Promise(resolve => app.w.addEventListener('dynamicDataLoaded', resolve, { once: true }));
    app.doc.querySelector('#status-skill_items button').click();
    await retried;
    assert.deepEqual(app.calls.slice(before).map(call => call.table), ['skill_items']);
    assert.equal(app.doc.querySelectorAll('.skill-card').length, 1);
    assert.equal(app.doc.getElementById('status-skill_items').hidden, true);
});

test('empty album refresh clears stale media, disconnects observation, and fires albumLoaded', async t => {
    const data = fixture();
    data.album_items = [{ id: 1, type: 'video', url: 'https://media.example/clip.mp4' }];
    const app = setup(t, { data });
    await app.ready;
    const oldObserver = app.observers[0];
    assert.equal(oldObserver.targets.size, 1);
    let events = 0;
    app.w.addEventListener('albumLoaded', () => events++);
    data.album_items = [];
    await app.w.fetchDynamicData(['album_items']);
    assert.equal(app.doc.querySelectorAll('#albumGrid .masonry-item').length, 0);
    assert.equal(oldObserver.targets.size, 0);
    assert.equal(events, 1);
    assert.equal(app.doc.getElementById('status-album_items').hidden, false);
});

test('a replaced request is aborted and its late response cannot overwrite newer content', async t => {
    const app = setup(t);
    await app.ready;
    let resolveOld;
    let calls = 0;
    let oldSignal;
    app.w.fetch = (_, request) => {
        calls++;
        if (calls === 1) {
            oldSignal = request.signal;
            return new Promise(resolve => { resolveOld = resolve; });
        }
        return Promise.resolve(response([{ id: 2, company: 'Newest', role_en: 'Creator' }]));
    };
    const oldRequest = app.w.fetchDynamicData(['experience_items']);
    const newRequest = app.w.fetchDynamicData(['experience_items']);
    await Promise.all([oldRequest, newRequest]);
    assert.equal(oldSignal.aborted, true);
    resolveOld(response([{ id: 1, company: 'Outdated' }]));
    await tick();
    assert.equal(app.doc.querySelector('.bento-card h3').textContent, 'Newest');
});

test('a hanging API request reaches a retryable timeout while other sections render', async t => {
    const data = fixture();
    const app = setup(t, { data, timeoutMs: 20, fetch: table => table === 'skill_items' ? new Promise(() => {}) : Promise.resolve(response(data[table])) });
    await app.ready;
    assert.ok(app.doc.getElementById('phoneItem'));
    assert.ok(app.doc.querySelector('#status-skill_items button'));
    assert.equal(app.calls.find(call => call.table === 'skill_items').signal.aborted, true);
    assert.equal(app.doc.getElementById('skillsGrid').getAttribute('aria-busy'), 'false');
});

test('native album controls open a focus-trapped dialog, navigation works, Escape restores focus', async t => {
    const data = fixture();
    data.album_items.push({ id: 2, type: 'image', url: 'https://media.example/second.jpg' });
    const app = setup(t, { data });
    await app.ready;
    const trigger = app.doc.querySelector('.album-open');
    assert.equal(trigger.tagName, 'BUTTON');
    assert.equal(trigger.tabIndex, 0);
    trigger.focus();
    trigger.click();
    assert.equal(app.doc.getElementById('mediaModal').getAttribute('aria-hidden'), 'false');
    assert.equal(app.doc.activeElement, app.doc.querySelector('#mediaModal .modal-close'));
    assert.equal(app.doc.getElementById('modalDownload').hidden, true);
    assert.equal(app.doc.getElementById('modalControls').hidden, false);
    assert.equal(app.doc.getElementById('modalCounter').textContent, '01 / 02');
    app.doc.dispatchEvent(new app.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal(app.doc.getElementById('modalImg').src, 'https://media.example/second.jpg');
    assert.equal(app.doc.getElementById('modalCounter').textContent, '02 / 02');
    app.doc.getElementById('modalPrev').click();
    assert.equal(app.doc.getElementById('modalImg').src, 'https://media.example/photo.jpg');
    assert.equal(app.doc.getElementById('modalCounter').textContent, '01 / 02');
    app.doc.dispatchEvent(new app.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(app.doc.getElementById('mediaModal').hidden, true);
    assert.equal(app.doc.activeElement, trigger);
    assert.equal(app.doc.getElementById('modalImg').hasAttribute('src'), false);
});

test('CV keeps its real URL and exposes a separate original link with gallery navigation hidden', async t => {
    const app = setup(t);
    await app.ready;
    const cv = app.doc.querySelector('.btn-cv');
    assert.equal(cv.href, 'https://media.example/cv.pdf');
    cv.click();
    assert.equal(app.doc.getElementById('modalPdf').src, cv.href);
    assert.equal(app.doc.getElementById('modalDownload').href, cv.href);
    assert.equal(app.doc.getElementById('modalDownload').hidden, false);
    assert.equal(app.doc.getElementById('modalPrev').hidden, true);
    assert.equal(app.doc.getElementById('modalControls').hidden, true);
});

test('a single album item has no navigation and a failed image exposes its original URL', async t => {
    const app = setup(t);
    await app.ready;
    app.doc.querySelector('.album-open').click();
    assert.equal(app.doc.getElementById('modalPrev').hidden, true);
    assert.equal(app.doc.getElementById('modalNext').hidden, true);
    assert.equal(app.doc.getElementById('modalCounter').textContent, '01 / 01');
    assert.equal(app.doc.getElementById('modalDownload').hidden, true);
    app.doc.getElementById('modalImg').dispatchEvent(new app.w.Event('error'));
    assert.equal(app.doc.getElementById('modalStatus').hidden, false);
    assert.equal(app.doc.getElementById('modalDownload').hidden, false);
    assert.equal(app.doc.getElementById('modalDownload').href, 'https://media.example/photo.jpg');
});

test('video errors expose an original link and navigating clears the failed state', async t => {
    const data = fixture();
    data.album_items.unshift({ id: 2, type: 'video', url: 'https://media.example/clip.mp4' });
    const app = setup(t, { data });
    await app.ready;
    app.doc.querySelector('.album-open').click();
    assert.equal(app.doc.getElementById('modalDownload').hidden, true);
    app.doc.getElementById('modalVideo').dispatchEvent(new app.w.Event('error'));
    assert.equal(app.doc.getElementById('modalStatus').hidden, false);
    assert.equal(app.doc.getElementById('modalDownload').hidden, false);
    assert.equal(app.doc.getElementById('modalDownload').href, 'https://media.example/clip.mp4');
    app.doc.getElementById('modalNext').click();
    assert.equal(app.doc.getElementById('modalStatus').hidden, true);
    assert.equal(app.doc.getElementById('modalDownload').hidden, true);
    assert.equal(app.doc.getElementById('modalCounter').textContent, '02 / 02');
    assert.equal(app.doc.getElementById('modalImg').src, 'https://media.example/photo.jpg');
});

test('video previews load on intersection and pause for dialogs, hidden tabs, and reduced motion', async t => {
    const data = fixture();
    data.album_items.unshift({ id: 2, type: 'video', url: 'https://media.example/clip.mp4' });
    const app = setup(t, { data });
    await app.ready;
    const video = app.doc.querySelector('#albumGrid video');
    assert.equal(video.hasAttribute('src'), false);
    app.observers[0].callback([{ target: video, isIntersecting: true }]);
    assert.equal(video.src, 'https://media.example/clip.mp4');
    assert.equal(video._playing, true);
    app.doc.querySelectorAll('.album-open')[1].click();
    assert.equal(video._playing, false);
    app.doc.querySelector('#mediaModal .modal-close').click();
    assert.equal(video._playing, true);
    app.setHidden(true);
    assert.equal(video._playing, false);
    app.setHidden(false);
    assert.equal(video._playing, true);
    app.setReducedMotion(true);
    assert.equal(video._playing, false);
    video.dispatchEvent(new app.w.Event('error'));
    assert.ok(app.doc.querySelector('.media-error'));
    assert.equal(app.observers[0].targets.has(video), false);
});

test('language and theme remain usable when preference storage is disabled', async t => {
    const app = setup(t, { storageDisabled: true });
    await app.ready;
    assert.equal(app.doc.documentElement.lang, 'en');
    app.doc.getElementById('lang-switch').click();
    assert.equal(app.doc.documentElement.lang, 'vi');
    assert.equal(app.doc.querySelector('[data-i18n="nav_about"]').textContent, 'Giới thiệu');
    await app.w.fetchDynamicData(['skill_items']);
    assert.equal(app.doc.documentElement.lang, 'vi');
    assert.equal(app.doc.querySelector('.skill-card p').textContent, 'Dựng phim');
    app.doc.getElementById('theme-switch').click();
    assert.equal(app.doc.body.dataset.theme, 'dark');
    assert.deepEqual(app.errors, []);
});

test('mobile navigation has a keyboard close path and restores the menu trigger', async t => {
    const app = setup(t);
    await app.ready;
    const trigger = app.doc.querySelector('.hamburger');
    const menu = app.doc.querySelector('.mobile-menu');
    trigger.focus();
    trigger.click();
    assert.equal(menu.hidden, false);
    assert.equal(menu.inert, false);
    assert.equal(trigger.getAttribute('aria-expanded'), 'true');
    app.doc.dispatchEvent(new app.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(menu.hidden, true);
    assert.equal(trigger.getAttribute('aria-expanded'), 'false');
    assert.equal(app.doc.activeElement, trigger);
});

test('vendor failure in authorized editing mode shows a visible retry without changing auth', async t => {
    const app = setup(t, { adminMode: true });
    await app.ready;
    const script = app.doc.querySelector('script[src="vendor/Sortable.min.js"]');
    assert.ok(script);
    script.dispatchEvent(new app.w.Event('error'));
    await tick();
    assert.ok(app.doc.querySelector('#adminToolsStatus button'));
    assert.equal(app.w.sessionStorage.getItem('adminMode'), 'true');
});
