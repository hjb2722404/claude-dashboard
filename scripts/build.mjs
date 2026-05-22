import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// 1. 构建前端 (vite)
const { execSync } = await import('child_process');
console.log('Building frontend...');
execSync('npx vite build', { cwd: root, stdio: 'inherit' });

// 2. 构建后端 (esbuild → 单文件 bundle)
console.log('\nBuilding server...');
const binDir = path.join(root, 'dist', 'bin');
if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'src/cli.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(binDir, 'cli.cjs'),
  external: [
    // 这些在 npm install 时作为 dependencies 安装
    'express',
    'cors',
    'react',
    'react-dom',
    'react-router-dom',
    'react-markdown',
    'rehype-highlight',
    '@tanstack/react-query',
    'recharts',
    'highlight.js',
  ],
  minify: false,
});

console.log('\nBuild complete!');
console.log('  Production: node dist/bin/cli.cjs');
console.log('  Dev:        npm run dev');
