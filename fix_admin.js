const fs = require('fs');
const path = 'd:/Ngoc selection/Ngọc/admin-mode.js';
let content = fs.readFileSync(path, 'utf8');

// Fix intro editor
content = content.replace(
    /await sb\.from\('settings'\)\.upsert\(\{ key: 'hero_subtitle'.*?\n.*?intro_vi.*?\n.*?intro_en.*?;/g,
    `const resSettings1 = await Promise.all([
                    sb.from('settings').upsert({ key: 'hero_subtitle', value: sub }, { onConflict: 'key' }),
                    sb.from('settings').upsert({ key: 'intro_vi', value: vi }, { onConflict: 'key' }),
                    sb.from('settings').upsert({ key: 'intro_en', value: en }, { onConflict: 'key' })
                ]);
                for (let r of resSettings1) if (r.error) throw r.error;`
);

// Fix contact editor
content = content.replace(
    /await sb\.from\('settings'\)\.upsert\(\{ key: 'contact_phone'.*?\n.*?contact_email.*?\n.*?contact_fb.*?\n.*?cv_url.*?;/g,
    `const resSettings2 = await Promise.all([
                    sb.from('settings').upsert({ key: 'contact_phone', value: document.getElementById('editPhone').value.trim() }, { onConflict: 'key' }),
                    sb.from('settings').upsert({ key: 'contact_email', value: document.getElementById('editEmail').value.trim() }, { onConflict: 'key' }),
                    sb.from('settings').upsert({ key: 'contact_fb', value: document.getElementById('editFb').value.trim() }, { onConflict: 'key' }),
                    sb.from('settings').upsert({ key: 'cv_url', value: document.getElementById('editCv').value.trim() }, { onConflict: 'key' })
                ]);
                for (let r of resSettings2) if (r.error) throw r.error;`
);

// Fix Exp Delete
content = content.replace(
    /await sb\.from\('experience_items'\)\.delete\(\)\.eq\('id', parseInt\(element\.dataset\.id\)\);\s*element\.remove\(\); showToast\('Đã xóa!'\);/g,
    `const { error } = await sb.from('experience_items').delete().eq('id', parseInt(element.dataset.id));
                if (error) return showToast('Lỗi xóa: ' + error.message, 'error');
                element.remove(); showToast('Đã xóa!');`
);

// Fix Exp Save
content = content.replace(
    /if \(id\) \{\s*await sb\.from\('experience_items'\)\.update\(data\)\.eq\('id', id\);\s*\} else \{\s*const \{ data: max \} = await sb\.from\('experience_items'\)\.select\('sort_order'\)\.order\('sort_order', \{ascending: false\}\)\.limit\(1\);\s*data\.sort_order = max && max\.length \? max\[0\]\.sort_order \+ 1 : 0;\s*await sb\.from\('experience_items'\)\.insert\(data\);\s*\}/g,
    `let res;
                if (id) {
                    res = await sb.from('experience_items').update(data).eq('id', parseInt(id));
                } else {
                    const { data: max } = await sb.from('experience_items').select('sort_order').order('sort_order', {ascending: false}).limit(1);
                    data.sort_order = max && max.length ? max[0].sort_order + 1 : 0;
                    res = await sb.from('experience_items').insert(data);
                }
                if (res.error) throw res.error;`
);

// Fix Skill Delete
content = content.replace(
    /await sb\.from\('skill_items'\)\.delete\(\)\.eq\('id', parseInt\(element\.dataset\.id\)\);\s*element\.remove\(\); showToast\('Đã xóa!'\);/g,
    `const { error } = await sb.from('skill_items').delete().eq('id', parseInt(element.dataset.id));
                if (error) return showToast('Lỗi xóa: ' + error.message, 'error');
                element.remove(); showToast('Đã xóa!');`
);

// Fix Skill Save
content = content.replace(
    /if \(id\) \{\s*await sb\.from\('skill_items'\)\.update\(data\)\.eq\('id', id\);\s*\} else \{\s*const \{ data: max \} = await sb\.from\('skill_items'\)\.select\('sort_order'\)\.order\('sort_order', \{ascending: false\}\)\.limit\(1\);\s*data\.sort_order = max && max\.length \? max\[0\]\.sort_order \+ 1 : 0;\s*await sb\.from\('skill_items'\)\.insert\(data\);\s*\}/g,
    `let res;
                if (id) {
                    res = await sb.from('skill_items').update(data).eq('id', parseInt(id));
                } else {
                    const { data: max } = await sb.from('skill_items').select('sort_order').order('sort_order', {ascending: false}).limit(1);
                    data.sort_order = max && max.length ? max[0].sort_order + 1 : 0;
                    res = await sb.from('skill_items').insert(data);
                }
                if (res.error) throw res.error;`
);

// Fix Album Delete
content = content.replace(
    /if \(fp && fp !== 'undefined'\) await sb\.storage\.from\('media'\)\.remove\(\[fp\]\);\s*await sb\.from\('album_items'\)\.delete\(\)\.eq\('id', parseInt\(element\.dataset\.id\)\);/g,
    `if (fp && fp !== 'undefined') {
                    const { error: errStorage } = await sb.storage.from('media').remove([fp]);
                    if (errStorage) console.log("Storage err:", errStorage);
                }
                const { error } = await sb.from('album_items').delete().eq('id', parseInt(element.dataset.id));
                if (error) throw error;`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced successfully!");
