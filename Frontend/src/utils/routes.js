import { APP_BASE_URL } from './constants';

export const getRoute = (path) => {
  // Asegurar que el path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE_URL}${cleanPath}`;
};

// Rutas específicas de la aplicación
export const ROUTES = {
  HOME: getRoute('/'),
  
  LOGIN: getRoute('/login'),
  REGISTER: getRoute('/register'),
  
  PLAY_LOCAL: getRoute('/play'),
  GAME: (gameId) => getRoute(`/game/${gameId}`),
  WAITING_ROOM: (gameId) => getRoute(`/waiting-room/${gameId}`),
  
  RANKING: getRoute('/ranking'),
  INSTRUCTIONS: getRoute('/instructions'),
  
  DYNAMIC: {
    game: (gameId) => getRoute(`/game/${gameId}`),
    waitingRoom: (gameId) => getRoute(`/waiting-room/${gameId}`)
  }
};

export const navigateToRoute = (navigate, route) => {
  navigate(route);
};

export const redirectToRoute = (route) => {
  window.location.href = route;
};