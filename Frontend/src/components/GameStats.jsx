"use client"

import { useState } from "react"

const GameStats = ({
  player1Name,
  player2Name,
  player1Points,
  player2Points,
  player1Columns,
  player2Columns,
  gameStatus,
  gameStartTime,
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const calculateColumnPoints = (column) => {
    if (column.length === 0) return 0

    const counts = {}
    column.forEach((dice) => {
      counts[dice] = (counts[dice] || 0) + 1
    })

    let points = 0
    for (const [dice, count] of Object.entries(counts)) {
      if (count > 1) {
        points += Number(dice) * count * count
      } else {
        points += Number(dice)
      }
    }
    return points
  }

  const getGameDuration = () => {
    if (!gameStartTime) return "00:00"

    const now = new Date()
    const start = new Date(gameStartTime)
    const diff = Math.floor((now - start) / 1000)

    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-white rounded-lg shadow-lg border">
        {/* Header del panel */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Estadísticas</h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${showDetails ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del panel */}
        <div className="p-4 space-y-4">
          {/* Puntuación principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">{player1Name}</div>
              <div className="text-2xl font-bold text-blue-600">{player1Points}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">{player2Name}</div>
              <div className="text-2xl font-bold text-red-600">{player2Points}</div>
            </div>
          </div>

          {/* Detalles expandibles */}
          {showDetails && (
            <div className="space-y-4 border-t pt-4">
              {/* Duración del juego */}
              <div className="text-center">
                <div className="text-sm text-gray-600">Duración</div>
                <div className="font-mono text-lg">{getGameDuration()}</div>
              </div>

              {/* Puntos por columna */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700">Puntos por columna:</div>

                {/* Jugador 1 */}
                <div>
                  <div className="text-xs text-gray-600 mb-1">{player1Name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {player1Columns.map((column, index) => (
                      <div key={index} className="text-center bg-blue-50 rounded p-2">
                        <div className="text-xs text-gray-600">Col {index + 1}</div>
                        <div className="font-bold text-blue-600">{calculateColumnPoints(column)}</div>
                        <div className="text-xs text-gray-500">{column.length}/3</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Jugador 2 */}
                <div>
                  <div className="text-xs text-gray-600 mb-1">{player2Name}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {player2Columns.map((column, index) => (
                      <div key={index} className="text-center bg-red-50 rounded p-2">
                        <div className="text-xs text-gray-600">Col {index + 1}</div>
                        <div className="font-bold text-red-600">{calculateColumnPoints(column)}</div>
                        <div className="text-xs text-gray-500">{column.length}/3</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estado del juego */}
              <div className="text-center">
                <div className="text-sm text-gray-600">Estado</div>
                <div
                  className={`text-sm font-medium capitalize ${
                    gameStatus === "playing"
                      ? "text-green-600"
                      : gameStatus === "waiting"
                        ? "text-yellow-600"
                        : "text-gray-600"
                  }`}
                >
                  {gameStatus === "playing" ? "En juego" : gameStatus === "waiting" ? "Esperando" : "Finalizado"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameStats
