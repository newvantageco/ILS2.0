/**
 * WebSocket Mock for Tests
 * Provides a mock WebSocket implementation for testing
 */

class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.OPEN;
  }

  send(data) {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
  }

  addEventListener(event, handler) {
    // Mock event listener
  }

  removeEventListener(event, handler) {
    // Mock remove listener
  }
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

module.exports = WebSocket;
module.exports.default = WebSocket;
module.exports.WebSocket = WebSocket;
