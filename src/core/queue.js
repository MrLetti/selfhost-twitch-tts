const { EventEmitter } = require('events');

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

    let delaySegundos = 3;
    try { delaySegundos = getConfig().tts.delay_seconds !== undefined ? getConfig().tts.delay_seconds : 3; }
    catch (e) { delaySegundos = 3; }
    const timePassed = Date.now() - this.currentItem.addedAt;
    const timeToWait = Math.max(0, (delaySegundos*1000) - timePassed);
    if(timeToWait > 0){
      setTimeout(() => {
        this.emit('play', this.currentItem);
      }, timeToWait);
    }else{
      this.emit('play', this.currentItem);
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

  get size() {
    return this.items.length;
  }
}

module.exports = { AudioQueue };
