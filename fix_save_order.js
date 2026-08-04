const fs = require('fs');
const path = 'd:/Ngoc selection/Ngọc/admin-mode.js';
let content = fs.readFileSync(path, 'utf8');

// Replace saveExpOrder
content = content.replace(
    /async function saveExpOrder\(\) \{\s*const items = document\.querySelectorAll\('#experienceGrid \.timeline-item'\);\s*let order = 0;\s*for \(const item of items\) \{\s*await sb\.from\('experience_items'\)\.update\(\{ sort_order: order \}\)\.eq\('id', item\.dataset\.id\);\s*order\+\+;\s*\}\s*\}/g,
    `async function saveExpOrder() {
        const items = document.querySelectorAll('#experienceGrid .timeline-item');
        let order = 0;
        try {
            const promises = [];
            for (const item of items) {
                if (item.dataset.id) promises.push(sb.from('experience_items').update({ sort_order: order }).eq('id', parseInt(item.dataset.id)));
                order++;
            }
            const results = await Promise.all(promises);
            for (let r of results) if (r.error) throw r.error;
        } catch(e) { showToast('Lỗi lưu thứ tự: ' + e.message, 'error'); }
    }`
);

// Replace saveSkillOrder
content = content.replace(
    /async function saveSkillOrder\(\) \{\s*const items = document\.querySelectorAll\('#skillsGrid \.skill-card'\);\s*let order = 0;\s*for \(const item of items\) \{\s*await sb\.from\('skill_items'\)\.update\(\{ sort_order: order \}\)\.eq\('id', item\.dataset\.id\);\s*order\+\+;\s*\}\s*\}/g,
    `async function saveSkillOrder() {
        const items = document.querySelectorAll('#skillsGrid .skill-card');
        let order = 0;
        try {
            const promises = [];
            for (const item of items) {
                if (item.dataset.id) promises.push(sb.from('skill_items').update({ sort_order: order }).eq('id', parseInt(item.dataset.id)));
                order++;
            }
            const results = await Promise.all(promises);
            for (let r of results) if (r.error) throw r.error;
        } catch(e) { showToast('Lỗi lưu thứ tự: ' + e.message, 'error'); }
    }`
);

// Replace saveAlbumOrder
content = content.replace(
    /async function saveAlbumOrder\(\) \{\s*const items = document\.querySelectorAll\('#albumGrid \.masonry-item'\);\s*let order = 0;\s*for \(const item of items\) \{\s*if \(item\.dataset\.id\) \{\s*await sb\.from\('album_items'\)\.update\(\{ sort_order: order \}\)\.eq\('id', parseInt\(item\.dataset\.id\)\);\s*order\+\+;\s*\}\s*\}\s*showToast\('Đã lưu vị trí!', 'info'\);\s*\}/g,
    `async function saveAlbumOrder() {
        const items = document.querySelectorAll('#albumGrid .masonry-item');
        let order = 0;
        try {
            const promises = [];
            for (const item of items) {
                if (item.dataset.id) promises.push(sb.from('album_items').update({ sort_order: order }).eq('id', parseInt(item.dataset.id)));
                order++;
            }
            const results = await Promise.all(promises);
            for (let r of results) if (r.error) throw r.error;
            showToast('Đã lưu vị trí!', 'info');
        } catch(e) { showToast('Lỗi lưu vị trí: ' + e.message, 'error'); }
    }`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced saveOrder functions");
