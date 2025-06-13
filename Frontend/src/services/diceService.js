import { apiRequest } from "../utils/api"

export const getDice = () => {
  return Number.parseInt(Math.random() * 6 + 1)
}

// Nueva función para obtener un dado del servidor
export const rollDiceFromServer = async () => {
  try {
    // Verificar que el token exista antes de hacer la solicitud
    const token = localStorage.getItem("token")
    if (!token) {
      console.warn("⚠️ No hay token de autenticación disponible para obtener dado")
      return getDice() // Fallback a dado local
    }

    console.log("🎲 Solicitando dado al servidor...")
    console.log("🔑 Token disponible:", token ? `${token.substring(0, 20)}...` : "No token")

    const data = await apiRequest("/dice/roll", {
      method: "GET",
    })

    if (data.status === "success" && data.data && typeof data.data.dice === "number") {
      console.log("🎲 Dado recibido del servidor:", data.data.dice)
      return data.data.dice
    }

    console.error("❌ Formato de respuesta inesperado:", data)
    throw new Error("Formato de respuesta inesperado del servidor")
  } catch (error) {
    console.error("❌ Error al obtener dado del servidor:", error)
    console.log("🎲 Usando dado local como fallback")
    // Fallback a dado local si falla el servidor
    return getDice()
  }
}

// Función para obtener las probabilidades del usuario
export const getUserProbabilities = async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }

    console.log("📊 Obteniendo probabilidades del usuario...")

    const data = await apiRequest("/dice/probabilities", {
      method: "GET",
    })

    if (data.status === "success" && data.data) {
      console.log("📊 Probabilidades recibidas:", data.data)
      return data.data
    }

    throw new Error("Error al obtener probabilidades del usuario")
  } catch (error) {
    console.error("❌ Error al obtener probabilidades:", error)
    throw error
  }
}

// Función para actualizar las probabilidades del usuario
export const updateUserProbabilities = async (probabilities) => {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("No hay token de autenticación")
    }

    console.log("📊 Actualizando probabilidades del usuario:", probabilities)

    const data = await apiRequest("/dice/probabilities", {
      method: "PUT",
      body: JSON.stringify(probabilities),
    })

    if (data.status === "success") {
      console.log("✅ Probabilidades actualizadas exitosamente")
      return data.data
    }

    throw new Error("Error al actualizar probabilidades del usuario")
  } catch (error) {
    console.error("❌ Error al actualizar probabilidades:", error)
    throw error
  }
}

export const addDiceToColumn = (column, dice) => {
  if (column.length >= 2) {
    return column
  }

  column.push(dice)

  return column
}

//La siguiente función tiene como objetivo activar un multiplicador en caso
//de que se repita un dado en la misma columna.
//El multiplicador será la suma de los dados del mismo palo * la cantidad de veces que se repita.
//además, se le sumará el valor de los dados que no se repitan
//Ejemplo: 1,1,1 => (1+1+1) * 3 = 9

export const pointsColumn = (column) => {
  if (column.length === 0) {
    return 0
  }

  let points = 0
  const counts = {}

  column.forEach((dice) => {
    counts[dice] = (counts[dice] || 0) + 1
  })

  for (const [dice, count] of Object.entries(counts)) {
    if (count > 1) {
      points += Number(dice) * count * count
    } else {
      points += Number(dice)
    }
  }
  return points
}

export const removeDices = (opponent_column, dice) => {
  opponent_column.forEach((opponent_dice, index) => {
    if (opponent_dice === dice) {
      opponent_column.splice(index, 1)
    }
  })

  return opponent_column
}

// Nueva función específica para eliminar dados del oponente en juegos online
export const removeOpponentDices = (opponentColumn, diceValue) => {
  if (!Array.isArray(opponentColumn) || diceValue === undefined || diceValue === null) {
    return opponentColumn
  }

  // Filtrar todos los dados que coincidan con el valor
  const filteredColumn = opponentColumn.filter((dice) => dice !== diceValue)

  console.log(`🎯 Eliminando dados del oponente:`, {
    originalColumn: opponentColumn,
    diceValue,
    filteredColumn,
    removedCount: opponentColumn.length - filteredColumn.length,
  })

  return filteredColumn
}

// Función para obtener la columna correspondiente del oponente
export const getOpponentColumnIndex = (playerColumnId, isHost) => {
  // Mapeo de columnas:
  // Host (jugador 1): columnas 1, 2, 3
  // Guest (jugador 2): columnas 4, 5, 6
  // La correspondencia es: 1↔4, 2↔5, 3↔6

  if (isHost) {
    // Si soy host, mis columnas 1,2,3 corresponden a las columnas 4,5,6 del guest
    switch (playerColumnId) {
      case "1":
        return "4"
      case "2":
        return "5"
      case "3":
        return "6"
      default:
        return null
    }
  } else {
    // Si soy guest, mis columnas 4,5,6 corresponden a las columnas 1,2,3 del host
    switch (playerColumnId) {
      case "4":
        return "1"
      case "5":
        return "2"
      case "6":
        return "3"
      default:
        return null
    }
  }
}

// Función para obtener el setter de columna correspondiente
export const getColumnSetter = (columnId, setters) => {
  switch (columnId) {
    case "1":
    case "4":
      return setters.setFirst
    case "2":
    case "5":
      return setters.setSecond
    case "3":
    case "6":
      return setters.setThird
    default:
      return null
  }
}
