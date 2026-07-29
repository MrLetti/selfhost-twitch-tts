const { listSounds } = require('../services/soundboard');
const { getConfig } = require('../config/configManager');
const { shouldSkipMessage, cleanSpamCharacters, esSpam } = require('../services/filters');
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

    let isFastSound = false;
    let contentTTS = "";

    if (config.sounds.enabled && lower.startsWith('!') && !lower.startsWith('!tts')) {
      isFastSound = true;
    } else if (lower.startsWith('!tts')) {
      contentTTS = message.slice(4).trim();
      contentTTS = cleanSpamCharacters(contentTTS);
      if(isSpam(contentTTS)) return;
      if (contentTTS.length === 0) return;

      const { skip, reason } = shouldSkipMessage(username, contentTTS, config);
      if (skip) {
        console.log(`⏭️  Saltado (${reason}): ${username}: ${contentTTS}`);
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
      contentTTS,
      isFastSound,
      lowerText: lower,
      config,
      soundsFolder: SOUNDS_FOLDER,
      queue
    });
  };
}

module.exports = { setupTwitchHandlers };