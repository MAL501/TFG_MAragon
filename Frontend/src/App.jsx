"use client"

import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react"
import Options from "./components/Options"
import "./App.css"
import Table from "./components/Table"
import OnlineTable from "./components/OnlineTable"
import WaitingRoom from "./components/WaitingRoom"
import NotificationContainer, { setNotificationCallback } from "./components/NotificationContainer"

function App() {
  const [notifications, setNotifications] = useState([])

  // Configurar el callback para notificaciones
  useEffect(() => {
    setNotificationCallback((notification) => {
      const id = Date.now().toString()
      setNotifications((prev) => [...prev, { ...notification, id }])
    })
  }, [])

  // Función para eliminar una notificación
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <BrowserRouter basename="/Matatena">
      {/* Contenedor de notificaciones */}
      <div className="fixed top-4 right-4 z-50 space-y-4 max-w-sm">
        {notifications.map((notification) => (
          <NotificationContainer
            key={notification.id}
            type={notification.type}
            message={notification.message}
            duration={notification.duration || 5000}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      <Routes>
        <Route path="/" element={<Options />} />
        <Route path="/play" element={<Table />} />
        <Route path="/waiting-room/:gameId" element={<WaitingRoom />} />
        <Route path="/game/:gameId" element={<OnlineTable />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
