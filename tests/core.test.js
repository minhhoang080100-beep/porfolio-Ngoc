const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function setup(t) {
    const dom = new JSDOM('<body><button id="trigger">Open</button><main id="page">Content</main><div id="first" hidden><button id="a">First</button><button id="b">Last</button></div><div id="second" hidden><button id="c">Confirm</button></div></body>', {
        url: 'https://portfolio.example/', runScripts: 'outside-only', pretendToBeVisual: true
    });
    dom.window.eval(fs.readFileSync(path.join(__dirname, '../portfolio-core.js'), 'utf8'));
    t.after(() => dom.window.close());
    return { w: dom.window, doc: dom.window.document, api: dom.window.Portfolio };
}

test('URL validation blocks executable protocols and accepts supported media links', t => {
    const { api } = setup(t);
    for (const value of ['javascript:alert(1)', 'data:text/html,test', 'vbscript:test', 'java\nscript:alert(1)', '', null, 'not a URL']) {
        assert.equal(api.safeUrl(value), '', String(value));
    }
    assert.equal(api.safeUrl('https://example.com/a?q="name"'), 'https://example.com/a?q=%22name%22');
    assert.equal(api.safeUrl('/cv.pdf'), '');
    assert.equal(api.safeUrl('/cv.pdf', { allowRelative: true }), 'https://portfolio.example/cv.pdf');
    assert.equal(api.safeUrl('javascript:alert(1)', { allowRelative: true }), '');
});

test('escaped form text preserves quotes and never creates markup', t => {
    const { api, doc } = setup(t);
    const value = '\"><img src=x onerror=alert(1)> & \'name\'';
    const fixture = doc.createElement('div');
    fixture.innerHTML = `<input value="${api.escapeHtml(value)}">`;
    assert.equal(fixture.querySelector('input').value, value);
    assert.equal(fixture.querySelector('img'), null);
});

test('dialog traps keyboard focus and Escape restores the trigger and page state', t => {
    const { api, doc, w } = setup(t);
    const trigger = doc.getElementById('trigger');
    const dialog = api.createDialog(doc.getElementById('first'));
    doc.body.style.overflow = 'auto';
    trigger.focus();
    dialog.open();
    assert.equal(doc.activeElement.id, 'a');
    assert.equal(doc.getElementById('page').inert, true);
    doc.getElementById('b').focus();
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    assert.equal(doc.activeElement.id, 'a');
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    assert.equal(doc.activeElement.id, 'b');
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(dialog.isOpen(), false);
    assert.equal(doc.activeElement, trigger);
    assert.equal(doc.body.style.overflow, 'auto');
    assert.equal(doc.getElementById('page').inert, false);
});

test('nested confirmation restores the outer dialog and only closes the top dialog', t => {
    const { api, doc, w } = setup(t);
    const first = api.createDialog(doc.getElementById('first'));
    const second = api.createDialog(doc.getElementById('second'));
    first.open(doc.getElementById('trigger'));
    second.open(doc.getElementById('a'));
    assert.equal(first.close(), false);
    assert.equal(doc.getElementById('first').inert, true);
    assert.equal(doc.getElementById('second').inert, false);
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(first.isOpen(), true);
    assert.equal(second.isOpen(), false);
    assert.equal(doc.activeElement.id, 'a');
    assert.equal(doc.getElementById('first').inert, false);
    assert.equal(doc.body.style.overflow, 'hidden');
    first.close();
    assert.equal(doc.activeElement.id, 'trigger');
});

test('saving guard keeps dialog and focus available until the request ends', t => {
    const { api, doc, w } = setup(t);
    let saving = true;
    let closed = 0;
    const dialog = api.createDialog(doc.getElementById('first'), { canClose: () => !saving, onClose: () => closed++ });
    dialog.open();
    doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(dialog.isOpen(), true);
    assert.equal(closed, 0);
    saving = false;
    assert.equal(dialog.close(), true);
    assert.equal(closed, 1);
});

test('status announcements stay available while modal background is inert', t => {
    const { api, doc } = setup(t);
    const status = doc.createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    doc.body.append(status);
    const dialog = api.createDialog(doc.getElementById('first'));
    dialog.open();
    assert.notEqual(status.inert, true);
    assert.equal(doc.getElementById('page').inert, true);
    dialog.close();
});

test('unavailable preference storage falls back without breaking the page', t => {
    const { api, w } = setup(t);
    Object.defineProperty(w, 'localStorage', { get() { throw new Error('Storage disabled'); } });
    assert.equal(api.getLanguage(), 'en');
    assert.doesNotThrow(() => api.setPreference('portfolioTheme', 'dark'));
});
