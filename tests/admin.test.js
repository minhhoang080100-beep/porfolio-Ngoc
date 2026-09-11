const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };
const rejection = message => ({ data: null, error: { code: '42501', message }, status: 403 });

function setup(t, options = {}) {
    const html = '<!doctype html><body><div class="hero-content"></div><div class="hero-image"><img src="old.jpg"></div><div class="contact-container"></div><section id="experience"><h2 class="section-title">Experience</h2><div id="experienceGrid"><div class="bento-card" data-id="1"><h3>Company</h3><p class="role" data-vi="Diễn viên" data-en="Actor">Diễn viên</p><span class="year">2025</span></div></div></section><section id="skills"><h2 class="section-title">Skills</h2><div id="skillsGrid"><div class="skill-card" data-id="1"><i class="fas fa-camera skill-icon"></i><h3>Video</h3><p data-vi="Mô tả" data-en="Description">Mô tả</p></div></div></section><section id="album"><h2 class="section-title">Album</h2><div id="albumGrid"><div class="masonry-item" data-id="20" data-file-path="old.jpg"><button class="album-open">Open</button></div><div class="masonry-item" data-id="21" data-file-path="other.jpg"><button class="album-open">Open</button></div></div></section></body>';
    const dom = new JSDOM(html, { url: 'https://portfolio.example/', runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window, doc = w.document, calls = [], storage = [], inputs = [], sortableOptions = new Map();
    let serial = 100, refreshed = 0;
    const db = {
        settings: [{ key: 'cv_url', value: 'https://example.com/cv.pdf' }, { key: 'intro_vi', value: 'Giới thiệu thật' }, { key: 'hero_subtitle', value: 'Creator "Tên"' }],
        experience_items: [{ id: 1, company: 'Company', role_vi: 'Diễn viên', role_en: 'Actor', year: '2025', sort_order: 0 }],
        skill_items: [{ id: 1, title_en: 'Video', icon_class: 'fas fa-camera', sort_order: 0 }],
        album_items: [{ id: 10, type: 'text_link', experience_id: 1, url: 'https://example.com/a', file_path: JSON.stringify({ title: 'A' }), sort_order: 0 }, { id: 11, type: 'text_link', experience_id: 1, url: 'https://example.com/b', file_path: JSON.stringify({ title: 'B' }), sort_order: 1 }, { id: 20, type: 'image', experience_id: null, url: 'https://example.com/old.jpg', file_path: 'old.jpg', sort_order: 2 }, { id: 21, type: 'image', experience_id: null, url: 'https://example.com/other.jpg', file_path: 'other.jpg', sort_order: 3 }]
    };
    const client = {
        from(table) {
            const call = { table, action: 'select', filters: {}, payload: null }; let single = false, limit = null, ordered = null, descending = false, pending;
            const q = {
                select() { return q; }, eq(key, value) { call.filters[key] = value; return q; },
                order(key, options) { ordered = key; descending = options?.ascending === false; return q; }, limit(n) { limit = n; return q; }, single() { single = true; return q; },
                update(payload) { call.action = 'update'; call.payload = payload; return q; }, insert(payload) { call.action = 'insert'; call.payload = payload; return q; },
                upsert(payload) { call.action = 'upsert'; call.payload = payload; return q; }, delete() { call.action = 'delete'; return q; },
                then(resolve, reject) {
                    pending ||= (async () => {
                        calls.push(clone(call));
                        const intercepted = await options.intercept?.(call, db); if (intercepted !== undefined) return intercepted;
                        let rows = db[table].filter(row => Object.entries(call.filters).every(([key, value]) => String(row[key]) === String(value)));
                        if (call.action === 'insert') { rows = (Array.isArray(call.payload) ? call.payload : [call.payload]).map(value => ({ ...clone(value), id: ++serial })); db[table].push(...rows); }
                        else if (call.action === 'update') rows.forEach(row => Object.assign(row, clone(call.payload)));
                        else if (call.action === 'delete') db[table] = db[table].filter(row => !rows.includes(row));
                        else if (call.action === 'upsert') {
                            rows = (Array.isArray(call.payload) ? call.payload : [call.payload]).map(value => { let row = db[table].find(item => item.key === value.key); if (row) Object.assign(row, clone(value)); else { row = clone(value); db[table].push(row); } return row; });
                        }
                        if (ordered) rows = [...rows].sort((a, b) => ((a[ordered] || 0) - (b[ordered] || 0)) * (descending ? -1 : 1));
                        if (limit !== null) rows = rows.slice(0, limit);
                        return { data: clone(single ? rows[0] : rows), error: null, status: 200 };
                    })();
                    return pending.then(resolve, reject);
                }
            }; return q;
        },
        storage: { from(bucket) { return {
            async upload(filePath, file) { const call = { action: 'upload', bucket, path: filePath, name: file.name }; storage.push(call); return await options.storage?.(call) || { data: { path: filePath }, error: null }; },
            getPublicUrl(filePath) { return { data: { publicUrl: 'https://ppzosahycxznuxeerfts.supabase.co/storage/v1/object/public/' + bucket + '/' + filePath } }; },
            async remove(paths) { const call = { action: 'remove', bucket, paths: [...paths] }; storage.push(call); return await options.storage?.(call) || { data: [], error: null }; }
        }; } }
    };
    const createElement = doc.createElement.bind(doc);
    doc.createElement = (tag, ...args) => { const element = createElement(tag, ...args); if (tag === 'input') inputs.push(element); return element; };
    w.fetch = () => { throw new Error('Tests must not access network'); };
    w.supabase = { createClient: () => client };
    w.Sortable = { create: (grid, config) => { sortableOptions.set(grid.id, config); return { option() {} }; } };
    w.translations = { vi: { hero_subtitle: 'Default', hero_intro: 'Default VI' }, en: { hero_intro: 'Default EN' } };
    w.fetchDynamicData = async () => { refreshed++; };
    w.confirm = () => true;
    w.eval(source('portfolio-core.js')); w.eval(source('admin-mode.js'));
    t.after(async () => { doc.getElementById('adminModalClose')?.click(); await settle(); w.close(); });
    return { w, doc, db, calls, storage, inputs, sortableOptions, refreshed: () => refreshed, get: id => doc.getElementById(id), click: selector => doc.querySelector(selector).click(), toast: () => doc.querySelector('.admin-toast').textContent };
}

test('editing A then B preserves both stable IDs and the draft of A', async t => {
    const f = setup(t); f.click('#experienceGrid .admin-item-edit'); await settle();
    f.click('[data-key="id_10"] .admin-item-edit'); f.get('expLinkTitle').value = 'A changed';
    f.click('[data-key="id_10"] .admin-item-edit'); assert.equal(f.get('expLinkTitle').value, 'A changed');
    f.click('[data-key="id_11"] .admin-item-edit'); await settle(); f.get('adminModalSave').click(); await settle();
    assert.equal(JSON.parse(f.db.album_items.find(row => row.id === 10).file_path).title, 'A changed');
    assert.equal(JSON.parse(f.db.album_items.find(row => row.id === 11).file_path).title, 'B');
    assert.equal(f.calls.filter(call => call.table === 'album_items' && ['insert', 'delete'].includes(call.action)).length, 0);
});

test('retry after a partial create updates successful IDs and does not duplicate experience or links', async t => {
    let rejected = false;
    const f = setup(t, { intercept: call => { if (call.table === 'album_items' && call.action === 'insert' && JSON.parse(call.payload.file_path).title === 'Second' && !rejected) { rejected = true; return rejection('Link rejected'); } } });
    f.click('#experience .admin-add-btn'); f.get('expCompany').value = 'New'; f.get('expRoleVi').value = 'Role';
    for (const title of ['First', 'Second']) { f.get('expLinkTitle').value = title; f.get('expLinkUrl').value = 'https://example.com/' + title; f.get('btnAddExpLink').click(); await settle(); }
    f.get('adminModalSave').click(); await settle();
    assert.equal(f.refreshed(), 0); assert.match(f.toast(), /Link rejected/); assert.equal(f.get('adminModalSave').disabled, false);
    f.get('adminModalSave').click(); await settle();
    assert.equal(f.db.experience_items.filter(row => row.company === 'New').length, 1);
    const created = f.db.album_items.filter(row => row.experience_id > 1); assert.equal(created.length, 2);
    assert.equal(f.calls.filter(call => call.table === 'experience_items' && call.action === 'insert').length, 1);
});

test('skill rejection restores the shared Save button and permits retry', async t => {
    let fail = true;
    const f = setup(t, { intercept: call => call.table === 'skill_items' && call.action === 'update' && fail ? rejection('Skill denied') : undefined });
    f.click('#skillsGrid .admin-item-edit'); f.get('adminModalSave').click(); await settle();
    assert.equal(f.get('adminModalSave').disabled, false); assert.match(f.toast(), /Skill denied/); assert.equal(f.refreshed(), 0);
    fail = false; f.get('adminModalSave').click(); await settle(); assert.equal(f.refreshed(), 1);
});

for (const kind of ['contact', 'intro']) test(kind + ' cannot save before its settings load, or after loading fails', async t => {
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const f = setup(t, { intercept: call => call.table === 'settings' && call.action === 'select' ? pending : undefined });
    f.click(kind === 'contact' ? '.contact-container .admin-edit-btn' : '.hero-content .admin-edit-btn');
    assert.equal(f.get('adminModalSave').disabled, true); await f.get('adminModalSave').onclick();
    assert.equal(f.calls.filter(call => call.action === 'upsert').length, 0);
    release(rejection('Read denied')); await settle(); assert.equal(f.get('adminModalSave').disabled, true);
    assert.equal(f.db.settings.find(row => row.key === 'cv_url').value, 'https://example.com/cv.pdf');
});

test('late settings result does not populate a different editor', async t => {
    let release; const pending = new Promise(resolve => { release = resolve; });
    const f = setup(t, { intercept: call => call.table === 'settings' && call.action === 'select' ? pending : undefined });
    f.click('.contact-container .admin-edit-btn'); f.get('adminModalClose').click(); f.click('#skillsGrid .admin-item-edit');
    release({ data: [{ key: 'cv_url', value: 'https://example.com/late.pdf' }], error: null }); await settle();
    assert.equal(f.get('adminModalTitle').textContent, 'Sửa Kỹ Năng'); assert.equal(f.get('skillTitle').value, 'Video'); assert.equal(f.get('adminModalSave').disabled, false);
});

test('failed album DB deletion never removes storage or its visible tile', async t => {
    const f = setup(t, { intercept: call => call.table === 'album_items' && call.action === 'delete' ? rejection('Delete denied') : undefined });
    f.click('#albumGrid [data-id="20"] .admin-item-delete'); await settle();
    assert.equal(f.storage.filter(call => call.action === 'remove').length, 0); assert.ok(f.doc.querySelector('#albumGrid [data-id="20"]')); assert.match(f.toast(), /Delete denied/);
});

test('storage cleanup failure offers a persistent manual retry after DB deletion', async t => {
    let fail = true;
    const f = setup(t, { storage: call => call.action === 'remove' && fail ? rejection('Storage denied') : undefined });
    f.click('#albumGrid [data-id="20"] .admin-item-delete'); await settle();
    assert.equal(f.db.album_items.some(row => row.id === 20), false); assert.equal(f.get('cleanupUploads').hidden, false); assert.match(f.get('cleanupUploads').textContent, /1/);
    fail = false; f.get('cleanupUploads').click(); await settle(); assert.equal(f.get('cleanupUploads').hidden, true); assert.equal(f.w.localStorage.getItem('portfolioPendingCleanup'), '[]');
});

test('intro values and project titles render as text, and unsafe URLs are rejected', async t => {
    const payload = '"><img src=x onerror=alert(1)>';
    const f = setup(t); f.db.settings.push({ key: 'intro_en', value: '</textarea>' + payload });
    f.click('.hero-content .admin-edit-btn'); await settle(); assert.equal(f.get('editIntroEn').value, '</textarea>' + payload); assert.equal(f.get('adminModalBody').querySelector('img'), null);
    f.get('adminModalClose').click(); f.click('#experience .admin-add-btn'); f.get('expLinkTitle').value = payload; f.get('expLinkUrl').value = 'javascript:alert(1)';
    f.get('btnAddExpLink').click(); await settle(); assert.equal(f.get('expLinksList').children.length, 0); assert.match(f.toast(), /http/);
    f.get('expLinkUrl').value = 'https://example.com/'; f.get('btnAddExpLink').click(); await settle(); assert.equal(f.get('expLinksList').querySelector('img'), null); assert.match(f.get('expLinksList').textContent, /onerror/);
});

test('preview upload uses media bucket, failed DB save retains draft, cancel cleans unreferenced upload', async t => {
    const f = setup(t, { intercept: call => call.table === 'experience_items' && call.action === 'insert' ? rejection('Create denied') : undefined });
    f.click('#experience .admin-add-btn'); f.get('expCompany').value = 'New'; f.get('expRoleVi').value = 'Role'; f.get('expLinkTitle').value = 'Preview'; f.get('expLinkUrl').value = 'https://example.com/';
    const file = new f.w.File(['image'], 'preview.png', { type: 'image/png' }); Object.defineProperty(f.get('expLinkPreviewFile'), 'files', { value: [file], configurable: true });
    f.get('expLinkPreviewFile').dispatchEvent(new f.w.Event('change')); f.get('adminModalSave').click(); await settle();
    assert.equal(f.storage[0].bucket, 'media'); assert.equal(f.get('adminModalSave').disabled, false); assert.equal(f.storage.filter(call => call.action === 'remove').length, 0);
    f.get('adminModalClose').click(); await settle(); assert.equal(f.storage.filter(call => call.action === 'remove').length, 1);
});

test('ambiguous creation blocks repeated insert and preserves possibly referenced files', async t => {
    const f = setup(t, { intercept: call => { if (call.table === 'experience_items' && call.action === 'insert') throw new TypeError('Network response lost'); } });
    f.click('#experience .admin-add-btn'); f.get('expCompany').value = 'New'; f.get('expRoleVi').value = 'Role'; f.get('expLinkTitle').value = 'Preview'; f.get('expLinkUrl').value = 'https://example.com/';
    Object.defineProperty(f.get('expLinkPreviewFile'), 'files', { value: [new f.w.File(['image'], 'preview.png', { type: 'image/png' })] }); f.get('expLinkPreviewFile').dispatchEvent(new f.w.Event('change'));
    f.get('adminModalSave').click(); await settle(); assert.equal(f.get('adminModalSave').disabled, true); await f.get('adminModalSave').onclick();
    assert.equal(f.calls.filter(call => call.action === 'insert').length, 1); f.get('adminModalClose').click(); await settle(); assert.equal(f.storage.filter(call => call.action === 'remove').length, 0);
});

test('album has a dedicated drag handle and keyboard buttons persist ordering', async t => {
    const f = setup(t); assert.equal(f.sortableOptions.get('albumGrid').handle, '.admin-drag-handle'); assert.ok(f.doc.querySelector('#albumGrid .admin-drag-handle'));
    f.doc.querySelector('#albumGrid [data-id="21"] .admin-order-btn').click(); await settle();
    assert.equal(f.get('albumGrid').firstElementChild.dataset.id, '21'); assert.equal(f.db.album_items.find(row => row.id === 21).sort_order, 0); assert.equal(f.db.album_items.find(row => row.id === 20).sort_order, 1);
});

test('failed experience deletion restores child references before reporting failure', async t => {
    const f = setup(t, { intercept: call => call.table === 'experience_items' && call.action === 'delete' ? rejection('Parent delete denied') : undefined });
    f.click('#experienceGrid .admin-item-delete'); await settle();
    assert.equal(f.db.experience_items.length, 1); assert.equal(f.db.album_items.find(row => row.id === 10).experience_id, '1'); assert.equal(f.db.album_items.find(row => row.id === 11).experience_id, '1');
    assert.equal(f.calls.some(call => call.table === 'album_items' && call.action === 'delete'), false); assert.match(f.toast(), /Parent delete denied/);
});

test('busy save prevents double submission and Escape until the request finishes', async t => {
    let release; const pending = new Promise(resolve => { release = resolve; });
    const f = setup(t, { intercept: call => call.table === 'skill_items' && call.action === 'update' ? pending : undefined });
    f.click('#skillsGrid .admin-item-edit'); f.get('adminModalSave').click(); await settle();
    await f.get('adminModalSave').onclick(); f.doc.dispatchEvent(new f.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(f.doc.querySelector('.admin-modal-overlay').style.display, 'flex'); assert.equal(f.calls.filter(call => call.action === 'update').length, 1);
    release(rejection('Retry now')); await settle(); assert.equal(f.get('adminModalSave').disabled, false); f.get('adminModalClose').click(); assert.equal(f.doc.querySelector('.admin-modal-overlay').style.display, 'none');
});

test('hero image write rejection reports failure and removes only its newly uploaded file', async t => {
    const f = setup(t, { intercept: call => call.table === 'settings' && call.action === 'upsert' ? rejection('Image save denied') : undefined });
    f.click('.hero-image .admin-edit-btn'); const picker = f.inputs.at(-1); Object.defineProperty(picker, 'files', { value: [new f.w.File(['image'], 'hero.png', { type: 'image/png' })] });
    picker.dispatchEvent(new f.w.Event('change')); await settle();
    assert.match(f.toast(), /Image save denied/); assert.equal(f.refreshed(), 0); assert.equal(f.storage[1].action, 'remove'); assert.equal(f.storage[1].paths[0], f.storage[0].path); assert.equal(f.doc.querySelector('.hero-image img').getAttribute('src'), 'old.jpg');
});

test('uncertain settings upsert can retry and keeps an uploaded CV if the editor closes', async t => {
    const f = setup(t, { intercept: call => { if (call.table === 'settings' && call.action === 'upsert') throw new TypeError('Response lost'); } });
    f.click('.contact-container .admin-edit-btn'); await settle();
    Object.defineProperty(f.get('cvFileInput'), 'files', { value: [new f.w.File(['pdf'], 'cv.pdf', { type: 'application/pdf' })] }); f.get('cvFileInput').dispatchEvent(new f.w.Event('change')); await settle();
    f.get('adminModalSave').click(); await settle(); assert.equal(f.get('adminModalSave').disabled, false); assert.match(f.toast(), /Chưa xác định/);
    f.get('adminModalClose').click(); await settle(); assert.equal(f.storage.filter(call => call.action === 'remove').length, 0);
});
