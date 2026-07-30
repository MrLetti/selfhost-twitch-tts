const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const { getConfig, saveConfig } = require('./config/configManager');
const { cleanTempFiles } = require('./services/ttsService');
const multer = require('multer');
const SOUNDS_FOLDER = path.join(__dirname, '..', 'sounds');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, SOUNDS_FOLDER); 
    },
    filename: (req, file, cb) => {
        let nombrePersonalizado = req.query.nombre || path.parse(file.originalname).name;
        nombrePersonalizado = nombrePersonalizado.trim().toLowerCase().replace(/\s+/g, '_');

        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${nombrePersonalizado}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 8 * 1024 * 1024 } // 8MB por seguridad
});

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
  app.post('/api/upload-sound', upload.single('archivoAudio'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo.' });
        }
        console.log(`🎵 Nuevo sonido agregado desde la web: ${req.file.filename}`);
        res.json({ success: true, filename: req.file.filename });
    } catch (err) {
        console.error('❌ Error al subir sonido:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sounds', (req, res) => {
    try {
        if (!fs.existsSync(SOUNDS_FOLDER)) {
            return res.json({ success: true, sounds: [] });
        }
        const archivos = fs.readdirSync(SOUNDS_FOLDER).filter(file => {
            return fs.statSync(path.join(SOUNDS_FOLDER, file)).isFile() && !file.startsWith('.');
        });
        res.json({ success: true, sounds: archivos });
    } catch (error) {
        console.error("Error leyendo sonidos:", error);
        res.status(500).json({ success: false, error: 'Error leyendo la carpeta' });
    }
  });

  app.delete('/api/sounds/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(SOUNDS_FOLDER, filename);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Sonido eliminado: ${filename}`);
            res.json({ success: true, message: 'Sonido eliminado correctamente' });
        } else {
            res.status(404).json({ success: false, error: 'Sonido no encontrado' });
        }
    } catch (err) {
        console.error('❌ Error al eliminar sonido:', err);
        res.status(500).json({ success: false, error: 'Error al eliminar el sonido' });
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 OBS conectado al reproductor de audio');
    const currentConfig = getConfig();

    socket.emit('sincronizar-volumen', currentConfig.tts.volume || 1.0);
    socket.emit('sincronizar-delay', currentConfig.tts.delay_seconds !== undefined ? currentConfig.tts.delay_seconds : 3);
    socket.emit('sincronizar-permisos', currentConfig.tts.solo_subs || false);
    socket.emit('sincronizar-blacklist-words', currentConfig.filters?.blacklisted_words || []);
    socket.emit('sincronizar-blacklist-users', currentConfig.filters?.blacklisted_users || []);
    socket.emit('sincronizar-canal', currentConfig.twitch.channel || '');
    
    const pendientesIniciales = queue && typeof queue.getItems === 'function' ? queue.getItems() : [];
    socket.emit('sincronizar-cola', pendientesIniciales);

    socket.on('actualizar-volumen', (volDecimal) => {
      saveConfig('tts', 'volume', volDecimal);
      io.emit('sincronizar-volumen', volDecimal);
    });

    socket.on('actualizar-delay', (nuevosSegundos) => {
      saveConfig('tts', 'delay_seconds', nuevosSegundos);
      io.emit('sincronizar-delay', nuevosSegundos);
    });

    socket.on('actualizar-permisos', (estadoSoloSubs) => {
      saveConfig('tts', 'solo_subs', estadoSoloSubs);
      io.emit('sincronizar-permisos', estadoSoloSubs);
    });

    socket.on('agregar-palabra-filtro', (palabra) => {
      const config = getConfig();
      if(!config.filters) config.filters = {};
      if(!config.filters.blacklisted_words) config.filters.blacklisted_words = [];
      const cleanWord = palabra.toLowerCase().trim();
      if(cleanWord.length > 1 && !config.filters.blacklisted_words.includes(cleanWord)){
        config.filters.blacklisted_words.push(cleanWord);
        saveConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-words', config.filters.blacklisted_words);
        console.log(`🚫 Palabra añadida al filtro: ${cleanWord}`);
      }
    });

    socket.on('remover-palabra-filtro', (palabra) => {
      const config = getConfig();
      if(config.filters && config.filters.blacklisted_words){
        config.filters.blacklisted_words = config.filters.blacklisted_words.filter(w => w !== palabra);
        saveConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-words', config.filters.blacklisted_words);
        console.log(`🚫 Palabra removida del filtro: ${palabra}`);
      }
    });

    socket.on('limpiar-filtro-palabras', () => {
      const config = getConfig();
      if(!config.filters) config.filters = {};
      config.filters.blacklisted_words = [];
      saveConfig('filters', config.filters);
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
        saveConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-users', config.filters.blacklisted_users);
        console.log(`🚫 Usuario añadido al filtro: ${cleanUser}`);
      }
    });

    socket.on('remover-blacklisted-user', (username) => {
      const config = getConfig();
      if(config.filters && config.filters.blacklisted_users){
        config.filters.blacklisted_users = config.filters.blacklisted_users.filter(u => u !== username);
        saveConfig('filters', config.filters);
        io.emit('sincronizar-blacklist-users', config.filters.blacklisted_users);
        console.log(`🚫 Usuario removido del filtro: ${username}`);
      }
    });

    socket.on('activar-limpieza', () => {
      if(queue && typeof queue.clear === 'function'){
        const items = queue.getItems();
        items.forEach(item => {
          if(item && item.tempFiles  && item.tempFiles.length > 0){
            cleanTempFiles(item.tempFiles);
          }
        })
        if(queue && typeof queue.clear === 'function'){
          queue.clear();
        }
      } 
      io.emit('ejecutar-silenciamiento');
      console.log(`🚫 Limpieza de Emergencia activada. Cola vaciada y audios cortados.`);
    });

    socket.on('apagar-servidor', () => {
      console.log(`🛑 ¡Apagado de emergencia! Deteniendo servidor...`);
      io.emit('ejecutar-silenciamiento');
      if (fs.existsSync(TEMP_DIR)) {
        fs.readdirSync(TEMP_DIR).forEach(f => {
          try { fs.unlinkSync(path.join(TEMP_DIR, f)); } catch {}
        });
      }
      setTimeout(() => {
        process.exit(0);
      }, 500);
    });
    socket.on('actualizar-canal', (canal) => {
      const config = getConfig();
      config.twitch.channel = canal;
      saveConfig('twitch','channel', canal);
      io.emit('sincronizar-canal', canal);
      console.log(`📺 Canal actualizado: ${canal}`);
    });

    socket.on('audio-finished', (item) => {
      if(item && item.tempFiles && item.tempFiles.length > 0){
        cleanTempFiles(item.tempFiles);
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