// admin.js — Supabase Admin Panel Logic

// ===== Config =====
const SUPABASE_URL = 'https://ppzosahycxznuxeerfts.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ff32PbO6HnaGMkqmEXP_WA_pPc4TMNn';
const ADMIN_PIN = '0801';

// ===== Init Supabase =====
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM Refs =====
const pinOverlay = document.getElementById('pinOverlay');
const adminPanel = document.getElementById('adminPanel');
const pinInput = document.getElementById('pinInput');
const pinError = document.getElementById('pinError');
const btnPin = document.getElementById('btnPin');
const toastEl = document.getElementById('toast');

// ===== PIN Logic =====
btnPin.addEventListener('click', checkPin);
pinInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPin(); });

function checkPin() {
    if (pinInput.value === ADMIN_PIN) {
        pinOverlay.style.display = 'none';
        adminPanel.style.display = 'block';
        loadAll();
    } else {
        pinError.style.display = 'block';
        pinInput.classList.add('shake');
        setTimeout(() => pinInput.classList.remove('shake'), 500);
    }
}

// ===== Tab Navigation =====
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ===== Load All Data =====
async function loadAll() {
    await loadSettings();
    await loadAlbum();
}

// ===== SETTINGS (Intro Text) =====
async function loadSettings() {
    try {
        const { data, error } = await sb.from('settings').select('*');
        if (error) throw error;
        if (data) {
            data.forEach(item => {
                if (item.key === 'intro_vi') document.getElementById('introVi').value = item.value;
                if (item.key === 'intro_en') document.getElementById('introEn').value = item.value;
            });
        }
    } catch (err) {
        console.error('Load settings error:', err);
    }
}

document.getElementById('btnSaveContent').addEventListener('click', async function() {
    const btn = this;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Đang lưu...';
    btn.disabled = true;

    try {
        const introVi = document.getElementById('introVi').value.trim();
        const introEn = document.getElementById('introEn').value.trim();

        if (!introVi || !introEn) {
            showToast('Vui lòng điền cả 2 ngôn ngữ!', 'error');
            return;
        }

        // Upsert Vietnamese
        await sb.from('settings').upsert(
            { key: 'intro_vi', value: introVi, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
        );

        // Upsert English
        await sb.from('settings').upsert(
            { key: 'intro_en', value: introEn, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
        );

        showToast('Đã lưu nội dung thành công! Trang chủ sẽ cập nhật ngay.', 'success');
    } catch (err) {
        console.error('Save error:', err);
        showToast('Lỗi khi lưu: ' + err.message, 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
});

// ===== ALBUM MANAGEMENT =====
async function loadAlbum() {
    const grid = document.getElementById('albumGrid');
    const emptyState = document.getElementById('emptyState');

    try {
        const { data, error } = await sb.from('album_items').select('*').order('sort_order', { ascending: true });
        if (error) throw error;

        grid.innerHTML = '';

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-photo-video"></i>
                    <p>Chưa có ảnh/video nào. Hãy upload ảnh đầu tiên!</p>
                </div>`;
            return;
        }

        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'album-card';

            if (item.type === 'video') {
                card.innerHTML = `
                    <video src="${item.url}" muted loop playsinline 
                        onmouseenter="this.play()" onmouseleave="this.pause()"></video>
                    <span class="type-badge"><i class="fas fa-video"></i> Video</span>
                    <button class="delete-btn" title="Xóa"><i class="fas fa-trash-alt"></i></button>`;
            } else {
                card.innerHTML = `
                    <img src="${item.url}" alt="Album" loading="lazy">
                    <button class="delete-btn" title="Xóa"><i class="fas fa-trash-alt"></i></button>`;
            }

            // Delete event
            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteAlbumItem(item.id, item.file_path);
            });

            grid.appendChild(card);
        });

    } catch (err) {
        console.error('Load album error:', err);
        showToast('Lỗi tải album: ' + err.message, 'error');
    }
}

// ===== FILE UPLOAD =====
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Click to upload
uploadZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'INPUT') fileInput.click();
});

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
    }
});

// File input change
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        uploadFiles(fileInput.files);
    }
});

async function uploadFiles(files) {
    const totalFiles = files.length;
    let uploaded = 0;

    uploadProgress.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = `Đang upload 0/${totalFiles} file...`;

    // Get current max sort_order
    const { data: lastItem } = await sb
        .from('album_items')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
    let nextOrder = (lastItem && lastItem.length > 0) ? lastItem[0].sort_order + 1 : 0;

    for (const file of files) {
        try {
            const timestamp = Date.now();
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${timestamp}_${safeName}`;

            // Upload to Supabase Storage
            const { data, error } = await sb.storage.from('media').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (error) {
                console.error('Upload error for', file.name, error);
                showToast(`Lỗi upload "${file.name}": ${error.message}`, 'error');
                continue;
            }

            // Get public URL
            const { data: urlData } = sb.storage.from('media').getPublicUrl(fileName);
            const publicUrl = urlData.publicUrl;

            // Determine type
            const type = file.type.startsWith('video/') ? 'video' : 'image';

            // Insert into album_items table
            const { error: insertError } = await sb.from('album_items').insert({
                type: type,
                url: publicUrl,
                file_path: fileName,
                sort_order: nextOrder
            });

            if (insertError) {
                console.error('Insert error:', insertError);
                continue;
            }

            nextOrder++;
            uploaded++;

            // Update progress
            const percent = Math.round((uploaded / totalFiles) * 100);
            progressFill.style.width = percent + '%';
            progressText.textContent = `Đang upload ${uploaded}/${totalFiles} file...`;

        } catch (err) {
            console.error('Upload error:', err);
            showToast(`Lỗi upload "${file.name}"`, 'error');
        }
    }

    // Done
    progressText.textContent = `Hoàn tất! Đã upload ${uploaded}/${totalFiles} file.`;
    setTimeout(() => { uploadProgress.style.display = 'none'; }, 2000);

    // Reset file input
    fileInput.value = '';

    // Reload album grid
    await loadAlbum();

    if (uploaded > 0) {
        showToast(`Upload thành công ${uploaded} file! Trang chủ đã cập nhật.`, 'success');
    }
}

// ===== DELETE ALBUM ITEM =====
async function deleteAlbumItem(id, filePath) {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh/video này không?')) return;

    try {
        // Delete from storage
        if (filePath) {
            await sb.storage.from('media').remove([filePath]);
        }

        // Delete from database
        const { error } = await sb.from('album_items').delete().eq('id', id);
        if (error) throw error;

        // Reload grid
        await loadAlbum();
        showToast('Đã xóa thành công!', 'success');

    } catch (err) {
        console.error('Delete error:', err);
        showToast('Lỗi khi xóa: ' + err.message, 'error');
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type} show`;
    setTimeout(() => { toastEl.className = 'toast'; }, 4000);
}
