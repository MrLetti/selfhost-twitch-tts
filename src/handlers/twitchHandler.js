const { listSounds } = require('../services/soundboard');
const { getConfig } = require('../config/configManager');
const { shouldSkipMessage, cleanSpamCharacters } = require('../services/filters');
const { processAndQueueAudio } = require('../services/ttsService');

function setupTwitchHandlers(twitch, SOUNDS_FOLDER, queue) {
  
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
      contenidoTTS = cleanSpamCharacters(contenidoTTS);
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
}

module.exports = { setupTwitchHandlers };