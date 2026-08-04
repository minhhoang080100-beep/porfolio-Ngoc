const fs = require('fs');
const path = 'd:/Ngoc selection/Ngọc/admin-mode.js';
let content = fs.readFileSync(path, 'utf8');

const confirmHtml = `
    const confirmOverlay = document.createElement('div');
    confirmOverlay.className = 'admin-modal-overlay';
    confirmOverlay.style.display = 'none';
    confirmOverlay.style.zIndex = '10000';
    confirmOverlay.innerHTML = \`
        <div class="admin-modal" style="max-width: 400px; text-align: center; padding: 2rem;">
            <div style="font-size: 3rem; color: #e74c3c; margin-bottom: 1rem;"><i class="fas fa-exclamation-triangle"></i></div>
            <h3 style="margin-bottom: 1rem; font-size: 1.3rem;">Xác nhận xóa</h3>
            <p id="adminConfirmMessage" style="margin-bottom: 2rem; color: #666;"></p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                <button id="adminConfirmCancel" class="admin-save-btn" style="background: #eee; color: #333;"><i class="fas fa-times"></i> Hủy</button>
                <button id="adminConfirmOk" class="admin-save-btn" style="background: #e74c3c;"><i class="fas fa-trash-alt"></i> Xóa</button>
            </div>
        </div>
    \`;
    document.body.appendChild(confirmOverlay);

    function adminConfirm(message) {
        return new Promise((resolve) => {
            document.getElementById('adminConfirmMessage').textContent = message;
            confirmOverlay.style.display = 'flex';
            
            const btnOk = document.getElementById('adminConfirmOk');
            const btnCancel = document.getElementById('adminConfirmCancel');
            
            const cleanup = () => {
                confirmOverlay.style.display = 'none';
                btnOk.replaceWith(btnOk.cloneNode(true));
                btnCancel.replaceWith(btnCancel.cloneNode(true));
            };
            
            btnOk.addEventListener('click', () => { cleanup(); resolve(true); });
            btnCancel.addEventListener('click', () => { cleanup(); resolve(false); });
        });
    }
`;

// Insert the confirmHtml after toastEl
content = content.replace(
    /const toastEl = document\.createElement\('div'\);\s*toastEl\.className = 'admin-toast';\s*document\.body\.appendChild\(toastEl\);/g,
    `const toastEl = document.createElement('div');
    toastEl.className = 'admin-toast';
    document.body.appendChild(toastEl);
    ${confirmHtml}`
);

// Replace confirms
content = content.replace(
    /if \(confirm\('Xóa mốc kinh nghiệm này\?'\)\) \{/g,
    `if (await adminConfirm('Bạn có chắc chắn muốn xóa mốc kinh nghiệm này không? Hành động này không thể hoàn tác.')) {`
);

content = content.replace(
    /if \(confirm\('Xóa kỹ năng này\?'\)\) \{/g,
    `if (await adminConfirm('Bạn có chắc chắn muốn xóa kỹ năng này không? Hành động này không thể hoàn tác.')) {`
);

content = content.replace(
    /if \(\!confirm\('Bạn có chắc chắn muốn xóa ảnh\/video này\?'\)\) return;/g,
    `if (!(await adminConfirm('Bạn có chắc chắn muốn xóa ảnh/video này không? Hành động này không thể hoàn tác.'))) return;`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Custom confirm modal added!");
