const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  emitAsync(event, ...args) {
    const listeners = this.listeners(event);
    return Promise.allSettled(
      listeners.map((listener) => listener(...args))
    );
  }
}

const eventBus = new EventBus();

module.exports = eventBus;
