// main.js

// --- Supabase Config (for dynamic data) ---
const SUPABASE_URL = window.Portfolio.config.supabaseUrl;
const SUPABASE_KEY = window.Portfolio.config.supabaseKey;

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

Object.assign(translations.vi, {
    loading: 'Đang tải nội dung…', section_error: 'Chưa tải được phần này. Bạn vẫn có thể xem các phần khác.',
    retry: 'Thử lại', empty: 'Nội dung đang được cập nhật.', open_image: 'Xem ảnh', open_video: 'Xem video',
    media_error: 'Không tải được nội dung. Bạn có thể mở tệp gốc.', open_file: 'Mở tệp gốc',
    language_label: 'Chuyển sang tiếng Anh', theme_label: 'Chuyển giao diện sáng hoặc tối',
    menu_label: 'Mở trình đơn', close_label: 'Đóng', project_link: 'Xem dự án', media_title: 'Xem nội dung',
    previous: 'Nội dung trước', next: 'Nội dung tiếp theo', gallery_controls: 'Điều hướng album',
    gallery_position: 'Nội dung {current} trên {total}', editor_error: 'Chưa tải được công cụ chỉnh sửa. Vui lòng thử lại.'
});
Object.assign(translations.en, {
    loading: 'Loading content…', section_error: 'This section could not load. Other sections are still available.',
    retry: 'Try again', empty: 'Content is being updated.', open_image: 'View image', open_video: 'Watch video',
    media_error: 'This media could not load. You can open the original file.', open_file: 'Open original file',
    language_label: 'Switch to Vietnamese', theme_label: 'Switch light or dark theme',
    menu_label: 'Open menu', close_label: 'Close', project_link: 'View project', media_title: 'Media viewer',
    previous: 'Previous media', next: 'Next media', gallery_controls: 'Album navigation',
    gallery_position: 'Item {current} of {total}', editor_error: 'Editing tools could not load. Please try again.'
});

const portfolio = window.Portfolio;
const tables = ['settings', 'experience_items', 'skill_items', 'album_items'];
const targets = { settings: 'contactInfo', experience_items: 'experienceGrid', skill_items: 'skillsGrid', album_items: 'albumGrid' };
const cache = Object.create(null);
const requests = Object.create(null);
const sectionStates = Object.create(null);
const originalIntros = { vi: translations.vi.hero_intro, en: translations.en.hero_intro };
let mediaDialog;
let menuDialog;
let videoObserver;
const visibleVideos = new Set();
let galleryEntries = [];
let activeMediaIndex = -1;
let activeMediaTrigger = null;
let mediaMotionCleanup = null;
let mediaLoadCleanup = null;
let mediaSwipe = null;
let ignoreMediaBackdropClickUntil = 0;
const motionPreference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
let language = portfolio.getLanguage() === 'vi' ? 'vi' : 'en';

function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text ?? '');
    return node;
}

function currentLanguage() { return language; }
function label(key) { return translations[currentLanguage()][key] || key; }
function mediaUrl(value) { return portfolio.safeUrl(value, { allowRelative: true }); }
function bilingual(node, vi, en) {
    node.dataset.vi = String(vi ?? '');
    node.dataset.en = String(en ?? vi ?? '');
    node.textContent = node.dataset[currentLanguage()];
    return node;
}
function savePreference(key, value) {
    portfolio.setPreference(key, value);
}

function applyLanguage(lang) {
    if (!translations[lang]) return;
    language = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
        const value = translations[lang][node.dataset.i18n];
        if (value) node.textContent = value;
    });
    document.querySelectorAll('[data-vi][data-en]').forEach(node => { node.textContent = node.dataset[lang]; });
    const switcher = document.getElementById('lang-switch');
    if (switcher) {
        switcher.querySelector('span').textContent = lang.toUpperCase();
        switcher.setAttribute('aria-label', translations[lang].language_label);
        switcher.title = translations[lang].language_label;
    }
    [['#theme-switch', 'theme_label'], ['.hamburger', 'menu_label'], ['.mobile-menu', 'menu_label'], ['.close-menu', 'close_label'], ['#mediaModal .modal-close', 'close_label'], ['#mediaModal', 'media_title'], ['#modalPrev', 'previous'], ['#modalNext', 'next']].forEach(([selector, key]) => {
        const node = document.querySelector(selector);
        if (node) node.setAttribute('aria-label', translations[lang][key]);
    });
    document.querySelectorAll('.album-open').forEach(button => {
        button.setAttribute('aria-label', translations[lang][button.dataset.mediaType === 'video' ? 'open_video' : 'open_image'] + ' ' + button.dataset.number);
    });
    const pdf = document.getElementById('modalPdf');
    if (pdf) pdf.title = translations[lang].nav_cv + ' — Hà Ngọc';
    const download = document.getElementById('modalDownload');
    if (download) download.textContent = translations[lang].open_file;
    updateMediaNavigation();
    Object.keys(sectionStates).forEach(table => updateSectionStatus(table, sectionStates[table]));
}

function attachLinkPreview(link, value) {
    const url = mediaUrl(value);
    if (!url) return;
    let tooltip = document.querySelector('.link-preview-tooltip');
    if (!tooltip) {
        tooltip = makeElement('div', 'link-preview-tooltip');
        tooltip.setAttribute('aria-hidden', 'true');
        const image = makeElement('img');
        image.alt = '';
        tooltip.append(image);
        document.body.append(tooltip);
    }
    const position = event => {
        const rect = link.getBoundingClientRect();
        const x = typeof event.clientX === 'number' ? event.clientX : rect.left;
        const y = typeof event.clientY === 'number' ? event.clientY : rect.bottom;
        tooltip.style.left = Math.max(8, Math.min(x + 15, window.innerWidth - 258)) + 'px';
        tooltip.style.top = Math.max(8, Math.min(y + 15, window.innerHeight - 168)) + 'px';
    };
    const show = event => {
        tooltip.querySelector('img').src = url;
        position(event);
        tooltip.classList.add('active');
    };
    const hide = () => tooltip.classList.remove('active');
    link.addEventListener('mouseenter', show);
    link.addEventListener('focus', show);
    link.addEventListener('mousemove', position);
    link.addEventListener('mouseleave', hide);
    link.addEventListener('blur', hide);
    link.addEventListener('click', hide);
}

function updateSectionStatus(table, state) {
    sectionStates[table] = state;
    const target = document.getElementById(targets[table]);
    if (!target) return;
    target.setAttribute('aria-busy', String(state === 'loading'));
    let status = document.getElementById('status-' + table);
    if (!status) {
        status = makeElement('div', 'section-status');
        status.id = 'status-' + table;
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        target.before(status);
    }
    status.replaceChildren();
    ['error', 'empty', 'loading'].forEach(name => status.classList.toggle(name, state === name));
    status.hidden = !state;
    if (!state) return;
    status.append(makeElement('p', '', label(state === 'error' ? 'section_error' : state)));
    if (state === 'error') {
        const retry = makeElement('button', 'btn btn-outline', label('retry'));
        retry.type = 'button';
        retry.addEventListener('click', () => fetchDynamicData([table]));
        status.append(retry);
    }
}

function renderSettings(items) {
    const values = Object.fromEntries(items.filter(item => typeof item.key === 'string').map(item => [item.key, typeof item.value === 'string' ? item.value.trim() : '']));
    translations.vi.hero_intro = values.intro_vi || originalIntros.vi;
    translations.en.hero_intro = values.intro_en || originalIntros.en;
    translations.vi.hero_subtitle = translations.en.hero_subtitle = values.hero_subtitle || 'DIGITAL CREATOR & TALENT';
    const hero = document.querySelector('.hero-image img');
    if (hero) {
        if (!hero.dataset.fallbackSrc) hero.dataset.fallbackSrc = hero.getAttribute('src') || '';
        hero.src = mediaUrl(values.hero_image_url) || hero.dataset.fallbackSrc;
        hero.onerror = () => {
            hero.onerror = null;
            if (hero.dataset.fallbackSrc) hero.src = hero.dataset.fallbackSrc;
        };
    }
    const contact = document.getElementById('contactInfo');
    if (contact) {
        ['phoneItem', 'emailItem', 'fbItem'].forEach(id => document.getElementById(id)?.remove());
        const entries = [
            ['phoneItem', values.contact_phone, values.contact_phone && 'tel:' + values.contact_phone.replace(/[^\d+]/g, ''), 'fas fa-phone-alt'],
            ['emailItem', values.contact_email, values.contact_email && 'mailto:' + values.contact_email, 'fas fa-envelope'],
            ['fbItem', 'Hà Ngọc (Facebook)', portfolio.safeUrl(values.contact_fb), 'fab fa-facebook']
        ];
        entries.forEach(([id, text, url, icon]) => {
            if (!url || !text) return;
            const link = makeElement('a', 'contact-item');
            link.id = id;
            link.href = url;
            if (id === 'fbItem') { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
            const glyph = makeElement('i', icon);
            glyph.setAttribute('aria-hidden', 'true');
            link.append(glyph, makeElement('span', '', text));
            contact.append(link);
        });
    }
    document.querySelectorAll('.btn-cv').forEach(link => {
        if (!link.dataset.fallbackHref) link.dataset.fallbackHref = link.getAttribute('href') || '';
        const url = mediaUrl(values.cv_url) || mediaUrl(link.dataset.fallbackHref);
        if (!url) { link.removeAttribute('href'); return; }
        link.href = url;
        link.rel = 'noopener noreferrer';
        link.onclick = event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            openMedia(url, 'pdf', link);
        };
    });
}

function renderExperience(items) {
    const grid = document.getElementById('experienceGrid');
    if (!grid) return;
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const card = makeElement('div', 'bento-card');
        card.dataset.source = 'supabase';
        card.dataset.id = String(item.id);
        card.append(makeElement('h3', '', item.company), bilingual(makeElement('p', 'role'), item.role_vi, item.role_en), makeElement('span', 'year', item.year));
        const links = makeElement('div', 'bento-links-container');
        (cache.album_items || []).filter(media => String(media.experience_id) === String(item.id) && media.type === 'text_link').forEach(media => {
            const url = portfolio.safeUrl(media.url);
            if (!url) return;
            let metadata = {};
            try { metadata = JSON.parse(media.file_path) || {}; } catch (_) { /* Older links have no metadata. */ }
            const link = makeElement('a', 'bento-project-link');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const title = makeElement('span', '', typeof metadata.title === 'string' && metadata.title ? metadata.title : label('project_link'));
            if (!metadata.title) title.dataset.i18n = 'project_link';
            const icon = makeElement('i', 'fas fa-link');
            icon.setAttribute('aria-hidden', 'true');
            link.append(icon, title);
            attachLinkPreview(link, metadata.preview_image);
            links.append(link);
        });
        if (links.childElementCount) card.append(links);
        fragment.append(card);
    });
    grid.replaceChildren(fragment);
}

function renderSkills(items) {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const card = makeElement('div', 'skill-card');
        card.dataset.source = 'supabase';
        card.dataset.id = String(item.id);
        const iconClasses = typeof item.icon_class === 'string' && /^[a-zA-Z0-9 _-]+$/.test(item.icon_class) ? item.icon_class : 'fas fa-star';
        const icon = makeElement('i', iconClasses + ' skill-icon');
        icon.setAttribute('aria-hidden', 'true');
        card.append(icon, bilingual(makeElement('h3'), item.title_vi || item.title_en, item.title_en), bilingual(makeElement('p'), item.desc_vi, item.desc_en));
        fragment.append(card);
    });
    grid.replaceChildren(fragment);
}

function refreshVideoPlayback() {
    const allowed = !document.hidden && !motionPreference.matches && !mediaDialog?.isOpen() && !menuDialog?.isOpen();
    document.querySelectorAll('#albumGrid video').forEach(video => {
        if (allowed && visibleVideos.has(video) && video.getAttribute('src')) video.play().catch(() => {});
        else video.pause();
    });
}

function renderAlbum(items) {
    const grid = document.getElementById('albumGrid');
    if (!grid) return;
    videoObserver?.disconnect();
    visibleVideos.clear();
    galleryEntries = [];
    activeMediaIndex = -1;
    grid.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
    grid.replaceChildren();
    if ('IntersectionObserver' in window) {
        videoObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    visibleVideos.add(video);
                    if (!video.getAttribute('src')) { video.preload = 'metadata'; video.src = video.dataset.src; }
                } else visibleVideos.delete(video);
            });
            refreshVideoPlayback();
        }, { threshold: 0.1 });
    }
    const mediaItems = items.filter(item => item.type !== 'text_link');
    mediaItems.forEach((item, index) => {
        const isVideo = item.type === 'video';
        const url = mediaUrl(item.url);
        const card = makeElement('div', 'masonry-item skeleton');
        card.dataset.category = item.category || 'all';
        card.dataset.id = String(item.id);
        card.dataset.filePath = String(item.file_path || '');
        card.dataset.type = isVideo ? 'video' : 'image';
        const button = makeElement('button', 'album-open');
        button.type = 'button';
        button.dataset.mediaType = card.dataset.type;
        button.dataset.number = String(index + 1);
        button.setAttribute('aria-label', label(isVideo ? 'open_video' : 'open_image') + ' ' + (index + 1));
        const media = makeElement(isVideo ? 'video' : 'img');
        const loaded = () => card.classList.remove('skeleton');
        const failed = () => {
            card.classList.remove('skeleton');
            const message = makeElement('span', 'media-error', label('media_error'));
            message.dataset.i18n = 'media_error';
            button.replaceChildren(message);
            if (isVideo) { videoObserver?.unobserve(media); visibleVideos.delete(media); media.pause(); }
        };
        media.addEventListener('error', failed, { once: true });
        if (isVideo) {
            media.muted = true;
            media.loop = true;
            media.playsInline = true;
            media.preload = 'none';
            media.dataset.src = url;
            media.setAttribute('aria-hidden', 'true');
            media.addEventListener('loadeddata', loaded, { once: true });
            media.addEventListener('loadedmetadata', loaded, { once: true });
            const poster = mediaUrl(item.poster_url || item.thumbnail_url);
            if (poster) media.poster = poster;
        } else {
            media.loading = 'lazy';
            media.decoding = 'async';
            media.alt = typeof item.alt_text === 'string' ? item.alt_text : '';
            media.addEventListener('load', loaded, { once: true });
        }
        button.append(media);
        card.append(button);
        grid.append(card);
        if (!url) { failed(); button.disabled = true; }
        else {
            galleryEntries.push({ url, type: isVideo ? 'video' : 'image', trigger: button });
            button.addEventListener('click', () => openMedia(url, isVideo ? 'video' : 'image', button));
            if (isVideo && videoObserver) videoObserver.observe(media);
            else { if (isVideo) media.preload = 'metadata'; media.src = url; }
        }
    });
    updateSectionStatus('album_items', mediaItems.length ? '' : 'empty');
    window.dispatchEvent(new Event('albumLoaded'));
}

function stopMediaMotion() {
    mediaSwipe = null;
    mediaLoadCleanup?.();
    mediaLoadCleanup = null;
    mediaMotionCleanup?.();
    mediaMotionCleanup = null;
}

function canAnimateMedia() {
    return !motionPreference.matches && !document.hidden && typeof Element.prototype.animate === 'function';
}

function thumbnailBounds(trigger) {
    const image = trigger?.querySelector('img');
    if (!trigger?.isConnected || !image?.complete || !image.naturalWidth) return null;
    const rect = trigger.getBoundingClientRect();
    // Avoid flying an image to an off-screen destination after gallery navigation.
    if (rect.width <= 0 || rect.height <= 0 || rect.top < 0 || rect.bottom > window.innerHeight || rect.left < 0 || rect.right > window.innerWidth) return null;
    return rect;
}

function morphImage(image, from, to, concealed) {
    if (!canAnimateMedia() || !from?.width || !from?.height || !to?.width || !to?.height) return;
    const ghost = makeElement('img', 'media-morph');
    ghost.alt = '';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    ghost.src = image.currentSrc || image.src;
    Object.assign(ghost.style, {
        left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px'
    });
    const originals = concealed.filter(Boolean).map(node => [node, node.style.opacity]);
    let animation;
    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        animation?.cancel();
        ghost.remove();
        originals.forEach(([node, opacity]) => { node.style.opacity = opacity; });
        if (mediaMotionCleanup === cleanup) mediaMotionCleanup = null;
    };
    try {
        document.body.append(ghost);
        animation = ghost.animate([
            { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
            { transform: 'none' }
        ], { duration: window.innerWidth <= 600 ? 300 : 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
        originals.forEach(([node]) => { node.style.opacity = '0'; });
        mediaMotionCleanup = cleanup;
        animation.finished.then(cleanup, cleanup);
    } catch (_) { cleanup(); } // Animation is optional; the real image remains usable.
}

function animateMediaOpen(image, trigger, origin, direction) {
    if (!canAnimateMedia()) return;
    const started = performance.now();
    const ready = () => {
        mediaLoadCleanup?.();
        mediaLoadCleanup = null;
        if (!mediaDialog?.isOpen() || !canAnimateMedia() || !image.naturalWidth || performance.now() - started > 500) return;
        if (origin && trigger?.isConnected) {
            morphImage(image, origin, image.getBoundingClientRect(), [image, trigger.querySelector('img')]);
        } else {
            let animation;
            let cleaned = false;
            const cleanup = () => {
                if (cleaned) return;
                cleaned = true;
                animation?.cancel();
                if (mediaMotionCleanup === cleanup) mediaMotionCleanup = null;
            };
            try {
                animation = image.animate([
                    { opacity: 0, transform: direction ? `translateX(${direction * 16}px)` : 'translateY(8px)' },
                    { opacity: 1, transform: 'none' }
                ], { duration: 220, easing: 'ease-out' });
                mediaMotionCleanup = cleanup;
                animation.finished.then(cleanup, cleanup);
            } catch (_) { cleanup(); }
        }
    };
    if (image.complete && image.naturalWidth) ready();
    else {
        image.addEventListener('load', ready, { once: true });
        mediaLoadCleanup = () => image.removeEventListener('load', ready);
    }
}

function animateMediaClose() {
    const interrupted = document.querySelector('.media-morph')?.getBoundingClientRect();
    stopMediaMotion();
    const image = document.getElementById('modalImg');
    const destination = thumbnailBounds(activeMediaTrigger);
    if (image?.style.display === 'block' && image.complete && image.naturalWidth && destination) {
        morphImage(image, interrupted || image.getBoundingClientRect(), destination, [activeMediaTrigger.querySelector('img')]);
    }
    return true;
}

function clearModalMedia({ preserveMotion = false } = {}) {
    if (!preserveMotion) stopMediaMotion();
    mediaSwipe = null;
    document.querySelector('#mediaModal .modal-body')?.removeAttribute('data-media-type');
    ['modalImg', 'modalVideo', 'modalPdf'].forEach(id => {
        const node = document.getElementById(id);
        if (!node) return;
        node.style.display = 'none';
        if (id === 'modalVideo') node.pause();
        node.removeAttribute('src');
        if (id === 'modalVideo') node.load();
    });
    const status = document.getElementById('modalStatus');
    if (status) status.hidden = true;
    const download = document.getElementById('modalDownload');
    if (download) { download.hidden = true; download.removeAttribute('href'); }
    ['modalPrev', 'modalNext'].forEach(id => { const button = document.getElementById(id); if (button) button.hidden = true; });
    const controls = document.getElementById('modalControls');
    if (controls) controls.hidden = true;
}

function updateMediaNavigation() {
    const controls = document.getElementById('modalControls');
    if (!controls) return;
    controls.hidden = activeMediaIndex < 0;
    controls.setAttribute('aria-label', label('gallery_controls'));
    ['modalPrev', 'modalNext'].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.hidden = activeMediaIndex < 0 || galleryEntries.length < 2;
    });
    const counter = document.getElementById('modalCounter');
    if (counter) {
        const current = activeMediaIndex + 1;
        const total = galleryEntries.length;
        counter.textContent = current > 0 ? `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}` : '';
        counter.setAttribute('aria-label', current > 0 ? label('gallery_position').replace('{current}', current).replace('{total}', total) : '');
    }
}

function openMedia(value, type, trigger, direction = 0) {
    const url = mediaUrl(value);
    if (!url || !mediaDialog) return;
    clearModalMedia();
    const origin = !mediaDialog.isOpen() && type === 'image' ? thumbnailBounds(trigger) : null;
    activeMediaTrigger = trigger;
    const node = document.getElementById(type === 'pdf' ? 'modalPdf' : type === 'video' ? 'modalVideo' : 'modalImg');
    if (!node) return;
    document.querySelector('#mediaModal .modal-body').dataset.mediaType = type;
    node.style.display = 'block';
    node.src = url;
    if (type === 'image') node.alt = trigger?.querySelector('img')?.alt || '';
    const download = document.getElementById('modalDownload');
    if (download) { download.href = url; download.textContent = label('open_file'); download.hidden = type !== 'pdf'; }
    activeMediaIndex = galleryEntries.findIndex(entry => entry.trigger === trigger && entry.url === url && entry.type === type);
    updateMediaNavigation();
    const source = trigger?.closest('[hidden], [inert]') ? document.querySelector('.hamburger') : trigger;
    mediaDialog.open(source);
    refreshVideoPlayback();
    if (type === 'image') animateMediaOpen(node, trigger, origin, direction);
    if (type === 'video') node.play().catch(() => {});
}

function navigateMedia(direction) {
    if (activeMediaIndex < 0 || galleryEntries.length < 2 || !mediaDialog?.isOpen()) return;
    const entry = galleryEntries[(activeMediaIndex + direction + galleryEntries.length) % galleryEntries.length];
    openMedia(entry.url, entry.type, entry.trigger, direction);
}

function installMediaSwipe(stage) {
    if (!stage) return;
    // Leave video controls and native pinch/vertical gestures to the browser.
    stage.closest('.modal')?.addEventListener('pointerdown', event => {
        if (event.pointerType === 'touch' && !event.isPrimary) mediaSwipe = null;
    }, { passive: true, capture: true });
    stage.addEventListener('pointerdown', event => {
        mediaSwipe = null;
        if (event.pointerType !== 'touch' || !event.isPrimary || !mediaDialog?.isOpen() || activeMediaIndex < 0 || galleryEntries.length < 2) return;
        if (event.target.closest('video,audio,iframe,button,a,input,textarea,select') || (window.visualViewport?.scale || 1) > 1.05) return;
        mediaSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now() };
    }, { passive: true });
    stage.addEventListener('pointerup', event => {
        const gesture = mediaSwipe;
        mediaSwipe = null;
        if (!gesture || event.pointerId !== gesture.id || !event.isPrimary || (window.visualViewport?.scale || 1) > 1.05) return;
        const dx = event.clientX - gesture.x;
        const dy = event.clientY - gesture.y;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5 || performance.now() - gesture.started > 900) return;
        ignoreMediaBackdropClickUntil = performance.now() + 400;
        navigateMedia(dx < 0 ? 1 : -1);
    }, { passive: true });
    ['pointercancel', 'lostpointercapture'].forEach(name => stage.addEventListener(name, () => { mediaSwipe = null; }, { passive: true }));
}

async function loadAdminTools() {
    let status = document.getElementById('adminToolsStatus');
    if (!status) {
        status = makeElement('div', 'section-status');
        status.id = 'adminToolsStatus';
        status.setAttribute('role', 'status');
        document.querySelector('.hero-content')?.prepend(status);
    }
    status.replaceChildren(makeElement('p', '', label('loading')));
    const loadScript = src => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => { script.remove(); reject(new Error('Script failed')); };
        document.head.append(script);
    });
    try {
        await Promise.all([
            window.supabase ? Promise.resolve() : loadScript('vendor/supabase.min.js'),
            window.Sortable ? Promise.resolve() : loadScript('vendor/Sortable.min.js')
        ]);
        await loadScript('admin-mode.js');
        status.remove();
    } catch (_) {
        const message = makeElement('p', '', label('editor_error'));
        message.dataset.i18n = 'editor_error';
        const retry = makeElement('button', 'btn btn-outline', label('retry'));
        retry.type = 'button';
        retry.dataset.i18n = 'retry';
        retry.addEventListener('click', loadAdminTools, { once: true });
        status.replaceChildren(message, retry);
    }
}

async function fetchTable(table) {
    const previous = requests[table];
    if (previous) previous.controller.abort();
    const request = { controller: new AbortController() };
    requests[table] = request;
    updateSectionStatus(table, 'loading');
    let timeout;
    try {
        const operation = (async () => {
            const ordering = table === 'settings' ? '' : '&order=sort_order,id';
            const response = await fetch(SUPABASE_URL + '/rest/v1/' + table + '?select=*' + ordering, {
                headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY },
                signal: request.controller.signal
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (!Array.isArray(data) || data.some(item => !item || typeof item !== 'object')) throw new Error('Invalid data');
            return data;
        })();
        const deadline = new Promise((_, reject) => {
            timeout = setTimeout(() => { request.controller.abort(); reject(new Error('Request timed out')); }, 12000);
            request.controller.signal.addEventListener('abort', () => reject(new Error('Request aborted')), { once: true });
        });
        const data = await Promise.race([operation, deadline]);
        if (requests[table] !== request) return;
        cache[table] = data;
        if (table === 'settings') renderSettings(data);
        if (table === 'experience_items') renderExperience(data);
        if (table === 'skill_items') renderSkills(data);
        if (table === 'album_items') {
            renderAlbum(data);
            if (cache.experience_items) renderExperience(cache.experience_items);
        } else updateSectionStatus(table, data.length ? '' : 'empty');
        applyLanguage(currentLanguage());
    } catch (error) {
        if (requests[table] !== request) return;
        updateSectionStatus(table, 'error');
        console.warn('Unable to load portfolio section:', table);
    } finally {
        clearTimeout(timeout);
        if (requests[table] === request) delete requests[table];
    }
}

async function fetchDynamicData(selectedTables = tables) {
    const selected = Array.isArray(selectedTables) ? selectedTables.filter(table => tables.includes(table)) : tables;
    await Promise.allSettled(selected.map(fetchTable));
    window.dispatchEvent(new Event('dynamicDataLoaded'));
}

function initializePortfolio() {
    const modal = document.getElementById('mediaModal');
    if (modal) {
        mediaDialog = portfolio.createDialog(modal, {
            display: 'grid', canClose: animateMediaClose,
            onClose: () => { activeMediaIndex = -1; activeMediaTrigger = null; clearModalMedia({ preserveMotion: true }); refreshVideoPlayback(); }
        });
        modal.querySelector('.modal-close')?.addEventListener('click', () => mediaDialog.close());
        modal.addEventListener('click', event => {
            if (event.target.classList.contains('modal-body') && performance.now() < ignoreMediaBackdropClickUntil) return;
            if (event.target === modal || event.target.classList.contains('modal-body')) mediaDialog.close();
        });
        const body = modal.querySelector('.modal-body');
        const status = makeElement('p', 'media-error', label('media_error'));
        status.id = 'modalStatus';
        status.dataset.i18n = 'media_error';
        status.hidden = true;
        status.setAttribute('role', 'status');
        body?.append(status);
        const controls = makeElement('div', 'modal-controls');
        controls.id = 'modalControls';
        controls.hidden = true;
        controls.setAttribute('role', 'group');
        const counter = makeElement('span', 'modal-counter');
        counter.id = 'modalCounter';
        counter.setAttribute('role', 'status');
        counter.setAttribute('aria-live', 'polite');
        counter.setAttribute('aria-atomic', 'true');
        [['modalPrev', 'modal-nav modal-prev', -1], ['modalNext', 'modal-nav modal-next', 1]].forEach(([id, className, direction]) => {
            const button = makeElement('button', className);
            button.id = id;
            button.type = 'button';
            button.hidden = true;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
            svg.setAttribute('stroke-width', '1.6');
            svg.setAttribute('stroke-linecap', 'round');
            svg.setAttribute('stroke-linejoin', 'round');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('focusable', 'false');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', direction < 0 ? 'M14 6l-6 6 6 6' : 'M10 6l6 6-6 6');
            svg.append(path);
            button.append(svg);
            button.addEventListener('click', () => navigateMedia(direction));
            controls.append(button);
            if (direction < 0) controls.append(counter);
        });
        modal.append(controls);
        const modalImage = document.getElementById('modalImg');
        if (modalImage) modalImage.draggable = false;
        installMediaSwipe(body);
        document.addEventListener('keydown', event => {
            if (!mediaDialog.isOpen() || event.target.matches?.('video,audio,iframe,input,textarea,select') || event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                navigateMedia(event.key === 'ArrowLeft' ? -1 : 1);
            }
        });
        ['modalImg', 'modalVideo', 'modalPdf'].forEach(id => document.getElementById(id)?.addEventListener('error', event => {
            if (!event.currentTarget.getAttribute('src')) return;
            stopMediaMotion();
            event.currentTarget.style.display = 'none';
            status.hidden = false;
            const download = document.getElementById('modalDownload');
            if (download?.hasAttribute('href')) download.hidden = false;
        }));
    }
    const menu = document.querySelector('.mobile-menu');
    const toggle = document.querySelector('.hamburger');
    if (menu && toggle) {
        menuDialog = portfolio.createDialog(menu, { display: 'flex', onClose: () => {
            menu.classList.remove('active'); menu.hidden = true; menu.inert = true; toggle.setAttribute('aria-expanded', 'false'); refreshVideoPlayback();
        } });
        toggle.addEventListener('click', () => {
            if (menuDialog.isOpen()) { menuDialog.close(); return; }
            menu.hidden = false; menu.inert = false; menu.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true'); menuDialog.open(toggle);
            refreshVideoPlayback();
        });
        menu.querySelector('.close-menu')?.addEventListener('click', () => menuDialog.close());
        menu.querySelectorAll('.mobile-link').forEach(link => link.addEventListener('click', () => menuDialog.close()));
        window.addEventListener('resize', () => { if (window.innerWidth > 1040) menuDialog.close(); });
    }
    const themeSwitch = document.getElementById('theme-switch');
    let dark = false;
    try { dark = localStorage.getItem('portfolioTheme') === 'dark'; } catch (_) { /* Use default theme. */ }
    const setTheme = () => {
        document.body.toggleAttribute('data-theme', dark);
        if (dark) document.body.setAttribute('data-theme', 'dark');
        const icon = themeSwitch?.querySelector('i');
        if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
        themeSwitch?.setAttribute('aria-pressed', String(dark));
    };
    setTheme();
    themeSwitch?.addEventListener('click', () => { dark = !dark; setTheme(); savePreference('portfolioTheme', dark ? 'dark' : 'light'); });
    document.getElementById('lang-switch')?.addEventListener('click', () => {
        const lang = document.documentElement.lang === 'en' ? 'vi' : 'en';
        savePreference('portfolioLang', lang);
        applyLanguage(lang);
    });
    applyLanguage(currentLanguage());
    const navbar = document.querySelector('.navbar');
    let scrollPending = false;
    window.addEventListener('scroll', () => {
        if (scrollPending) return;
        scrollPending = true;
        window.requestAnimationFrame(() => { navbar?.classList.toggle('scrolled', window.scrollY > 50); scrollPending = false; });
    }, { passive: true });
    const cursor = document.getElementById('custom-cursor');
    const pointer = window.matchMedia ? window.matchMedia('(min-width: 769px) and (pointer: fine)') : { matches: false };
    if (cursor) {
        document.addEventListener('mousemove', event => {
            if (!pointer.matches || motionPreference.matches) return;
            document.body.classList.add('custom-cursor-enabled');
            cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
            cursor.classList.toggle('hover', Boolean(event.target.closest('a,button,input,textarea')));
        });
        document.documentElement.addEventListener('mouseleave', () => document.body.classList.remove('custom-cursor-enabled'));
        const resetCursor = () => document.body.classList.remove('custom-cursor-enabled');
        pointer.addEventListener?.('change', resetCursor);
        motionPreference.addEventListener?.('change', resetCursor);
    }
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) { stopMediaMotion(); document.getElementById('modalVideo')?.pause(); }
        refreshVideoPlayback();
    });
    motionPreference.addEventListener?.('change', refreshVideoPlayback);
    motionPreference.addEventListener?.('change', stopMediaMotion);
    window.addEventListener('resize', stopMediaMotion);
    window.addEventListener('pagehide', stopMediaMotion);
    // Keep readable static content visible while independent data requests finish.
    document.querySelectorAll('.reveal').forEach(node => node.classList.add('active'));
    const title = document.getElementById('typewriter');
    if (title && !title.textContent.trim()) title.textContent = 'HÀ NGỌC';
    renderSettings([]);
    fetchDynamicData();
    let adminMode = false;
    try { adminMode = sessionStorage.getItem('adminMode') === 'true'; } catch (_) { /* Public view. */ }
    if (adminMode) loadAdminTools();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePortfolio, { once: true });
else initializePortfolio();
