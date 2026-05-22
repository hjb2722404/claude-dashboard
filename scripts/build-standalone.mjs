import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const outDir = path.join(root, 'dist', 'standalone');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('Building standalone bundle (all dependencies inlined)...');

await esbuild.build({
  entryPoints: [path.join(root, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(outDir, 'cli.cjs'),
  packages: 'bundle',
  minify: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

// 复制前端静态资源
const clientDir = path.join(root, 'dist', 'client');
const standaloneClientDir = path.join(outDir, 'client');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

if (fs.existsSync(clientDir)) {
  console.log('Copying frontend assets...');
  copyDir(clientDir, standaloneClientDir);
}

// 复制启动脚本
for (const script of ['start.sh', 'start.bat']) {
  const src = path.join(root, script);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, script));
  }
}

console.log('\nStandalone build complete!');
console.log(`  Output: ${outDir}/`);
console.log('  Run:    node dist/standalone/cli.cjs');
console.log('    or:   ./start.sh (Mac/Linux)');
console.log('    or:   start.bat (Windows)');
