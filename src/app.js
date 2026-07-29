const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { getConfig, guardarConfig } = require('./config/configManager');

function initServer(TEMP_DIR, SOUNDS_FOLDER, queue) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/temp', express.static(TEMP_DIR));
  app.use('/sounds', express.static(SOUNDS_FOLDER));

  queue.on('change', (itemsPendientes) => {
    io.emit('sincronizar-cola', itemsPendientes);
  });

  io.on('connection', (socket) => {
    console.log('🟢 OBS conectado al reproductor de audio');
    const currentConfig = getConfig();

    socket.emit('sincronizar-volumen', currentConfig.tts.volume || 1.0);
    socket.emit('sincronizar-delay', currentConfig.tts.delay_seconds !== undefined ? currentConfig.tts.delay_seconds : 3);
    socket.emit('sincronizar-permisos', currentConfig.tts.solo_subs || false);
    socket.emit('sincronizar-blacklist-words', currentConfig.filters?.blacklisted_words || []);
    socket.emit('sincronizar-blacklist-users', currentConfig.filters?.blacklisted_users || []);
    
    const pendientesIniciales = queue && typeof queue.getItems === 'function' ? queue.getItems() : [];
    socket.emit('sincronizar-cola', pendientesIniciales);

    socket.on('actualizar-volumen', (volDecimal) => {
      guardarConfig('tts', 'volume', volDecimal);
      io.emit('sincronizar-volumen', volDecimal);
    });

    socket.on('actualizar-delay', (nuevosSegundos) => {
      guardarConfig('tts', 'delay_seconds', nuevosSegundos);
      io.emit('sincronizar-delay', nuevosSegundos);
    });

    socket.on('actualizar-permisos', (estadoSoloSubs) => {
      guardarConfig('tts', 'solo_subs', estadoSoloSubs);
      io.emit('sincronizar-permisos', estadoSoloSubs);
    });

    socket.on('agregar-palabra-filtro', (palabra) => {
      const config = getConfig();
      if(!config.filters) config.filters = {};
      if(!config.filters.blacklisted_words) config.filters.blacklisted_words = [];
      const cleanWord = palabra.toLowerCase().trim();
      if(cleanWord.length > 1 && !config.filters.blacklisted_words.includes(cleanWord)){
        config.filters.blacklisted_words.push(cleanWord);
        guardarConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-words', config.filters.blacklisted_words);
        console.log(`🚫 Palabra añadida al filtro: ${cleanWord}`);
      }
    });

    socket.on('remover-palabra-filtro', (palabra) => {
      const config = getConfig();
      if(config.filters && config.filters.blacklisted_words){
        config.filters.blacklisted_words = config.filters.blacklisted_words.filter(w => w !== palabra);
        guardarConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-words', config.filters.blacklisted_words);
        console.log(`🚫 Palabra removida del filtro: ${palabra}`);
      }
    });

    socket.on('limpiar-filtro-palabras', () => {
      const config = getConfig();
      if(!config.filters) config.filters = {};
      config.filters.blacklisted_words = [];
      guardarConfig('filters', config.filters);
      io.emit('sincronizar-blacklist-words', config.filters.blacklisted_words);
      console.log(`🚫 Filtro de palabras limpiado`);
    });

    socket.on('agregar-blacklisted-user', (username) => {
      const config = getConfig();
      if(!config.filters) config.filters = {};
      if(!config.filters.blacklisted_users) config.filters.blacklisted_users = [];
      const cleanUser = username;
      if(cleanUser.length > 1 && !config.filters.blacklisted_users.includes(cleanUser)){
        config.filters.blacklisted_users.push(cleanUser);
        guardarConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-users', config.filters.blacklisted_users);
        console.log(`🚫 Usuario añadido al filtro: ${cleanUser}`);
      }
    });

    socket.on('remover-blacklisted-user', (username) => {
      const config = getConfig();
      if(config.filters && config.filters.blacklisted_users){
        config.filters.blacklisted_users = config.filters.blacklisted_users.filter(u => u !== username);
        guardarConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-users', config.filters.blacklisted_users);
        console.log(`🚫 Usuario removido del filtro: ${username}`);
      }
    });

    socket.on('activar-limpieza', () => {
      if(queue && typeof queue.clear === 'function'){
        queue.clear();
      } 
      io.emit('ejecutar-silenciamiento');
      console.log(`🚫 Modo pánico activado. Cola vaciada y audios cortados.`);
    });
    socket.on('apagar-servidor', () => {
      console.log(`🛑 ¡Apagado de emergencia! Deteniendo servidor...`);
      io.emit('ejecutar-silenciamiento');
      setTimeout(() => {
        process.exit(0);
      }, 500);
    })

    socket.on('audio-finished', (item) => {
      if (item.tempFiles && item.tempFiles.length > 0) {
        item.tempFiles.forEach(f => {
          try { fs.unlinkSync(f); } catch {}
        });
      }

      if (queue && typeof queue.finish === 'function' && item && item.id) {
        queue.finish(item.id);
      } else if (queue && typeof queue.next === 'function') {
        queue.next();
      }
    });
  });

  return { server, io };
}

module.exports = { initServer };