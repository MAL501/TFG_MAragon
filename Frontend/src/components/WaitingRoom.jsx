"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { gameService } from "../services/gameService"
import { socketService } from "../services/socketService"
import { NOTIFICATION_TYPES } from "../utils/constants"
import { showNotification } from "./NotificationContainer"

const WaitingRoom = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()

  // Estados del componente
  const [gameData, setGameData] = useState(null)
  const [gameCode, setGameCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [isWaiting, setIsWaiting] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [opponentName, setOpponentName] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [playersCount, setPlayersCount] = useState(1)

  // Cargar datos de la partida al montar el componente
  useEffect(() => {
    if (gameId) {
      console.log("🎮 WaitingRoom: Iniciando para gameId:", gameId)
      loadGameData()
      setupSocketConnection()
    }

    return () => {
      console.log("🎮 WaitingRoom: Limpiando listeners")
      cleanupSocketListeners()
    }
  }, [gameId])

  // Polling para verificar el estado de la partida cada 3 segundos
  useEffect(() => {
    if (!isWaiting) return

    const interval = setInterval(async () => {
      try {
        console.log("🔄 Verificando estado de la partida...")
        const response = await gameService.getGame(gameId)
        const game = response.game

        if (game.guest_user && isWaiting) {
          console.log("✅ ¡Segundo jugador detectado via polling!")
          setOpponentName(game.guest_username || "Oponente")
          setIsWaiting(false)
          setPlayersCount(2)

          showNotification({
            type: NOTIFICATION_TYPES.SUCCESS,
            message: `¡${game.guest_username || "Oponente"} se ha unido!`,
          })

          setTimeout(() => {
            console.log("🚀 Redirigiendo al juego...")
            navigate(`/game/${gameId}`)
          }, 2000)
        }
      } catch (error) {
        console.error("Error en polling:", error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [gameId, isWaiting, navigate])

  const loadGameData = async () => {
    try {
      setLoading(true)
      setError("")

      console.log("📡 Cargando datos de la partida:", gameId)

      // Obtener información de la partida desde el backend
      const response = await gameService.getGame(gameId)
      const game = response.game

      console.log("📊 Datos de la partida recibidos:", game)

      setGameData(game)
      setGameCode(game.code)

      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      const isCurrentUserHost = game.host_user === currentUserId

      setIsHost(isCurrentUserHost)

      console.log("👤 Usuario actual:", currentUserId)
      console.log("🏠 Es host:", isCurrentUserHost)
      console.log("👥 Host user:", game.host_user)
      console.log("🎯 Guest user:", game.guest_user)

      // Verificar si ya hay un oponente
      if (game.guest_user) {
        console.log("✅ Ya hay un segundo jugador!")
        setIsWaiting(false)
        setOpponentName(game.guest_username || "Oponente")
        setPlayersCount(2)

        // Si ya hay dos jugadores, ir directamente al juego
        setTimeout(() => {
          console.log("🚀 Redirigiendo al juego (ya hay 2 jugadores)...")
          navigate(`/game/${gameId}`)
        }, 2000)
      } else {
        console.log("⏳ Esperando segundo jugador...")
        setPlayersCount(1)
      }
    } catch (error) {
      console.error("❌ Error al cargar datos de la partida:", error)
      setError(error.message || "Error al cargar la partida")

      showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message: "Error al cargar la partida",
      })
    } finally {
      setLoading(false)
    }
  }

  const setupSocketConnection = () => {
    try {
      console.log("🔌 Configurando conexión de socket...")

      // Conectar al socket si no está conectado
      if (!socketService.isConnected) {
        console.log("🔌 Conectando socket...")
        socketService.connect()
      } else {
        console.log("✅ Socket ya conectado")
      }

      // Configurar listeners
      setupSocketListeners()

      // Unirse a la sala del juego
      console.log("🏠 Uniéndose a la sala:", gameId)
      socketService.joinGame(gameId)
    } catch (error) {
      console.error("❌ Error al conectar socket:", error)
      setConnectionStatus("error")
      showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message: "Error al conectar con el servidor",
      })
    }
  }

  const setupSocketListeners = () => {
    console.log("👂 Configurando listeners de socket...")

    // Conexión exitosa
    socketService.onConnect(() => {
      console.log("✅ Socket conectado")
      setConnectionStatus("connected")
      showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: "Conectado al servidor",
      })
    })

    // Desconexión
    socketService.onDisconnect(() => {
      console.log("❌ Socket desconectado")
      setConnectionStatus("disconnected")
      showNotification({
        type: NOTIFICATION_TYPES.WARNING,
        message: "Desconectado del servidor",
      })
    })

    // Cuando se une a la partida exitosamente
    socketService.onGameJoined((data) => {
      console.log("🎮 Evento gameJoined recibido:", data)
      setConnectionStatus("connected")

      if (data.opponentName) {
        console.log("👥 Oponente detectado via gameJoined:", data.opponentName)
        setOpponentName(data.opponentName)
        setIsWaiting(false)
        setPlayersCount(2)
      }
    })

    // Cuando se inicia la partida (se une el segundo jugador)
    socketService.onGameStarted((data) => {
      console.log("🚀 Evento gameStarted recibido:", data)
      setOpponentName(data.opponentName)
      setIsWaiting(false)
      setPlayersCount(2)

      showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: `¡${data.opponentName} se ha unido a la partida!`,
      })

      // Redirigir al juego después de un breve delay
      setTimeout(() => {
        console.log("🚀 Redirigiendo al juego via gameStarted...")
        navigate(`/game/${gameId}`)
      }, 2000)
    })

    // Errores
    socketService.onError((error) => {
      console.error("❌ Error de socket:", error)
      setConnectionStatus("error")
      showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message: error.message || "Error de conexión",
      })
    })
  }

  const cleanupSocketListeners = () => {
    console.log("🧹 Limpiando listeners de socket...")
    socketService.off("onConnect")
    socketService.off("onDisconnect")
    socketService.off("onGameJoined")
    socketService.off("onGameStarted")
    socketService.off("onError")
  }

  // Función para copiar código al portapapeles
  const copyGameCode = async () => {
    if (gameCode) {
      try {
        await navigator.clipboard.writeText(gameCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)

        showNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          message: "Código copiado al portapapeles",
        })
      } catch (err) {
        console.error("Error al copiar:", err)
        showNotification({
          type: NOTIFICATION_TYPES.ERROR,
          message: "Error al copiar el código",
        })
      }
    }
  }

  // Función para cancelar partida
  const cancelGame = async () => {
    if (window.confirm("¿Estás seguro de que quieres cancelar la partida?")) {
      try {
        console.log("🚫 Cancelando partida...")

        // Llama a la función para eliminar la partida
        await gameService.deleteGame(gameId)

        showNotification({
          type: NOTIFICATION_TYPES.SUCCESS,
          message: "Partida eliminada correctamente",
        })

        // Desconectar del socket
        socketService.disconnect()

        // Navegar al menú principal
        navigate("/")
      } catch (error) {
        console.error("Error al cancelar partida:", error)
        showNotification({
          type: NOTIFICATION_TYPES.ERROR,
          message: error.message || "Error al cancelar la partida",
        })
      }
    }
  }

  // Función para ir al juego manualmente
  const goToGame = () => {
    console.log("🎮 Yendo al juego manualmente...")
    navigate(`/game/${gameId}`)
  }

  // Función para refrescar el estado
  const refreshGameState = async () => {
    console.log("🔄 Refrescando estado de la partida...")
    await loadGameData()
  }

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando partida...</p>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Volver al menú
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sala de Espera</h1>
          <p className="text-gray-600">{isHost ? "Eres el anfitrión" : "Te has unido a la partida"}</p>
          <p className="text-sm text-gray-500">Jugadores: {playersCount}/2</p>
        </div>

        {/* Estado de conexión */}
        <div className="flex items-center justify-center mb-4">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
          ></div>
          <span className="text-sm text-gray-600">
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "connecting"
                ? "Conectando..."
                : "Desconectado"}
          </span>
        </div>

        {/* Código de partida */}
        {gameCode && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-2 text-center">Código de partida:</p>
            <div className="flex items-center space-x-2">
              <code className="flex-1 bg-white px-4 py-3 rounded border text-2xl font-mono text-center tracking-wider">
                {gameCode}
              </code>
              <button
                onClick={copyGameCode}
                className="px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
              >
                {copied ? "✓" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {isHost ? "Comparte este código con tu oponente" : "Código de la partida"}
            </p>
          </div>
        )}

        {/* Estado de la partida */}
        <div className="text-center mb-6">
          {isWaiting ? (
            <div>
              <div className="animate-pulse text-4xl mb-4">⏳</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {isHost ? "Esperando oponente..." : "Esperando que inicie la partida..."}
              </h3>
              <p className="text-gray-500 text-sm">
                {isHost
                  ? "La partida comenzará automáticamente cuando se una otro jugador"
                  : "El anfitrión iniciará la partida pronto"}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-lg font-semibold text-green-600 mb-2">¡{opponentName} se ha unido!</h3>
              <p className="text-gray-500 text-sm">Redirigiendo al juego...</p>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-700 mb-2">Información de la partida:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              <span className="font-medium">ID:</span> {gameId}
            </p>
            <p>
              <span className="font-medium">Código:</span> {gameCode}
            </p>
            <p>
              <span className="font-medium">Estado:</span> {isWaiting ? "Esperando" : "Lista para iniciar"}
            </p>
            <p>
              <span className="font-medium">Rol:</span> {isHost ? "Anfitrión" : "Invitado"}
            </p>
            <p>
              <span className="font-medium">Jugadores:</span> {playersCount}/2
            </p>
            {opponentName && (
              <p>
                <span className="font-medium">Oponente:</span> {opponentName}
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          {!isWaiting && (
            <button
              onClick={goToGame}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              Ir al Juego
            </button>
          )}

          {isWaiting && (
            <button
              onClick={refreshGameState}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Refrescar Estado
            </button>
          )}

          <button
            onClick={cancelGame}
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
          >
            {isHost ? "Cancelar Partida" : "Abandonar Partida"}
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Volver al Menú
          </button>
        </div>

        {/* Debug info (solo en desarrollo) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <p>Debug: gameId={gameId}</p>
            <p>Debug: isHost={isHost.toString()}</p>
            <p>Debug: isWaiting={isWaiting.toString()}</p>
            <p>Debug: playersCount={playersCount}</p>
            <p>Debug: connectionStatus={connectionStatus}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WaitingRoom
