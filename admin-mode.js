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

    // ===== Initialize all controls once dynamic data is loaded =====
    window.addEventListener('dynamicDataLoaded', () => {
        setupHeroAdmin();
        setupContactAdmin();
        setupExperienceAdmin();
        setupSkillsAdmin();
    });

    // We also need to setup album controls when album loads
    window.addEventListener('albumLoaded', () => {
        setupAlbumAdmin();
    });

    // Fallback if events were fired before admin-mode loaded
    setTimeout(() => {
        setupHeroAdmin();
        setupContactAdmin();
        setupExperienceAdmin();
        setupSkillsAdmin();
        setupAlbumAdmin();
    }, 1500);

    // =========================================
    // SECTION SETUPS
    // =========================================

    function setupHeroAdmin() {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && !heroContent.querySelector('.admin-edit-btn')) {
            heroContent.style.position = 'relative';
            const editBtn = document.createElement('button');
            editBtn.className = 'admin-edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa Giới thiệu';
            editBtn.addEventListener('click', (e) => { e.stopPropagation(); openIntroEditor(); });
            heroContent.appendChild(editBtn);
        }

        const heroImage = document.querySelector('.hero-image');
        if (heroImage && !heroImage.querySelector('.admin-edit-btn')) {
            heroImage.style.position = 'relative';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            heroImage.appendChild(fileInput);

            const editBtn = document.createElement('button');
            editBtn.className = 'admin-edit-btn';
            editBtn.innerHTML = '<i class="fas fa-camera"></i>';
            editBtn.title = 'Thay đổi Ảnh đại diện';
            editBtn.style.top = '20px';
            editBtn.style.right = '20px';
            editBtn.style.zIndex = '10';
            editBtn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                fileInput.click();
            });
            heroImage.appendChild(editBtn);

            fileInput.addEventListener('change', async function() {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    showToast('Đang tải ảnh lên...', 'info');
                    try {
                        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                        const fileName = `hero_${Date.now()}_${safeName}`;
                        const { error } = await sb.storage.from('media').upload(fileName, file, { cacheControl: '3600' });
                        if (error) throw error;
                        
                        const { data: urlData } = sb.storage.from('media').getPublicUrl(fileName);
                        await sb.from('settings').upsert({ key: 'hero_image_url', value: urlData.publicUrl }, { onConflict: 'key' });
                        
                        const img = heroImage.querySelector('img');
                        if (img) img.src = urlData.publicUrl;
                        showToast('Đã thay đổi ảnh đại diện thành công!');
                    } catch (err) {
                        showToast('Lỗi upload: ' + err.message, 'error');
                    }
                    this.value = '';
                }
            });
        }
    }

    function setupContactAdmin() {
        const contactSection = document.querySelector('.contact-container');
        if (contactSection && !contactSection.querySelector('.admin-edit-btn')) {
            contactSection.style.position = 'relative';
            const editBtn = document.createElement('button');
            editBtn.className = 'admin-edit-btn';
            editBtn.innerHTML = '<i class="fas fa-pen"></i>';
            editBtn.title = 'Chỉnh sửa Thông tin liên hệ';
            editBtn.addEventListener('click', (e) => { e.stopPropagation(); openContactEditor(); });
            contactSection.appendChild(editBtn);
        }
    }

    function setupExperienceAdmin() {
        const expSection = document.getElementById('experience');
        if (!expSection) return;
        const title = expSection.querySelector('.section-title');
        if (title && !expSection.querySelector('.admin-add-btn')) {
            const controls = document.createElement('div');
            controls.className = 'admin-album-controls';
            controls.innerHTML = `
                <button class="admin-add-btn" id="btnAddExp">
                    <i class="fas fa-plus-circle"></i> Thêm Kinh Nghiệm
                </button>
            `;
            title.after(controls);
            document.getElementById('btnAddExp').addEventListener('click', () => openExpEditor());
        }

        const grid = document.getElementById('experienceGrid');
        if (grid) {
            const attach = () => {
                grid.querySelectorAll('.timeline-item').forEach(item => {
                    if (!item.querySelector('.admin-item-controls')) addExpControls(item);
                });
            };
            attach();
            new MutationObserver(attach).observe(grid, { childList: true });
            
            if (!grid.dataset.sortable) {
                Sortable.create(grid, {
                    animation: 150,
                    delay: 200,
                    delayOnTouchOnly: true,
                    onEnd: saveExpOrder
                });
                grid.dataset.sortable = 'true';
            }
        }
    }

    function setupSkillsAdmin() {
        const skillsSection = document.getElementById('skills');
        if (!skillsSection) return;
        const title = skillsSection.querySelector('.section-title');
        if (title && !skillsSection.querySelector('.admin-add-btn')) {
            const controls = document.createElement('div');
            controls.className = 'admin-album-controls';
            controls.innerHTML = `
                <button class="admin-add-btn" id="btnAddSkill">
                    <i class="fas fa-plus-circle"></i> Thêm Kỹ Năng
                </button>
            `;
            title.after(controls);
            document.getElementById('btnAddSkill').addEventListener('click', () => openSkillEditor());
        }

        const grid = document.getElementById('skillsGrid');
        if (grid) {
            const attach = () => {
                grid.querySelectorAll('.skill-card').forEach(item => {
                    if (!item.querySelector('.admin-item-controls')) addSkillControls(item);
                });
            };
            attach();
            new MutationObserver(attach).observe(grid, { childList: true });

            if (!grid.dataset.sortable) {
                Sortable.create(grid, {
                    animation: 150,
                    delay: 200,
                    delayOnTouchOnly: true,
                    onEnd: saveSkillOrder
                });
                grid.dataset.sortable = 'true';
            }
        }
    }

    function setupAlbumAdmin() {
        const albumSection = document.getElementById('album');
        if (!albumSection) return;
        const albumTitle = albumSection.querySelector('.section-title');
        if (albumTitle && !albumSection.querySelector('.admin-add-btn')) {
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

        const grid = document.querySelector('.masonry-grid');
        if (grid) {
            const attach = () => {
                grid.querySelectorAll('.masonry-item').forEach(item => {
                    if (!item.querySelector('.admin-item-controls')) addItemControls(item);
                });
            };
            attach();
            new MutationObserver(attach).observe(grid, { childList: true });

            if (!grid.dataset.sortable) {
                Sortable.create(grid, {
                    animation: 150,
                    delay: 200,
                    delayOnTouchOnly: true,
                    onEnd: saveAlbumOrder
                });
                grid.dataset.sortable = 'true';
            }
        }
    }

    // =========================================
    // MODAL HTML
    // =========================================
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
                    <i class="fas fa-save"></i> Lưu
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    document.getElementById('adminModalClose').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    const toastEl = document.createElement('div');
    toastEl.className = 'admin-toast';
    document.body.appendChild(toastEl);

    // =========================================
    // HERO / INTRO EDITOR
    // =========================================
    function openIntroEditor() {
        document.getElementById('adminModalTitle').textContent = 'Giới thiệu & Chức danh';
        document.getElementById('adminModalBody').innerHTML = `
            <div class="admin-form-group">
                <label>Chức danh (VD: DIGITAL CREATOR & TALENT)</label>
                <input type="text" id="editSubtitle" class="admin-input" value="${translations.vi.hero_subtitle || 'DIGITAL CREATOR & TALENT'}">
            </div>
            <div class="admin-form-group">
                <label><i class="fas fa-flag"></i> Giới thiệu (Tiếng Việt)</label>
                <textarea id="editIntroVi" rows="5">${translations.vi.hero_intro || ''}</textarea>
            </div>
            <div class="admin-form-group">
                <label><i class="fas fa-globe"></i> Giới thiệu (English)</label>
                <textarea id="editIntroEn" rows="5">${translations.en.hero_intro || ''}</textarea>
            </div>
        `;
        document.getElementById('adminModalSave').onclick = async () => {
            const btn = document.getElementById('adminModalSave');
            btn.disabled = true; btn.innerHTML = 'Đang lưu...';
            try {
                const sub = document.getElementById('editSubtitle').value.trim();
                const vi = document.getElementById('editIntroVi').value.trim();
                const en = document.getElementById('editIntroEn').value.trim();
                
                await sb.from('settings').upsert({ key: 'hero_subtitle', value: sub }, { onConflict: 'key' });
                await sb.from('settings').upsert({ key: 'intro_vi', value: vi }, { onConflict: 'key' });
                await sb.from('settings').upsert({ key: 'intro_en', value: en }, { onConflict: 'key' });
                
                showToast('Đã lưu! Tải lại trang để xem thay đổi.');
                closeModal();
                setTimeout(() => window.location.reload(), 1500);
            } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        };
        modalOverlay.style.display = 'flex';
    }

    // =========================================
    // CONTACT EDITOR
    // =========================================
    function openContactEditor() {
        document.getElementById('adminModalTitle').textContent = 'Thông tin liên hệ & CV';
        document.getElementById('adminModalBody').innerHTML = `
            <div class="admin-form-group">
                <label>Số điện thoại</label>
                <input type="text" id="editPhone" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Email</label>
                <input type="text" id="editEmail" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Link Facebook</label>
                <input type="text" id="editFb" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>File CV (PDF)</label>
                <div style="display: flex; gap: 10px;">
                    <input type="text" id="editCv" class="admin-input" placeholder="Chưa có CV" readonly style="flex: 1;">
                    <button id="btnUploadCv" type="button" class="admin-save-btn" style="width: auto; padding: 0 15px; margin: 0;"><i class="fas fa-upload"></i> Tải PDF</button>
                    <input type="file" id="cvFileInput" accept="application/pdf" hidden>
                </div>
            </div>
        `;
        
        const pEl = document.getElementById('phoneItem');
        if (pEl) document.getElementById('editPhone').value = pEl.textContent.trim();
        const eEl = document.getElementById('emailItem');
        if (eEl) document.getElementById('editEmail').value = eEl.textContent.trim();
        const fEl = document.getElementById('fbItem');
        if (fEl) document.getElementById('editFb').value = fEl.href;
        
        // Wait for modal to render to attach events
        setTimeout(() => {
            const btnUploadCv = document.getElementById('btnUploadCv');
            const cvFileInput = document.getElementById('cvFileInput');
            const editCv = document.getElementById('editCv');
            
            // Get current CV URL from Supabase Settings instead of DOM to be safe
            sb.from('settings').select('value').eq('key', 'cv_url').single().then(({data}) => {
                if (data && data.value) editCv.value = data.value;
            });

            btnUploadCv.addEventListener('click', () => cvFileInput.click());
            
            cvFileInput.addEventListener('change', async function() {
                if (this.files.length > 0) {
                    const file = this.files[0];
                    if (file.type !== 'application/pdf') return showToast('Chỉ hỗ trợ file PDF!', 'error');
                    btnUploadCv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    btnUploadCv.disabled = true;
                    try {
                        const fileName = \`cv_\${Date.now()}.pdf\`;
                        const { error } = await sb.storage.from('media').upload(fileName, file, { cacheControl: '3600' });
                        if (error) throw error;
                        const { data: urlData } = sb.storage.from('media').getPublicUrl(fileName);
                        editCv.value = urlData.publicUrl;
                        showToast('Tải CV lên thành công! Đừng quên bấm Lưu.');
                    } catch(err) {
                        showToast('Lỗi upload: ' + err.message, 'error');
                    }
                    btnUploadCv.innerHTML = '<i class="fas fa-upload"></i> Tải PDF';
                    btnUploadCv.disabled = false;
                }
            });
        }, 100);

        document.getElementById('adminModalSave').onclick = async () => {
            const btn = document.getElementById('adminModalSave');
            btn.disabled = true; btn.innerHTML = 'Đang lưu...';
            try {
                await sb.from('settings').upsert({ key: 'contact_phone', value: document.getElementById('editPhone').value.trim() }, { onConflict: 'key' });
                await sb.from('settings').upsert({ key: 'contact_email', value: document.getElementById('editEmail').value.trim() }, { onConflict: 'key' });
                await sb.from('settings').upsert({ key: 'contact_fb', value: document.getElementById('editFb').value.trim() }, { onConflict: 'key' });
                await sb.from('settings').upsert({ key: 'cv_url', value: document.getElementById('editCv').value.trim() }, { onConflict: 'key' });
                
                showToast('Đã lưu! Tải lại trang để xem thay đổi.');
                closeModal();
                setTimeout(() => window.location.reload(), 1500);
            } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Lưu';
        };
        modalOverlay.style.display = 'flex';
    }

    // =========================================
    // EXPERIENCE CONTROLS
    // =========================================
    function addExpControls(element) {
        element.style.position = 'relative';
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'admin-item-controls';
        controlsDiv.style.top = '10px'; controlsDiv.style.right = '10px';
        controlsDiv.innerHTML = `
            <button class="admin-item-btn admin-item-edit" title="Sửa"><i class="fas fa-pen"></i></button>
            <button class="admin-item-btn admin-item-delete" title="Xóa"><i class="fas fa-trash-alt"></i></button>
        `;

        controlsDiv.querySelector('.admin-item-edit').addEventListener('click', (e) => {
            e.stopPropagation(); openExpEditor(element.dataset.id, element);
        });
        controlsDiv.querySelector('.admin-item-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Xóa mốc kinh nghiệm này?')) {
                await sb.from('experience_items').delete().eq('id', element.dataset.id);
                element.remove(); showToast('Đã xóa!');
            }
        });

        element.appendChild(controlsDiv);
    }

    async function saveExpOrder() {
        const items = document.querySelectorAll('#experienceGrid .timeline-item');
        let order = 0;
        for (const item of items) {
            await sb.from('experience_items').update({ sort_order: order }).eq('id', item.dataset.id);
            order++;
        }
    }

    function openExpEditor(id = null, element = null) {
        document.getElementById('adminModalTitle').textContent = id ? 'Sửa Kinh Nghiệm' : 'Thêm Kinh Nghiệm';
        document.getElementById('adminModalBody').innerHTML = `
            <div class="admin-form-group">
                <label>Tên Đơn Vị / Công Ty</label>
                <input type="text" id="expCompany" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Năm (VD: 2025 hoặc 2024 - Hiện tại)</label>
                <input type="text" id="expYear" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Vai trò (Tiếng Việt)</label>
                <input type="text" id="expRoleVi" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Vai trò (English)</label>
                <input type="text" id="expRoleEn" class="admin-input">
            </div>
        `;

        if (element) {
            document.getElementById('expCompany').value = element.querySelector('h3').textContent;
            document.getElementById('expYear').value = element.querySelector('.year').textContent;
            document.getElementById('expRoleVi').value = element.querySelector('.role').getAttribute('data-vi');
            document.getElementById('expRoleEn').value = element.querySelector('.role').getAttribute('data-en');
        }

        document.getElementById('adminModalSave').onclick = async () => {
            const data = {
                company: document.getElementById('expCompany').value.trim(),
                year: document.getElementById('expYear').value.trim(),
                role_vi: document.getElementById('expRoleVi').value.trim(),
                role_en: document.getElementById('expRoleEn').value.trim()
            };
            if (!data.company || !data.role_vi) return showToast('Vui lòng điền đủ thông tin!', 'error');

            const btn = document.getElementById('adminModalSave');
            btn.disabled = true; btn.innerHTML = 'Đang lưu...';
            try {
                if (id) {
                    await sb.from('experience_items').update(data).eq('id', id);
                } else {
                    const { data: max } = await sb.from('experience_items').select('sort_order').order('sort_order', {ascending: false}).limit(1);
                    data.sort_order = max && max.length ? max[0].sort_order + 1 : 0;
                    await sb.from('experience_items').insert(data);
                }
                showToast('Đã lưu thành công!');
                closeModal();
                setTimeout(() => window.location.reload(), 1000);
            } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
        };
        modalOverlay.style.display = 'flex';
    }

    // =========================================
    // SKILLS CONTROLS
    // =========================================
    function addSkillControls(element) {
        element.style.position = 'relative';
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'admin-item-controls';
        controlsDiv.style.top = '10px'; controlsDiv.style.right = '10px';
        controlsDiv.innerHTML = `
            <button class="admin-item-btn admin-item-edit" title="Sửa"><i class="fas fa-pen"></i></button>
            <button class="admin-item-btn admin-item-delete" title="Xóa"><i class="fas fa-trash-alt"></i></button>
        `;

        controlsDiv.querySelector('.admin-item-edit').addEventListener('click', (e) => {
            e.stopPropagation(); openSkillEditor(element.dataset.id, element);
        });
        controlsDiv.querySelector('.admin-item-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Xóa kỹ năng này?')) {
                await sb.from('skill_items').delete().eq('id', element.dataset.id);
                element.remove(); showToast('Đã xóa!');
            }
        });

        element.appendChild(controlsDiv);
    }

    async function saveSkillOrder() {
        const items = document.querySelectorAll('#skillsGrid .skill-card');
        let order = 0;
        for (const item of items) {
            await sb.from('skill_items').update({ sort_order: order }).eq('id', item.dataset.id);
            order++;
        }
    }

    function openSkillEditor(id = null, element = null) {
        document.getElementById('adminModalTitle').textContent = id ? 'Sửa Kỹ Năng' : 'Thêm Kỹ Năng';
        document.getElementById('adminModalBody').innerHTML = `
            <div class="admin-form-group">
                <label>Tên Kỹ Năng (VD: Videography)</label>
                <input type="text" id="skillTitle" class="admin-input">
            </div>
            <div class="admin-form-group">
                <label>Class của Icon (FontAwesome) VD: fas fa-camera</label>
                <input type="text" id="skillIcon" class="admin-input" placeholder="fas fa-star">
            </div>
            <div class="admin-form-group">
                <label>Mô tả chi tiết (Tiếng Việt)</label>
                <textarea id="skillDescVi" rows="3"></textarea>
            </div>
            <div class="admin-form-group">
                <label>Mô tả chi tiết (English)</label>
                <textarea id="skillDescEn" rows="3"></textarea>
            </div>
        `;

        if (element) {
            document.getElementById('skillTitle').value = element.querySelector('h3').textContent;
            document.getElementById('skillIcon').value = element.querySelector('i').className.replace(' skill-icon', '');
            document.getElementById('skillDescVi').value = element.querySelector('p').getAttribute('data-vi');
            document.getElementById('skillDescEn').value = element.querySelector('p').getAttribute('data-en');
        }

        document.getElementById('adminModalSave').onclick = async () => {
            const data = {
                title_en: document.getElementById('skillTitle').value.trim(),
                icon_class: document.getElementById('skillIcon').value.trim() || 'fas fa-star',
                desc_vi: document.getElementById('skillDescVi').value.trim(),
                desc_en: document.getElementById('skillDescEn').value.trim()
            };
            if (!data.title_en) return showToast('Vui lòng nhập tên kỹ năng!', 'error');

            const btn = document.getElementById('adminModalSave');
            btn.disabled = true; btn.innerHTML = 'Đang lưu...';
            try {
                if (id) {
                    await sb.from('skill_items').update(data).eq('id', id);
                } else {
                    const { data: max } = await sb.from('skill_items').select('sort_order').order('sort_order', {ascending: false}).limit(1);
                    data.sort_order = max && max.length ? max[0].sort_order + 1 : 0;
                    await sb.from('skill_items').insert(data);
                }
                showToast('Đã lưu thành công!');
                closeModal();
                setTimeout(() => window.location.reload(), 1000);
            } catch(e) { showToast('Lỗi: ' + e.message, 'error'); }
        };
        modalOverlay.style.display = 'flex';
    }

    // =========================================
    // ALBUM CONTROLS
    // =========================================
    function addItemControls(element) {
        element.style.position = 'relative';
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'admin-item-controls';
        controlsDiv.innerHTML = `
            <button class="admin-item-btn admin-item-delete" title="Xóa"><i class="fas fa-trash-alt"></i></button>
        `;

        controlsDiv.querySelector('.admin-item-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!confirm('Bạn có chắc chắn muốn xóa ảnh/video này?')) return;
            try {
                const fp = element.dataset.filePath;
                if (fp && fp !== 'undefined') await sb.storage.from('media').remove([fp]);
                await sb.from('album_items').delete().eq('id', parseInt(element.dataset.id));
                element.remove(); showToast('Đã xóa thành công!');
            } catch(err) { showToast('Lỗi: ' + err.message, 'error'); }
        });

        element.appendChild(controlsDiv);
    }

    async function saveAlbumOrder() {
        const items = document.querySelectorAll('#albumGrid .masonry-item');
        let order = 0;
        for (const item of items) {
            if (item.dataset.id) {
                await sb.from('album_items').update({ sort_order: order }).eq('id', parseInt(item.dataset.id));
                order++;
            }
        }
        showToast('Đã lưu vị trí!', 'info');
    }

    // --- Upload Media ---
    const progressBar = document.createElement('div');
    progressBar.className = 'admin-upload-progress';
    progressBar.style.display = 'none';
    progressBar.innerHTML = `
        <div class="admin-progress-fill" id="adminProgressFill"></div>
        <span class="admin-progress-text" id="adminProgressText">Uploading...</span>
    `;
    document.body.appendChild(progressBar);

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
                    type, url: urlData.publicUrl, file_path: fileName, sort_order: nextOrder, category: 'all'
                }).select();

                if (insertErr) { showToast('Lỗi DB: ' + insertErr.message, 'error'); continue; }

                nextOrder++; uploaded++;
                const pct = Math.round((uploaded / total) * 100);
                document.getElementById('adminProgressFill').style.width = pct + '%';
                document.getElementById('adminProgressText').textContent = `Đang upload ${uploaded}/${total}...`;
            } catch (err) { showToast('Lỗi: ' + err.message, 'error'); }
        }

        document.getElementById('adminProgressText').textContent = `Hoàn tất! ${uploaded}/${total} file.`;
        setTimeout(() => { 
            progressBar.style.display = 'none'; 
            window.location.reload(); 
        }, 1500);
    }

    // =========================================
    // HELPERS
    // =========================================
    function closeModal() { modalOverlay.style.display = 'none'; }

    function showToast(msg, type = 'success') {
        toastEl.textContent = msg;
        toastEl.className = `admin-toast ${type} show`;
        setTimeout(() => { toastEl.className = 'admin-toast'; }, 4000);
    }
})();
