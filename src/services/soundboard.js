const path = require('path');
const fs   = require('fs');

const SUPPORTED = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];

function getSoundPath(name, folder) {
  if (!fs.existsSync(folder)) return null;

  for (const ext of SUPPORTED) {
    const filepath = path.join(folder, `${name}${ext}`);
    if (fs.existsSync(filepath)) return filepath;
  }
  return null;
}

function listSounds(folder) {
  if (!fs.existsSync(folder)) return [];

  return fs.readdirSync(folder)
    .filter(f => SUPPORTED.includes(path.extname(f).toLowerCase()))
    .map(f => path.basename(f, path.extname(f)))
    .sort();
}

function soundExists(name, folder) {
  return getSoundPath(name, folder) !== null;
}

module.exports = { getSoundPath, listSounds, soundExists };
