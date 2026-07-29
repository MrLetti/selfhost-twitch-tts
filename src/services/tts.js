const path = require('path');
const fs   = require('fs');
const { execSync } = require('child_process');

const TEMP_DIR = path.join(__dirname, '..', 'temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ─── Google TTS (gratis, sin API key) ──────────────────────────────────────

function generateGoogle(text, language) {
  return new Promise((resolve, reject) => {
    try {
      const gTTS    = require('node-gtts');
      const tts     = gTTS(language || 'es');
      const outFile = path.join(TEMP_DIR, `tts_${Date.now()}.mp3`);

      tts.save(outFile, text, (err) => {
        if (err) reject(err);
        else resolve(outFile);
      });
    } catch (err) {
      reject(new Error(`Error en Google TTS: ${err.message}`));
    }
  });
}

function generateLocal(text, voice, speed) {
  return new Promise((resolve, reject) => {
    try {
      const say     = require('say');
      const ext     = process.platform === 'darwin' ? 'aiff' : 'wav';
      const outFile = path.join(TEMP_DIR, `tts_${Date.now()}.${ext}`);

      say.export(text, voice || null, speed || 1.0, outFile, (err) => {
        if (err) reject(err);
        else resolve(outFile);
      });
    } catch (err) {
      reject(new Error(`Error en TTS local: ${err.message}`));
    }
  });
}

async function generateTTS(text, config) {
  const engine = config.tts.engine || 'google';

  if (engine === 'google') {
    return generateGoogle(text, config.tts.language);
  }
  if (engine === 'local') {
    return generateLocal(text, config.tts.voice, config.tts.speed);
  }

  throw new Error(`Motor TTS desconocido: "${engine}". Usa "google" o "local".`);
}


function mergeAudioFiles(filePaths) {
  if (filePaths.length === 0) return null;
  if (filePaths.length === 1) return filePaths[0]; 

  try {
    const ffmpeg = require('ffmpeg-static');
    const outFile = path.join(TEMP_DIR, `merged_${Date.now()}.mp3`);
    
    const inputs = filePaths.map(p => `-i "${p}"`).join(' ');
    const streams = filePaths.map((_, i) => `[${i}:0]`).join('');
    const filter = `${streams}concat=n=${filePaths.length}:v=0:a=1[out]`;
    
    const cmd = `"${ffmpeg}" -y ${inputs} -filter_complex "${filter}" -map "[out]" "${outFile}"`;
    
    execSync(cmd, { stdio: 'ignore' });
    return outFile;
  } catch (err) {
    console.error(`❌ Error fusionando audios: ${err.message}`);
    return null;
  }
}

module.exports = { generateTTS, mergeAudioFiles, TEMP_DIR };
