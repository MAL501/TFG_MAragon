import { API_BASE_URL } from "./constants"

// Función helper para hacer peticiones autenticadas
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token")

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    // Intentar parsear la respuesta como JSON
    let responseData
    try {
      responseData = await response.json()
    } catch (parseError) {
      // Si no se puede parsear como JSON, crear una respuesta de error
      responseData = {
        status: "error",
        message: `Error del servidor (${response.status})`,
      }
    }

    // Si la respuesta HTTP no es exitosa, lanzar error
    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    return responseData
  } catch (error) {
    // Si es un error de red o de conexión
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Error de conexión. Verifica tu conexión a internet.")
    }

    // Re-lanzar el error para que lo maneje el código que llama
    throw error
  }
}
