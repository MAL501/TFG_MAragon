import { GAME_STATES } from "../utils/constants"

const TurnIndicator = ({ isMyTurn, gameStatus, opponentName, myName }) => {
  if (gameStatus !== GAME_STATES.PLAYING) {
    return null
  }

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
      <div
        className={`px-6 py-3 rounded-full shadow-lg transition-all duration-300 ${
          isMyTurn ? "bg-green-500 text-white animate-pulse" : "bg-orange-500 text-white"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isMyTurn ? "bg-white" : "bg-white opacity-70"}`}></div>
          <span className="font-medium">{isMyTurn ? `Tu turno` : `Turno de ${opponentName}`}</span>
        </div>
      </div>
    </div>
  )
}

export default TurnIndicator
