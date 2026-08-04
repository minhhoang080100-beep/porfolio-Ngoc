const fs = require('fs');

// --- 1. Modify main.js ---
let mainJs = fs.readFileSync('d:/Ngoc selection/Ngọc/main.js', 'utf8');

const oldExp = `        // --- Render Experience ---
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
        }`;

const newExp = `        // --- Render Experience ---
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

                // Add Project Button if there is media
                const relatedMedia = albumItems.filter(item => item.experience_id === exp.id);
                if (relatedMedia.length > 0) {
                    const btn = document.createElement('button');
                    btn.className = 'btn-view-project';
                    btn.innerHTML = \`<i class="fas fa-images"></i> Xem dự án (\${relatedMedia.length})\`;
                    btn.onclick = () => window.openProjectModal(exp.company, relatedMedia);
                    div.querySelector('.timeline-content').appendChild(btn);
                }

                expGrid.appendChild(div);
            });
        }`;

mainJs = mainJs.replace(oldExp, newExp);

// Add window.openProjectModal function at the end of the file
const projectModalLogic = `
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
`;
if (!mainJs.includes('window.openProjectModal')) {
    mainJs += projectModalLogic;
}

fs.writeFileSync('d:/Ngoc selection/Ngọc/main.js', mainJs, 'utf8');
console.log("Updated main.js with Project modal logic");


// --- 2. Modify style.css ---
let styleCss = fs.readFileSync('d:/Ngoc selection/Ngọc/style.css', 'utf8');
const newCss = `

/* btn-view-project */
.btn-view-project {
    margin-top: 15px;
    padding: 8px 16px;
    background: rgba(167, 208, 246, 0.1);
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
    border-radius: 20px;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
.btn-view-project:hover {
    background: var(--primary-color);
    color: var(--bg-color);
    transform: translateY(-2px);
}
`;

if (!styleCss.includes('.btn-view-project')) {
    styleCss += newCss;
    fs.writeFileSync('d:/Ngoc selection/Ngọc/style.css', styleCss, 'utf8');
    console.log("Updated style.css");
}
