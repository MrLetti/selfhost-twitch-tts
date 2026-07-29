const { generateTTS, mergeAudioFiles, TEMP_DIR } = require('./tts');
const { getSoundPath } = require('./soundboard');
const fs = require('fs');

function cleanTempFiles(tempFiles){
  if(!tempFiles || !Array.isArray(tempFiles)) return;
  tempFiles.forEach(filePath => {
    try{
      if(filePath && filePath.startsWith(TEMP_DIR) && fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
      }
    }catch (err){
      console.error(`❌ Error al eliminar archivo temporal: ${filePath}`, err);
    }
  });
}

function parseSegments(text, soundsFolder) {
  const segments = [];
  const PAREN_RE = /\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = PAREN_RE.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before.length > 0) {
      segments.push({ type: 'tts', text: before });
    }

    const soundName = match[1].trim().toLowerCase();
    const soundPath = getSoundPath(soundName, soundsFolder);

    if (soundPath) {
      segments.push({ type: 'sound', filepath: soundPath, name: soundName });
    } else {
      segments.push({ type: 'tts', text: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = text.slice(lastIndex).trim();
  if (tail.length > 0) {
    segments.push({ type: 'tts', text: tail });
  }

  return segments;
}

async function processAndQueueAudio({ username, contentTTS, isFastSound, lowerText, config, soundsFolder, queue }) {
  const maxLen = config.tts.max_length || 300;
  
  if (isFastSound) {
    const soundName = lowerText.slice(1).split(' ')[0];
    const soundPath = getSoundPath(soundName, soundsFolder);
    if (soundPath) {
      console.log(`🔊 Sonido rápido: !${soundName} (${username})`);
      queue.add({
        type: 'sound',
        filepath: soundPath,
        name: soundName,
        username: username,
        contentTTS: `!${soundName}`,
      });
    }
    return;
  }

  const trimmed = contentTTS.length > maxLen
    ? contentTTS.slice(0, maxLen)
    : contentTTS;

  const segments = parseSegments(trimmed, soundsFolder);
  if (segments.length === 0) return;

  if (config.tts.say_username) {
    const firstTTS = segments.find(s => s.type === 'tts');
    if (firstTTS) {
      firstTTS.text = `${username} dice: ${firstTTS.text}`;
    } else {
      segments.unshift({ type: 'tts', text: `${username}:` });
    }
  }

  const preview = segments.map(s =>
    s.type === 'tts' ? `"${s.text}"` : `🔊(${s.name})`
  ).join(' → ');
  console.log(`📢 [${username}] ${preview}`);

  const filePaths = [];
  const tempFiles = [];

  for (const seg of segments) {
    if (seg.type === 'tts') {
      try {
        const ttsPath = await generateTTS(seg.text, config);
        filePaths.push(ttsPath);
        tempFiles.push(ttsPath); 
      } catch (e) {
        console.error(`❌ Error pre-generando TTS: ${e.message}`);
      }
    } else if (seg.type === 'sound') {
      filePaths.push(seg.filepath); 
    }
  }

  if (filePaths.length === 0) return;

  const mergedPath = mergeAudioFiles(filePaths);

  if (mergedPath) {
    if (mergedPath.startsWith(TEMP_DIR) && filePaths.length > 1) {
       tempFiles.push(mergedPath);
    }
    
    queue.add({
      type: 'merged',
      filepath: mergedPath,
      tempFiles: tempFiles,
      username: username,
      contentTTS: trimmed,
    });
  }
}

module.exports = { parseSegments, processAndQueueAudio, cleanTempFiles };