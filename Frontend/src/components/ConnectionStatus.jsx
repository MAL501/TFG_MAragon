import { useState, useEffect } from "react"

const ConnectionStatus = ({ status, onReconnect }) => {
  const [showReconnectButton, setShowReconnectButton] = useState(false)

  useEffect(() => {
    if (status === "disconnected") {
      const timer = setTimeout(() => {
        setShowReconnectButton(true)
      }, 5000) // Mostrar botón de reconexión después de 5 segundos

      return () => clearTimeout(timer)
    } else {
      setShowReconnectButton(false)
    }
  }, [status])

  if (status === "connected") {
    return null // No mostrar nada si está conectado
  }

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div
        className={`px-6 py-3 rounded-lg shadow-lg ${
          status === "reconnecting" ? "bg-yellow-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        <div className="flex items-center space-x-3">
          {status === "reconnecting" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Reconectando...</span>
            </>
          ) : (
            <>
              <div className="w-4 h-4 bg-white rounded-full"></div>
              <span className="font-medium">Conexión perdida</span>
              {showReconnectButton && (
                <button
                  onClick={onReconnect}
                  className="ml-3 bg-white text-red-500 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition"
                >
                  Reconectar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConnectionStatus
