import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const output = path.join(root, 'dist');
export const siteFiles = [
    'index.html', 'admin.html', 'style.css', 'portfolio-core.js', 'main.js', 'admin-mode.js',
    'favicon.svg', 'og-image.jpg', 'Nguyen-Ha-Ngoc-CV.pdf', 'source'
];

export async function build() {
    if (path.relative(root, output) !== 'dist') throw new Error('Build output must stay inside the project dist directory.');
    await rm(output, { recursive: true, force: true });
    await mkdir(output, { recursive: true });
    await Promise.all(siteFiles.map(file => cp(path.join(root, file), path.join(output, file), { recursive: true })));
    await mkdir(path.join(output, 'vendor'), { recursive: true });
    await Promise.all([
        cp(path.join(root, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'), path.join(output, 'vendor/supabase.min.js')),
        cp(path.join(root, 'node_modules/sortablejs/Sortable.min.js'), path.join(output, 'vendor/Sortable.min.js')),
        cp(path.join(root, 'node_modules/@supabase/supabase-js/LICENSE'), path.join(output, 'vendor/supabase-LICENSE')),
        cp(path.join(root, 'node_modules/sortablejs/LICENSE'), path.join(output, 'vendor/sortable-LICENSE'))
    ]);
    const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
    await writeFile(path.join(output, 'vendor/versions.json'), JSON.stringify(packageJson.dependencies, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await build();
    console.log('Built portfolio in dist/ with pinned local browser dependencies.');
}
