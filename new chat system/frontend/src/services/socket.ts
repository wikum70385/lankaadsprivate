import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket | null = null;
  eventQueue: Array<{ event: string; callback: (...args: any[]) => void }> = [];
  isConnecting: boolean = false;

  connect(token: string) {
    if (this.socket) return this.socket;
    this.isConnecting = true;
    this.socket = io('http://localhost:5000', {
      auth: { token }
    });
    // Attach queued event handlers
    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.eventQueue.forEach(({ event, callback }) => {
        this.socket?.on(event, callback);
      });
      this.eventQueue = [];
    });
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.eventQueue = [];
    }
  }

  emit(event: string, data: any) {
    if (!this.socket) {
      const token = localStorage.getItem('authToken');
      const s = this.connect(token!);
      s.on('connect', () => {
        this.socket?.emit(event, data);
      });
    } else {
      this.socket.emit(event, data);
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.socket) {
      const token = localStorage.getItem('authToken');
      this.connect(token!);
      this.eventQueue.push({ event, callback });
    } else if (this.isConnecting) {
      this.eventQueue.push({ event, callback });
    } else {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();
