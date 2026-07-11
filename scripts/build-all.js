// Cross-platform replacement for a shell `for` loop (npm on Windows runs
// scripts through cmd.exe, which doesn't understand bash's `for ... do` syntax).
const { execSync } = require('child_process');

const APPS = [
  'gateway',
  'auth',
  'user',
  'movie',
  'video',
  'search',
  'history',
  'recommendation',
  'payment',
  'notification',
  'transcoder',
];

for (const app of APPS) {
  console.log(`\n=== building ${app} ===`);
  execSync(`npx nest build ${app}`, { stdio: 'inherit' });
}
