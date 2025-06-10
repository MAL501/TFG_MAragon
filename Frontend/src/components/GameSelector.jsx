import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { gameService } from "../services/gameService"
import { NOTIFICATION_TYPES } from "../utils/constants"
import { showNotification } from "./NotificationContainer"

const inputStyle = "w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
const buttonStyle =
  "w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
const buttonLocalStyle = "w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-700 transition"
const errorStyle = "text-red-500 text-sm mb-2 text-center"
const successStyle = "text-green-600 text-sm mb-2 text-center"

const GameSelector = ({ onClose }) => {
  const [gameCode, setGameCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  // Función para crear una nueva partida online
  const handleCreateGame = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Llamar al backend para crear la partida
      const gameData = await gameService.createGame()

      setSuccess(`¡Partida creada! Código: ${gameData.gameCode}`)

      showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: `Partida creada con código: ${gameData.gameCode}`,
      })

      // Redirigir a la sala de espera con el gameId real del backend
      setTimeout(() => {
        navigate(`/waiting-room/${gameData.gameId}`)
        if (onClose) onClose()
      }, 1500)
    } catch (error) {
      setError(error.message || "Error al crear la partida")
      showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message: error.message || "Error al crear la partida",
      })
      console.error("Error al crear partida:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para unirse a una partida por código
  const handleJoinGame = async (e) => {
    e.preventDefault()

    if (!gameCode.trim()) {
      setError("Por favor, introduce un código de partida")
      return
    }

    if (gameCode.length !== 5) {
      setError("El código debe tener exactamente 5 caracteres")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Llamar al backend para unirse a la partida
      const gameData = await gameService.joinGameByCode(gameCode.toUpperCase())

      setSuccess("¡Te has unido a la partida!")

      showNotification({
        type: NOTIFICATION_TYPES.SUCCESS,
        message: "Te has unido a la partida exitosamente",
      })

      // Redirigir a la sala de espera con el gameId real del backend
      setTimeout(() => {
        navigate(`/waiting-room/${gameData.game.id}`)
        if (onClose) onClose()
      }, 1000)
    } catch (error) {
      setError(error.message || "Error al unirse a la partida")
      showNotification({
        type: NOTIFICATION_TYPES.ERROR,
        message: error.message || "Código de partida inválido",
      })
      console.error("Error al unirse a partida:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para jugar en modo local
  const handlePlayLocal = () => {
    navigate("/play")
    if (onClose) onClose()
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Seleccionar Modo de Juego</h2>

      {error && <div className={errorStyle}>{error}</div>}
      {success && <div className={successStyle}>{success}</div>}

      {/* Botones superiores */}
      <div className="space-y-4 mb-6">
        <button onClick={handleCreateGame} disabled={isLoading} className={buttonStyle}>
          {isLoading ? "Creando partida..." : "Crear Partida Online"}
        </button>

        <button onClick={handlePlayLocal} disabled={isLoading} className={buttonLocalStyle}>
          Jugar Local
        </button>
      </div>

      {/* Sección para unirse a partida */}
      <div className="border-t pt-6">
        <p className="text-sm text-gray-600 mb-3 text-center">¿Tienes un código de partida? Únete aquí:</p>

        <form onSubmit={handleJoinGame} className="space-y-4">
          <input
            type="text"
            placeholder="Código de 5 dígitos (ej: ABC12)"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            className={inputStyle}
            maxLength={5}
            disabled={isLoading}
            style={{ textTransform: "uppercase" }}
          />

          <button
            type="submit"
            disabled={isLoading || !gameCode.trim() || gameCode.length !== 5}
            className={buttonStyle}
          >
            {isLoading ? "Uniéndose..." : "Unirse a Partida"}
          </button>
        </form>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 text-center">
          <strong>Nota:</strong> Para jugar online, uno de los jugadores debe crear la partida y compartir el código con
          el otro jugador.
        </p>
      </div>
    </div>
  )
}

export default GameSelector
