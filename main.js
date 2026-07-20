// main.js

// --- i18n Translations ---
const translations = {
    vi: {
        nav_about: "Giới thiệu",
        nav_experience: "Kinh nghiệm",
        nav_skills: "Kỹ năng",
        nav_album: "Album",
        nav_contact: "Liên hệ",
        nav_cv: "Xem CV",
        hero_subtitle: "NHÀ SÁNG TẠO NỘI DUNG & TÀI NĂNG ĐA LĨNH VỰC",
        hero_intro: "Xin chào, tôi là Hà Ngọc — một Digital Creator, VJ và Diễn viên tự do. Tôi là cầu nối đưa câu chuyện của thương hiệu đến gần hơn với công chúng. Với tư duy nội dung đa chiều và bản lĩnh trước ống kính, tôi có khả năng độc lập sản xuất các sản phẩm Social Media trọn gói — từ lên ý tưởng, viết kịch bản đến diễn xuất — đồng thời luôn mang đến tác phong làm việc chuyên nghiệp, linh hoạt trong mọi dự án hợp tác.",
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
        hero_intro: "Hi, I'm Hà Ngọc — a Digital Creator, VJ, and freelance Actress. I bridge the gap between brands and audiences through creative storytelling. With a multi-dimensional content mindset and confidence in front of the camera, I can independently produce end-to-end Social Media content — from concept and scripting to on-camera performance — while bringing a professional, flexible approach to every collaboration.",
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

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
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
                modalVideo.style.display = 'block';
                modalVideo.src = videoSrc;
                modalVideo.play();
            } else {
                const imgSrc = item.querySelector('img').src;
                modalVideo.style.display = 'none';
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
});
