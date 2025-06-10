import { useNavigate } from "react-router-dom"
import { GAME_STATES } from "../utils/constants"

const GameStatusOverlay = ({ gameStatus, gameId, opponentName, onCancel }) => {
  const navigate = useNavigate()

  if (gameStatus === GAME_STATES.WAITING) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            {/* Animación de carga */}
            <div className="relative mb-6">
              <div className="w-16 h-16 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-2">Esperando oponente</h3>
            <p className="text-gray-600 mb-6">La partida comenzará automáticamente cuando se una otro jugador</p>

            {/* Información de la partida */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-600 mb-2">Código de partida:</div>
              <div className="font-mono text-lg font-bold text-gray-800 bg-white px-3 py-2 rounded border">
                {gameId}
              </div>
              <div className="text-xs text-gray-500 mt-2">Comparte este código con tu oponente</div>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition font-medium"
              >
                Cancelar partida
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(gameId)
                }}
                className="w-full bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition"
              >
                Copiar código
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameStatus === GAME_STATES.PLAYING) {
    return null // No mostrar overlay durante el juego
  }

  if (gameStatus === GAME_STATES.FINISHED) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Partida finalizada</h3>
            <p className="text-gray-600 mb-6">La partida ha terminado</p>

            <div className="space-y-3">
              <button
                onClick={() => navigate("/")}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-medium"
              >
                Ir al menú principal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default GameStatusOverlay
