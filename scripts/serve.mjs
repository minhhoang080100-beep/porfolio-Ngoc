import http from 'node:http';
import fs from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { root, siteFiles } from './build.mjs';

const port = Number(process.env.PORT || 4173);
const vendorFiles = {
    'vendor/supabase.min.js': 'node_modules/@supabase/supabase-js/dist/umd/supabase.js',
    'vendor/Sortable.min.js': 'node_modules/sortablejs/Sortable.min.js'
};
const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.pdf': 'application/pdf', '.mp4': 'video/mp4'
};
const server = http.createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        let filename = path.resolve(root, '.' + pathname);
        if (!filename.startsWith(root + path.sep) && filename !== root) { res.writeHead(403).end(); return; }
        if (pathname.endsWith('/')) filename = path.join(filename, 'index.html');
        else if (!path.extname(filename)) filename += '.html';
        const relative = path.relative(root, filename).split(path.sep).join('/');
        if (Object.hasOwn(vendorFiles, relative)) filename = path.join(root, vendorFiles[relative]);
        else if (!siteFiles.includes(relative) && !relative.startsWith('source/')) { res.writeHead(404).end(); return; }
        const info = await stat(filename);
        if (!info.isFile()) { res.writeHead(404).end(); return; }
        const headers = { 'Content-Type': types[path.extname(filename).toLowerCase()] || 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
        let start = 0, end = info.size - 1;
        if (req.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
            if (match && (match[1] || match[2])) {
                start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
                end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
            }
            if (!match || (!match[1] && !match[2]) || start > end || start >= info.size) {
                res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return;
            }
            headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
            headers['Content-Length'] = end - start + 1;
        }
        res.writeHead(req.headers.range ? 206 : 200, headers);
        if (req.method === 'HEAD' || info.size === 0) { res.end(); return; }
        const stream = fs.createReadStream(filename, { start, end });
        stream.on('error', () => res.destroy());
        res.on('close', () => stream.destroy());
        stream.pipe(res);
    } catch (error) { res.writeHead(error instanceof URIError ? 400 : 404).end(); }
});
server.listen(port, '127.0.0.1', () => console.log(`Portfolio: http://localhost:${port} (refresh to see changes)`));
