import React, { useEffect, useRef, useState } from 'react';
import { getInstructions } from '../services/instructionService';
import GameExample1 from '../assets/GameExample1.png';
import GameExample2 from '../assets/GameExample2.png';
import GameExample3 from '../assets/GameExample3.png';

// Constantes para los estilos
const dialogStyle = "fixed top-0 left-0 w-full h-full bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm p-0 border-none overflow-hidden";
const dialogContainerStyle = "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[600px] bg-white rounded-lg shadow-xl p-8 flex flex-col items-center relative";
const buttonStyle = "bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition";
const closeButtonStyle = "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors mt-4";
const navigationButtonStyle = "absolute top-1/2 transform -translate-y-1/2";

const exampleImages = [GameExample1, GameExample2, GameExample3];

const InstructionsDialog = ({ open, setOpen }) => {
    const dialogRef = useRef(null);
    //Este useState tiene como objetivo almacenar las instrucciones en le idioma del jugador
    //TODO: Implementar una función para obtener el idioma del navegador del jugador
    const [instructions, setInstructions] = useState([]);
    //Este useState tiene como objetivo llevar el control de la página en la que se encuentra el usuario
    const [currentIndex, setCurrentIndex] = useState(0); 
    // Idioma (1: Español, 2: Inglés, 3: Alemán)
    const language = 1; 

    useEffect(() => {
        if (open) {
            dialogRef.current.showModal();
            dialogRef.current.style.position = 'fixed';
            dialogRef.current.style.top = '0';
            dialogRef.current.style.left = '0';
            dialogRef.current.style.right = '0';
            dialogRef.current.style.bottom = '0';

            // Carga las instrucciones al abrir el diálogo
            const loadInstructions = async () => {
                try {
                    console.log("getInstructions", language);
                    const loadedInstructions = await getInstructions(language);
                    setInstructions(loadedInstructions);
                } catch (error) {
                    console.error("Error al cargar las instrucciones:", error);
                    setInstructions(["Error al cargar las instrucciones"]);
                }
            };
            
            loadInstructions();
        } else {
            dialogRef.current.close();
        }
    }, [open, language]);

    const handleClose = () => {
        setOpen(false); 
    };

    const handleNext = () => {
        if (currentIndex < instructions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1); 
        }
    };

    return (
        <dialog
            ref={dialogRef}
            className={dialogStyle}
            style={{
                display: open ? 'block' : 'none',
                margin: 0,
                zIndex: 9999
            }}
        >
            <div className={dialogContainerStyle}>
                {/* Botón para retroceder */}
                <button
                    onClick={handlePrevious}
                    className={`${navigationButtonStyle} left-4 ${buttonStyle}`}
                    disabled={currentIndex === 0} 
                >
                    {"<"}
                </button>

                {/* Título del diálogo */}
                <h2 className="text-2xl font-bold mb-4">Instrucciones</h2>

                {/* Texto de la instrucción actual */}
                <p className="text-justify mb-4">
                    {instructions[currentIndex] || "Cargando instrucciones..."}
                </p>

                {/* Imagen de ejemplo correspondiente */}
                {instructions.length > 0 && currentIndex < exampleImages.length && (
                    <img
                        src={exampleImages[currentIndex]}
                        alt={`Ejemplo del juego ${currentIndex + 1}`}
                        className="w-full max-w-[400px] h-[200px] object-contain rounded-lg mb-4"
                    />
                )}

                {/* Botón para avanzar */}
                <button
                    onClick={handleNext}
                    className={`${navigationButtonStyle} right-4 ${buttonStyle}`}
                    disabled={currentIndex === instructions.length - 1}
                >
                    {">"}
                </button>

                {/* Contador de instrucciones */}
                <div className="text-sm text-gray-500 mt-2">
                    {instructions.length > 0 ? `${currentIndex + 1}/${instructions.length}` : "0/0"}
                </div>

                {/* Botón para cerrar el diálogo */}
                <button
                    onClick={handleClose}
                    className={closeButtonStyle}
                >
                    Cerrar
                </button>
            </div>
        </dialog>
    );
};

export default InstructionsDialog;