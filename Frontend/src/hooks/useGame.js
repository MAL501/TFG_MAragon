import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { gameService } from '../services/gameService';

export const useGame = (gameId) => {
  const [gameState, setGameState] = useState({
    game: null,
    isHost: false,
    opponentName: null,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    plays: [],
    currentTurn: null,
    isMyTurn: false
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { socketService, isConnected } = useSocket();

  // Cargar información inicial del juego
  const loadGameData = useCallback(async () => {
    if (!gameId) return;
    
    try {
      setLoading(true);
      const gameData = await gameService.getGame(gameId);
      const playsData = await gameService.getGamePlays(gameId);
      
      setGameState(prev => ({
        ...prev,
        game: gameData.game,
        plays: playsData.plays,
        gameStarted: !!gameData.game.guest_user,
        gameEnded: !!gameData.game.ended_at,
        winner: gameData.game.winner
      }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Unirse a la sala de WebSocket
  const joinGameRoom = useCallback(() => {
    if (isConnected && gameId) {
      socketService.joinGame(gameId);
    }
  }, [isConnected, gameId, socketService]);

  // Configurar listeners de WebSocket
  useEffect(() => {
    if (!isConnected || !socketService) return;

    // Listener: Información de la partida al unirse
    socketService.onGameJoined((data) => {
      console.log('Game joined:', data);
      setGameState(prev => ({
        ...prev,
        isHost: data.isHost,
        opponentName: data.opponentName,
        gameStarted: data.gameStarted,
        gameEnded: data.gameEnded,
        winner: data.winner
      }));
    });

    // Listener: Partida iniciada (se unió el segundo jugador)
    socketService.onGameStarted((data) => {
      console.log('Game started:', data);
      setGameState(prev => ({
        ...prev,
        opponentName: data.opponentName,
        gameStarted: true
      }));
    });

    // Listener: Jugada realizada
    socketService.onPlayMade((data) => {
      console.log('Play made:', data);
      setGameState(prev => ({
        ...prev,
        plays: [...prev.plays, data],
        currentTurn: data.userId,
        isMyTurn: data.userId !== parseInt(localStorage.getItem('userId'))
      }));
    });

    // Listener: Partida finalizada
    socketService.onGameEnded((data) => {
      console.log('Game ended:', data);
      setGameState(prev => ({
        ...prev,
        gameEnded: true,
        winner: data.winnerId
      }));
    });

    // Listener: Errores
    socketService.onError((error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    // Unirse a la sala cuando esté conectado
    joinGameRoom();

    // Cleanup: remover listeners al desmontar
    return () => {
      // Los listeners se limpian automáticamente cuando se desconecta el socket
    };
  }, [isConnected, socketService, joinGameRoom]);

  // Cargar datos iniciales
  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Funciones para interactuar con el juego
  const makePlay = useCallback(async (dice, column) => {
    try {
      // Registrar en la base de datos
      await gameService.makePlay(gameId, dice, column);
      
      // Emitir por WebSocket
      socketService.makePlay(gameId, dice, column);
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [gameId, socketService]);

  const endGame = useCallback(async (winnerId) => {
    try {
      // Actualizar en la base de datos
      await gameService.endGame(gameId, winnerId);
      
      // Emitir por WebSocket
      socketService.endGame(gameId, winnerId);
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [gameId, socketService]);

  return {
    gameState,
    loading,
    error,
    makePlay,
    endGame,
    refreshGame: loadGameData
  };
};