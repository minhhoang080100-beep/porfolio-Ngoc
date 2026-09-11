const { test, expect } = require('@playwright/test');

const tables = {
    settings: [
        { key: 'contact_phone', value: '0123456789' },
        { key: 'contact_email', value: 'hello@example.com' },
        { key: 'cv_url', value: 'http://127.0.0.1:4173/Nguyen-Ha-Ngoc-CV.pdf' }
    ],
    experience_items: [{ id: 1, company: 'Studio & Creative', year: '2026', role_vi: 'Diễn viên "chính"', role_en: 'Lead "actress"', sort_order: 0 }],
    skill_items: [{ id: 1, title_en: 'Video production', icon_class: 'fas fa-camera', desc_vi: 'Sáng tạo nội dung', desc_en: 'Create "stories" with purpose', sort_order: 0 }],
    album_items: [
        { id: 1, type: 'image', url: 'http://127.0.0.1:4173/source/Lọc%20source/1.jpg', file_path: 'portrait.jpg', sort_order: 0 },
        { id: 2, type: 'image', url: 'http://127.0.0.1:4173/og-image.jpg', file_path: 'portrait-2.jpg', sort_order: 1 },
        { id: 3, type: 'text_link', experience_id: 1, url: 'https://example.com/project', file_path: JSON.stringify({ title: 'Campaign "Stories"', preview_image: 'http://127.0.0.1:4173/og-image.jpg' }), sort_order: 0 }
    ]
};

async function mockData(page, options = {}) {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // No test request reaches the real database or Storage, including unexpected mutations.
    await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async route => {
        const request = route.request();
        const url = new URL(request.url());
        const table = url.pathname.split('/rest/v1/')[1];
        if (request.method() !== 'GET') {
            options.writes?.push({ method: request.method(), table, body: request.postDataJSON() });
            if (options.allowOrderWrites && request.method() === 'PATCH' && Object.keys(request.postDataJSON()).every(key => key === 'sort_order')) {
                await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: Number(url.searchParams.get('id')?.replace('eq.', '')) }]) });
                return;
            }
            await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Simulated save failure', code: 'TEST_FAILURE' }) });
            return;
        }
        const data = options.tables || tables;
        if (!data[table]) { await route.fulfill({ status: 404, body: '{}' }); return; }
        if (table === 'skill_items' && options.failSkills) {
            await route.fulfill({ status: 503, body: '{}' }); return;
        }
        let rows = data[table];
        if (url.searchParams.get('key')) rows = rows.filter(row => row.key === url.searchParams.get('key').replace('eq.', ''));
        const single = request.headers().accept?.includes('vnd.pgrst.object');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(single ? rows[0] || null : rows) });
    });
    await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)\/.*/, route => route.abort());
    return errors;
}

async function expectControlsBelowMedia(page, selector) {
    const media = await page.locator(selector).boundingBox();
    const controls = await page.locator('#modalControls').boundingBox();
    expect(media).not.toBeNull();
    expect(controls).not.toBeNull();
    expect(controls.y).toBeGreaterThanOrEqual(media.y + media.height - 1);
    expect(controls.x).toBeGreaterThanOrEqual(0);
    expect(controls.x + controls.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    expect(controls.y + controls.height).toBeLessThanOrEqual(page.viewportSize().height);
}

test('desktop preserves quoted content and image dialog supports keyboard focus', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = await mockData(page);
    await page.goto('/');
    await expect(page.locator('.role')).toHaveText('Lead "actress"');
    await expect(page.locator('.skill-card p')).toHaveText('Create "stories" with purpose');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const album = page.locator('.album-open').first();
    await album.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mediaModal')).toBeVisible();
    await expect(page.locator('#modalDownload')).toBeHidden();
    await expect(page.locator('#modalCounter')).toHaveText('01 / 02');
    await expect(page.locator('.media-morph')).toHaveCount(0);
    await expectControlsBelowMedia(page, '#modalImg');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#modalImg')).toHaveAttribute('src', /og-image\.jpg$/);
    await expect(page.locator('#modalCounter')).toHaveText('02 / 02');
    await page.locator('#modalPrev').click();
    await expect(page.locator('#modalImg')).toHaveAttribute('src', /1\.jpg$/);
    await expect(page.locator('#modalCounter')).toHaveText('01 / 02');
    await page.keyboard.press('Escape');
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await page.locator('#theme-switch').click();
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#lang-switch').click();
    await expect(page.locator('.role')).toHaveText('Diễn viên "chính"');
    expect(errors).toEqual([]);
});

test('mobile menu closes correctly and narrow desktop keeps a visible native cursor', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors = await mockData(page);
    await page.goto('/');
    await expect(page.locator('.album-open')).toHaveCount(2);
    await page.locator('.hamburger').click();
    await expect(page.locator('#mobileMenu')).toBeVisible();
    await expect(page.locator('.hamburger')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobileMenu')).toBeHidden();
    await expect(page.locator('.hamburger')).toBeFocused();
    await page.mouse.move(120, 180);
    expect(await page.locator('body').evaluate(node => getComputedStyle(node).cursor)).not.toBe('none');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

test('one failed section leaves contact and album usable and can retry', async ({ page }) => {
    const options = { failSkills: true };
    const errors = await mockData(page, options);
    await page.goto('/');
    await expect(page.locator('#status-skill_items')).toBeVisible();
    await expect(page.locator('#phoneItem')).toHaveText('0123456789');
    await expect(page.locator('.album-open')).toHaveCount(2);
    options.failSkills = false;
    await page.locator('#status-skill_items button').click();
    await expect(page.locator('.skill-card')).toHaveCount(1);
    await expect(page.locator('#status-skill_items')).toBeHidden();
    expect(errors).toEqual([]);
});

test('PIN entry still opens admin and saving failure keeps the editor usable', async ({ page }) => {
    const writes = [];
    const errors = await mockData(page, { writes });
    await page.goto('/admin');
    // Read the current PIN from the unchanged local login script; no credential is sent externally.
    const pin = await page.locator('script').last().textContent();
    await page.locator('#pinInput').fill(pin.match(/ADMIN_PIN\s*=\s*'([^']+)'/)[1]);
    await page.locator('#btnPin').click();
    await expect(page.locator('.admin-bar')).toBeVisible();
    await page.locator('#skillsGrid .admin-item-edit').first().click();
    await expect(page.locator('.admin-modal-overlay')).toBeVisible();
    await page.locator('#adminModalSave').click();
    await expect(page.locator('#adminModalSave')).toBeEnabled();
    await expect(page.locator('.admin-modal-overlay')).toBeVisible();
    await expect(page.locator('.admin-toast')).toContainText('Simulated save failure');
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({ method: 'PATCH', table: 'skill_items', body: { title_en: 'Video production' } });
    expect(errors).toEqual([]);
});

test('album order can be changed with keyboard controls without opening a media dialog', async ({ page }) => {
    const writes = [];
    const errors = await mockData(page, { writes, allowOrderWrites: true });
    await page.addInitScript(() => sessionStorage.setItem('adminMode', 'true'));
    await page.goto('/');
    const first = page.locator('#albumGrid > .masonry-item').first();
    await expect(first.locator('.admin-drag-handle')).toBeVisible();
    const move = first.getByRole('button', { name: 'Đưa xuống sau', exact: true });
    await move.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.admin-toast')).toContainText('Đã lưu thứ tự');
    expect(await page.locator('#albumGrid > .masonry-item').evaluateAll(nodes => nodes.map(node => node.dataset.id))).toEqual(['2', '1']);
    expect(writes).toHaveLength(2);
    expect(writes.map(write => write.body.sort_order)).toEqual([0, 1]);
    await expect(page.locator('#mediaModal')).toBeHidden();
    expect(errors).toEqual([]);
});

async function observeMediaMorphs(page, { pause = false } = {}) {
    await page.addInitScript(({ pause }) => {
        const animate = Element.prototype.animate;
        window.__mediaMorphAnimations = [];
        Element.prototype.animate = function (...args) {
            const animation = animate.apply(this, args);
            if (this.classList.contains('media-morph')) {
                window.__mediaMorphAnimations.push(animation);
                // Hold the actual animation at its beginning so interruption tests do not
                // depend on CPU speed or an arbitrary delay inside a short transition.
                if (pause) animation.pause();
            }
            return animation;
        };
    }, { pause });
}

async function finishMediaMorphs(page) {
    await page.evaluate(() => {
        window.__mediaMorphAnimations.forEach(animation => {
            if (animation.playState === 'paused' || animation.playState === 'running') animation.finish();
        });
    });
    await expect(page.locator('.media-morph')).toHaveCount(0);
}

async function loadedAlbumImage(page, index = 0) {
    const trigger = page.locator('.album-open').nth(index);
    await trigger.scrollIntoViewIfNeeded();
    await expect.poll(() => trigger.locator('img').evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await trigger.scrollIntoViewIfNeeded();
    return trigger;
}

async function expectAlbumImagesRestored(page) {
    for (const node of await page.locator('.album-open, .album-open img').all()) {
        await expect(node).toBeVisible();
        await expect(node).toHaveCSS('visibility', 'visible');
        await expect(node).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('.media-morph')).toHaveCount(0);
}

test('album image morph completes and rapid navigation restores the original keyboard trigger', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await observeMediaMorphs(page, { pause: true });
    const errors = await mockData(page);
    await page.goto('/');
    const album = await loadedAlbumImage(page);
    await loadedAlbumImage(page, 1);
    await album.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mediaModal')).toBeVisible();
    const ghost = page.locator('.media-morph');
    await expect(ghost).toHaveCount(1);
    await expect(ghost).toHaveAttribute('aria-hidden', 'true');
    await expect(ghost).toHaveCSS('pointer-events', 'none');
    await finishMediaMorphs(page);
    await expect(page.locator('#modalImg')).toHaveCSS('visibility', 'visible');
    await expect(page.locator('#modalImg')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await expect(ghost).toHaveCount(1);
    await finishMediaMorphs(page);
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await expectAlbumImagesRestored(page);

    // Navigate and close while the next opening transition is still in flight.
    await page.keyboard.press('Enter');
    await expect(ghost).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#modalImg')).toHaveAttribute('src', /og-image\.jpg$/);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await finishMediaMorphs(page);
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await expectAlbumImagesRestored(page);
    expect(errors).toEqual([]);
});

test('album image open and close fit a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const errors = await mockData(page);
    await page.goto('/');
    const album = await loadedAlbumImage(page);
    await album.click();
    await expect(page.locator('#mediaModal')).toBeVisible();
    await expect(page.locator('#modalImg')).toBeVisible();
    await expect(page.locator('.media-morph')).toHaveCount(0);
    const imageBounds = await page.locator('#modalImg').boundingBox();
    expect(imageBounds.x).toBeGreaterThanOrEqual(0);
    expect(imageBounds.x + imageBounds.width).toBeLessThanOrEqual(321);
    await expectControlsBelowMedia(page, '#modalImg');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await expectAlbumImagesRestored(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
});

async function gesture(target, events, pointerType = 'touch') {
    await target.evaluate((node, { events, pointerType }) => {
        events.forEach(({ type, x, y, id = 1, primary = true }) => {
            node.dispatchEvent(new PointerEvent(type, {
                bubbles: true, cancelable: true, pointerType, pointerId: id,
                isPrimary: primary, clientX: x, clientY: y,
                button: 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1
            }));
        });
    }, { events, pointerType });
}

test('touch swipes navigate photos while vertical drags, multiple touches, and controls do not', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = await mockData(page);
    await page.goto('/');
    await (await loadedAlbumImage(page)).click();
    const photo = page.locator('#modalImg');
    const counter = page.locator('#modalCounter');
    const left = [
        { type: 'pointerdown', x: 260, y: 300 },
        { type: 'pointermove', x: 170, y: 304 },
        { type: 'pointerup', x: 110, y: 305 }
    ];
    await gesture(photo, left);
    await expect(counter).toHaveText('02 / 02');
    await expect(photo).toHaveAttribute('src', /og-image\.jpg$/);
    await gesture(photo, [
        { type: 'pointerdown', x: 100, y: 300 },
        { type: 'pointerup', x: 260, y: 305 }
    ]);
    await expect(counter).toHaveText('01 / 02');
    await gesture(photo, [
        { type: 'pointerdown', x: 160, y: 260 },
        { type: 'pointermove', x: 200, y: 350 },
        { type: 'pointerup', x: 220, y: 450 }
    ]);
    await expect(counter).toHaveText('01 / 02');
    await gesture(photo, left, 'mouse');
    await expect(counter).toHaveText('01 / 02');
    await gesture(photo, [
        { type: 'pointerdown', x: 260, y: 300 },
        { type: 'pointercancel', x: 170, y: 300 },
        { type: 'pointerup', x: 110, y: 300 }
    ]);
    await expect(counter).toHaveText('01 / 02');
    await gesture(photo, [
        { type: 'pointerdown', x: 260, y: 300 },
        { type: 'pointerdown', x: 170, y: 300, id: 2, primary: false },
        { type: 'pointerup', x: 110, y: 300 },
        { type: 'pointerup', x: 220, y: 300, id: 2, primary: false }
    ]);
    await expect(counter).toHaveText('01 / 02');
    await gesture(page.locator('#modalNext'), left);
    await expect(counter).toHaveText('01 / 02');
    await expect(page.locator('#mediaModal')).toBeVisible();
    await page.locator('#modalNext').click();
    await expect(counter).toHaveText('02 / 02');
    expect(errors).toEqual([]);
});

test('video keeps its native controls clear and ignores swipes over playback', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const data = { ...tables, album_items: [
        { id: 4, type: 'video', url: 'http://127.0.0.1:4173/source/Lọc%20source/8055902076146.mp4', sort_order: 0 },
        tables.album_items[0]
    ] };
    const errors = await mockData(page, { tables: data });
    await page.goto('/');
    await page.locator('.album-open').first().click();
    const video = page.locator('#modalVideo');
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate(node => node.readyState)).toBeGreaterThanOrEqual(1);
    await expectControlsBelowMedia(page, '#modalVideo');
    await expect(page.locator('#modalDownload')).toBeHidden();
    await gesture(video, [
        { type: 'pointerdown', x: 260, y: 500 },
        { type: 'pointerup', x: 90, y: 500 }
    ]);
    await expect(page.locator('#modalCounter')).toHaveText('01 / 02');
    await expect(video).toBeVisible();
    await page.locator('#modalNext').click();
    await expect(page.locator('#modalCounter')).toHaveText('02 / 02');
    await expect(page.locator('#modalImg')).toBeVisible();
    expect(errors).toEqual([]);
});

test('a failed photo exposes a recovery link and CV keeps its link without gallery controls', async ({ page }) => {
    const errors = await mockData(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await (await loadedAlbumImage(page)).click();
    await expect(page.locator('#modalDownload')).toBeHidden();
    await page.locator('#modalImg').dispatchEvent('error');
    await expect(page.locator('#modalStatus')).toBeVisible();
    await expect(page.locator('#modalDownload')).toBeVisible();
    await expect(page.locator('#modalDownload')).toHaveAttribute('href', /1\.jpg$/);
    await page.locator('#modalNext').click();
    await expect(page.locator('#modalStatus')).toBeHidden();
    await expect(page.locator('#modalDownload')).toBeHidden();
    await page.keyboard.press('Escape');
    await page.locator('.btn-cv').first().click();
    await expect(page.locator('#modalPdf')).toBeVisible();
    await expect(page.locator('#modalDownload')).toBeVisible();
    await expect(page.locator('#modalDownload')).toHaveAttribute('href', /Nguyen-Ha-Ngoc-CV\.pdf$/);
    await expect(page.locator('#modalControls')).toBeHidden();
    await expect(page.locator('#modalCounter')).toBeHidden();
    expect(errors).toEqual([]);
});

test('reduced motion keeps the hero readable and album operable without image morphs', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await observeMediaMorphs(page);
    const errors = await mockData(page);
    await page.goto('/');
    await expect(page.locator('.hero h1')).toBeVisible();
    await expect(page.locator('.hero .pre-title')).toHaveCSS('opacity', '1');
    expect(await page.locator('.hero').evaluate(hero => hero.getAnimations({ subtree: true })
        .filter(animation => ['running', 'pending', 'paused'].includes(animation.playState)
            && Number(animation.effect.getTiming().duration) > 1).length)).toBe(0);
    const album = await loadedAlbumImage(page);
    await album.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mediaModal')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#modalImg')).toHaveAttribute('src', /og-image\.jpg$/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await expectAlbumImagesRestored(page);
    expect(await page.evaluate(() => window.__mediaMorphAnimations.length)).toBe(0);
    expect(errors).toEqual([]);
});

test('changing motion preference during an image transition removes the overlay immediately', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await observeMediaMorphs(page, { pause: true });
    const errors = await mockData(page);
    await page.goto('/');
    const album = await loadedAlbumImage(page);
    await album.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.media-morph')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.media-morph')).toHaveCount(0);
    await expect(page.locator('#mediaModal')).toBeVisible();
    await expect(page.locator('#modalImg')).toHaveCSS('visibility', 'visible');
    await expect(page.locator('#modalImg')).toHaveCSS('opacity', '1');
    await page.keyboard.press('Escape');
    await expect(page.locator('#mediaModal')).toBeHidden();
    await expect(album).toBeFocused();
    await expectAlbumImagesRestored(page);
    expect(await page.evaluate(() => window.__mediaMorphAnimations
        .filter(animation => ['running', 'paused'].includes(animation.playState)).length)).toBe(0);
    expect(errors).toEqual([]);
});
