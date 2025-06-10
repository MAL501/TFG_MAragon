"use client"

import { useEffect, useState, useCallback } from "react"
import "../styles/cup.css"
import Cup from "./Cup"
import Board from "./Board"
import CloseButton from "./CloseButton"
import MessageDialog from "./MessageDialog"
import { getDice, pointsColumn } from "../services/diceService"
import { DndContext } from "@dnd-kit/core"
import { useParams, useNavigate } from "react-router-dom"
import { socketService } from "../services/socketService"
import { gameService } from "../services/gameService"
import { removeDices } from "../services/diceService"

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
  const [dice, setDice] = useState(1)

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
    } catch (error) {
      console.error("❌ Error al cargar datos del juego:", error)
    }
  }, [gameId])

  // Cargar el estado completo del juego desde el servidor
  const loadGameState = useCallback(async () => {
    try {
      console.log("🔄 Cargando estado completo del juego...")
      const gameState = await gameService.getGameState(gameId)

      console.log("📊 Estado del juego recibido:", gameState)

      // Actualizar las columnas con los datos del servidor (ya incluye eliminaciones)
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

      // Actualizar el turno
      const currentUserId = Number.parseInt(localStorage.getItem("userId"))
      if (gameState.currentTurn) {
        const isMyTurn = gameState.currentTurn === currentUserId
        const isHostTurn = gameState.currentTurn === gameState.game.hostUser
        setTurn(isHostTurn)
        console.log("🔄 Turno actualizado:", { isMyTurn, isHostTurn, currentTurn: gameState.currentTurn })
      }

      // Actualizar el contador de jugadas
      if (gameState.plays) {
        setLastPlayId(gameState.plays.length)
      }
    } catch (error) {
      console.error("❌ Error al cargar estado del juego:", error)
    }
  }, [gameId])

  // Polling para sincronizar jugadas usando el endpoint correcto
  const syncGamePlays = useCallback(async () => {
    try {
      console.log("🔄 Sincronizando jugadas...")
      const response = await gameService.getGamePlays(gameId)
      const plays = response.plays || []
      const columns = response.columns || {}

      if (plays.length > lastPlayId) {
        console.log("🆕 Nuevas jugadas detectadas, actualizando estado completo...")

        // Actualizar todas las columnas con los datos del servidor (ya procesados)
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

        // Forzar actualización de puntos
        setFirst_columns_update((prev) => !prev)
        setSecond_columns_update((prev) => !prev)
        setThird_columns_update((prev) => !prev)
      }
    } catch (error) {
      console.error("❌ Error al sincronizar jugadas:", error)
    }
  }, [gameId, lastPlayId])

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
      // Recargar estado completo desde el servidor (ya incluye eliminaciones)
      setTimeout(() => {
        loadGameState()
      }, 300)
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

  useEffect(() => {
    console.log("🔄 Cambio de turno - turn:", turn)
    setCup_position(turn ? CUP_PLAYER1_POSITION : CUP_PLAYER2_POSITION)
    setBoard1_enabled(!turn)
    setBoard2_enabled(turn)
    setDice(getDice())
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
    setDice(1)
    setFirst_columns_update(false)
    setSecond_columns_update(false)
    setThird_columns_update(false)
    setWinner(null)
    setGameOver(false)
    setLastPlayId(0)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    console.log("🎯 handleDragEnd llamado")
    console.log("🎯 Estado actual:", { turn, isHost, canMove: canMakeMove() })

    if (!over || over.data.current.size >= 3) {
      console.log("🚫 Movimiento cancelado - columna llena o destino inválido")
      return
    }

    if (active.id === over.id) {
      console.log("🚫 Movimiento cancelado - mismo origen y destino")
      return
    }

    const columnId = over.id
    const diceFace = active.data.current.face

    console.log("🎲 Realizando jugada:", { column: columnId, dice: diceFace })

    // NO actualizar el tablero local - dejar que el servidor maneje todo
    // Esto evita inconsistencias entre frontend y backend

    // Enviar la jugada al servidor
    console.log("📡 Enviando jugada al servidor...")

    try {
      // Intentar por WebSocket primero
      socketService.makePlay(gameId, diceFace, columnId)
      console.log("✅ Jugada enviada via WebSocket")

      // También enviar por API como backup
      await gameService.makePlay(gameId, diceFace, columnId)
      console.log("✅ Jugada enviada via API")

      // Recargar estado inmediatamente después de enviar
      setTimeout(() => {
        loadGameState()
      }, 200)
    } catch (error) {
      console.error("❌ Error al enviar jugada:", error)
    }

    console.log("🔄 Cambiando turno después de hacer jugada")
    changeTurn()
  }
    //Eliminan los dados del oponente
    useEffect(() => {
        setPlayer2_first_column_dices((prev) => removeDices(prev, player1_first_column_dices[player1_first_column_dices.length - 1]));
        setFirst_columns_update(!first_columns_update);
    }, [player1_first_column_dices]);
    useEffect(() => {
        setPlayer2_second_column_dices((prev) => removeDices(prev, player1_second_column_dices[player1_second_column_dices.length - 1]));
        setSecond_columns_update(!second_columns_update);
    }, [player1_second_column_dices]);

    useEffect(() => {
        setPlayer2_third_column_dices((prev) => removeDices(prev, player1_third_column_dices[player1_third_column_dices.length - 1]));
        setThird_columns_update(!third_columns_update);
    }, [player1_third_column_dices]);

    useEffect(() => {
        setPlayer1_first_column_dices((prev) => removeDices(prev, player2_first_column_dices[player2_first_column_dices.length - 1]));
        setFirst_columns_update(!first_columns_update);
    }, [player2_first_column_dices]);

    useEffect(() => {
        setPlayer1_second_column_dices((prev) => removeDices(prev, player2_second_column_dices[player2_second_column_dices.length - 1]));
        setSecond_columns_update(!second_columns_update);
    }, [player2_second_column_dices]);

    useEffect(() => {
        setPlayer1_third_column_dices((prev) => removeDices(prev, player2_third_column_dices[player2_third_column_dices.length - 1]));
        setThird_columns_update(!third_columns_update);
    }, [player2_third_column_dices]);

  const canMakeMove = () => {
    if (isHost && turn) {
      return true
    }
    if (!isHost && !turn) {
      return true
    }
    return false
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
          <p>Can Move: {canMakeMove().toString()}</p>
          <p>Socket: {socketService.isConnected ? "Connected" : "Disconnected"}</p>
          <p>Last Play ID: {lastPlayId}</p>
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
            {canMakeMove() ? "Tu turno" : "Turno del oponente"}
          </p>
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
          <div className={!canMakeMove() ? "opacity-50 pointer-events-none" : ""}>
            <Cup id={CUP_IP} face={dice} />
          </div>
        </div>

        {gameOver && <MessageDialog winner={winner} reset={resetGame} p1={player1_points} p2={player2_points} />}
      </div>
    </DndContext>
  )
}

export default OnlineTable
