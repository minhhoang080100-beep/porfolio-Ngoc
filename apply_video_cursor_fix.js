const fs = require('fs');

// --- 1. Modify style.css ---
let styleCss = fs.readFileSync('d:/Ngoc selection/Ngọc/style.css', 'utf8');
const oldCursorCss = `.custom-cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 25px;
    height: 25px;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
    transition: width 0.2s, height 0.2s, background-color 0.2s;
    background-color: rgba(167, 208, 246, 0.2);
}`;
const newCursorCss = `.custom-cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 25px;
    height: 25px;
    border: 2px solid var(--primary-color);
    border-radius: 50%;
    /* GPU Acceleration */
    will-change: transform;
    transform: translate3d(-50%, -50%, 0);
    pointer-events: none;
    z-index: 9999;
    transition: width 0.2s, height 0.2s, background-color 0.2s;
    background-color: rgba(167, 208, 246, 0.2);
}`;

if (styleCss.includes(oldCursorCss)) {
    styleCss = styleCss.replace(oldCursorCss, newCursorCss);
    fs.writeFileSync('d:/Ngoc selection/Ngọc/style.css', styleCss, 'utf8');
    console.log("Updated style.css cursor!");
} else {
    console.log("Could not find old cursor CSS.");
}

// --- 2. Modify main.js ---
let mainJs = fs.readFileSync('d:/Ngoc selection/Ngọc/main.js', 'utf8');

// 2a. Replace Video Autoplay logic
const oldVideoLogic = `                            vid.autoplay = true; vid.loop = true; vid.muted = true; vid.playsInline = true;
                            vid.onloadeddata = () => div.classList.remove('skeleton');
                            div.appendChild(vid);`;

const newVideoLogic = `                            vid.loop = true; vid.muted = true; vid.playsInline = true;
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
                            }`;

if (mainJs.includes(oldVideoLogic)) {
    mainJs = mainJs.replace(oldVideoLogic, newVideoLogic);
    console.log("Updated video logic!");
} else {
    console.log("Could not find old video logic.");
}

// 2b. Replace Cursor Logic
const oldCursorJs = `    // Custom Cursor
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = e.clientX + 'px';
            customCursor.style.top = e.clientY + 'px';
        });`;

const newCursorJs = `    // Custom Cursor (Optimized GPU Acceleration)
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            window.requestAnimationFrame(() => {
                // Use translate3d for GPU acceleration.
                // Note: we use translate3d instead of top/left. We subtract 12.5px (half of 25px) to center it.
                customCursor.style.transform = \`translate3d(\${e.clientX - 12.5}px, \${e.clientY - 12.5}px, 0)\`;
            });
        });`;

if (mainJs.includes(oldCursorJs)) {
    mainJs = mainJs.replace(oldCursorJs, newCursorJs);
    console.log("Updated cursor JS logic!");
} else {
    console.log("Could not find old cursor JS logic.");
}

fs.writeFileSync('d:/Ngoc selection/Ngọc/main.js', mainJs, 'utf8');

