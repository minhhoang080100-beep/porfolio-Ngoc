import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parse } from 'css-tree';
import { JSDOM } from 'jsdom';
import { root } from './build.mjs';

for (const name of ['portfolio-core.js', 'main.js', 'admin-mode.js']) {
    new vm.Script(fs.readFileSync(path.join(root, name), 'utf8'), { filename: name });
}
for (const name of ['index.html', 'admin.html']) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, name), 'utf8'));
    const ids = new Set();
    for (const element of dom.window.document.querySelectorAll('[id]')) {
        if (ids.has(element.id)) throw new Error(`${name}: duplicate id ${element.id}`);
        ids.add(element.id);
    }
    for (const script of dom.window.document.querySelectorAll('script:not([src])')) {
        if (!script.type || ['text/javascript', 'application/javascript'].includes(script.type)) {
            new vm.Script(script.textContent, { filename: name });
        }
    }
    for (const element of dom.window.document.querySelectorAll('[src],link[href]')) {
        const value = element.getAttribute('src') || element.getAttribute('href');
        if (!value || /^(?:https?:|data:|#)/i.test(value)) continue;
        if (!fs.existsSync(path.join(root, decodeURIComponent(value)))) throw new Error(`${name}: missing asset ${value}`);
    }
    for (const style of dom.window.document.querySelectorAll('style')) parse(style.textContent, { onParseError(error) { throw error; } });
    dom.window.close();
}
parse(fs.readFileSync(path.join(root, 'style.css'), 'utf8'), { onParseError(error) { throw error; } });
console.log('JavaScript, CSS, HTML IDs and local asset references checked.');
