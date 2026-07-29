const EventEmitter = require('events');
const { getConfig } = require('../config/configManager');
const { cleanTempFiles } = require('../services/ttsService');

/**
 * Cola FIFO de audio — garantiza que los audios no se superpongan.
 * Emite el evento 'play' cuando hay que reproducir el siguiente item.
 */
class AudioQueue extends EventEmitter {
  constructor() {
    super();
    this.items = [];
    this.isProcessing = false;
    this.currentItem = null;
  }

  add(item) {
    item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    item.addedAt = Date.now();

    this.items.push(item);
    this.emit('change', this.getItems());
    if (!this.isProcessing) {
      this.next();
    }
  }

  next() {
    if (this.items.length === 0) {
      this.isProcessing = false;
      this.emit('empty');
      this.emit('change', this.getItems());
      return;
    }
    this.isProcessing = true;
    this.currentItem = this.items.shift();
    this.emit('change', this.getItems());

    let delaySeconds = 0;
    try { 
      delaySeconds = getConfig().tts.delay_seconds !== undefined ? getConfig().tts.delay_seconds : 0; 
    } catch (e) { 
      delaySeconds = 0; 
    }

    if (delaySeconds <= 0) {
      this.emit('play', this.currentItem);
    } else {
      setTimeout(() => {
        this.emit('play', this.currentItem);
      }, delaySeconds * 1000);
    }
  }

  finish(itemId) {
    if (this.currentItem && this.currentItem.id === itemId) {
      this.currentItem = null;
      this.next();
    }
  }

  clear() {
    this.items = [];
    this.isProcessing = false;
    this.currentItem = null;
    this.emit('cleared');
    this.emit('change', this.getItems());
  }

  getItems() {
    const list = [];
    if (this.currentItem) list.push(this.currentItem);
    return list.concat(this.items);
  }

  removeItemsByMessageId(msgId) {
    const index = this.items.findIndex(item => item.id === msgId || item.msgId === msgId);
    if (index !== -1) {
      const deletedItem = this.items[index];
      if (deletedItem.tempFiles) cleanTempFiles(deletedItem.tempFiles);
      
      this.items.splice(index, 1);
      this.emit('change', this.getItems());
      return true;
    }
    return false;
  }

  removeItemsByUsername(username) {
    const cleanUser = username.toLowerCase();
    const initialLength = this.items.length;
    
    this.items = this.items.filter(item => {
      const itemUser = (item.username || item['display-name'] || '').toLowerCase();
      if (itemUser !== cleanUser) {
        return true;
      } else {
        if (item.tempFiles) cleanTempFiles(item.tempFiles);
        return false;
      }
    });

    if (this.items.length !== initialLength) {
      this.emit('change', this.getItems());
      return true;
    }
    return false;
  }

  get size() {
    return this.items.length;
  }
}

module.exports = { AudioQueue };