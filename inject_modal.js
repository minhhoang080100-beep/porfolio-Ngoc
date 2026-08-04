const fs = require('fs');
let html = fs.readFileSync('d:/Ngoc selection/Ngọc/index.html', 'utf8');

const target = `    <!-- Custom Cursor -->`;
const injection = `    <!-- Project Gallery Modal -->
    <div class="modal" id="projectModal" style="z-index: 10000;">
        <span class="modal-close" id="projectModalClose"><i class="fas fa-times"></i></span>
        <div class="modal-body" style="width: 90vw; max-width: 1000px; height: 80vh; background: var(--bg-color); border-radius: 12px; padding: 30px; overflow-y: auto;">
            <h2 id="projectModalTitle" style="margin-bottom: 20px; font-size: 2rem; color: var(--primary-color);">Dự án</h2>
            <div id="projectModalGrid" class="masonry-grid" style="column-count: 2; column-gap: 20px;">
                <!-- Dynamically injected photos/videos for the project -->
            </div>
        </div>
    </div>

    <!-- Custom Cursor -->`;

html = html.replace(target, injection);
fs.writeFileSync('d:/Ngoc selection/Ngọc/index.html', html, 'utf8');
console.log("Injected modal HTML!");
