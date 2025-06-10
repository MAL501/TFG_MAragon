import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GAME_STATES, NOTIFICATION_TYPES } from "../utils/constants"
import { showNotification } from "./NotificationContainer"

const GameHeader = ({
  gameId,
  gameStatus,
  connectionStatus,
  isMyTurn,
  opponentConnected,
  player1Name,
  player2Name,
  player1Points,
  player2Points,
  onSurrender,
  onLeaveGame,
}) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "reconnecting":
        return "bg-yellow-500"
      case "disconnected":
      default:
        return "bg-red-500"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Conectado"
      case "reconnecting":
        return "Reconectando..."
      case "disconnected":
      default:
        return "Desconectado"
    }
  }

  const getGameStatusText = () => {
    switch (gameStatus) {
      case GAME_STATES.WAITING:
        return "Esperando oponente"
      case GAME_STATES.PLAYING:
        return "En juego"
      case GAME_STATES.FINISHED:
        return "Finalizada"
      default:
        return "Desconocido"
    }
  }

  const handleLeaveGame = () => {
    if (window.confirm("¿Estás seguro de que quieres abandonar la partida?")) {
      if (onLeaveGame) {
        onLeaveGame()
      }
      navigate("/")
    }
  }

  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId)
      showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: "ID de partida copiado al portapapeles",
      })
    } catch (error) {
      console.error("Error al copiar:", error)
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 bg-white shadow-md z-30">
      <div className="flex items-center justify-between p-4">
        {/* Información de la partida */}
        <div className="flex items-center space-x-4">
          {/* Estado de conexión */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
            <span className="text-sm font-medium">{getConnectionStatusText()}</span>
          </div>

          {/* ID de partida */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Partida:</span>
            <button
              onClick={copyGameId}
              className="font-mono text-sm bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition"
              title="Clic para copiar"
            >
              {gameId}
            </button>
          </div>

          {/* Estado del juego */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Estado:</span>
            <span className="text-sm font-medium capitalize">{getGameStatusText()}</span>
          </div>
        </div>

        {/* Información de jugadores */}
        <div className="flex items-center space-x-6">
          {/* Jugador 1 */}
          <div className="text-center">
            <div className="text-sm font-medium">{player1Name}</div>
            <div className="text-lg font-bold text-blue-600">{player1Points}</div>
          </div>

          <div className="text-2xl font-bold text-gray-400">VS</div>

          {/* Jugador 2 */}
          <div className="text-center">
            <div className="text-sm font-medium">{player2Name}</div>
            <div className="text-lg font-bold text-red-600">{player2Points}</div>
          </div>
        </div>

        {/* Controles del juego */}
        <div className="flex items-center space-x-2">
          {/* Indicador de turno */}
          {gameStatus === GAME_STATES.PLAYING && (
            <div className="flex items-center space-x-2 mr-4">
              {isMyTurn ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Tu turno</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Turno del oponente</span>
                </div>
              )}
            </div>
          )}

          {/* Indicador de oponente desconectado */}
          {!opponentConnected && gameStatus === GAME_STATES.PLAYING && (
            <div className="flex items-center space-x-2 text-red-600 mr-4">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Oponente desconectado</span>
            </div>
          )}

          {/* Menú de opciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
              title="Opciones"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-40">
                <div className="py-1">
                  {gameStatus === GAME_STATES.PLAYING && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onSurrender()
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-gray-100"
                    >
                      Rendirse
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      handleLeaveGame()
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Abandonar partida
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      navigate("/")
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Ir al menú principal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameHeader
