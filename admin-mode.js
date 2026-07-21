// admin-mode.js — Inline editing controls overlaid on the real portfolio page
(function() {
    'use strict';

    const sb = window.supabase.createClient(
        'https://ppzosahycxznuxeerfts.supabase.co',
        'sb_publishable_ff32PbO6HnaGMkqmEXP_WA_pPc4TMNn'
    );

    document.body.classList.add('admin-mode');

    // ===== 1. Admin Top Bar =====
    const bar = document.createElement('div');
    bar.className = 'admin-bar';
    bar.innerHTML = `
        <div class="admin-bar-left">
            <i class="fas fa-cog fa-spin"></i>
            <span>Chế độ Quản trị</span>
        </div>
        <button class="admin-bar-exit" id="exitAdmin">
            <i class="fas fa-sign-out-alt"></i> Thoát
        </button>
    `;
    document.body.prepend(bar);

    document.getElementById('exitAdmin').addEventListener('click', () => {
        sessionStorage.removeItem('adminMode');
        window.location.reload();
    });

    // ===== 2. Edit Button for Intro =====
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.position = 'relative';
        const editBtn = document.createElement('button');
        editBtn.className = 'admin-edit-btn';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';
        editBtn.title = 'Chỉnh sửa giới thiệu';
        editBtn.addEventListener('click', (e) => { e.stopPropagation(); openIntroEditor(); });
        heroContent.appendChild(editBtn);
    }

    // ===== 3. Album Controls =====
    const albumSection = document.getElementById('album');
    if (albumSection) {
        const albumTitle = albumSection.querySelector('.section-title');
        if (albumTitle) {
            const controls = document.createElement('div');
            controls.className = 'admin-album-controls';
            controls.innerHTML = `
                <label class="admin-add-btn">
                    <input type="file" id="adminFileInput" multiple accept="image/*,video/*" hidden>
                    <i class="fas fa-plus-circle"></i> Thêm ảnh/video
                </label>
            `;
            albumTitle.after(controls);

            document.getElementById('adminFileInput').addEventListener('change', function() {
                if (this.files.length > 0) uploadMedia(this.files);
            });
        }

        // Add controls to Supabase items via MutationObserver
        const grid = document.querySelector('.masonry-grid');
        if (grid) {
            // Mark existing hardcoded items
            grid.querySelectorAll('.masonry-item').forEach(item => {
                item.dataset.source = 'local';
            });

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(m => {
                    m.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('masonry-item') && !node.dataset.source) {
                            node.dataset.source = 'supabase';
                            addItemControls(node);
                        }
                    });
                });
            });
            observer.observe(grid, { childList: true });
        }
    }

    // ===== 4. Create Modal =====
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'admin-modal-overlay';
    modalOverlay.style.display = 'none';
    modalOverlay.innerHTML = `
        <div class="admin-modal">
            <div class="admin-modal-header">
                <h3 id="adminModalTitle">Chỉnh sửa</h3>
                <button class="admin-modal-close" id="adminModalClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="admin-modal-body" id="adminModalBody"></div>
            <div class="admin-modal-footer">
                <button class="admin-save-btn" id="adminModalSave">
                    <i class="fas fa-save"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    document.getElementById('adminModalClose').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // ===== 5. Toast =====
    const toastEl = document.createElement('div');
    toastEl.className = 'admin-toast';
    document.body.appendChild(toastEl);

    // ===== 6. Upload Progress =====
    const progressBar = document.createElement('div');
    progressBar.className = 'admin-upload-progress';
    progressBar.style.display = 'none';
    progressBar.innerHTML = `
        <div class="admin-progress-fill" id="adminProgressFill"></div>
        <span class="admin-progress-text" id="adminProgressText">Uploading...</span>
    `;
    document.body.appendChild(progressBar);

    // =========================================
    // FUNCTIONS
    // =========================================

    // --- Intro Editor ---
    function openIntroEditor() {
        document.getElementById('adminModalTitle').textContent = 'Chỉnh sửa Giới thiệu';
        document.getElementById('adminModalBody').innerHTML = `
            <div class="admin-form-group">
                <label><i class="fas fa-flag"></i> Tiếng Việt</label>
                <textarea id="editIntroVi" rows="6">${translations.vi.hero_intro}</textarea>
            </div>
            <div class="admin-form-group">
                <label><i class="fas fa-globe"></i> English</label>
                <textarea id="editIntroEn" rows="6">${translations.en.hero_intro}</textarea>
            </div>
        `;
        document.getElementById('adminModalSave').onclick = saveIntro;
        modalOverlay.style.display = 'flex';
    }

    async function saveIntro() {
        const btn = document.getElementById('adminModalSave');
        const orig = btn.innerHTML;
        btn.innerHTML = '<span class="admin-spinner"></span> Đang lưu...';
        btn.disabled = true;

        try {
            const vi = document.getElementById('editIntroVi').value.trim();
            const en = document.getElementById('editIntroEn').value.trim();
            if (!vi || !en) { showToast('Vui lòng điền cả 2 ngôn ngữ!', 'error'); return; }

            await sb.from('settings').upsert({ key: 'intro_vi', value: vi, updated_at: new Date().toISOString() }, { onConflict: 'key' });
            await sb.from('settings').upsert({ key: 'intro_en', value: en, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            translations.vi.hero_intro = vi;
            translations.en.hero_intro = en;
            const lang = localStorage.getItem('portfolioLang') || 'en';
            applyLanguage(lang);

            showToast('Đã lưu nội dung thành công!');
            closeModal();
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error');
        } finally {
            btn.innerHTML = orig;
            btn.disabled = false;
        }
    }

    // --- Album: Add controls (delete + move) to each Supabase item ---
    function addItemControls(element) {
        element.style.position = 'relative';

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'admin-item-controls';
        controlsDiv.innerHTML = `
            <button class="admin-item-btn admin-item-move-left" title="Di chuyển sang trái">
                <i class="fas fa-arrow-left"></i>
            </button>
            <button class="admin-item-btn admin-item-move-right" title="Di chuyển sang phải">
                <i class="fas fa-arrow-right"></i>
            </button>
            <button class="admin-item-btn admin-item-delete" title="Xóa">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;

        // Delete
        controlsDiv.querySelector('.admin-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = element.dataset.id;
            const fp = element.dataset.filePath;
            deleteMedia(id, fp, element);
        });

        // Move Left
        controlsDiv.querySelector('.admin-item-move-left').addEventListener('click', (e) => {
            e.stopPropagation();
            const prev = element.previousElementSibling;
            if (prev) {
                element.parentNode.insertBefore(element, prev);
                saveAlbumOrder();
                showToast('Đã di chuyển!', 'info');
            }
        });

        // Move Right
        controlsDiv.querySelector('.admin-item-move-right').addEventListener('click', (e) => {
            e.stopPropagation();
            const next = element.nextElementSibling;
            if (next) {
                element.parentNode.insertBefore(next, element);
                saveAlbumOrder();
                showToast('Đã di chuyển!', 'info');
            }
        });

        element.appendChild(controlsDiv);
    }

    // --- Save album order to Supabase ---
    async function saveAlbumOrder() {
        const grid = document.querySelector('.masonry-grid');
        if (!grid) return;

        const items = grid.querySelectorAll('.masonry-item[data-source="supabase"]');
        let order = 0;
        for (const item of items) {
            const id = item.dataset.id;
            if (id) {
                await sb.from('album_items').update({ sort_order: order }).eq('id', parseInt(id));
                order++;
            }
        }
    }

    // --- Upload Media ---
    async function uploadMedia(files) {
        const total = files.length;
        let uploaded = 0;

        progressBar.style.display = 'flex';
        document.getElementById('adminProgressFill').style.width = '0%';
        document.getElementById('adminProgressText').textContent = `Đang upload 0/${total}...`;

        const { data: lastItem } = await sb.from('album_items').select('sort_order').order('sort_order', { ascending: false }).limit(1);
        let nextOrder = (lastItem && lastItem.length > 0) ? lastItem[0].sort_order + 1 : 0;

        for (const file of files) {
            try {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                const fileName = `${Date.now()}_${safeName}`;

                const { error } = await sb.storage.from('media').upload(fileName, file, { cacheControl: '3600' });
                if (error) { showToast('Lỗi upload: ' + error.message, 'error'); continue; }

                const { data: urlData } = sb.storage.from('media').getPublicUrl(fileName);
                const type = file.type.startsWith('video/') ? 'video' : 'image';

                const { data: insertData, error: insertErr } = await sb.from('album_items').insert({
                    type, url: urlData.publicUrl, file_path: fileName, sort_order: nextOrder
                }).select();

                if (insertErr) { showToast('Lỗi DB: ' + insertErr.message, 'error'); continue; }

                const itemData = insertData ? insertData[0] : { type, url: urlData.publicUrl, file_path: fileName };
                addItemToGrid(itemData);

                nextOrder++;
                uploaded++;
                const pct = Math.round((uploaded / total) * 100);
                document.getElementById('adminProgressFill').style.width = pct + '%';
                document.getElementById('adminProgressText').textContent = `Đang upload ${uploaded}/${total}...`;
            } catch (err) {
                showToast('Lỗi: ' + err.message, 'error');
            }
        }

        document.getElementById('adminProgressText').textContent = `Hoàn tất! ${uploaded}/${total} file.`;
        setTimeout(() => { progressBar.style.display = 'none'; }, 2500);
        document.getElementById('adminFileInput').value = '';
        if (uploaded > 0) showToast(`Upload thành công ${uploaded} file!`);
    }

    function addItemToGrid(item) {
        const grid = document.querySelector('.masonry-grid');
        if (!grid) return;

        const div = document.createElement('div');
        div.className = 'masonry-item';
        div.dataset.source = 'supabase';
        div.dataset.id = item.id || '';
        div.dataset.filePath = item.file_path || '';

        if (item.type === 'video') {
            div.dataset.type = 'video';
            div.innerHTML = `<video src="${item.url}" autoplay loop muted playsinline></video>`;
        } else {
            div.innerHTML = `<img loading="lazy" src="${item.url}" alt="Album Image">`;
        }

        addItemControls(div);

        // Modal click
        div.addEventListener('click', () => {
            const modal = document.getElementById('mediaModal');
            const modalImg = document.getElementById('modalImg');
            const modalVideo = document.getElementById('modalVideo');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            if (item.type === 'video') {
                modalImg.style.display = 'none';
                modalVideo.style.display = 'block';
                modalVideo.src = item.url;
                modalVideo.play();
            } else {
                modalVideo.style.display = 'none';
                modalVideo.pause();
                modalImg.style.display = 'block';
                modalImg.src = item.url;
            }
        });

        grid.appendChild(div);
    }

    // --- Delete Media ---
    async function deleteMedia(id, filePath, element) {
        if (!confirm('Bạn có chắc chắn muốn xóa ảnh/video này?')) return;
        try {
            if (filePath) await sb.storage.from('media').remove([filePath]);
            if (id) await sb.from('album_items').delete().eq('id', parseInt(id));
            element.style.transition = '0.3s';
            element.style.opacity = '0';
            element.style.transform = 'scale(0.8)';
            setTimeout(() => element.remove(), 300);
            showToast('Đã xóa thành công!');
        } catch (err) {
            showToast('Lỗi: ' + err.message, 'error');
        }
    }

    // --- Helpers ---
    function closeModal() { modalOverlay.style.display = 'none'; }

    function showToast(msg, type = 'success') {
        toastEl.textContent = msg;
        toastEl.className = `admin-toast ${type} show`;
        setTimeout(() => { toastEl.className = 'admin-toast'; }, 4000);
    }
})();
