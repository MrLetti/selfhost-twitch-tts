const { listSounds } = require('../services/soundboard');
const { getConfig } = require('../config/configManager');
const { shouldSkipMessage } = require('../services/filters');
const { processAndQueueAudio } = require('../services/ttsService');

const pendingTTS = new Map();

function setupTwitchHandlers(twitch, SOUNDS_FOLDER, queue) {
  
  twitch.onMessageDeleted = ({ messageId }) => {
    if (pendingTTS.has(messageId)) {
      clearTimeout(pendingTTS.get(messageId).timer);
      pendingTTS.delete(messageId);
      console.log(`🗑️ TTS Abortado: Un moderador borró el mensaje.`);
    }
  };

  twitch.onUserPunished = ({ username }) => {
    const lowerUser = username.toLowerCase();
    for (const [messageId, data] of pendingTTS.entries()) {
      if (data.username === lowerUser) {
        clearTimeout(data.timer);
        pendingTTS.delete(messageId);
        console.log(`🗑️ TTS Abortado: Un moderador castigó a ${username}`);
      }
    }
  };

  twitch.onMessage = async ({ id, username, message, isSub, isMod, isBroadcaster }) => {
    const config = getConfig();
    const lower = message.toLowerCase().trim();

    if (lower === '!sonidos') {
      const sounds = listSounds(SOUNDS_FOLDER);
      if (sounds.length > 0) {
        twitch.sendMessage(`🔊 Sonidos disponibles (${sounds.length}): ${sounds.map(s => '!' + s).join(', ')}`);
      }
      return;
    }

    let esSonidoRapido = false;
    let contenidoTTS = "";

    if (config.sounds.enabled && lower.startsWith('!') && !lower.startsWith('!tts')) {
      esSonidoRapido = true;
    } else if (lower.startsWith('!tts')) {
      contenidoTTS = message.slice(4).trim();
      if (contenidoTTS.length === 0) return;

      const { skip, reason } = shouldSkipMessage(username, contenidoTTS, config);
      if (skip) {
        console.log(`⏭️  Saltado (${reason}): ${username}: ${contenidoTTS}`);
        return;
      }
    } else {
      return;
    }
    const hasPrivilegies = isSub || isMod || isBroadcaster;
    
    if (config.tts.solo_subs && !hasPrivilegies) {
      console.log(`🔒 Bloqueado: ${username} intentó usar TTS, pero el chat está en Solo Subs.`);
      return;
    }
    const rawDelay = config.tts.delay_seconds !== undefined ? config.tts.delay_seconds : 5;
    const delayMs = Number(rawDelay) * 1000;
    

    const ejecutarAudio = async () => {
      pendingTTS.delete(id);
      await processAndQueueAudio({
        username,
        contenidoTTS,
        esSonidoRapido,
        lower,
        config,
        SOUNDS_FOLDER,
        queue
      });
    };
    if (delayMs > 0) {
      const timer = setTimeout(ejecutarAudio, delayMs);
      pendingTTS.set(id, { timer, username: username.toLowerCase() });
    } else {
      ejecutarAudio();
    }
  };
}

module.exports = { setupTwitchHandlers };