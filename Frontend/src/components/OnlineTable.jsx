"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import "../styles/cup.css"
import Cup from "./Cup"
import Board from "./Board"
import CloseButton from "./CloseButton"
import MessageDialog from "./MessageDialog"
import { rollDiceFromServer, pointsColumn, removeDices } from "../services/diceService"
import { DndContext } from "@dnd-kit/core"
import { useParams, useNavigate } from "react-router-dom"
import { socketService } from "../services/socketService"
import { gameService } from "../services/gameService"

const OnlineTable = () => {
  const { gameId } = useParams()
  const navigate = useNavigate()

  //--------------------Variables del jugador----------------------
  const [player1_points, setPlayer1_points] = useState(0)
  const [player2_points, setPlayer2_points] = useState(0)
  const [player1_name, setPlayer1_name] = useState("Jugador 1")
  const [player2_name, setPlayer2_name] = useState("Jugador 2")
  const [isHost, setIsHost] = useState(false)

  //--------------------Variables del cubilete----------------------
  const CUP_IP = 0
  const CUP_PLAYER2_POSITION = "cup-player2"
  const CUP_PLAYER1_POSITION = "cup-player1"
  const [cup_position, setCup_position] = useState(CUP_PLAYER1_POSITION)
  const [dice, setDice] = useState(null) // Inicializar como null hasta recibir del servidor
  const [isLoadingDice, setIsLoadingDice] = useState(false)
  const [diceError, setDiceError] = useState(null) // Para manejar errores de dados
  const diceToSend = useRef(null) // Variable para almacenar el dado a enviar
  //--------------------Variables del tablero----------------------
  const [turn, setTurn] = useState(true)
  const [player1_hookDice, setPlayer1_hookDice] = useState({
    column_id: 0,
    face: 0,
  })
  const [player2_hookDice, setPlayer2_hookDice] = useState({
    column_id: 0,
    face: 0,
  })

  const [player1_first_column_dices, setPlayer1_first_column_dices] = useState([])
  const [player1_second_column_dices, setPlayer1_second_column_dices] = useState([])
  const [player1_third_column_dices, setPlayer1_third_column_dices] = useState([])
  const [player2_first_column_dices, setPlayer2_first_column_dices] = useState([])
  const [player2_second_column_dices, setPlayer2_second_column_dices] = useState([])
  const [player2_third_column_dices, setPlayer2_third_column_dices] = useState([])

  const IDS_BOARD1 = ["1", "2", "3"]
  const IDS_BOARD2 = ["4", "5", "6"]

  const [first_columns_update, setFirst_columns_update] = useState(false)
  const [second_columns_update, setSecond_columns_update] = useState(false)
  const [third_columns_update, setThird_columns_update] = useState(false)

  const [board1_enabled, setBoard1_enabled] = useState(true)
  const [board2_enabled, setBoard2_enabled] = useState(false)

  const [winner, setWinner] = useState(null)
  const [gameOver, setGameOver] = useState(false)

  // Estado para tracking de jugadas
  const [lastPlayId, setLastPlayId] = useState(0)
  // Flag para controlar si estamos procesando una jugada local
  const [isProcessingLocalMove, setIsProcessingLocalMove] = useState(false)
  // Referencias para almacenar el último dado añadido manualmente (no por sincronización)
  const lastAddedDice = useRef({
    player1: { col1: null, col2: null, col3: null },
    player2: { col1: null, col2: null, col3: null },
  })

  // Verificación de autenticación mejorada
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userId = localStorage.getItem("userId")
    const username = localStorage.getItem("username")

    console.log("🔐 Verificando autenticación:", {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : "No token",
      userId,
      username,
    })

    if (!token) {
      console.error("❌ Usuario no autenticado. Redirigiendo al login...")
      navigate("/")
      return
    }

    if (!userId || !username) {
      console.warn("⚠️ Información de usuario incompleta")
    }
  }, [navigate])

  // Función para verificar si es mi turno (sin depender del dado)
  const isMyTurn = useCallback(() => {
    const currentUserId = Number.parseInt(localStorage.getItem("userId"))
    if (isHost && turn) {
      return true
    }
    if (!isHost && !turn) {
      return true
    }
    return false
  }, [isHost, turn])

  // Función para obtener un nuevo dado del servidor (SIN FALLBACK LOCAL)
  const getNewDiceFromServer = useCallback(async () => {
    try {
      setIsLoadingDice(true)
      setDiceError(null)
      console.log("🎲 Obteniendo nuevo dado del servidor...")

      // Verificar que haya un token de autenticación
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No hay token de autenticación para obtener dado")
      }

      // Intentar obtener dado específico para la partida primero
      let newDice
      try {
        console.log("🎲 Intentando obtener dado específico para la partida...")
        newDice = await gameService.rollDiceForGame(gameId)
        console.log("✅ Dado obtenido del servidor (específico para partida):", newDice)
      } catch (error) {
        // Fallback a la API general de dados
        console.log("🎲 Fallback a API general de dados...")
        newDice = await rollDiceFromServer()
        console.log("✅ Dado obtenido del servidor (API general):", newDice)
      }

      if (typeof newDice === "number" && newDice >= 1 && newDice <= 6) {
        setDice(newDice)
        diceToSend.current = newDice
        setDiceError(null)
        return newDice
      } else {
        throw new Error("Dado inválido recibido del servidor")
      }
    } catch (error) {
      console.error("❌ Error al obtener dado del servidor:", error)
      setDiceError(error.message)
      // NO generar dado local - mantener el estado como error
      setDice(null)
      throw error
    } finally {
      setIsLoadingDice(false)
    }
  }, [gameId])

  // Cargar datos iniciales del juego
  const loadGameData = useCallback(async () => {
    try {
      console.log("🎮 OnlineTable: Cargando datos del juego:", gameId)

      const response = await gameService.getGame(gameId)
      const game = response.game

      console.log("📊 Datos del juego:", game)

      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      const username = localStorage.getItem("username") || "Jugador"

      const amIHost = game.host_user === currentUserId
      setIsHost(amIHost)

      console.log("👤 Usuario actual:", currentUserId)
      console.log("🏠 Soy host:", amIHost)

      if (amIHost) {
        setPlayer1_name(username)
        setPlayer2_name(game.guest_username || "Oponente")
      } else {
        setPlayer1_name(game.host_username || "Anfitrión")
        setPlayer2_name(username)
      }

      // Cargar el estado completo del juego
      await loadGameState()

      // Obtener el primer dado del servidor si es nuestro turno
      console.log("🎲 Verificando si debo obtener dado inicial...")
      console.log("🎲 Es mi turno:", isMyTurn())

      if (isMyTurn()) {
        console.log("🎲 Obteniendo dado inicial...")
        await getNewDiceFromServer()
      } else {
        console.log("🎲 No es mi turno, no obtengo dado")
      }
    } catch (error) {
      console.error("❌ Error al cargar datos del juego:", error)
    }
  }, [gameId, getNewDiceFromServer, isMyTurn])

  // Cargar el estado completo del juego desde el servidor
  const loadGameState = useCallback(async () => {
    // Si estamos procesando una jugada local, no sobrescribir con datos del servidor
    if (isProcessingLocalMove) {
      console.log("⏸️ Saltando carga de estado - procesando jugada local")
      return
    }

    try {
      console.log("🔄 Cargando estado completo del juego...")
      const gameState = await gameService.getGameState(gameId)

      console.log("📊 Estado del juego recibido:", gameState)

      // Actualizar las columnas con los datos del servidor
      if (gameState.columns) {
        console.log("📋 Actualizando columnas con datos del servidor:", gameState.columns)

        // Columnas del jugador 1 (host)
        setPlayer1_first_column_dices(gameState.columns["1"] || [])
        setPlayer1_second_column_dices(gameState.columns["2"] || [])
        setPlayer1_third_column_dices(gameState.columns["3"] || [])

        // Columnas del jugador 2 (guest)
        setPlayer2_first_column_dices(gameState.columns["4"] || [])
        setPlayer2_second_column_dices(gameState.columns["5"] || [])
        setPlayer2_third_column_dices(gameState.columns["6"] || [])
      }

      // SOLO actualizar el turno si no estamos procesando una jugada local
      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      if (gameState.currentTurn && !isProcessingLocalMove) {
        const isMyTurnNow = gameState.currentTurn === currentUserId
        const isHostTurn = gameState.currentTurn === gameState.game.hostUser
        setTurn(isHostTurn)
        console.log("🔄 Turno actualizado:", { isMyTurnNow, isHostTurn, currentTurn: gameState.currentTurn })
      }

      // Actualizar el contador de jugadas
      if (gameState.plays) {
        setLastPlayId(gameState.plays.length)
      }

      // Sincronizar el dado actual si está disponible en el estado del juego
      if (gameState.currentDice && gameState.currentDice !== dice) {
        console.log("🎲 Sincronizando dado desde el servidor:", gameState.currentDice)
        setDice(gameState.currentDice)
        setDiceError(null)
      }
    } catch (error) {
      console.error("❌ Error al cargar estado del juego:", error)
    }
  }, [gameId, isProcessingLocalMove, dice])

  // Polling para sincronizar jugadas usando el endpoint correcto
  const syncGamePlays = useCallback(async () => {
    // No sincronizar si estamos procesando una jugada local
    if (isProcessingLocalMove) {
      console.log("⏸️ Saltando sincronización - procesando jugada local")
      return
    }

    try {
      console.log("🔄 Sincronizando jugadas...")
      const response = await gameService.getGamePlays(gameId)
      const plays = response.plays || []
      const columns = response.columns || {}

      if (plays.length > lastPlayId) {
        console.log("🆕 Nuevas jugadas detectadas, actualizando estado completo...")

        // Actualizar todas las columnas con los datos del servidor
        setPlayer1_first_column_dices(columns["1"] || [])
        setPlayer1_second_column_dices(columns["2"] || [])
        setPlayer1_third_column_dices(columns["3"] || [])
        setPlayer2_first_column_dices(columns["4"] || [])
        setPlayer2_second_column_dices(columns["5"] || [])
        setPlayer2_third_column_dices(columns["6"] || [])

        setLastPlayId(plays.length)

        // Actualizar el turno basado en la última jugada
        if (response.gameState && response.gameState.currentTurn) {
          const isHostTurn = response.gameState.currentTurn === response.gameState.game.hostUser
          setTurn(isHostTurn)
          console.log("🔄 Turno actualizado via polling:", {
            currentTurn: response.gameState.currentTurn,
            isHostTurn,
          })
        }

        // Sincronizar el dado actual
        if (response.gameState && response.gameState.currentDice) {
          console.log("🎲 Sincronizando dado via polling:", response.gameState.currentDice)
          setDice(response.gameState.currentDice)
          setDiceError(null)
        }

        // Forzar actualización de puntos
        setFirst_columns_update((prev) => !prev)
        setSecond_columns_update((prev) => !prev)
        setThird_columns_update((prev) => !prev)
      }
    } catch (error) {
      console.error("❌ Error al sincronizar jugadas:", error)
    }
  }, [gameId, lastPlayId, isProcessingLocalMove])

  // Polling cada 2 segundos para sincronizar jugadas
  useEffect(() => {
    const interval = setInterval(syncGamePlays, 2000)
    return () => clearInterval(interval)
  }, [syncGamePlays])

  // Inicialización del juego online
  useEffect(() => {
    if (gameId) {
      console.log("🚀 OnlineTable: Iniciando para gameId:", gameId)
      loadGameData()
      setupSocketConnection()
    }

    return () => {
      console.log("🧹 OnlineTable: Limpiando listeners")
      cleanupSocketListeners()
    }
  }, [gameId, loadGameData])

  const setupSocketConnection = () => {
    try {
      console.log("🔌 OnlineTable: Configurando conexión de socket...")

      if (!socketService.isConnected) {
        console.log("🔌 Conectando socket...")
        socketService.connect()
      } else {
        console.log("✅ Socket ya conectado")
      }

      setupSocketListeners()
      console.log("🏠 Uniéndose a la sala del juego:", gameId)
      socketService.joinGame(gameId)
    } catch (error) {
      console.error("❌ Error al conectar socket:", error)
    }
  }

  const setupSocketListeners = () => {
    console.log("👂 OnlineTable: Configurando listeners de socket...")

    socketService.onConnect((data) => {
      console.log("✅ Socket conectado en OnlineTable:", data)
    })

    socketService.onDisconnect((data) => {
      console.log("❌ Socket desconectado en OnlineTable:", data)
    })

    socketService.onGameJoined((data) => {
      console.log("🎮 Evento gameJoined en OnlineTable:", data)
    })

    socketService.onGameStarted((data) => {
      console.log("🚀 Evento gameStarted en OnlineTable:", data)
    })

    socketService.onPlayMade((data) => {
      console.log("🎯 Jugada recibida via WebSocket en OnlineTable:", data)

      // Si no es mi jugada, actualizar el estado
      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      if (data.userId !== currentUserId) {
        // Recargar estado completo desde el servidor
        setTimeout(() => {
          loadGameState()
        }, 300)

        // Obtener nuevo dado del servidor para el siguiente turno
        setTimeout(() => {
          if (isMyTurn()) {
            console.log("🎲 Obteniendo nuevo dado después de jugada del oponente...")
            getNewDiceFromServer()
          }
        }, 500)
      }
    })

    socketService.onGameEnded((data) => {
      console.log("🏁 Juego terminado:", data)
      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      if (data.winnerId === currentUserId) {
        setWinner(isHost ? player1_name : player2_name)
      } else {
        setWinner(isHost ? player2_name : player1_name)
      }
      setGameOver(true)
    })

    socketService.onError((error) => {
      console.error("❌ Error de socket en OnlineTable:", error)
    })

    socketService.onNotification((notification) => {
      console.log("📢 Notificación recibida:", notification)
    })
  }

  const cleanupSocketListeners = () => {
    console.log("🧹 OnlineTable: Limpiando listeners de socket...")
    socketService.off("onConnect")
    socketService.off("onDisconnect")
    socketService.off("onGameJoined")
    socketService.off("onGameStarted")
    socketService.off("onPlayMade")
    socketService.off("onGameEnded")
    socketService.off("onError")
    socketService.off("onNotification")
  }

  const getTotalPoints = (column1, column2, column3) => {
    let ret = 0
    ret += pointsColumn(column1)
    ret += pointsColumn(column2)
    ret += pointsColumn(column3)
    return ret
  }

  // Effect para manejar cambios de turno y obtención de dados
  useEffect(() => {
    console.log(
      "🔄 Cambio de turno - turn:",
      turn,
      "isMyTurn:",
      isMyTurn(),
      "isProcessingLocalMove:",
      isProcessingLocalMove,
    )

    // Actualizar posición del cup inmediatamente
    setCup_position(turn ? CUP_PLAYER1_POSITION : CUP_PLAYER2_POSITION)

    // Actualizar estados de los tableros
    setBoard1_enabled(!turn)
    setBoard2_enabled(turn)

    // SOLO obtener nuevo dado del servidor si:
    // 1. No estamos procesando una jugada local
    // 2. Es mi turno
    // 3. No estamos ya cargando un dado
    // 4. No hay error de dado
    // 5. No tenemos ya un dado válido
    if (!isProcessingLocalMove && isMyTurn() && !isLoadingDice && !diceError && dice === null) {
      console.log("🎲 Obteniendo dado para mi turno...")
      getNewDiceFromServer().catch((error) => {
        console.error("❌ Error al obtener dado en cambio de turno:", error)
      })
    } else {
      console.log("⏸️ Saltando obtención de dado:", {
        isProcessingLocalMove,
        isMyTurn: isMyTurn(),
        isLoadingDice,
        diceError,
        currentDice: dice,
      })
    }
  }, [turn])

  // Actualizar puntos cuando cambien las columnas
  useEffect(() => {
    setPlayer1_points(
      getTotalPoints(player1_first_column_dices, player1_second_column_dices, player1_third_column_dices),
    )
  }, [
    player1_first_column_dices,
    player1_second_column_dices,
    player1_third_column_dices,
    first_columns_update,
    second_columns_update,
    third_columns_update,
  ])

  useEffect(() => {
    setPlayer2_points(
      getTotalPoints(player2_first_column_dices, player2_second_column_dices, player2_third_column_dices),
    )
  }, [
    player2_first_column_dices,
    player2_second_column_dices,
    player2_third_column_dices,
    first_columns_update,
    second_columns_update,
    third_columns_update,
  ])

  // Verificar condiciones de victoria
  useEffect(() => {
    if (
      player1_first_column_dices.length === 3 &&
      player1_second_column_dices.length === 3 &&
      player1_third_column_dices.length === 3
    ) {
      setWinner(player1_name)
      setGameOver(true)

      if (isHost) {
        socketService.endGame(gameId, Number.parseInt(localStorage.getItem("userId")))
      }
    }

    if (
      player2_first_column_dices.length === 3 &&
      player2_second_column_dices.length === 3 &&
      player2_third_column_dices.length === 3
    ) {
      setWinner(player2_name)
      setGameOver(true)

      if (!isHost) {
        socketService.endGame(gameId, Number.parseInt(localStorage.getItem("userId")))
      }
    }
  }, [
    player1_first_column_dices,
    player1_second_column_dices,
    player1_third_column_dices,
    player2_first_column_dices,
    player2_second_column_dices,
    player2_third_column_dices,
    isHost,
    gameId,
    player1_name,
    player2_name,
  ])

  const changeTurn = () => {
    console.log("🔄 changeTurn llamado - turn actual:", turn, "nuevo turn:", !turn)
    setTurn(!turn)
  }

  const resetGame = () => {
    setPlayer1_points(0)
    setPlayer2_points(0)
    setPlayer1_first_column_dices([])
    setPlayer1_second_column_dices([])
    setPlayer1_third_column_dices([])
    setPlayer2_first_column_dices([])
    setPlayer2_second_column_dices([])
    setPlayer2_third_column_dices([])
    setTurn(true)
    setCup_position(CUP_PLAYER1_POSITION)
    setDice(null) // Resetear a null
    setDiceError(null)
    setFirst_columns_update(false)
    setSecond_columns_update(false)
    setThird_columns_update(false)
    setWinner(null)
    setGameOver(false)
    setLastPlayId(0)
    setIsProcessingLocalMove(false)
    setIsLoadingDice(false)
    lastAddedDice.current = {
      player1: { col1: null, col2: null, col3: null },
      player2: { col1: null, col2: null, col3: null },
    }
    // Obtener nuevo dado del servidor al reiniciar
    if (isMyTurn()) {
      getNewDiceFromServer().catch((error) => {
        console.error("❌ Error al obtener dado en reset:", error)
      })
    }
  }

  // Función para actualizar una columna y registrar el último dado añadido
  const updateColumnWithDice = (columnSetter, currentColumn, diceFace, playerKey, colKey) => {
    console.log(`🎯 Actualizando columna ${colKey} del ${playerKey} con dado:`, diceFace)

    // Actualizar la columna con el dado específico (no generar uno nuevo)
    columnSetter((prev) => {
      const newColumn = [...prev, diceFace]
      // Registrar el último dado añadido para esta columna
      lastAddedDice.current[playerKey][colKey] = diceFace
      console.log(`✅ Columna ${colKey} actualizada:`, newColumn)
      return newColumn
    })
  }

  // Función para procesar la eliminación de dados del oponente
  const processOpponentDiceRemoval = (diceValue, playerColumnId) => {
    console.log(`🎯 Procesando eliminación de dados: valor ${diceValue}, columna ${playerColumnId}`)

    if (diceValue === undefined || diceValue === null) {
      console.log("🚫 No hay dado para eliminar")
      return
    }

    // Determinar qué columna del oponente debe ser actualizada
    let opponentColumnSetter
    if (playerColumnId === "1" || playerColumnId === "4") {
      opponentColumnSetter = playerColumnId === "1" ? setPlayer2_first_column_dices : setPlayer1_first_column_dices
    } else if (playerColumnId === "2" || playerColumnId === "5") {
      opponentColumnSetter = playerColumnId === "2" ? setPlayer2_second_column_dices : setPlayer1_second_column_dices
    } else if (playerColumnId === "3" || playerColumnId === "6") {
      opponentColumnSetter = playerColumnId === "3" ? setPlayer2_third_column_dices : setPlayer1_third_column_dices
    }

    // Eliminar los dados del oponente
    if (opponentColumnSetter) {
      opponentColumnSetter((prev) => {
        const newColumn = removeDices(prev, diceValue)
        console.log(`✂️ Eliminando dados ${diceValue} de la columna ${playerColumnId}:`, {
          antes: prev,
          después: newColumn,
          eliminados: prev.length - newColumn.length,
        })
        return newColumn
      })

      // Forzar actualización de puntos
      if (playerColumnId === "1" || playerColumnId === "4") {
        setFirst_columns_update((prev) => !prev)
      } else if (playerColumnId === "2" || playerColumnId === "5") {
        setSecond_columns_update((prev) => !prev)
      } else if (playerColumnId === "3" || playerColumnId === "6") {
        setThird_columns_update((prev) => !prev)
      }
    }
  }

  // Función para reintentar obtener dado del servidor
  const retryGetDice = async () => {
    try {
      await getNewDiceFromServer()
    } catch (error) {
      console.error("❌ Error al reintentar obtener dado:", error)
    }
  }

  const handleDragEnd = async (event) => {

    const { active, over } = event
    const diceFace = active.data.current?.face; // Obtener el valor del dado arrastrado
    console.log("DADO ARRASTRAO DE LAS NARICES:", diceFace)
    console.log("DADO PA ENVIAR:", diceToSend.current)
    if (diceFace !== diceToSend.current) {
      console.error("Discrepancia entre dado arrastrado y dado del cup");
      return;
    }

    console.log("🎯 handleDragEnd llamado")
    console.log("🎯 Estado actual:", { turn, isHost, isMyTurn: isMyTurn(), currentDice: dice })

    // Verificar que tenemos un dado válido del servidor
    if (dice === null || dice === undefined) {
      console.error("🚫 No hay dado válido del servidor para realizar la jugada")
      return
    }

    if (!over || over.data.current.size >= 3) {
      console.log("🚫 Movimiento cancelado - columna llena o destino inválido")
      return
    }

    if (active.id === over.id) {
      console.log("🚫 Movimiento cancelado - mismo origen y destino")
      return
    }

    const columnId = over.id

    // VALIDAR que el dado que se está arrastrando es el mismo que está en el cup
    if (diceFace !== dice) {
      console.error("🚫 Error: El dado arrastrado no coincide con el dado del cup", {
        diceFace,
        cupDice: dice,
      })
      return
    }

    console.log("🎲 Realizando jugada:", { column: columnId, dice: diceFace, cupDice: dice })

    // Marcar que estamos procesando una jugada local
    setIsProcessingLocalMove(true)

    // Limpiar el dado actual para evitar que se use de nuevo
    setDice(null)

    // CAMBIAR EL TURNO INMEDIATAMENTE para desactivar el cup
    console.log("🔄 Cambiando turno inmediatamente")
    changeTurn()

    try {
      // Actualizar el tablero local SOLO con el dado actual del cup
      if (!turn) {
        // Nota: usamos !turn porque ya cambiamos el turno
        // Era turno del host (player1) antes del cambio
        if (columnId === "1") {
          updateColumnWithDice(setPlayer1_first_column_dices, player1_first_column_dices, dice, "player1", "col1")
          processOpponentDiceRemoval(dice, "1")
        } else if (columnId === "2") {
          updateColumnWithDice(setPlayer1_second_column_dices, player1_second_column_dices, dice, "player1", "col2")
          processOpponentDiceRemoval(dice, "2")
        } else if (columnId === "3") {
          updateColumnWithDice(setPlayer1_third_column_dices, player1_third_column_dices, dice, "player1", "col3")
          processOpponentDiceRemoval(dice, "3")
        }
      } else {
        // Era turno del guest (player2) antes del cambio
        if (columnId === "4") {
          updateColumnWithDice(setPlayer2_first_column_dices, player2_first_column_dices, dice, "player2", "col1")
          processOpponentDiceRemoval(dice, "4")
        } else if (columnId === "5") {
          updateColumnWithDice(setPlayer2_second_column_dices, player2_second_column_dices, dice, "player2", "col2")
          processOpponentDiceRemoval(dice, "5")
        } else if (columnId === "6") {
          updateColumnWithDice(setPlayer2_third_column_dices, player2_third_column_dices, dice, "player2", "col3")
          processOpponentDiceRemoval(dice, "6")
        }
      }

      // Enviar la jugada al servidor usando el dado que acabamos de usar
      console.log("📡 Enviando jugada al servidor con dado del cup:", diceFace)

      // Intentar por WebSocket primero
      socketService.makePlay(gameId, diceToSend.current, columnId)
      console.log("✅ Jugada enviada via WebSocket")

      // También enviar por API como backup
      await gameService.makePlay(gameId, diceToSend.current, columnId)
      console.log("✅ Jugada enviada via API")

      // SOLO después de enviar exitosamente, obtener un nuevo dado para el siguiente turno
      console.log("🎲 Obteniendo nuevo dado para el siguiente turno...")
      setTimeout(async () => {
        try {
          if (isMyTurn()) {
            await getNewDiceFromServer()
            console.log("✅ Nuevo dado obtenido para el siguiente turno")
          }
        } catch (error) {
          console.error("❌ Error al obtener nuevo dado:", error)
        }
      }, 1000) // Esperar 1 segundo antes de obtener el nuevo dado
    } catch (error) {
      console.error("❌ Error al enviar jugada:", error)
      // Si hay error, revertir el cambio de turno
      changeTurn()
      // Restaurar el dado
      setDice(diceFace)
    } finally {
      // Permitir sincronización nuevamente después de un breve delay
      setTimeout(() => {
        setIsProcessingLocalMove(false)
      }, 2000)
    }
  }

  const canMakeMove = () => {
    // No permitir movimientos si estamos procesando una jugada o cargando dado
    if (isProcessingLocalMove || isLoadingDice || dice === null || diceError) {
      return false
    }

    return isMyTurn()
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative w-full h-screen flex flex-col justify-center items-center">
        <CloseButton />

        {/* Debug info en pantalla */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <p>GameID: {gameId}</p>
          <p>Is Host: {isHost.toString()}</p>
          <p>Turn: {turn.toString()}</p>
          <p>Is My Turn: {isMyTurn().toString()}</p>
          <p>Can Move: {canMakeMove().toString()}</p>
          <p>Socket: {socketService.isConnected ? "Connected" : "Disconnected"}</p>
          <p>Last Play ID: {lastPlayId}</p>
          <p>Processing Local: {isProcessingLocalMove.toString()}</p>
          <p>Loading Dice: {isLoadingDice.toString()}</p>
          <p>Current Dice: {dice || "NULL"}</p>
          <p>Dice Error: {diceError ? "YES" : "NO"}</p>
          <p>Token: {localStorage.getItem("token") ? "✅" : "❌"}</p>
          <p>
            P1 Dices: [{player1_first_column_dices.length}, {player1_second_column_dices.length},{" "}
            {player1_third_column_dices.length}]
          </p>
          <p>
            P2 Dices: [{player2_first_column_dices.length}, {player2_second_column_dices.length},{" "}
            {player2_third_column_dices.length}]
          </p>
          <p>P1 Points: {player1_points}</p>
          <p>P2 Points: {player2_points}</p>
        </div>

        {/* Board superior (Guest/Jugador 2) */}
        <div className="mb-[1%]">
          <Board
            id={IDS_BOARD2}
            enabled={board2_enabled}
            dice={player2_hookDice}
            first_column_dices={player2_first_column_dices}
            setFirst_column_dices={setPlayer2_first_column_dices}
            second_column_dices={player2_second_column_dices}
            setSecond_column_dices={setPlayer2_second_column_dices}
            third_column_dices={player2_third_column_dices}
            setThird_column_dices={setPlayer2_third_column_dices}
            opponent_first_column={player1_first_column_dices}
            opponent_second_column={player1_second_column_dices}
            opponent_third_column={player1_third_column_dices}
            owner={false}
            first_columns_update={first_columns_update}
            second_columns_update={second_columns_update}
            third_columns_update={third_columns_update}
          />
        </div>

        <p>{player2_name}</p>
        <p className="font-extrabold">{player2_points}</p>

        <div className="text-center my-2">
          <p className={`font-bold ${canMakeMove() ? "text-green-600" : "text-gray-500"}`}>
            {isMyTurn() ? "Tu turno" : "Turno del oponente"}
          </p>
          {isProcessingLocalMove && <p className="text-yellow-600 text-sm">Procesando jugada...</p>}
          {isLoadingDice && <p className="text-blue-600 text-sm">Obteniendo dado del servidor...</p>}
          {diceError && (
            <div className="text-red-600 text-sm">
              <p>Error: {diceError}</p>
              <button
                onClick={retryGetDice}
                className="mt-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Reintentar
              </button>
            </div>
          )}
          {dice === null && !isLoadingDice && !diceError && isMyTurn() && (
            <p className="text-orange-600 text-sm">Esperando dado del servidor...</p>
          )}
        </div>

        <p className="font-extrabold">{player1_points}</p>
        <p>{player1_name}</p>

        {/* Board inferior (Host/Jugador 1) */}
        <div className="mt-[1%]">
          <Board
            id={IDS_BOARD1}
            enabled={board1_enabled}
            dice={player1_hookDice}
            first_column_dices={player1_first_column_dices}
            setFirst_column_dices={setPlayer1_first_column_dices}
            second_column_dices={player1_second_column_dices}
            setSecond_column_dices={setPlayer1_second_column_dices}
            third_column_dices={player1_third_column_dices}
            setThird_column_dices={setPlayer1_third_column_dices}
            opponent_first_column={player2_first_column_dices}
            opponent_second_column={player2_second_column_dices}
            opponent_third_column={player2_third_column_dices}
            owner={true}
            first_columns_update={first_columns_update}
            second_columns_update={second_columns_update}
            third_columns_update={third_columns_update}
          />
        </div>

        <div className={cup_position}>
          <div
            className={
              !canMakeMove() || isProcessingLocalMove || isLoadingDice || dice === null || diceError
                ? "opacity-50 pointer-events-none"
                : ""
            }
          >
            {dice !== null ? (
              <Cup id={CUP_IP} face={dice} />
            ) : (
              <div className="inline-flex justify-center items-center p-9 border-2 border-black rounded-xl bg-gray-200">
                <div className="text-gray-500">?</div>
              </div>
            )}
            {isLoadingDice && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>

        {gameOver && <MessageDialog winner={winner} reset={resetGame} p1={player1_points} p2={player2_points} />}
      </div>
    </DndContext>
  )
}

export default OnlineTable
