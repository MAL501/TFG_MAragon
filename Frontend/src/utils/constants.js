// Variables de entorno para URLs y rutas base
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";
export const APP_BASE_URL = import.meta.env.VITE_APP_BASE_URL || "/Matatena";

export const GAME_STATES = {
  WAITING: "waiting",
  PLAYING: "playing",
  FINISHED: "finished",
}

export const SOCKET_EVENTS = {
  JOIN_GAME: "joinGame",
  MAKE_PLAY: "makePlay",
  END_GAME: "endGame",
  SURRENDER: "surrender",
  GAME_JOINED: "gameJoined",
  GAME_STARTED: "gameStarted",
  PLAY_MADE: "playMade",
  GAME_ENDED: "gameEnded",
  OPPONENT_DISCONNECTED: "opponentDisconnected",
  OPPONENT_RECONNECTED: "opponentReconnected",
  ERROR: "error",
}

export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
}
