"use client"

import { useState, useEffect } from "react"
import Notification from "./Notification"
import { socketService } from "../services/socketService"

const NotificationContainer = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    // Suscribirse a las notificaciones del socket
    const handleNotification = (notification) => {
      const id = Date.now().toString()
      setNotifications((prev) => [...prev, { ...notification, id }])
    }

    socketService.onNotification(handleNotification)

    return () => {
      // Limpiar suscripción
      socketService.off("onNotification", handleNotification)
    }
  }, [])

  // Función para mostrar una notificación manualmente
  const addNotification = (notification) => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { ...notification, id }])
  }

  // Función para eliminar una notificación
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration || 5000}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Exportar el componente y una función para mostrar notificaciones desde cualquier parte
export default NotificationContainer

// Función global para mostrar notificaciones
let notificationCallback = null

export const setNotificationCallback = (callback) => {
  notificationCallback = callback
}

export const showNotification = (notification) => {
  if (notificationCallback) {
    notificationCallback(notification)
  } else {
    console.warn("Notification callback not set")
  }
}
