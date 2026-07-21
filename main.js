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
        footer_cv: "Tải CV"
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
        footer_cv: "Download CV"
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
    try {
        const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

        // 1. Settings
        const resSettings = await fetch(SUPABASE_URL + '/rest/v1/settings?select=*', { headers });
        if (resSettings.ok) {
            const data = await resSettings.json();
            data.forEach(item => {
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
                            el.innerHTML = `<i class="fas fa-phone-alt"></i><span></span>`;
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
                            el.innerHTML = `<i class="fas fa-envelope"></i><span></span>`;
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
                            el.innerHTML = `<i class="fab fa-facebook"></i><span>Hà Ngọc (Facebook)</span>`;
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
                    
                    const footerCvBtn = document.querySelector('.footer-content .btn-primary');
                    if (footerCvBtn) footerCvBtn.href = item.value;
                }
            });
        }

        // 2. Experience
        const resExp = await fetch(SUPABASE_URL + '/rest/v1/experience_items?select=*&order=sort_order', { headers });
        if (resExp.ok) {
            const exps = await resExp.json();
            const expGrid = document.getElementById('experienceGrid');
            if (expGrid) {
                expGrid.innerHTML = '';
                exps.forEach(exp => {
                    const div = document.createElement('div');
                    div.className = 'timeline-item';
                    div.dataset.source = 'supabase';
                    div.dataset.id = exp.id;
                    div.innerHTML = `
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h3>${exp.company}</h3>
                            <p class="role" data-vi="${exp.role_vi}" data-en="${exp.role_en}">${exp.role_vi}</p>
                            <span class="year">${exp.year}</span>
                        </div>
                    `;
                    expGrid.appendChild(div);
                });
            }
        }

        // 3. Skills
        const resSkills = await fetch(SUPABASE_URL + '/rest/v1/skill_items?select=*&order=sort_order', { headers });
        if (resSkills.ok) {
            const skills = await resSkills.json();
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
        }

        // Re-apply current language
        const lang = localStorage.getItem('portfolioLang') || 'en';
        applyLanguage(lang);

        window.dispatchEvent(new Event('dynamicDataLoaded'));
    } catch (e) {
        console.log('Dynamic data fetch skipped:', e.message);
    }
}

async function fetchAlbumItems() {
    try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/album_items?select=*&order=sort_order', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
        });
        if (!res.ok) return;
        const items = await res.json();
        const grid = document.querySelector('.masonry-grid');
        if (!grid || items.length === 0) return;

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'masonry-item';
            div.dataset.category = item.category || 'all';
            if (item.type === 'video') {
                div.dataset.type = 'video';
                div.innerHTML = '<video src="' + item.url + '" autoplay loop muted playsinline></video>';
            } else {
                div.innerHTML = '<img loading="lazy" src="' + item.url + '" alt="Album Image">';
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
    } catch (e) {
        console.log('Album fetch skipped:', e.message);
    }
}

// Load dynamic data on page load
fetchDynamicData();

document.addEventListener('DOMContentLoaded', () => {
    // Fetch album items after DOM ready
    fetchAlbumItems();

    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

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

    // 3. Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');
    
    function checkReveal() {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                reveal.classList.add('active');
            }
        });
    }
    
    // Initial check
    checkReveal();
    // Check on scroll
    window.addEventListener('scroll', checkReveal);

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

    // 6. Custom Cursor
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        });

        const clickables = document.querySelectorAll('a, .masonry-item, .theme-switch, .lang-switch, .hamburger, .close-menu');
        clickables.forEach(el => {
            el.addEventListener('mouseenter', () => customCursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => customCursor.classList.remove('hover'));
        });
    }

    // 7. Typewriter Effect
    const typewriterElement = document.getElementById('typewriter');
    if (typewriterElement) {
        const text = "HÀ NGỌC";
        let index = 0;
        
        function type() {
            if (index < text.length) {
                typewriterElement.innerHTML += text.charAt(index);
                index++;
                setTimeout(type, 200);
            }
        }
        
        setTimeout(type, 500);
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
