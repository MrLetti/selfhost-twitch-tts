const EventEmitter = require('events');
const { getConfig } = require('../config/configManager');

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

    let delaySegundos = 0;
    try { delaySegundos = getConfig().tts.delay_seconds !== undefined ? getConfig().tts.delay_seconds : 0; }
    catch (e) { delaySegundos = 0; }
    if(delaySegundos <= 0){
      this.emit('play', this.currentItem);
    }else{
      setTimeout(() => {
        this.emit('play', this.currentItem);
      }, delaySegundos*1000);
    }
  }
  finish(itemId){
    if(this.currentItem && this.currentItem.id === itemId){
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
    const lista = [];
    if(this.currentItem) lista.push(this.currentItem);
    return lista.concat(this.items);
  }
  removeItemsByMessageId(msgId){
    console.log(msgId, this.items)
    const index = this.items.findIndex(item => item.id === msgId || item.msgId === msgId);
    console.log(index)
    if(index !== -1){
      this.items.splice(index, 1);
      this.emit('change', this.getItems());
      return true;
    }
    return false;
  }
  removeItemsByUsername(username){
    const cleanUser = username.toLowerCase();
    const initialLength = this.items.length;
    this.items = this.items.filter(item => {
      const itemUser = (item.username || item['display-name'] || '').toLowerCase();
      return itemUser !== cleanUser;
    });
    if(this.items.length !== initialLength){
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
