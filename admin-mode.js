// Inline editing; the existing PIN/sessionStorage entry flow is unchanged.
(function () {
    'use strict';
    const P = window.Portfolio;
    const sb = window.supabase.createClient(P.config.supabaseUrl, P.config.supabaseKey);
    const bucket = P.config.mediaBucket;
    const saveLabel = '<i class="fas fa-save" aria-hidden="true"></i> Lưu';
    const sortables = new Map();
    const observedGrids = new WeakSet();
    const pendingCleanup = new Set();
    try { for (const path of JSON.parse(P.getPreference('portfolioPendingCleanup', '[]'))) if (typeof path === 'string') pendingCleanup.add(path); } catch (_) { /* Invalid optional preferences are ignored. */ }
    let active = null;
    let working = false;
    let toastTimer;
    document.body.classList.add('admin-mode');
    const bar = document.createElement('div');
    bar.className = 'admin-bar';
    bar.innerHTML = '<div class="admin-bar-left"><i class="fas fa-cog" aria-hidden="true"></i><span>Chế độ Quản trị</span></div><button class="admin-bar-exit" id="exitAdmin"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> Thoát</button>';
    document.body.prepend(bar);
    const cleanupButton = document.createElement('button'); cleanupButton.id = 'cleanupUploads'; cleanupButton.className = 'admin-bar-exit'; bar.appendChild(cleanupButton);
    cleanupButton.onclick = () => pageAction(async () => { if (await removeFiles([...pendingCleanup])) showToast('Đã dọn các file chờ.'); });
    const overlay = document.createElement('div');
    overlay.className = 'admin-modal-overlay';
    overlay.style.display = 'none';
    overlay.setAttribute('aria-labelledby', 'adminModalTitle');
    overlay.innerHTML = '<div class="admin-modal"><div class="admin-modal-header"><h3 id="adminModalTitle">Chỉnh sửa</h3><button class="admin-modal-close" id="adminModalClose" aria-label="Đóng cửa sổ chỉnh sửa"><i class="fas fa-times" aria-hidden="true"></i></button></div><div class="admin-modal-body" id="adminModalBody"></div><div class="admin-modal-footer"><button class="admin-save-btn" id="adminModalSave">' + saveLabel + '</button></div></div>';
    document.body.appendChild(overlay);
    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
    const progress = document.createElement('div');
    progress.className = 'admin-upload-progress';
    progress.style.display = 'none';
    progress.innerHTML = '<div class="admin-progress-fill" id="adminProgressFill"></div><span class="admin-progress-text" id="adminProgressText"></span>';
    document.body.appendChild(progress);
    const $ = id => document.getElementById(id);
    const dialog = P.createDialog(overlay, {
        display: 'flex', canClose: () => !active || !active.busy,
        onClose: () => { const state = active; active = null; if (state) cleanupDraft(state); syncBusy(); }
    });
    $('adminModalClose').addEventListener('click', () => dialog.close());
    overlay.addEventListener('click', e => { if (e.target === overlay) dialog.close(); });
    $('exitAdmin').addEventListener('click', () => {
        if (working || active?.busy) return;
        dialog.close(); sessionStorage.removeItem('adminMode'); window.location.reload();
    });
    function showToast(message, type = 'success') {
        clearTimeout(toastTimer); toast.textContent = message; toast.className = 'admin-toast ' + type + ' show';
        toastTimer = setTimeout(() => { toast.className = 'admin-toast'; }, 5000);
    }
    async function checked(query, requireRows = false, writing = false, creating = false) {
        try {
            const result = await query;
            if (!result || result.error) {
                const error = new Error(result?.error?.message || 'Không nhận được phản hồi từ máy chủ.');
                const status = Number(result?.status || result?.error?.statusCode || 0);
                error.definite = (status >= 400 && status < 500) || /^(?:[0-9A-Z]{5}|PGRST\d+)$/.test(result?.error?.code || '');
                throw error;
            }
            if (requireRows && (!result.data || (Array.isArray(result.data) && !result.data.length))) throw new Error('Không nhận được bản ghi đã lưu.');
            return result.data;
        } catch (error) {
            if (writing && !error.definite) {
                error.uncertain = true;
                error.message += creating ? ' Chưa xác định kết quả tạo mới. Hãy đóng cửa sổ và tải lại trang để kiểm tra trước khi tạo lại.' : ' Chưa xác định kết quả ghi. Có thể thử lưu lại để xác nhận.';
                // A request may have committed before its response was lost. Retain its files.
                if (active) { if (creating) active.uncertain = true; for (const path of active.uploads) active.protectedUploads.add(path); active.uploads.clear(); }
            }
            throw error;
        }
    }
    function syncBusy() {
        const busy = working || Boolean(active?.busy);
        document.querySelectorAll('.admin-edit-btn, .admin-item-controls .admin-item-btn, .admin-add-btn, .admin-bar-exit').forEach(el => {
            if ('disabled' in el) el.disabled = busy;
            el.setAttribute('aria-disabled', String(busy));
        });
        sortables.forEach(sortable => sortable.option('disabled', busy || Boolean(active)));
        $('adminModalSave').disabled = busy || Boolean(active?.loading || active?.uncertain);
        $('adminModalClose').disabled = Boolean(active?.busy);
        overlay.querySelectorAll('input, textarea, select, .admin-modal-body button').forEach(el => { el.disabled = Boolean(active?.busy || active?.loading) || el.dataset.boundary === 'true'; });
        if (!busy) $('adminModalSave').innerHTML = saveLabel;
        cleanupButton.hidden = pendingCleanup.size === 0; cleanupButton.textContent = 'Dọn file chờ (' + pendingCleanup.size + ')';
    }
    async function refresh() {
        if (typeof window.fetchDynamicData === 'function') {
            try { await window.fetchDynamicData(); setupAll(); }
            catch (error) { showToast('Đã lưu, nhưng chưa tải lại được giao diện: ' + error.message, 'error'); }
        } else window.location.reload();
    }
    function beginEditor(title, html, trigger) {
        if (working || active?.busy) return null;
        dialog.close();
        const state = { busy: false, loading: false, uploads: new Set(), protectedUploads: new Set() }; active = state;
        $('adminModalTitle').textContent = title; $('adminModalBody').innerHTML = html; $('adminModalSave').onclick = null;
        syncBusy(); dialog.open(trigger); return state;
    }
    function saveHandler(state, operation) {
        $('adminModalSave').onclick = async () => {
            if (active !== state || state.busy || state.loading || state.uncertain || working) return;
            state.busy = true; syncBusy(); $('adminModalSave').textContent = 'Đang lưu...';
            try { await operation(); state.busy = false; dialog.close(); showToast('Đã lưu thành công!'); await refresh(); }
            catch (error) { showToast('Lỗi: ' + error.message, 'error'); }
            finally { state.busy = false; syncBusy(); }
        };
    }
    function field(id, label, type = 'text') {
        const control = type === 'textarea' ? '<textarea id="' + id + '" rows="4"></textarea>' : '<input id="' + id + '" class="admin-input" type="' + type + '">';
        return '<div class="admin-form-group"><label for="' + id + '">' + label + '</label>' + control + '</div>';
    }
    function validUrl(value, label, allowEmpty = false) {
        const trimmed = String(value || '').trim(); if (!trimmed && allowEmpty) return '';
        const url = P.safeUrl(trimmed); if (!url) throw new Error(label + ' phải là địa chỉ http:// hoặc https:// hợp lệ.'); return url;
    }
    function validateFile(file, kind) {
        if (!file) throw new Error('Vui lòng chọn file.');
        const image = /^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type), video = /^video\/(mp4|webm|quicktime|ogg)$/i.test(file.type), pdf = file.type === 'application/pdf';
        if ((kind === 'image' && !image) || (kind === 'pdf' && !pdf) || (kind === 'media' && !image && !video)) throw new Error(kind === 'pdf' ? 'Vui lòng chọn file PDF.' : 'Hỗ trợ ảnh JPG, PNG, WebP, GIF, AVIF và video MP4, WebM, MOV, OGV.');
        const maxMB = video ? 250 : 20;
        if (file.size > maxMB * 1024 * 1024) throw new Error('File vượt quá dung lượng ' + maxMB + ' MB.');
    }
    async function upload(file, prefix, kind, state) {
        validateFile(file, kind);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const unique = window.crypto?.randomUUID?.() || Date.now() + '_' + Math.random().toString(36).slice(2);
        const path = prefix + '_' + unique + '_' + safeName;
        await checked(sb.storage.from(bucket).upload(path, file, { cacheControl: '3600' }));
        if (state) state.uploads.add(path);
        const result = sb.storage.from(bucket).getPublicUrl(path), url = P.safeUrl(result.data?.publicUrl);
        if (result.error || !url) { await removeFiles([path]); if (state) state.uploads.delete(path); throw result.error || new Error('Không lấy được địa chỉ file vừa tải.'); }
        return { path, url };
    }
    async function removeFiles(paths) {
        const unique = [...new Set(paths.filter(Boolean))]; if (!unique.length) return true;
        let success = false;
        try { await checked(sb.storage.from(bucket).remove(unique)); for (const path of unique) pendingCleanup.delete(path); success = true; }
        catch (error) { for (const path of unique) pendingCleanup.add(path); showToast('Chưa dọn được file: ' + error.message + '. Dùng nút Dọn file chờ để thử lại.', 'error'); }
        P.setPreference('portfolioPendingCleanup', JSON.stringify([...pendingCleanup])); syncBusy(); return success;
    }
    function cleanupDraft(state) { const paths = [...state.uploads]; state.uploads.clear(); return removeFiles(paths); }
    async function pageAction(operation) {
        if (working || active) return; working = true; syncBusy();
        try { await operation(); } catch (error) { showToast('Lỗi: ' + error.message, 'error'); }
        finally { working = false; syncBusy(); }
    }
    async function updateSettings(values) { return checked(sb.from('settings').upsert(values, { onConflict: 'key' }).select('key'), true, true); }
    function openIntroEditor(trigger) {
        const state = beginEditor('Giới thiệu & Chức danh', field('editSubtitle', 'Chức danh') + field('editIntroVi', 'Giới thiệu (Tiếng Việt)', 'textarea') + field('editIntroEn', 'Giới thiệu (English)', 'textarea') + '<p id="introLoadStatus" class="admin-status" role="status">Đang tải nội dung...</p>', trigger);
        if (!state) return;
        $('editSubtitle').value = translations.vi.hero_subtitle || ''; $('editIntroVi').value = translations.vi.hero_intro || ''; $('editIntroEn').value = translations.en.hero_intro || '';
        state.loading = true; syncBusy();
        (async () => {
            try {
                const rows = await checked(sb.from('settings').select('key,value'));
                if (active !== state) return;
                const values = Object.fromEntries((rows || []).map(row => [row.key, row.value ?? '']));
                $('editSubtitle').value = values.hero_subtitle ?? translations.vi.hero_subtitle ?? '';
                $('editIntroVi').value = values.intro_vi ?? translations.vi.hero_intro ?? '';
                $('editIntroEn').value = values.intro_en ?? translations.en.hero_intro ?? '';
                state.loading = false; $('introLoadStatus').textContent = '';
            } catch (error) { if (active === state) $('introLoadStatus').textContent = 'Không tải được nội dung: ' + error.message + '. Hãy đóng và mở lại cửa sổ.'; }
            finally { if (active === state) syncBusy(); }
        })();
        saveHandler(state, () => updateSettings([{ key: 'hero_subtitle', value: $('editSubtitle').value.trim() }, { key: 'intro_vi', value: $('editIntroVi').value.trim() }, { key: 'intro_en', value: $('editIntroEn').value.trim() }]));
    }
    function openContactEditor(trigger) {
        const state = beginEditor('Thông tin liên hệ & CV', field('editPhone', 'Số điện thoại', 'tel') + field('editEmail', 'Email', 'email') + field('editFb', 'Link Facebook', 'url') + '<div class="admin-form-group"><label for="editCv">File CV (PDF, tối đa 20 MB)</label><div class="admin-form-row"><input type="text" id="editCv" class="admin-input" readonly><button id="btnUploadCv" type="button" class="admin-save-btn">Tải PDF</button><input type="file" id="cvFileInput" accept="application/pdf" hidden></div><p class="admin-status" id="contactLoadStatus" role="status">Đang tải thông tin...</p></div>', trigger);
        if (!state) return;
        state.loading = true; state.cvPath = ''; syncBusy();
        (async () => {
            try {
                const rows = await checked(sb.from('settings').select('key,value'));
                if (active !== state) return;
                const values = Object.fromEntries((rows || []).map(row => [row.key, row.value || '']));
                $('editPhone').value = values.contact_phone || ''; $('editEmail').value = values.contact_email || ''; $('editFb').value = values.contact_fb || ''; $('editCv').value = values.cv_url || '';
                $('contactLoadStatus').textContent = ''; state.loading = false;
            } catch (error) { if (active === state) $('contactLoadStatus').textContent = 'Không tải được dữ liệu: ' + error.message + '. Hãy đóng và mở lại cửa sổ.'; }
            finally { if (active === state) syncBusy(); }
        })();
        $('btnUploadCv').onclick = () => $('cvFileInput').click();
        $('cvFileInput').onchange = async function () {
            if (!this.files.length || state.busy || state.loading || active !== state) return;
            const file = this.files[0]; state.busy = true; syncBusy();
            try {
                const uploaded = await upload(file, 'cv', 'pdf', state);
                if (state.cvPath && !state.protectedUploads.has(state.cvPath)) { if (await removeFiles([state.cvPath])) state.uploads.delete(state.cvPath); }
                state.cvPath = uploaded.path; $('editCv').value = uploaded.url; showToast('Đã tải CV. Bấm Lưu để cập nhật.');
            } catch (error) { showToast('Lỗi tải CV: ' + error.message, 'error'); }
            finally { this.value = ''; state.busy = false; syncBusy(); }
        };
        saveHandler(state, async () => {
            const email = $('editEmail').value.trim();
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email không hợp lệ.');
            const facebook = validUrl($('editFb').value, 'Link Facebook', true), cv = validUrl($('editCv').value, 'Địa chỉ CV', true);
            await updateSettings([{ key: 'contact_phone', value: $('editPhone').value.trim() }, { key: 'contact_email', value: email }, { key: 'contact_fb', value: facebook }, { key: 'cv_url', value: cv }]);
            if (state.cvPath) state.uploads.delete(state.cvPath);
        });
    }
    function openSkillEditor(id, element, trigger) {
        const state = beginEditor(id ? 'Sửa Kỹ Năng' : 'Thêm Kỹ Năng', field('skillTitle', 'Tên kỹ năng') + field('skillIcon', 'Biểu tượng (ví dụ: fas fa-camera)') + field('skillDescVi', 'Mô tả (Tiếng Việt)', 'textarea') + field('skillDescEn', 'Mô tả (English)', 'textarea'), trigger);
        if (!state) return; state.id = id;
        if (element) {
            $('skillTitle').value = element.querySelector('h3')?.textContent || '';
            $('skillIcon').value = element.querySelector('.skill-icon')?.className.replace(/\bskill-icon\b/g, '').trim() || 'fas fa-star';
            $('skillDescVi').value = element.querySelector('p')?.getAttribute('data-vi') || ''; $('skillDescEn').value = element.querySelector('p')?.getAttribute('data-en') || '';
        }
        saveHandler(state, async () => {
            const data = { title_en: $('skillTitle').value.trim(), icon_class: $('skillIcon').value.trim() || 'fas fa-star', desc_vi: $('skillDescVi').value.trim(), desc_en: $('skillDescEn').value.trim() };
            if (!data.title_en) throw new Error('Vui lòng nhập tên kỹ năng.');
            if (!/^(?:fa[a-z-]*)(?:\s+fa[a-z0-9-]*)*$/i.test(data.icon_class)) throw new Error('Biểu tượng phải gồm các class Font Awesome, ví dụ fas fa-camera.');
            if (state.id) await checked(sb.from('skill_items').update(data).eq('id', state.id).select('id'), true, true);
            else { data.sort_order = await nextOrder('skill_items'); const row = await checked(sb.from('skill_items').insert(data).select('id').single(), true, true, true); state.id = row.id; }
        });
    }
    async function nextOrder(table) {
        const rows = await checked(sb.from(table).select('sort_order').order('sort_order', { ascending: false }).limit(1));
        return rows?.length ? (Number(rows[0].sort_order) || 0) + 1 : 0;
    }
    function openExpEditor(id, element, trigger) {
        const state = beginEditor(id ? 'Sửa Kinh Nghiệm' : 'Thêm Kinh Nghiệm', field('expCompany', 'Tên thương hiệu') + field('expYear', 'Năm') + field('expRoleVi', 'Vai trò (Tiếng Việt)') + field('expRoleEn', 'Vai trò (English)') + '<div class="admin-form-group"><label>Các link dự án</label><div class="admin-link-editor"><input type="text" id="expLinkTitle" class="admin-input" placeholder="Tên dự án" aria-label="Tên dự án"><input type="url" id="expLinkUrl" class="admin-input" placeholder="https://..." aria-label="Link dự án"><button type="button" class="admin-save-btn" id="btnChooseExpPreview">Ảnh xem trước</button><input type="file" id="expLinkPreviewFile" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden><button type="button" class="admin-save-btn" id="btnAddExpLink">Thêm link</button></div><p id="expLinkPreviewStatus" class="admin-status" role="status"></p><div id="expLinksList"></div></div>', trigger);
        if (!state) return;
        Object.assign(state, { id, links: [], deleted: new Map(), editKey: null, file: null, previewUrl: '', previewPath: '' });
        if (element) {
            $('expCompany').value = element.querySelector('h3')?.textContent || ''; $('expYear').value = element.querySelector('.year')?.textContent || '';
            $('expRoleVi').value = element.querySelector('.role')?.getAttribute('data-vi') || ''; $('expRoleEn').value = element.querySelector('.role')?.getAttribute('data-en') || '';
        }
        function resetLinkDraft() {
            state.editKey = null; state.file = null; state.previewUrl = ''; state.previewPath = '';
            $('expLinkTitle').value = ''; $('expLinkUrl').value = ''; $('expLinkPreviewFile').value = ''; $('expLinkPreviewStatus').textContent = ''; $('btnAddExpLink').textContent = 'Thêm link';
        }
        function stageLink() {
            const title = $('expLinkTitle').value.trim(), rawUrl = $('expLinkUrl').value.trim();
            if (!title && !rawUrl && !state.file && !state.editKey) return null;
            if (!title || !rawUrl) throw new Error('Vui lòng nhập đủ tên và link dự án đang chỉnh sửa.');
            return { title, url: validUrl(rawUrl, 'Link dự án') };
        }
        async function commitLink() {
            const draft = stageLink(); if (!draft) return;
            let preview = { url: state.previewUrl, path: state.previewPath };
            if (state.file) { preview = await upload(state.file, 'preview', 'image', state); state.file = null; state.previewUrl = preview.url; state.previewPath = preview.path; }
            const existing = state.links.find(link => link.key === state.editKey);
            if (existing) Object.assign(existing, draft, { preview_image: preview.url, uploadedPath: preview.path });
            else state.links.push({ ...draft, key: 'new_' + Math.random().toString(36).slice(2), preview_image: preview.url, uploadedPath: preview.path });
            resetLinkDraft(); renderLinks();
        }
        function renderLinks() {
            const list = $('expLinksList'); list.replaceChildren();
            state.links.forEach((link, index) => {
                const row = document.createElement('div'); row.className = 'admin-link-row'; row.dataset.key = link.key;
                const copy = document.createElement('div'); copy.className = 'admin-link-copy';
                const title = document.createElement('strong'); title.textContent = link.title;
                const anchor = document.createElement('a'); anchor.textContent = link.url; const safe = P.safeUrl(link.url);
                if (safe) { anchor.href = safe; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
                copy.append(title, anchor); row.appendChild(copy);
                const actions = document.createElement('div'); actions.className = 'admin-link-actions';
                function action(label, className, callback, disabled = false) {
                    const button = document.createElement('button'); button.type = 'button'; button.className = 'admin-item-btn ' + className; button.textContent = label;
                    button.dataset.boundary = String(disabled); button.disabled = disabled || state.busy; button.setAttribute('aria-label', label + ' ' + link.title); button.onclick = callback; actions.appendChild(button);
                }
                action('↑', 'admin-item-up', () => { if (state.busy || index === 0) return; [state.links[index - 1], state.links[index]] = [link, state.links[index - 1]]; renderLinks(); }, index === 0);
                action('↓', 'admin-item-down', () => { if (state.busy || index === state.links.length - 1) return; [state.links[index + 1], state.links[index]] = [link, state.links[index + 1]]; renderLinks(); }, index === state.links.length - 1);
                action('Sửa', 'admin-item-edit', async () => {
                    if (state.busy || state.editKey === link.key) return;
                    try {
                        // Keep every previous draft on its own stable entry before selecting another.
                        if (state.editKey !== link.key && stageLink()) { state.busy = true; syncBusy(); await commitLink(); }
                        state.editKey = link.key; state.file = null; state.previewUrl = link.preview_image || ''; state.previewPath = link.uploadedPath || '';
                        $('expLinkTitle').value = link.title; $('expLinkUrl').value = link.url; $('expLinkPreviewFile').value = '';
                        $('expLinkPreviewStatus').textContent = state.previewUrl ? 'Đã có ảnh xem trước.' : ''; $('btnAddExpLink').textContent = 'Cập nhật link';
                    } catch (error) { showToast(error.message, 'error'); }
                    finally { state.busy = false; syncBusy(); }
                });
                action('Xóa', 'admin-item-delete', () => {
                    if (state.busy) return;
                    if (link.id) state.deleted.set(link.id, link);
                    state.links = state.links.filter(item => item !== link); if (state.editKey === link.key) resetLinkDraft(); renderLinks();
                });
                row.appendChild(actions); list.appendChild(row);
            });
        }
        $('btnChooseExpPreview').onclick = () => $('expLinkPreviewFile').click();
        $('expLinkPreviewFile').onchange = function () {
            if (state.busy || state.loading || !this.files.length) return;
            try { validateFile(this.files[0], 'image'); state.file = this.files[0]; $('expLinkPreviewStatus').textContent = 'Đã chọn: ' + state.file.name; }
            catch (error) { showToast(error.message, 'error'); }
            this.value = '';
        };
        $('btnAddExpLink').onclick = async () => {
            if (state.busy || state.loading) return; state.busy = true; syncBusy();
            try { if (!stageLink()) throw new Error('Vui lòng nhập tên và link dự án.'); await commitLink(); }
            catch (error) { showToast(error.message, 'error'); }
            finally { state.busy = false; syncBusy(); }
        };
        if (id) {
            state.loading = true; syncBusy(); $('expLinkPreviewStatus').textContent = 'Đang tải các link dự án...';
            (async () => {
                try {
                    const rows = await checked(sb.from('album_items').select('*').eq('experience_id', id).eq('type', 'text_link').order('sort_order'));
                    if (active !== state) return;
                    state.links = (rows || []).map(row => {
                        let metadata = {}; try { metadata = JSON.parse(row.file_path) || {}; } catch (_) { /* Legacy entries may contain a plain path. */ }
                        return { id: row.id, key: 'id_' + row.id, title: String(metadata.title || 'Link dự án'), url: row.url || '', preview_image: P.safeUrl(metadata.preview_image || '') };
                    });
                    state.loading = false; $('expLinkPreviewStatus').textContent = ''; renderLinks();
                } catch (error) { if (active === state) $('expLinkPreviewStatus').textContent = 'Không tải được link: ' + error.message + '. Hãy đóng và mở lại cửa sổ.'; }
                finally { if (active === state) syncBusy(); }
            })();
        }
        saveHandler(state, async () => {
            const data = { company: $('expCompany').value.trim(), year: $('expYear').value.trim(), role_vi: $('expRoleVi').value.trim(), role_en: $('expRoleEn').value.trim() };
            if (!data.company || !data.role_vi) throw new Error('Vui lòng nhập tên thương hiệu và vai trò tiếng Việt.');
            await commitLink(); for (const link of state.links) validUrl(link.url, 'Link dự án');
            if (state.id) await checked(sb.from('experience_items').update(data).eq('id', state.id).select('id'), true, true);
            else { data.sort_order = await nextOrder('experience_items'); const row = await checked(sb.from('experience_items').insert(data).select('id').single(), true, true, true); state.id = row.id; }
            for (let i = 0; i < state.links.length; i++) {
                const link = state.links[i], values = { type: 'text_link', url: link.url, file_path: JSON.stringify({ title: link.title, preview_image: link.preview_image || '' }), sort_order: i, category: 'all', experience_id: state.id };
                if (link.id) await checked(sb.from('album_items').update(values).eq('id', link.id).select('id'), true, true);
                else { const row = await checked(sb.from('album_items').insert(values).select('id').single(), true, true, true); link.id = row.id; }
                // Retain successful IDs before any subsequent write can fail, so retries update them.
                if (link.uploadedPath) { state.uploads.delete(link.uploadedPath); link.uploadedPath = ''; }
            }
            for (const [deletedId] of state.deleted) { await checked(sb.from('album_items').delete().eq('id', deletedId).select('id'), false, true); state.deleted.delete(deletedId); }
        });
    }
    async function deleteExperience(element) {
        const id = element.dataset.id;
        if (!id || !window.confirm('Xóa mốc kinh nghiệm và các link dự án? Ảnh/video trong album sẽ được giữ lại.')) return;
        await pageAction(async () => {
            const children = await checked(sb.from('album_items').select('*').eq('experience_id', id)), detached = [];
            try {
                for (const child of children || []) { await checked(sb.from('album_items').update({ experience_id: null }).eq('id', child.id).select('id'), true, true); detached.push(child.id); }
                await checked(sb.from('experience_items').delete().eq('id', id).select('id'), true, true);
            } catch (error) {
                let restoreFailed = false;
                for (const childId of detached) {
                    try { await checked(sb.from('album_items').update({ experience_id: id }).eq('id', childId).select('id'), true, true); }
                    catch (_) { restoreFailed = true; }
                }
                if (restoreFailed) throw new Error(error.message + ' Một số liên kết album chưa được khôi phục; cần kiểm tra lại dữ liệu.');
                throw error;
            }
            let cleanupFailed = false;
            for (const child of children || []) {
                if (child.type !== 'text_link') continue;
                try { await checked(sb.from('album_items').delete().eq('id', child.id).select('id'), false, true); }
                catch (_) { cleanupFailed = true; }
            }
            await refresh();
            showToast(cleanupFailed ? 'Đã xóa kinh nghiệm; một số link cũ chưa dọn được. Hãy kiểm tra dữ liệu trước khi tiếp tục.' : 'Đã xóa kinh nghiệm.', cleanupFailed ? 'error' : 'success');
        });
    }
    async function deleteAlbumItem(element) {
        if (!element.dataset.id || !window.confirm('Xóa ảnh/video này? Hành động này không thể hoàn tác.')) return;
        await pageAction(async () => {
            await checked(sb.from('album_items').delete().eq('id', element.dataset.id).select('id'), true, true);
            element.remove();
            const path = element.dataset.filePath, clean = path && path !== 'undefined' ? await removeFiles([path]) : true;
            await refresh(); if (clean) showToast('Đã xóa ảnh/video.');
        });
    }
    async function uploadMedia(fileList) {
        const files = Array.from(fileList); if (!files.length) return;
        await pageAction(async () => {
            let uploaded = 0, order = await nextOrder('album_items'); const failures = [];
            progress.style.display = 'flex';
            try {
                for (let index = 0; index < files.length; index++) {
                    const file = files[index]; let stored;
                    try {
                        stored = await upload(file, 'album', 'media');
                        await checked(sb.from('album_items').insert({ type: file.type.startsWith('video/') ? 'video' : 'image', url: stored.url, file_path: stored.path, sort_order: order, category: 'all' }).select('id'), true, true);
                        uploaded++; order++;
                    } catch (error) { if (stored && !error.uncertain) await removeFiles([stored.path]); failures.push(file.name + ': ' + error.message); }
                    $('adminProgressFill').style.width = Math.round((index + 1) / files.length * 100) + '%';
                    $('adminProgressText').textContent = 'Đã xử lý ' + (index + 1) + '/' + files.length + ' file';
                }
                if (uploaded) await refresh();
                showToast('Đã tải ' + uploaded + '/' + files.length + ' file.' + (failures.length ? ' ' + failures.join('; ') : ''), failures.length ? 'error' : 'success');
            } finally { progress.style.display = 'none'; }
        });
    }
    function editButton(parent, label, icon, callback) {
        if (!parent || parent.querySelector(':scope > .admin-edit-btn')) return;
        parent.style.position = 'relative';
        const button = document.createElement('button'); button.className = 'admin-edit-btn'; button.title = label; button.setAttribute('aria-label', label);
        button.innerHTML = '<i class="fas ' + icon + '" aria-hidden="true"></i>';
        button.onclick = e => { e.stopPropagation(); if (!working && !active?.busy) callback(button); }; parent.appendChild(button);
    }
    function itemControls(element, edit, remove) {
        if (element.querySelector(':scope > .admin-item-controls')) return;
        element.style.position = 'relative';
        const controls = document.createElement('div'); controls.className = 'admin-item-controls';
        const drag = document.createElement('span'); drag.className = 'admin-drag-handle'; drag.textContent = '⠿'; drag.title = 'Kéo để sắp xếp'; drag.setAttribute('aria-hidden', 'true'); controls.appendChild(drag);
        for (const [direction, label] of [[-1, 'Đưa lên trước'], [1, 'Đưa xuống sau']]) {
            const orderButton = document.createElement('button'); orderButton.className = 'admin-item-btn admin-order-btn'; orderButton.textContent = direction < 0 ? '↑' : '↓'; orderButton.setAttribute('aria-label', label); orderButton.title = label;
            orderButton.onclick = e => { e.stopPropagation(); pageAction(async () => {
                const grid = element.parentElement, sibling = direction < 0 ? element.previousElementSibling : element.nextElementSibling;
                if (!sibling) return;
                if (direction < 0) sibling.before(element); else sibling.after(element);
                const table = grid.id === 'experienceGrid' ? 'experience_items' : grid.id === 'skillsGrid' ? 'skill_items' : 'album_items';
                await persistOrder(grid, table);
            }); }; controls.appendChild(orderButton);
        }
        if (edit) {
            const button = document.createElement('button'); button.className = 'admin-item-btn admin-item-edit'; button.title = 'Sửa'; button.setAttribute('aria-label', 'Sửa mục'); button.innerHTML = '<i class="fas fa-pen" aria-hidden="true"></i>';
            button.onclick = e => { e.stopPropagation(); if (!working && !active) edit(button); }; controls.appendChild(button);
        }
        const button = document.createElement('button'); button.className = 'admin-item-btn admin-item-delete'; button.title = 'Xóa'; button.setAttribute('aria-label', 'Xóa mục'); button.innerHTML = '<i class="fas fa-trash-alt" aria-hidden="true"></i>';
        button.onclick = e => { e.stopPropagation(); if (!working && !active) remove(); }; controls.appendChild(button); element.appendChild(controls);
    }
    async function persistOrder(grid, table) {
        const items = [...grid.children].filter(item => item.dataset.id);
        const results = await Promise.allSettled(items.map((item, index) => checked(sb.from(table).update({ sort_order: index }).eq('id', item.dataset.id).select('id'), true, true)));
        const failed = results.find(result => result.status === 'rejected');
        if (failed) { await refresh(); throw new Error('Chưa lưu đủ thứ tự. ' + failed.reason.message); }
        showToast('Đã lưu thứ tự.');
    }
    function setupGrid(sectionId, gridId, itemSelector, table, label, add, attach) {
        const section = $(sectionId), grid = $(gridId); if (!section || !grid) return;
        if (!section.querySelector('.admin-add-btn')) {
            const controls = document.createElement('div'); controls.className = 'admin-album-controls';
            const button = document.createElement('button'); button.className = 'admin-add-btn'; button.textContent = label;
            button.onclick = () => { if (!working && !active) add(button); }; controls.appendChild(button); section.querySelector('.section-title')?.after(controls);
        }
        const attachAll = () => { grid.querySelectorAll(itemSelector).forEach(attach); }; attachAll();
        if (!observedGrids.has(grid)) { new MutationObserver(attachAll).observe(grid, { childList: true }); observedGrids.add(grid); }
        if (window.Sortable && !sortables.has(grid)) {
            sortables.set(grid, Sortable.create(grid, {
                animation: 150, delay: 200, delayOnTouchOnly: true, handle: '.admin-drag-handle', filter: 'button,a,input', preventOnFilter: false,
                onEnd: () => pageAction(() => persistOrder(grid, table))
            }));
        }
    }
    function setupAll() {
        editButton(document.querySelector('.hero-content'), 'Chỉnh sửa giới thiệu', 'fa-pen', openIntroEditor);
        editButton(document.querySelector('.hero-image'), 'Thay đổi ảnh đại diện', 'fa-camera', () => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif';
            input.onchange = () => {
                if (!input.files.length) return; const file = input.files[0]; input.value = '';
                pageAction(async () => {
                    let stored;
                    try { stored = await upload(file, 'hero', 'image'); await updateSettings([{ key: 'hero_image_url', value: stored.url }]); }
                    catch (error) { if (stored && !error.uncertain) await removeFiles([stored.path]); throw error; }
                    await refresh(); showToast('Đã thay đổi ảnh đại diện.');
                });
            }; input.click();
        });
        editButton(document.querySelector('.contact-container'), 'Chỉnh sửa thông tin liên hệ', 'fa-pen', openContactEditor);
        setupGrid('experience', 'experienceGrid', '.bento-card', 'experience_items', 'Thêm Kinh Nghiệm', button => openExpEditor(null, null, button), element => itemControls(element, button => openExpEditor(element.dataset.id, element, button), () => deleteExperience(element)));
        setupGrid('skills', 'skillsGrid', '.skill-card', 'skill_items', 'Thêm Kỹ Năng', button => openSkillEditor(null, null, button), element => itemControls(element, button => openSkillEditor(element.dataset.id, element, button), () => {
            if (!element.dataset.id || !window.confirm('Xóa kỹ năng này? Hành động này không thể hoàn tác.')) return;
            pageAction(async () => { await checked(sb.from('skill_items').delete().eq('id', element.dataset.id).select('id'), true, true); await refresh(); showToast('Đã xóa kỹ năng.'); });
        }));
        setupGrid('album', 'albumGrid', '.masonry-item', 'album_items', 'Thêm ảnh/video', () => {
            const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,video/ogg';
            input.onchange = () => { const files = Array.from(input.files); input.value = ''; uploadMedia(files); }; input.click();
        }, element => itemControls(element, null, () => deleteAlbumItem(element)));
        syncBusy();
    }
    window.addEventListener('dynamicDataLoaded', setupAll);
    window.addEventListener('albumLoaded', setupAll);
    setupAll();
})();
