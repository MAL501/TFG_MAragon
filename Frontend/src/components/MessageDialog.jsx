import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const MessageDialog = ({ winner, reset, p1, p2 }) => {
    const dialogRef = useRef(null);
    let winnerScore = p1>p2 ? p1 : p2;
    useEffect(() => {
        if (winner) {
            dialogRef.current.showModal();
            // Forzar reset de estilos por si hay herencia no deseada
            dialogRef.current.style.position = 'fixed';
            dialogRef.current.style.top = '0';
            dialogRef.current.style.left = '0';
            dialogRef.current.style.right = '0';
            dialogRef.current.style.bottom = '0';
        }
    }, [winner]);

    return (
        <dialog
            ref={dialogRef}
            className="fixed top-0 left-0 w-full h-full bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 border-none overflow-hidden"
            style={{
                display: winner ? 'block' : 'none', // Alternativa para navegadores antiguos
                margin: 0,
                zIndex: 9999
            }}
        >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[600px] bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
                <p className="mb-4 text-2xl font-bold">¡Ganó {winner}!</p>
                <p className="mb-6 text-lg">Puntos: {winnerScore}</p>
                
                <div className="flex gap-4">
                    <Link
                        to="/"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Menú Principal
                    </Link>
                    <button
                        onClick={reset}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                    >
                        Volver a Jugar
                    </button>
                </div>
            </div>
        </dialog>
    );
};

export default MessageDialog;