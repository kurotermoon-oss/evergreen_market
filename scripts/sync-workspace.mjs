import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checkOnly = process.argv.includes('--check');

function git(...args) {
  const result = spawnSync('git', ['-c', `safe.directory=${root.replace(/[\\/]$/, '').replaceAll('\\', '/')}`, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 90_000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr.trim() || `git ${args[0]} failed`);
  }
  return result.stdout.trim();
}

try {
  git('rev-parse', '--show-toplevel');
  const remote = git('remote', 'get-url', 'origin').replace(/\.git$/, '');
  if (!['https://github.com/kurotermoon-oss/evergreen_market', 'git@github.com:kurotermoon-oss/evergreen_market'].includes(remote)) {
    throw new Error('origin не указывает на kurotermoon-oss/evergreen_market. Проверьте репозиторий.');
  }
  const branch = git('branch', '--show-current');
  if (branch !== 'main') throw new Error(`Открыта ветка ${branch || 'detached HEAD'}. Перейдите на main после сохранения работы.`);

  git('-c', 'http.sslBackend=openssl', '-c', 'http.version=HTTP/1.1', '-c', 'credential.interactive=never', 'fetch', 'origin', 'main');
  const dirty = git('status', '--short');
  const [ahead, behind] = git('rev-list', '--left-right', '--count', 'HEAD...origin/main').split(/\s+/).map(Number);
  console.log(`main: локальных коммитов ${ahead}, новых на GitHub ${behind}.`);
  if (dirty) console.log(`Несохранённые изменения:\n${dirty}`);

  if (checkOnly) {
    console.log(`Локально: ${git('rev-parse', '--short', 'HEAD')}; GitHub: ${git('rev-parse', '--short', 'origin/main')}.`);
    if (dirty || ahead || behind) process.exitCode = 1;
  } else {
    if (dirty || ahead) throw new Error('Сначала сохраните и согласуйте локальную работу. Файлы не изменены; автоматического сброса нет.');
    git('merge', '--ff-only', 'origin/main');
    console.log(`Синхронизировано с GitHub: ${git('rev-parse', '--short', 'HEAD')}.`);
  }
} catch (error) {
  console.error(error.message);
  console.error('Если это ZIP-копия без .git, используйте git clone. Инструкция: docs/DEVICE-WORKFLOW.md.');
  process.exitCode = 1;
}
