import { io } from "socket.io-client"
import { SOCKET_URL, SOCKET_EVENTS } from "../utils/constants"

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000 // 3 segundos
    this.listeners = {
      onConnect: [],
      onDisconnect: [],
      onError: [],
      onGameJoined: [],
      onGameStarted: [],
      onPlayMade: [],
      onGameEnded: [],
      onOpponentDisconnect: [],
      onOpponentReconnect: [],
      onNotification: [],
    }
  }

  connect() {
    try {
      const token = localStorage.getItem("token") || "guest-token"

      // Usar URL de desarrollo si no hay una configurada
      const socketUrl = SOCKET_URL || "http://localhost:8080"

      console.log("🔌 Conectando socket a:", socketUrl)

      this.socket = io(socketUrl, {
        auth: {
          token: token,
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        timeout: 10000,
      })

      this._setupEventListeners()

      return this.socket
    } catch (error) {
      console.error("Error al conectar socket:", error)
      this._notifyListeners("onError", { message: "Error de conexión", details: error.message })
      throw error
    }
  }

  _setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("✅ Socket conectado:", this.socket.id)
      this.isConnected = true
      this.reconnectAttempts = 0
      this._notifyListeners("onConnect", { socketId: this.socket.id })
      this._notifyListeners("onNotification", {
        type: "success",
        message: "Conectado al servidor",
      })
    })

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket desconectado:", reason)
      this.isConnected = false
      this._notifyListeners("onDisconnect", { reason })
      this._notifyListeners("onNotification", {
        type: "warning",
        message: "Desconectado del servidor",
      })

      if (reason === "io server disconnect") {
        // El servidor cerró la conexión, intentar reconectar manualmente
        this._attemptReconnect()
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("❌ Error de conexión socket:", error)
      this._notifyListeners("onError", { message: "Error de conexión", details: error.message })
      this._notifyListeners("onNotification", {
        type: "error",
        message: "Error de conexión al servidor",
      })

      this._attemptReconnect()
    })

    // Eventos específicos del juego
    this.socket.on(SOCKET_EVENTS.GAME_JOINED, (data) => {
      console.log("🎮 Evento GAME_JOINED recibido:", data)
      this._notifyListeners("onGameJoined", data)
      this._notifyListeners("onNotification", {
        type: "info",
        message: "Te has unido a la partida",
      })
    })

    this.socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      console.log("🚀 Evento GAME_STARTED recibido:", data)
      this._notifyListeners("onGameStarted", data)
      this._notifyListeners("onNotification", {
        type: "success",
        message: `¡${data.opponentName} se ha unido a la partida!`,
      })
    })

    this.socket.on(SOCKET_EVENTS.PLAY_MADE, (data) => {
      console.log("🎯 Evento PLAY_MADE recibido:", data)
      console.log("🎯 Detalles de la jugada:", {
        dice: data.dice,
        column: data.column,
        userId: data.userId,
        gameId: data.gameId,
        timestamp: new Date().toISOString(),
      })
      this._notifyListeners("onPlayMade", data)
    })

    this.socket.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      console.log("🏁 Evento GAME_ENDED recibido:", data)
      this._notifyListeners("onGameEnded", data)

      const message =
        data.winnerId === Number.parseInt(localStorage.getItem("userId"))
          ? "¡Has ganado la partida!"
          : "Has perdido la partida"

      this._notifyListeners("onNotification", {
        type: data.winnerId === Number.parseInt(localStorage.getItem("userId")) ? "success" : "info",
        message,
      })
    })

    this.socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, (data) => {
      console.log("❌ Evento OPPONENT_DISCONNECTED recibido:", data)
      this._notifyListeners("onOpponentDisconnect", data)
      this._notifyListeners("onNotification", {
        type: "warning",
        message: "Tu oponente se ha desconectado",
      })
    })

    this.socket.on(SOCKET_EVENTS.OPPONENT_RECONNECTED, (data) => {
      console.log("✅ Evento OPPONENT_RECONNECTED recibido:", data)
      this._notifyListeners("onOpponentReconnect", data)
      this._notifyListeners("onNotification", {
        type: "success",
        message: "Tu oponente se ha reconectado",
      })
    })

    // Listener genérico para todos los eventos
    this.socket.onAny((eventName, ...args) => {
      console.log("📡 Evento recibido:", eventName, args)
    })
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`)

      this._notifyListeners("onNotification", {
        type: "info",
        message: `Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      })

      setTimeout(() => {
        if (!this.isConnected) {
          this.connect()
        }
      }, this.reconnectInterval)
    } else {
      console.error("❌ Máximo de intentos de reconexión alcanzado")
      this._notifyListeners("onNotification", {
        type: "error",
        message: "No se pudo reconectar al servidor",
      })
    }
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Desconectando socket...")
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Métodos para unirse y enviar eventos de juego
  joinGame(gameId) {
    if (this.socket && this.isConnected) {
      console.log("🏠 Enviando JOIN_GAME:", gameId)
      this.socket.emit(SOCKET_EVENTS.JOIN_GAME, { gameId })
    } else {
      console.error("❌ No se puede unir al juego: socket no conectado")
      this._notifyListeners("onError", { message: "No se puede unir al juego: no hay conexión" })
    }
  }

  // Mejorar el manejo de errores en makePlay
  makePlay(gameId, dice, column) {
    if (this.socket && this.isConnected) {
      const playData = { gameId, dice, column }
      console.log("🎯 Enviando MAKE_PLAY:", playData)
      console.log("🎯 Socket ID:", this.socket.id)
      console.log("🎯 Socket conectado:", this.isConnected)

      try {
        this.socket.emit(SOCKET_EVENTS.MAKE_PLAY, playData)
        console.log("✅ Evento MAKE_PLAY enviado exitosamente")
        return true
      } catch (error) {
        console.error("❌ Error al enviar MAKE_PLAY:", error)
        this._notifyListeners("onError", { message: "Error al enviar jugada", details: error.message })
        return false
      }
    } else {
      console.error("❌ No se puede realizar la jugada: socket no conectado")
      console.error("❌ Socket:", this.socket)
      console.error("❌ isConnected:", this.isConnected)
      this._notifyListeners("onError", { message: "No se puede realizar la jugada: no hay conexión" })
      return false
    }
  }

  endGame(gameId, winnerId) {
    if (this.socket && this.isConnected) {
      console.log("🏁 Enviando END_GAME:", { gameId, winnerId })
      this.socket.emit(SOCKET_EVENTS.END_GAME, { gameId, winnerId })
    } else {
      console.error("❌ No se puede finalizar el juego: socket no conectado")
      this._notifyListeners("onError", { message: "No se puede finalizar el juego: no hay conexión" })
    }
  }

  surrender(gameId) {
    if (this.socket && this.isConnected) {
      console.log("🏳️ Enviando SURRENDER:", gameId)
      this.socket.emit(SOCKET_EVENTS.SURRENDER, { gameId })
    } else {
      console.error("❌ No se puede rendirse: socket no conectado")
      this._notifyListeners("onError", { message: "No se puede rendirse: no hay conexión" })
    }
  }

  // Métodos para registrar listeners
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ Error en listener de ${event}:`, error)
        }
      })
    }
  }

  // Métodos específicos para cada tipo de evento (para compatibilidad con código existente)
  onConnect(callback) {
    this.on("onConnect", callback)
  }

  onDisconnect(callback) {
    this.on("onDisconnect", callback)
  }

  onError(callback) {
    this.on("onError", callback)
  }

  onGameJoined(callback) {
    this.on("onGameJoined", callback)
  }

  onGameStarted(callback) {
    this.on("onGameStarted", callback)
  }

  onPlayMade(callback) {
    this.on("onPlayMade", callback)
  }

  onGameEnded(callback) {
    this.on("onGameEnded", callback)
  }

  onOpponentDisconnect(callback) {
    this.on("onOpponentDisconnect", callback)
  }

  onOpponentReconnect(callback) {
    this.on("onOpponentReconnect", callback)
  }

  onNotification(callback) {
    this.on("onNotification", callback)
  }
}

// Exportar una instancia singleton
export const socketService = new SocketService()
