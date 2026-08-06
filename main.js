// main.js

// --- Supabase Config (for dynamic data) ---
const SUPABASE_URL = 'https://ppzosahycxznuxeerfts.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ff32PbO6HnaGMkqmEXP_WA_pPc4TMNn';

// --- i18n Translations ---
let translations = {
    vi: {
        nav_about: "Giới thiệu",
        nav_experience: "Kinh nghiệm",
        nav_skills: "Kỹ năng",
        nav_album: "Album",
        nav_contact: "Liên hệ",
        nav_cv: "Xem CV",
        hero_subtitle: "DIGITAL CREATOR & TALENT",
        hero_intro: "Xin chào, tôi là Hà Ngọc — một Digital Creator, VJ và Diễn viên tự do. Sứ mệnh của tôi là thổi hồn vào những câu chuyện thương hiệu, đưa chúng đến gần hơn với khán giả một cách tự nhiên và sáng tạo nhất. Bằng tư duy nhạy bén và sự tự tin trước ống kính, tôi có thể đảm nhiệm trọn gói các dự án Social Media — từ khâu lên ý tưởng, viết kịch bản cho đến trực tiếp diễn xuất. Tôi luôn đặt sự chuyên nghiệp và tinh thần linh hoạt lên hàng đầu trong mỗi lần hợp tác.",
        hero_btn_album: "Xem Album",
        hero_btn_exp: "Kinh Nghiệm",
        exp_title: "Kinh Nghiệm Làm Việc",
        exp_role_1: "Diễn viên truyền hình",
        exp_role_2: "Nhà sáng tạo nội dung Marketing & F&B",
        exp_role_3: "Diễn viên chính phim ngắn",
        exp_role_4: "Biên kịch sáng tạo",
        exp_role_5: "VJ & Người mẫu ảnh chuyên nghiệp",
        exp_year_5: "Đang hoạt động",
        skills_title: "Kỹ Năng",
        skill_1_desc: "Quay phim, canh góc máy, ánh sáng chuyên nghiệp cho các nền tảng social media.",
        skill_2_desc: "Hậu kỳ hình ảnh, chỉnh sửa video sáng tạo, tạo hiệu ứng thị giác ấn tượng.",
        skill_3_desc: "Kịch bản nội dung đa chiều, dẫn dắt câu chuyện thu hút người xem.",
        skill_4_desc: "Tự tin trước ống kính, đài từ tốt, biểu cảm đa dạng phù hợp nhiều concept.",
        album_title: "Album",
        contact_title: "Liên Hệ",
        contact_desc: "Hãy liên hệ với tôi để cùng hợp tác trong những dự án sáng tạo sắp tới!",
        footer_tagline: "Sáng tạo không giới hạn - Kết nối qua từng khung hình.",
        footer_cv: "Tải CV",
        error_title: "Bảo trì hệ thống",
        error_desc: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại."
    },
    en: {
        nav_about: "About",
        nav_experience: "Experience",
        nav_skills: "Skills",
        nav_album: "Album",
        nav_contact: "Contact",
        nav_cv: "View CV",
        hero_subtitle: "DIGITAL CREATOR & TALENT",
        hero_intro: "Hi, I'm Hà Ngọc — a Digital Creator, VJ, and freelance Actress. My passion lies in breathing life into brand stories, connecting them with audiences in the most natural and creative ways. Combining a sharp mindset for content with confidence on camera, I can handle end-to-end Social Media projects — from brainstorming and scripting to on-screen performance. Professionalism and adaptability are the core values I bring to every collaboration.",
        hero_btn_album: "View Album",
        hero_btn_exp: "Experience",
        exp_title: "Working Experience",
        exp_role_1: "Television Actress",
        exp_role_2: "Marketing & F&B Content Creator",
        exp_role_3: "Short-Film Lead Actress",
        exp_role_4: "Creative Scriptwriter",
        exp_role_5: "VJ & Professional Photo Model",
        exp_year_5: "Ongoing",
        skills_title: "Skills",
        skill_1_desc: "Professional cinematography, camera angles, and lighting for social media platforms.",
        skill_2_desc: "Creative photo retouching, video editing, and impressive visual effects.",
        skill_3_desc: "Multi-dimensional scriptwriting, crafting engaging narratives that captivate audiences.",
        skill_4_desc: "Confident on camera, clear voice delivery, and versatile expressions across many concepts.",
        album_title: "Album",
        contact_title: "Contact",
        contact_desc: "Let's connect and collaborate on upcoming creative projects!",
        footer_tagline: "Unlimited creativity — Connected through every frame.",
        footer_cv: "Download CV",
        error_title: "System Maintenance",
        error_desc: "Cannot connect to the server. Please check your network or try again."
    }
};

function applyLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    // Static translations
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Dynamic translations (Supabase)
    document.querySelectorAll('[data-vi][data-en]').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });
}

// --- Fetch dynamic data from Supabase ---

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
                    el.href = 'tel:' + item.value.replace(/\s+/g, '');
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
            expGrid.className = 'bento-grid'; // Swap timeline for bento-grid
            exps.forEach(exp => {
                const div = document.createElement('div');
                div.className = 'bento-card';
                div.dataset.source = 'supabase';
                div.dataset.id = exp.id;
                
                let linkHtml = '';
                const linkItems = albumItems.filter(a => a.experience_id === exp.id && a.type === 'text_link');
                if (linkItems && linkItems.length > 0) {
                    linkHtml = '<div class="bento-links-container">';
                    linkItems.forEach(item => {
                        let title = "Bấm vào đây để xem dự án";
                        let previewImage = "";
                        try {
                            const parsed = JSON.parse(item.file_path);
                            if (parsed.title) title = parsed.title;
                            if (parsed.preview_image) previewImage = parsed.preview_image;
                        } catch(e) {}
                        
                        let dataAttr = previewImage ? `data-preview-image="${previewImage}"` : '';
                        linkHtml += `<a href="${item.url}" target="_blank" class="bento-project-link" ${dataAttr}><i class="fas fa-link"></i> ${title}</a>`;
                    });
                    linkHtml += '</div>';
                }

                div.innerHTML = `
                    <h3>${exp.company}</h3>
                    <p class="role" data-vi="${exp.role_vi}" data-en="${exp.role_en}">${exp.role_vi}</p>
                    <span class="year">${exp.year}</span>
                    ${linkHtml}
                `;
                expGrid.appendChild(div);
            });
            
            // Setup Hover Tooltip for links
            let tooltip = document.querySelector('.link-preview-tooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'link-preview-tooltip';
                tooltip.innerHTML = '<img src="" alt="Preview">';
                document.body.appendChild(tooltip);
            }
            const tooltipImg = tooltip.querySelector('img');

            document.querySelectorAll('.bento-project-link').forEach(link => {
                link.addEventListener('mouseenter', (e) => {
                    const preview = link.getAttribute('data-preview-image');
                    if (preview) {
                        tooltipImg.src = preview;
                        tooltip.classList.add('active');
                    }
                });
                link.addEventListener('mousemove', (e) => {
                    if (tooltip.classList.contains('active')) {
                        // Keep tooltip in viewport bounds if possible, else just offset
                        let left = e.clientX + 15;
                        let top = e.clientY + 15;
                        if (left + 250 > window.innerWidth) left = e.clientX - 265;
                        tooltip.style.left = left + 'px';
                        tooltip.style.top = top + 'px';
                    }
                });
                link.addEventListener('mouseleave', () => {
                    tooltip.classList.remove('active');
                });
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
                div.innerHTML = `
                    <i class="${skill.icon_class} skill-icon"></i>
                    <h3>${skill.title_en}</h3>
                    <p data-vi="${skill.desc_vi}" data-en="${skill.desc_en}">${skill.desc_vi}</p>
                `;
                skillsGrid.appendChild(div);
            });
        }

        // --- Render Album ---

                const grid = document.querySelector('.masonry-grid');
                if (grid && albumItems.length > 0) {
                    grid.innerHTML = '';
                    albumItems.forEach(item => {
                        if (item.type === 'text_link') return;
                        
                        const div = document.createElement('div');
                        div.className = 'masonry-item skeleton';
                        div.dataset.category = item.category || 'all';
                        div.dataset.id = item.id;
                        div.dataset.filePath = item.file_path;
                        if (item.type === 'video') {
                            div.dataset.type = 'video';
                            const vid = document.createElement('video');
                            vid.src = item.url;
                            vid.loop = true; vid.muted = true; vid.playsInline = true;
                            vid.preload = 'metadata';
                            vid.onloadeddata = () => div.classList.remove('skeleton');
                            div.appendChild(vid);
                            
                            // Intersection Observer for Video Play/Pause
                            if ('IntersectionObserver' in window) {
                                if (!window.videoObserver) {
                                    window.videoObserver = new IntersectionObserver((entries) => {
                                        entries.forEach(entry => {
                                            if (entry.isIntersecting) {
                                                entry.target.play().catch(e => console.log('Autoplay prevented', e));
                                            } else {
                                                entry.target.pause();
                                            }
                                        });
                                    }, { threshold: 0.1 });
                                }
                                window.videoObserver.observe(vid);
                            }
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


// Retry button
const btnRetry = document.getElementById('btnRetry');
if(btnRetry) {
    btnRetry.addEventListener('click', () => {
        fetchDynamicData();
    });
}

// Load dynamic data on page load
fetchDynamicData();



document.addEventListener('DOMContentLoaded', () => {


    // --- Visual Upgrades (Cursor, Audio, Parallax) ---
    // Custom Cursor (Optimized GPU Acceleration)
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            window.requestAnimationFrame(() => {
                customCursor.style.transform = `translate3d(${e.clientX - 12.5}px, ${e.clientY - 12.5}px, 0)`;
            });
        });

        const hoverSelector = 'a, button, .masonry-item, .skill-card, .theme-switch, .lang-switch, .hamburger, .close-menu';
        
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(hoverSelector)) {
                customCursor.classList.add('hover');
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(hoverSelector)) {
                customCursor.classList.remove('hover');
            }
        });
    }



    // Navbar Scroll (Optimized with requestAnimationFrame)
    const navbar = document.querySelector('.navbar');
    let isNavbarScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isNavbarScrolling) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                isNavbarScrolling = false;
            });
            isNavbarScrolling = true;
        }
    }, { passive: true });

    // 2. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    const closeMenu = document.querySelector('.close-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    hamburger.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });

    closeMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });

    // 3. Scroll Reveal Animation (Optimized with IntersectionObserver)
    const reveals = document.querySelectorAll('.reveal');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target); // Stop observing once revealed
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -100px 0px', // Equivalent to revealPoint = 100
            threshold: 0
        });

        reveals.forEach(reveal => {
            revealObserver.observe(reveal);
        });
    } else {
        // Fallback for very old browsers
        reveals.forEach(reveal => reveal.classList.add('active'));
    }

    // 4. Media Modal (Lightbox) — Fixed for proper image display
    const modal = document.getElementById('mediaModal');
    const modalImg = document.getElementById('modalImg');
    const modalVideo = document.getElementById('modalVideo');
    const closeBtn = document.querySelector('.modal-close');
    const masonryItems = document.querySelectorAll('.masonry-item');

    masonryItems.forEach(item => {
        item.addEventListener('click', () => {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            if (item.dataset.type === 'video') {
                const videoSrc = item.querySelector('video').src;
                modalImg.style.display = 'none';
                if (document.getElementById('modalPdf')) document.getElementById('modalPdf').style.display = 'none';
                modalVideo.style.display = 'block';
                modalVideo.src = videoSrc;
                modalVideo.play();
            } else {
                const imgSrc = item.querySelector('img').src;
                modalVideo.style.display = 'none';
                if (document.getElementById('modalPdf')) document.getElementById('modalPdf').style.display = 'none';
                modalVideo.pause();
                modalImg.style.display = 'block';
                modalImg.src = imgSrc;
            }
        });
    });

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modalVideo.pause();
        modalVideo.removeAttribute('src');
        const pdfModal = document.getElementById('modalPdf');
        if (pdfModal) {
            pdfModal.style.display = 'none';
            pdfModal.removeAttribute('src');
        }
    }

    closeBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside the media
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-body')) {
            closeModal();
        }
    });

    // 5. Theme Switch (Dark/Light Mode)
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        const themeIcon = themeSwitch.querySelector('i');
        
        const savedTheme = localStorage.getItem('portfolioTheme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }

        themeSwitch.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('portfolioTheme', 'light');
                themeIcon.classList.replace('fa-sun', 'fa-moon');
            } else {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('portfolioTheme', 'dark');
                themeIcon.classList.replace('fa-moon', 'fa-sun');
            }
        });
    }

    // 6. Custom Cursor logic has been merged above

    // 7. Staggered Text Reveal
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const text = "HÀ NGỌC";
        typewriterElement.innerHTML = '';
        const words = text.split(' ');
        let globalCharIndex = 0;
        
        words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.style.display = 'inline-block';
            
            word.split('').forEach((char) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'staggered-letter';
                charSpan.style.animationDelay = `${globalCharIndex * 0.08}s`;
                globalCharIndex++;
                if (char === ' ') {
                    charSpan.innerHTML = '&nbsp;';
                } else {
                    charSpan.innerText = char;
                }
                wordSpan.appendChild(charSpan);
            });
            
            typewriterElement.appendChild(wordSpan);
            
            // Add space between words
            if (wordIndex < words.length - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                typewriterElement.appendChild(space);
                globalCharIndex++; // Treat space as a character delay
            }
        });
    }

    // 8. Language Switch (EN / VI)
    const langSwitch = document.getElementById('lang-switch');
    if (langSwitch) {
        let currentLang = localStorage.getItem('portfolioLang') || 'en';
        
        // Apply saved language on load
        if (currentLang === 'vi') {
            applyLanguage('vi');
            langSwitch.querySelector('span').textContent = 'VI';
        }

        langSwitch.addEventListener('click', () => {
            if (currentLang === 'en') {
                currentLang = 'vi';
                applyLanguage('vi');
                langSwitch.querySelector('span').textContent = 'VI';
            } else {
                currentLang = 'en';
                applyLanguage('en');
                langSwitch.querySelector('span').textContent = 'EN';
            }
            localStorage.setItem('portfolioLang', currentLang);
        });
    }

    // ===== Admin Mode Detection =====
    if (sessionStorage.getItem('adminMode') === 'true') {
        const loadScript = (src) => new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = resolve; // proceed even if it fails (e.g. adblocker)
            document.head.appendChild(script);
        });

        Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js')
        ]).then(() => {
            const adminScript = document.createElement('script');
            adminScript.src = 'admin-mode.js';
            document.head.appendChild(adminScript);
        });
    }
});

// ==========================================
// Project Modal Logic
// ==========================================
window.openProjectModal = function(companyName, mediaList) {
    const modal = document.getElementById('projectModal');
    const title = document.getElementById('projectModalTitle');
    const grid = document.getElementById('projectModalGrid');
    
    if (!modal || !grid) return;
    
    title.textContent = "Dự án: " + companyName;
    grid.innerHTML = ''; // Clear old

    mediaList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'masonry-item';
        
        if (item.type === 'video') {
            const vid = document.createElement('video');
            vid.src = item.url;
            vid.controls = true;
            vid.preload = 'metadata';
            div.appendChild(vid);
        } else {
            const img = document.createElement('img');
            img.src = item.url;
            img.loading = 'lazy';
            img.onclick = () => openMediaModal(item.url, 'image'); // Reuse single view
            img.style.cursor = 'pointer';
            div.appendChild(img);
        }
        grid.appendChild(div);
    });

    modal.style.display = 'flex';
};

const pmClose = document.getElementById('projectModalClose');
if (pmClose) {
    pmClose.onclick = () => {
        document.getElementById('projectModal').style.display = 'none';
        // Pause all videos when closing modal
        document.querySelectorAll('#projectModalGrid video').forEach(v => v.pause());
    };
}
