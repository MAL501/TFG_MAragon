import React from 'react';
import PropTypes from 'prop-types';
import Dice from './Dice';

// Constantes para las clases de Tailwind
const columnStyle = "flex flex-col";
const cellStyle = "inline-flex justify-center items-center p-9 border-2 border-black rounded-xl cursor-grab active:cursor-grabbing bg-white-100 shadow-md mb-[5%]"; // Estilos actualizados
const pointsTextStyle = "text-center mb-2 text-lg font-bold"; // Estilo para el texto de puntos

const Column = ({ points, setNodeRef, dice, owner }) => {
  // Si el tablero pertenece al jugador 2, invertimos la dirección de la columna
  const columnStyle = owner
    ? "flex flex-col" // Jugador 1: de arriba a abajo
    : "flex flex-col-reverse"; // Jugador 2: de abajo a arriba

  return (
    <div>
      {owner && <p className={pointsTextStyle}>{points}</p>} {/* Texto de puntos para el jugador 1 */}
      <div ref={setNodeRef} className={columnStyle}>
        {dice.map((face, index) => (
          <div key={index} className={cellStyle}>
            {face && <Dice face={face} />} {/* Renderiza el dado si existe */}
          </div>
        ))}
        {/* Rellenar las celdas vacías si es necesario */}
        {dice.length < 3 &&
          Array.from({ length: 3 - dice.length }).map((_, index) => (
            <div key={`empty-${index}`} className={cellStyle} />
          ))}
      </div>
      {!owner && <p className={pointsTextStyle}>{points}</p>} {/* Texto de puntos para el jugador 2 */}
    </div>
  );
};

Column.propTypes = {
  id: PropTypes.string.isRequired, // Identificador de la columna
  points: PropTypes.number.isRequired, // Puntuación de la columna
  setNodeRef: PropTypes.func.isRequired, // Función para establecer la referencia del área droppable
  dice: PropTypes.arrayOf(PropTypes.number), // Array de dados en la columna
};

export default Column;