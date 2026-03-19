import { execSync } from 'node:child_process';

const RULES = [
  { label: 'text-black', grep: 'text-black', reason: 'Use text-text-primary' },
  { label: 'text-white', grep: 'text-white', reason: 'Use text-text-primary/secondary' },
  { label: 'bg-black', grep: 'bg-black', reason: 'Use bg-base-900' },
  { label: 'bg-white', grep: 'bg-white', reason: 'Use bg-base-800' },
  { label: 'shadow-lg', grep: 'shadow-lg', reason: 'Use card-glass or shadow-sm' },
  { label: 'shadow-xl', grep: 'shadow-xl', reason: 'Use card-glass' },
  { label: 'shadow-2xl', grep: 'shadow-2xl', reason: 'Prohibited' },
  { label: 'text-[Npx]', grep: 'text-\\[[0-9]*px\\]', reason: 'Use text-xs/sm/base/lg/xl/2xl/3xl' },
  { label: 'font-[N]', grep: 'font-\\[[0-9]', reason: 'Use font-normal/medium/semibold/bold' },
  {
    label: 'bg-gradient-to-',
    grep: 'bg-gradient-to-',
    reason: 'Gradients prohibited; use glow utilities',
  },
  { label: 'console.log', grep: 'console\\.log', reason: 'Use log.info from src/lib/logger.ts' },
];

let totalErrors = 0;

for (const rule of RULES) {
  try {
    const result = execSync(
      `grep -rn "${rule.grep}" src/ --include="*.tsx" --include="*.ts" | grep -v "validate-design"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const lines = result.trim().split('\n').filter(Boolean);
    if (lines.length > 0) {
      process.stderr.write(`\u26d4  ${rule.label} (${lines.length}) — ${rule.reason}\n`);
      for (const line of lines.slice(0, 3)) {
        process.stderr.write(`   ${line}\n`);
      }
      if (lines.length > 3) {
        process.stderr.write(`   ... and ${lines.length - 3} more\n`);
      }
      totalErrors += lines.length;
    }
  } catch {
    // grep exits 1 when no matches — that's the happy path
  }
}

if (totalErrors === 0) {
  process.stdout.write('\u2705 Design validation passed — no prohibited patterns found\n');
} else {
  process.stderr.write(`\n\u274c ${totalErrors} design violation(s) found\n`);
  process.exit(1);
}
