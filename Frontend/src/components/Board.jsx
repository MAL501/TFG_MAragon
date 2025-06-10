import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import "../styles/dices.css";
import { useDroppable } from '@dnd-kit/core';
import { pointsColumn } from '../services/diceService'; 
import Column from './Column';

// Constantes para las clases de Tailwind
const boardContainer = "w-72 h-72 grid grid-cols-3 gap-x-2 bg-white border-4 border-black p-2 rounded-xl";

const Board = ({
  enabled,
  id,
  dice,
  first_column_dices,
  setFirst_column_dices,
  second_column_dices,
  setSecond_column_dices,
  third_column_dices,
  setThird_column_dices,
  opponent_first_column,
  opponent_second_column,
  opponent_third_column,
  owner,
  first_columns_update,
  second_columns_update,
  third_columns_update,
}) => {
  //Cada uno de estos estados almacena los puntos totales de su columna
  const [first_column, setFirst_column] = useState(0);
  const [second_column, setSecond_column] = useState(0);
  const [third_column, setThird_column] = useState(0);
  // Controlamos a que jugador pertenece el tablero
  const [boardOwner, setBoardOwner] = useState(owner);
  //Este useffect tiene como objetivo añadir los dados a la columna dónde se
  // "droppea" un dado
  useEffect(() => {
    switch (dice.column_id) {
      case id[0]:
        setFirst_column_dices((prev) => [...prev, dice.face]);
        break;
      case id[1]:
        setSecond_column_dices((prev) => [...prev, dice.face]);
        break;
      case id[2]:
        setThird_column_dices((prev) => [...prev, dice.face]);
        break;
      default:
        break;
    }
  }, [dice]);
  //Estos useEffects tienen como objetivos actualizar los puntos de cada columna
  //cuando sea necesario
  useEffect(() => {
      setFirst_column(pointsColumn(first_column_dices));
  }, [first_column_dices, opponent_first_column, first_columns_update]);

  useEffect(() => {
    setSecond_column(pointsColumn(second_column_dices));
  }, [second_column_dices, opponent_second_column, second_columns_update]);

  useEffect(() => {
    setThird_column(pointsColumn(third_column_dices));
  }, [third_column_dices, opponent_third_column, third_columns_update]);

  const { setNodeRef: setFirstColumnRef } = useDroppable({
    id: id[0],
    disabled: enabled,
    data: {
      size: first_column_dices.length,
    },
  });
  const { setNodeRef: setSecondColumnRef } = useDroppable({
    id: id[1],
    disabled: enabled,
    data: {
      size: second_column_dices.length,
    },
  });
  const { setNodeRef: setThirdColumnRef } = useDroppable({
    id: id[2],
    disabled: enabled,
    data: {
      size: third_column_dices.length,
    },
  });


  return (
    <div className={boardContainer}>
      <Column owner={boardOwner} points={first_column} setNodeRef={setFirstColumnRef} dice={first_column_dices} />
      <Column owner={boardOwner} points={second_column} setNodeRef={setSecondColumnRef} dice={second_column_dices} />
      <Column owner={boardOwner} points={third_column} setNodeRef={setThirdColumnRef} dice={third_column_dices} />
    </div>
  );
};



export default Board;