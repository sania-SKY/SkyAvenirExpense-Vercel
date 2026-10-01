/**
 * Copies the Android Chrome camera fixes into expo-camera.
 *
 * patch-package diffs fail the Vercel install when node_modules is
 * already touched, which aborts the whole deploy. Overwriting these
 * two files is the same fix and does not depend on a clean package.
 */
const fs = require('fs');
const path = require('path');

const files = [
  'WebCameraUtils.js',
  'useWebCameraStream.js',
];

const sourceDir = path.join(
  __dirname,
  'expo-camera-web',
);

const destDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-camera',
  'build',
  'web',
);

if (!fs.existsSync(destDir)) {
  console.log(
    'expo-camera is not installed; skipping web camera fix.',
  );
  process.exit(0);
}

for (const file of files) {
  fs.copyFileSync(
    path.join(sourceDir, file),
    path.join(destDir, file),
  );
}

console.log(
  'Applied Android Chrome camera fix to expo-camera.',
);
