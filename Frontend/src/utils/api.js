import { API_BASE_URL } from "./constants"

// Función helper para hacer peticiones autenticadas
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token")

  // Configurar headers base
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Añadir token de autenticación si existe
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  console.log(`📡 API Request to ${API_BASE_URL}${endpoint}:`, {
    endpoint,
    method: config.method || "GET",
    headers: config.headers,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
  })

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    console.log(`📡 Response status: ${response.status}`, {
      ok: response.ok,
      statusText: response.statusText,
    })

    // Intentar parsear la respuesta como JSON
    let responseData
    try {
      responseData = await response.json()
      console.log(`📡 Response data:`, responseData)
    } catch (parseError) {
      console.error("❌ Error parsing JSON response:", parseError)
      // Si no se puede parsear como JSON, crear una respuesta de error
      responseData = {
        status: "error",
        message: `Error del servidor (${response.status})`,
      }
    }

    // Si la respuesta HTTP no es exitosa, lanzar error
    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`
      console.error(`❌ API Error:`, {
        status: response.status,
        message: errorMessage,
        responseData,
      })
      throw new Error(errorMessage)
    }

    return responseData
  } catch (error) {
    console.error(`❌ Request failed:`, {
      endpoint,
      error: error.message,
      stack: error.stack,
    })

    // Si es un error de red o de conexión
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error("Error de conexión. Verifica tu conexión a internet.")
    }

    // Re-lanzar el error para que lo maneje el código que llama
    throw error
  }
}
