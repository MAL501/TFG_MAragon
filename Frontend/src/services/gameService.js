import { apiRequest } from "../utils/api"
import { rollDiceFromServer } from "./diceService"

export const gameService = {
  async createGame() {
    try {
      const data = await apiRequest("/games", {
        method: "POST",
      })

      if (data.status === "success" && data.data) {
        return data.data
      }

      throw new Error("Formato de respuesta inesperado del servidor")
    } catch (error) {
      console.error("Error en createGame:", error)
      throw new Error(error.message || "Error al crear la partida")
    }
  },

  async joinGameByCode(code) {
    try {
      const data = await apiRequest("/games/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      })

      if (data.status === "success" && data.data) {
        return data.data
      }

      throw new Error("Formato de respuesta inesperado del servidor")
    } catch (error) {
      console.error("Error en joinGameByCode:", error)

      if (error.message.includes("404") || error.message.includes("not found")) {
        throw new Error("Código de partida no encontrado")
      }
      if (error.message.includes("409") || error.message.includes("completa")) {
        throw new Error("La partida ya está llena")
      }
      if (error.message.includes("410") || error.message.includes("finished")) {
        throw new Error("La partida ya ha terminado")
      }

      throw new Error(error.message || "Error al unirse a la partida")
    }
  },

  async getGame(gameId) {
    try {
      const data = await apiRequest(`/games/${gameId}`)

      if (data.status === "success" && data.data) {
        return data.data
      }

      throw new Error("Formato de respuesta inesperado del servidor")
    } catch (error) {
      console.error("Error en getGame:", error)

      if (error.message.includes("404")) {
        throw new Error("Partida no encontrada")
      }

      throw new Error(error.message || "Error al obtener información de la partida")
    }
  },

  async getGameByCode(code) {
    try {
      const data = await apiRequest(`/games/code/${code}`)

      if (data.status === "success" && data.data) {
        return data.data
      }

      throw new Error("Formato de respuesta inesperado del servidor")
    } catch (error) {
      console.error("Error en getGameByCode:", error)
      throw new Error(error.message || "Error al buscar la partida")
    }
  },

  async endGame(gameId, winnerId) {
    try {
      const data = await apiRequest(`/games/${gameId}/end`, {
        method: "PUT",
        body: JSON.stringify({ winnerId }),
      })

      if (data.status === "success") {
        return data.data
      }

      throw new Error("Error al finalizar la partida")
    } catch (error) {
      console.error("Error en endGame:", error)
      throw new Error(error.message || "Error al finalizar la partida")
    }
  },

  // Mejorar makePlay para incluir información sobre eliminación de dados
  async makePlay(gameId, dice, column) {
    try {
      const data = await apiRequest(`/games/${gameId}/plays`, {
        method: "POST",
        body: JSON.stringify({
          dice,
          column,
          // Incluir información adicional para que el backend procese la eliminación
          processOpponentRemoval: true,
        }),
      })

      if (data.status === "success") {
        return data.data
      }

      throw new Error("Error al realizar la jugada")
    } catch (error) {
      console.error("Error en makePlay:", error)
      throw new Error(error.message || "Error al realizar la jugada")
    }
  },

  // Cambiar para usar el endpoint de estado del juego que incluye las jugadas
  async getGamePlays(gameId) {
    try {
      const data = await apiRequest(`/games/${gameId}/state`)

      if (data.status === "success" && data.data) {
        // El servidor devuelve el estado completo, extraemos solo las jugadas
        return {
          plays: data.data.plays || [],
          columns: data.data.columns || {},
          gameState: data.data,
        }
      }

      return { plays: [], columns: {}, gameState: null }
    } catch (error) {
      console.error("Error en getGamePlays:", error)
      return { plays: [], columns: {}, gameState: null }
    }
  },

  // Nuevo método para obtener el estado completo del juego
  async getGameState(gameId) {
    try {
      const data = await apiRequest(`/games/${gameId}/state`)

      if (data.status === "success" && data.data) {
        return data.data
      }

      throw new Error("Error al obtener el estado del juego")
    } catch (error) {
      console.error("Error en getGameState:", error)
      throw new Error(error.message || "Error al obtener el estado del juego")
    }
  },

  async cancelGame(gameId) {
    try {
      const data = await apiRequest(`/games/${gameId}/cancel`, {
        method: "PUT",
      })

      if (data.status === "success") {
        return data.data
      }

      throw new Error("Error al cancelar la partida")
    } catch (error) {
      console.error("Error en cancelGame:", error)
      throw new Error(error.message || "Error al cancelar la partida")
    }
  },

  // Nuevo método para procesar eliminación de dados del oponente
  async processOpponentDiceRemoval(gameId, playerColumn, diceValue) {
    try {
      const data = await apiRequest(`/games/${gameId}/remove-opponent-dice`, {
        method: "POST",
        body: JSON.stringify({
          playerColumn,
          diceValue,
        }),
      })

      if (data.status === "success") {
        return data.data
      }

      throw new Error("Error al procesar eliminación de dados del oponente")
    } catch (error) {
      console.error("Error en processOpponentDiceRemoval:", error)
      throw new Error(error.message || "Error al procesar eliminación de dados del oponente")
    }
  },

  // Nuevo método para obtener un dado del servidor para una partida específica
  async rollDiceForGame(gameId) {
    try {
      // Verificar que el token exista antes de hacer la solicitud
      const token = localStorage.getItem("token")
      if (!token) {
        console.warn("⚠️ No hay token de autenticación disponible para obtener dado de partida")
        throw new Error("No hay token de autenticación")
      }

      console.log(`🎲 Solicitando dado para partida ${gameId}...`)
      console.log("🔑 Token disponible:", token ? `${token.substring(0, 20)}...` : "No token")

      const data = await apiRequest(`/games/${gameId}/roll-dice`, {
        method: "POST",
      })

      if (data.status === "success") {
        console.log("🎲 Dado de partida recibido:", data.data.dice)
        return data.data.dice
      }

      console.error("❌ Formato de respuesta inesperado:", data)
      throw new Error("Error al obtener dado del servidor")
    } catch (error) {
      console.error("❌ Error en rollDiceForGame:", error)
      // Intentar con la API general de dados
      console.log("🎲 Fallback a API general de dados...")
      return await rollDiceFromServer()
    }
  },

  // Nuevo método para eliminar una partida (solo el host puede hacerlo)
  async deleteGame(gameId) {
    try {
      const data = await apiRequest(`/games/${gameId}`, {
        method: "DELETE",
      })

      if (data.status === "success") {
        return data.data
      }

      throw new Error("Error al eliminar la partida")
    } catch (error) {
      console.error("Error en deleteGame:", error)
      throw new Error(error.message || "Error al eliminar la partida")
    }
  },
}
