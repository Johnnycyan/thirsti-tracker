type MessageHandler = (data: unknown) => void
type ConnectionHandler = () => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private onConnectHandler: ConnectionHandler | null = null
  private onDisconnectHandler: ConnectionHandler | null = null

  constructor(path: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.url = `${protocol}//${window.location.host}${path}`
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    const token = localStorage.getItem('auth_token')
    const url = token ? `${this.url}?token=${token}` : this.url

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.onConnectHandler?.()
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.onDisconnectHandler?.()
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type: string; data: unknown }
        const handlers = this.messageHandlers.get(message.type) || []
        handlers.forEach((handler) => handler(message.data))
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Attempting to reconnect in ${delay}ms...`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  send(type: string, data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  on(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type) || []
    handlers.push(handler)
    this.messageHandlers.set(type, handlers)
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type) || []
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
      this.messageHandlers.set(type, handlers)
    }
  }

  onConnect(handler: ConnectionHandler) {
    this.onConnectHandler = handler
  }

  onDisconnect(handler: ConnectionHandler) {
    this.onDisconnectHandler = handler
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Default WebSocket instance for real-time updates
export const wsClient = new WebSocketClient('/ws')
