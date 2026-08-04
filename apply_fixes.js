const fs = require('fs');

// --- 1. Modify index.html ---
let indexHtml = fs.readFileSync('d:/Ngoc selection/Ngọc/index.html', 'utf8');
if (!indexHtml.includes('id="errorOverlay"')) {
    const errorOverlayHtml = `
    <!-- Error State Overlay -->
    <div id="errorOverlay" class="error-overlay" style="display: none;">
        <i class="fas fa-plug"></i>
        <h2 data-i18n="error_title">Hệ thống đang bảo trì</h2>
        <p data-i18n="error_desc">Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.</p>
        <button id="btnRetry" class="btn btn-primary"><i class="fas fa-redo"></i> Thử lại</button>
    </div>
`;
    // Insert before <script src="main.js">
    indexHtml = indexHtml.replace('    <script src="main.js"></script>', `${errorOverlayHtml}\n    <script src="main.js"></script>`);
    fs.writeFileSync('d:/Ngoc selection/Ngọc/index.html', indexHtml, 'utf8');
}


// --- 2. Modify style.css ---
let styleCss = fs.readFileSync('d:/Ngoc selection/Ngọc/style.css', 'utf8');
if (!styleCss.includes('.error-overlay')) {
    const errorOverlayCss = `
/* Error Overlay */
.error-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-color: var(--bg-color);
    z-index: 100000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
}
.error-overlay i {
    font-size: 4rem;
    color: #e74c3c;
    margin-bottom: 1.5rem;
}
.error-overlay h2 {
    margin-bottom: 1rem;
    color: var(--text-color);
}
.error-overlay p {
    margin-bottom: 2rem;
    color: var(--text-light);
    max-width: 400px;
}
`;
    styleCss += '\n' + errorOverlayCss;
    fs.writeFileSync('d:/Ngoc selection/Ngọc/style.css', styleCss, 'utf8');
}


// --- 3. Modify main.js ---
let mainJs = fs.readFileSync('d:/Ngoc selection/Ngọc/main.js', 'utf8');

// Add translation keys for error overlay
if (!mainJs.includes('error_title')) {
    mainJs = mainJs.replace('        footer_cv: "Tải CV"', '        footer_cv: "Tải CV",\n        error_title: "Bảo trì hệ thống",\n        error_desc: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại."');
    mainJs = mainJs.replace('        footer_cv: "Download CV"', '        footer_cv: "Download CV",\n        error_title: "System Maintenance",\n        error_desc: "Cannot connect to the server. Please check your network or try again."');
}

// Extract the album render logic to a string
const albumLogic = `
                const grid = document.querySelector('.masonry-grid');
                if (grid && albumItems.length > 0) {
                    grid.innerHTML = '';
                    albumItems.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'masonry-item skeleton';
                        div.dataset.category = item.category || 'all';
                        div.dataset.id = item.id;
                        div.dataset.filePath = item.file_path;
                        if (item.type === 'video') {
                            div.dataset.type = 'video';
                            const vid = document.createElement('video');
                            vid.src = item.url;
                            vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
                            vid.onloadeddata = () => div.classList.remove('skeleton');
                            div.appendChild(vid);
                        } else {
                            const img = document.createElement('img');
                            img.loading = 'lazy';
                            img.src = item.url;
                            img.alt = 'Album Image';
                            img.onload = () => div.classList.remove('skeleton');
                            div.appendChild(img);
                        }
                        grid.appendChild(div);

                        // Add click event for modal
                        const modal = document.getElementById('mediaModal');
                        const modalImg = document.getElementById('modalImg');
                        const modalVideo = document.getElementById('modalVideo');
                        div.addEventListener('click', () => {
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
                    });
                    window.dispatchEvent(new Event('albumLoaded'));
                }
`;

// Replace fetchDynamicData and fetchAlbumItems entirely with the concurrent version
const newFetchLogic = `
async function fetchDynamicData() {
    const errorOverlay = document.getElementById('errorOverlay');
    try {
        if (errorOverlay) errorOverlay.style.display = 'none';
        const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

        // Fetch all data concurrently
        const [resSettings, resExp, resSkills, resAlbum] = await Promise.all([
            fetch(SUPABASE_URL + '/rest/v1/settings?select=*', { headers }),
            fetch(SUPABASE_URL + '/rest/v1/experience_items?select=*&order=sort_order', { headers }),
            fetch(SUPABASE_URL + '/rest/v1/skill_items?select=*&order=sort_order', { headers }),
            fetch(SUPABASE_URL + '/rest/v1/album_items?select=*&order=sort_order', { headers })
        ]);

        if (!resSettings.ok || !resExp.ok || !resSkills.ok || !resAlbum.ok) {
            throw new Error("One or more API requests failed.");
        }

        // Parse JSON concurrently
        const [settingsData, exps, skills, albumItems] = await Promise.all([
            resSettings.json(),
            resExp.json(),
            resSkills.json(),
            resAlbum.json()
        ]);

        // --- Render Settings ---
        settingsData.forEach(item => {
            if (item.key === 'intro_vi' && item.value) translations.vi.hero_intro = item.value;
            if (item.key === 'intro_en' && item.value) translations.en.hero_intro = item.value;
            if (item.key === 'hero_subtitle' && item.value) {
                translations.vi.hero_subtitle = item.value;
                translations.en.hero_subtitle = item.value;
            }
            if (item.key === 'hero_image_url' && item.value) {
                const heroImg = document.querySelector('.hero-image img');
                if (heroImg) heroImg.src = item.value;
            }
            
            // Contact info updates
            const contactInfo = document.getElementById('contactInfo');
            if (contactInfo) {
                if (item.key === 'contact_phone' && item.value) {
                    let el = document.getElementById('phoneItem');
                    if (!el) {
                        el = document.createElement('a');
                        el.id = 'phoneItem';
                        el.className = 'contact-item';
                        el.innerHTML = '<i class="fas fa-phone-alt"></i><span></span>';
                        contactInfo.appendChild(el);
                    }
                    el.href = 'tel:' + item.value.replace(/\\s+/g, '');
                    el.querySelector('span').textContent = item.value;
                }
                if (item.key === 'contact_email' && item.value) {
                    let el = document.getElementById('emailItem');
                    if (!el) {
                        el = document.createElement('a');
                        el.id = 'emailItem';
                        el.className = 'contact-item';
                        el.innerHTML = '<i class="fas fa-envelope"></i><span></span>';
                        contactInfo.appendChild(el);
                    }
                    el.href = 'mailto:' + item.value;
                    el.querySelector('span').textContent = item.value;
                }
                if (item.key === 'contact_fb' && item.value) {
                    let el = document.getElementById('fbItem');
                    if (!el) {
                        el = document.createElement('a');
                        el.id = 'fbItem';
                        el.className = 'contact-item';
                        el.target = '_blank';
                        el.innerHTML = '<i class="fab fa-facebook"></i><span>Hà Ngọc (Facebook)</span>';
                        contactInfo.appendChild(el);
                    }
                    el.href = item.value;
                }
            }
            
            if (item.key === 'cv_url' && item.value) {
                const pdfModal = document.getElementById('modalPdf');
                const mediaModal = document.getElementById('mediaModal');
                const modalImg = document.getElementById('modalImg');
                const modalVideo = document.getElementById('modalVideo');
                
                document.querySelectorAll('.btn-cv').forEach(el => {
                    el.href = 'javascript:void(0)';
                    el.onclick = (e) => {
                        e.preventDefault();
                        if (mediaModal && pdfModal) {
                            mediaModal.style.display = 'block';
                            document.body.style.overflow = 'hidden';
                            if (modalImg) modalImg.style.display = 'none';
                            if (modalVideo) { modalVideo.style.display = 'none'; modalVideo.pause(); }
                            pdfModal.style.display = 'block';
                            pdfModal.src = item.value;
                        }
                    };
                });
            }
        });

        // --- Render Experience ---
        const expGrid = document.getElementById('experienceGrid');
        if (expGrid) {
            expGrid.innerHTML = '';
            exps.forEach(exp => {
                const div = document.createElement('div');
                div.className = 'timeline-item';
                div.dataset.source = 'supabase';
                div.dataset.id = exp.id;
                div.innerHTML = \`
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <h3>\${exp.company}</h3>
                        <p class="role" data-vi="\${exp.role_vi}" data-en="\${exp.role_en}">\${exp.role_vi}</p>
                        <span class="year">\${exp.year}</span>
                    </div>
                \`;
                expGrid.appendChild(div);
            });
        }

        // --- Render Skills ---
        const skillsGrid = document.getElementById('skillsGrid');
        if (skillsGrid) {
            skillsGrid.innerHTML = '';
            skills.forEach(skill => {
                const div = document.createElement('div');
                div.className = 'skill-card';
                div.dataset.source = 'supabase';
                div.dataset.id = skill.id;
                div.innerHTML = \`
                    <i class="\${skill.icon_class} skill-icon"></i>
                    <h3>\${skill.title_en}</h3>
                    <p data-vi="\${skill.desc_vi}" data-en="\${skill.desc_en}">\${skill.desc_vi}</p>
                \`;
                skillsGrid.appendChild(div);
            });
        }

        // --- Render Album ---
${albumLogic}

        // Re-apply current language
        const lang = localStorage.getItem('portfolioLang') || 'en';
        applyLanguage(lang);

        window.dispatchEvent(new Event('dynamicDataLoaded'));
    } catch (e) {
        console.error('Fetch failed:', e.message);
        if (errorOverlay) {
            errorOverlay.style.display = 'flex';
            const lang = localStorage.getItem('portfolioLang') || 'en';
            applyLanguage(lang);
        }
    }
}
`;

// Regex replace fetchDynamicData and fetchAlbumItems
const startIdx = mainJs.indexOf('async function fetchDynamicData() {');
const endIdx = mainJs.indexOf('// Load dynamic data on page load');

if (startIdx !== -1 && endIdx !== -1) {
    mainJs = mainJs.substring(0, startIdx) + newFetchLogic + '\n' + mainJs.substring(endIdx);
}

// Add Retry button listener
const retryLogic = "\n// Retry button\nconst btnRetry = document.getElementById('btnRetry');\nif(btnRetry) {\n    btnRetry.addEventListener('click', () => {\n        fetchDynamicData();\n    });\n}\n\n";
mainJs = mainJs.replace('// Load dynamic data on page load', retryLogic + '// Load dynamic data on page load');

// Remove the separate fetchAlbumItems call in DOMContentLoaded
mainJs = mainJs.replace(/    \/\/ Fetch album items after DOM ready\s*fetchAlbumItems\(\);/g, '');

fs.writeFileSync('d:/Ngoc selection/Ngọc/main.js', mainJs, 'utf8');

console.log("Modifications completed successfully!");
