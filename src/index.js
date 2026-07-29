const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');

const { getConfig, watchConfig } = require('./config/configManager');
let config = getConfig();

const { TwitchManager } = require('./core/twitchManager');
const { AudioQueue } = require('./core/queue');
const { TEMP_DIR } = require('./services/tts');
const { listSounds } = require('./services/soundboard');
const { initServer } = require('./app');
const { setupTwitchHandlers } = require('./handlers/twitchHandler');

const SOUNDS_FOLDER = path.join(__dirname, '..', config.sounds.folder || './sounds');

watchConfig((newConfig) => {
  config = newConfig;
  twitch.config = config;
});

[SOUNDS_FOLDER, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const queue = new AudioQueue();

const { server, io } = initServer(TEMP_DIR, SOUNDS_FOLDER, queue);

const twitch = new TwitchManager(config, queue, io);

setupTwitchHandlers(twitch, SOUNDS_FOLDER, queue);

queue.on('play', async (item) => {
  try {
    if (item.filepath) {
      let fileUrl = "";
      const normalizedPath = item.filepath.replace(/\\/g, '/');
      const tempDirNorm = TEMP_DIR.replace(/\\/g, '/');
      const soundsDirNorm = SOUNDS_FOLDER.replace(/\\/g, '/');
      
      if (normalizedPath.includes(tempDirNorm)) {
        fileUrl = `/temp/${path.basename(item.filepath)}`;
      } else if (normalizedPath.includes(soundsDirNorm)) {
        fileUrl = `/sounds/${path.basename(item.filepath)}`;
      } else {
        fileUrl = `/temp/${path.basename(item.filepath)}`;
      }
      
      io.emit('play-audio', { 
        url: `${fileUrl}?t=${Date.now()}`, 
        volume: config.tts.volume || 1.0,
        item: item
      });
    } else {
      queue.next();
    }
  } catch (err) {
    console.error(`❌ Error reproduciendo audio: ${err.message}`);
    queue.next(); 
  }
});

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    Self-Host Twitch TTS  🎙️           ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  const sounds = listSounds(SOUNDS_FOLDER);
  if (sounds.length > 0) {
    console.log(`🎵 Sonidos disponibles (${sounds.length}): ${sounds.join(', ')}`);
  } else {
    console.log('ℹ️  Sin sonidos — agrega archivos mp3/wav en la carpeta /sounds');
  }
  console.log('');

  if (!config.twitch.channel || config.twitch.channel === 'tu_canal_twitch') {
    console.error('❌ Configura twitch.channel en config.json');
    process.exit(1);
  }

  try {
    const PUERTO = 3000;
    server.listen(PUERTO, () => {
      console.log(`🎧 Reproductor de audio corriendo en http://localhost:${PUERTO}`);
    });
    await twitch.initialize(process.env.TWITCH_OAUTH_TOKEN || '');
  } catch (err) {
    console.error('❌ Error al iniciar:', err.message);
    process.exit(1);
  }

  console.log('');
  console.log(`✅ Sistema activo — leyendo #${config.twitch.channel}`);
  console.log(`   Motor TTS: ${config.tts.engine} | Idioma: ${config.tts.language}`);
  console.log(`   Prefijo sonidos: ${config.sounds.prefix}`);
  console.log('');
  console.log('Presiona Ctrl+C para detener\n');
}

process.on('SIGINT', () => {
  console.log('\n⛔ Apagando el sistema TTS...');
  twitch.destroy();

  if (fs.existsSync(TEMP_DIR)) {
    fs.readdirSync(TEMP_DIR).forEach(f => {
      try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch {}
    });
  }
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
});

main();