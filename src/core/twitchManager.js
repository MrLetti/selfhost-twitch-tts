const tmi = require('tmi.js');

class TwitchManager {
  constructor(config, queue, io) {
    this.config    = config;
    this.queue     = queue;
    this.io        = io;
    this.client    = null;
    this.onMessage = null;
  }

  async initialize(oauthToken) {
    const clientConfig = {
      options: { debug: false },
      channels: [this.config.twitch.channel],
    };

    if (oauthToken && oauthToken.length > 0) {
      clientConfig.identity = {
        username: this.config.twitch.bot_username,
        password: oauthToken,
      };
    }

    this.client = new tmi.Client(clientConfig);

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return; 
      if (this.onMessage) {
        this.onMessage({
          id:            tags.id,
          username:      tags['display-name'] || tags.username,
          message:       message.trim(),
          isMod:         tags.mod === true || !!tags.badges?.moderator,
          isBroadcaster: !!tags.badges?.broadcaster,
          isSub:         tags.subscriber === true,
          color:         tags.color || null,
        });
      }
    });

    this.client.on('messagedeleted', (channel, username, deletedMessage, tags) => {
      if(this.queue){
        const targetMsgId = tags && (tags['target-msg-id'] || tags['id']);
        if(targetMsgId){
          const deleted = this.queue.removeItemsByMessageId(targetMsgId);
          if(deleted){
            console.log(`🗑️ Mensaje de ${username} eliminado. Eliminado de la cola.`);
          }
        }
        if(this.queue.currentItem && (this.queue.currentItem.username || '').toLowerCase() === username.toLowerCase()){
          if (this.io) this.io.emit('ejecutar-silenciamiento');
          this.queue.finish(this.queue.currentItem.id);
        }
      }
    });

    this.client.on('timeout', (channel, username, reason, duration, userstate) => {
      if(this.queue){
        const punished = this.queue.removeItemsByUsername(username);
        if(punished){
          console.log(`🔨 Usuario castigado (Timeout: ${duration}s) -> ${username}. Sus audios pendientes fueron expulsados de la cola.`);
        }
        if(this.queue.currentItem && (this.queue.currentItem.username || '').toLowerCase() === username.toLowerCase()){
          if (this.io) this.io.emit('ejecutar-silenciamiento');
          this.queue.finish(this.queue.currentItem.id);
        }
      }
    });

    this.client.on('ban', (channel, username, reason, duration, userstate) => {
      if (this.queue){
        const punished = this.queue.removeItemsByUsername(username);
        if(punished){
          console.log(`🚫 Usuario baneado -> ${username}. Sus audios pendientes fueron expulsados de la cola.`);
        }
        if(this.queue.currentItem && (this.queue.currentItem.username || '').toLowerCase() === username.toLowerCase()){
          if (this.io) this.io.emit('ejecutar-silenciamiento');
          this.queue.finish(this.queue.currentItem.id);
        }
      }
    });

    this.client.on('connected', (addr, port) => {
      console.log(`✅ Twitch: conectado a #${this.config.twitch.channel}`);
    });

    this.client.on('disconnected', (reason) => {
      console.log(`⚠️  Twitch: desconectado (${reason}). Reconectando...`);
    });

    await this.client.connect();
  }
  
  sendMessage(message) {
    if (this.client && this.client.readyState() === 'OPEN') {
      this.client.say(this.config.twitch.channel, message).catch(err => {
        console.error('❌ Error enviando mensaje a Twitch (¿falta el OAuth Token?):', err.message);
      });
    }
  }

  destroy() {
    if (this.client) this.client.disconnect();
  }
}

module.exports = { TwitchManager };