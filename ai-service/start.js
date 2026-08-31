const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const aiDir = __dirname;

const isWin = process.platform === 'win32';
const candidatePaths = isWin
  ? [
      path.join(aiDir, 'venv', 'Scripts', 'python.exe'),
      path.join(aiDir, '.venv', 'Scripts', 'python.exe'),
    ]
  : [
      path.join(aiDir, 'venv', 'bin', 'python'),
      path.join(aiDir, '.venv', 'bin', 'python'),
    ];

let pythonCmd = candidatePaths.find((p) => fs.existsSync(p));

if (!pythonCmd) {
  pythonCmd = isWin ? 'python' : 'python3';
}

console.log(`[AI Service] Starting Flask service using Python at: ${pythonCmd}`);

const child = spawn(pythonCmd, ['app.py'], {
  cwd: aiDir,
  stdio: 'inherit',
  shell: isWin,
});

child.on('error', (err) => {
  console.error('[AI Service] Failed to start process:', err);
});

child.on('exit', (code, signal) => {
  if (code !== null && code !== 0) {
    console.error(`[AI Service] Process exited with code ${code}`);
  } else if (signal) {
    console.log(`[AI Service] Process terminated by signal ${signal}`);
  }
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
