import React, { useEffect, useState } from "react";
import '../styles/cup.css';
import Cup from "./Cup";
import Board from "./Board";
import CloseButton from "./CloseButton";
import MessageDialog from "./MessageDialog";
import { getDice, pointsColumn, removeDices } from "../services/diceService";
import {DndContext} from '@dnd-kit/core';


const Table = () => {
//--------------------Variables del jugador----------------------
    //Controlan los puntos de cada jugador
    const [player1_points, setPlayer1_points] = useState(0);
    const [player2_points, setPlayer2_points] = useState(0);
    //Nombres de los jugadores
    const [player1_name, setPlayer1_name] = useState("Jugador 1");
    const [player2_name, setPlayer2_name] = useState("Jugador 2");

//--------------------Variables del cubilete----------------------
    const CUP_IP = 0;

    //Posiciones del cubilete	
    const CUP_PLAYER2_POSITION = "cup-player2";
    const CUP_PLAYER1_POSITION = "cup-player1";

    //Indica quién debe tener el cubilete
    const [cup_position, setCup_position]=useState(CUP_PLAYER1_POSITION);
    
    //Dado que se usa
    const [dice, setDice] = useState(1);
//--------------------Variables del tablero----------------------
    //Controla el turno del jugador
    const [turn,setTurn] = useState(true);
    //Nos indica la columna dónde el jugador deja el dado y
    //el valor del dado
    const [player1_hookDice, setPlayer1_hookDice] = useState({
        column_id: 0,
        face: 0
    });

    const [player2_hookDice, setPlayer2_hookDice] = useState({
        column_id: 0,
        face: 0
    });

    //Cada uno de estos estados almacena todos los dados de su columna
    const [player1_first_column_dices, setPlayer1_first_column_dices] = useState([]);
    const [player1_second_column_dices, setPlayer1_second_column_dices] = useState([]);
    const [player1_third_column_dices, setPlayer1_third_column_dices] = useState([]);

    const [player2_first_column_dices, setPlayer2_first_column_dices] = useState([]);
    const [player2_second_column_dices, setPlayer2_second_column_dices] = useState([]);
    const [player2_third_column_dices, setPlayer2_third_column_dices] = useState([]);

    //IDs que necesitan los tableros para poder 
    //"Droppear" los dados en las columnas
    const IDS_BOARD1 = ["1","2","3"];
    const IDS_BOARD2 = ["4","5","6"];

    //Indican si se deben actualizar o no los puntos de las columnas
    const [first_columns_update, setFirst_columns_update] = useState(false);
    const [second_columns_update, setSecond_columns_update] = useState(false);
    const [third_columns_update, setThird_columns_update] = useState(false);

    //Nos permite poder, o no, usar el tablero según el turno
    let [board1_enabled, setBoard1_enabled] = useState(true);
    let [board2_enabled, setBoard2_enabled] = useState(false);
    
    const [winner, setWinner] = useState(null); // Estado para el ganador
    const [gameOver, setGameOver] = useState(false); // Estado para indicar si la partida terminó
    //Esta función tiene como objetivo calcular el total de puntos de un jugador
    //Recibe como parámetros cada una de sus columnas y devuelve el sumatorio de los puntos
    const getTotalPoints = (column1,column2,column3) => {
        let ret=0;
        ret += pointsColumn(column1);
        ret += pointsColumn(column2);
        ret += pointsColumn(column3);
        console.log(ret);
        return ret;
    }

    /**
     * Cuando turn sea true, será el turno del host o jugador 1
     * Cuando turn sea false, será el turno del guest o el jugador 2
     */
    useEffect(() =>{
        setCup_position(turn ? CUP_PLAYER1_POSITION : CUP_PLAYER2_POSITION);
        setBoard1_enabled(!turn);
        setBoard2_enabled(turn);
        setDice(getDice());
    },[turn]);
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
    //El siguiente useEffect controla los puntos de cada jugador
    useEffect(() => {
        //Calculamos los puntos de cada jugador
        setPlayer1_points(player1_first_column_dices.length + player1_second_column_dices.length + player1_third_column_dices.length);
        setPlayer2_points(player2_first_column_dices.length + player2_second_column_dices.length + player2_third_column_dices.length);
    }, [player1_first_column_dices, player1_second_column_dices, player1_third_column_dices, player2_first_column_dices, player2_second_column_dices, player2_third_column_dices]);

    //El siguiente useEffect tiene como objetivo mostrar un dialog cuando cualquiera de los dos jugadores gane
    useEffect(() => {
        setPlayer1_points(getTotalPoints(player1_first_column_dices, player1_second_column_dices, player1_third_column_dices));
        setPlayer2_points(getTotalPoints(player2_first_column_dices, player2_second_column_dices, player2_third_column_dices));
        if (
            player1_first_column_dices.length === 3 &&
            player1_second_column_dices.length === 3 &&
            player1_third_column_dices.length === 3
        ) {
            setWinner("Jugador 1");
            setGameOver(true); // Marca la partida como terminada
        }

        if (
            player2_first_column_dices.length === 3 &&
            player2_second_column_dices.length === 3 &&
            player2_third_column_dices.length === 3
        ) {
            setWinner("Jugador 2");
            setGameOver(true); // Marca la partida como terminada
        }
    }, [player1_points, player2_points]);

    
    const changeTurn = () =>{
        setTurn(!turn);
    }

    const resetGame = () => {
        // Reinicia los puntos de los jugadores
        setPlayer1_points(0);
        setPlayer2_points(0);

        // Reinicia los dados en las columnas
        setPlayer1_first_column_dices([]);
        setPlayer1_second_column_dices([]);
        setPlayer1_third_column_dices([]);
        setPlayer2_first_column_dices([]);
        setPlayer2_second_column_dices([]);
        setPlayer2_third_column_dices([]);

        // Reinicia el turno al jugador 1
        setTurn(true);

        // Reinicia el cubilete y el dado
        setCup_position(CUP_PLAYER1_POSITION);
        setDice(1);

        // Reinicia los estados de actualización de columnas
        setFirst_columns_update(false);
        setSecond_columns_update(false);
        setThird_columns_update(false);

        // Reinicia el estado del ganador y el estado del juego
        setWinner(null);
        setGameOver(false);
    };

    const handleDragEnd = (event) => {
        const {active, over} = event;
        //Si no se suelta en ninguna columna o
        //la columna está llena, entonces no se hace nada
        if(!over || over.data.current.size >= 3){
            return;
        }
        // Si el dado se suelta fuera de la tabla, no se hace nada
        if(active.id === over.id){
            return;
        }
        turn ? setPlayer1_hookDice({
            column_id: over.id,
            face: active.data.current.face
        }) : setPlayer2_hookDice({
            column_id: over.id,
            face: active.data.current.face
        });
        changeTurn();
    }
    useEffect(() => {
        // Este código solo se ejecuta en el cliente
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
        setPlayer1_name(storedUsername);
        }
    }, []); // Array vacío = solo se ejecuta una vez al montar
    return (
        <DndContext onDragEnd={handleDragEnd}>
            <div className="relative w-full h-screen flex flex-col justify-center items-center">
                <CloseButton />
                {/* Board superior (Guest) */}
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
                <p className="font-extrabold">{player1_points}</p>
                <p>{player1_name}</p>
                {/* Board inferior (Host) */}
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
                        firfirst_columns_update={first_columns_update}
                        second_columns_update={second_columns_update}
                        third_columns_update={third_columns_update}
                    />
                </div>

                <div className={cup_position}>
                    <Cup id={CUP_IP} face={dice}/>
                </div>

                {/* Mostrar el diálogo solo si la partida terminó */}
                {gameOver && <MessageDialog winner={winner} reset={resetGame} p1={player1_points} p2={player2_points}/>}
            </div>
        </DndContext>
    );
};

export default Table;
