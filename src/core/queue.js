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
  }

  /** Agrega un item a la cola y dispara el procesamiento si está libre */
  add(item) {
    this.items.push(item);
    if (!this.isProcessing) {
      this.next();
    }
  }

  /** Pasa al siguiente item en la cola */
  next() {
    if (this.items.length === 0) {
      this.isProcessing = false;
      this.emit('empty');
      return;
    }
    this.isProcessing = true;
    const item = this.items.shift();
    this.emit('play', item);
  }

  /** Vacía la cola (ej. para un comando !skip o !clear) */
  clear() {
    this.items = [];
    this.isProcessing = false;
    this.emit('cleared');
  }

  get size() {
    return this.items.length;
  }
}

module.exports = { AudioQueue };
