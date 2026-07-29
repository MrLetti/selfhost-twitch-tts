const tmi = require('tmi.js');

class TwitchManager {
  constructor(config) {
    this.config   = config;
    this.client   = null;
    this.onMessage = null;
    this.onMessageDeleted = null;
    this.onUserPunished = null;
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
      console.log(tags);
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

    this.client.on('messageDeleted', (channel, username, deletedMessage, userstate) => {
      if(this.onMessageDeleted){
        this.onMessageDeleted(userstate['target-msg-id']);
      }
    });
    this.client.on('timeout', (channel, username, reason, duration, userstate) => {
      if(this.onUserPunished){
        this.onUserPunished(username);
      }
    });
    this.client.on('ban', (channel, username, reason, duration, userstate) => {
      if(this.onUserPunished){
        this.onUserPunished(username);
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
