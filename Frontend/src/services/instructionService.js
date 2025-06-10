const API_URL = "#"; 

// instructionService.js
export const getInstructions = async (language) => {
    if (language < 1 || language > 3) {
        throw new Error("El idioma debe ser un número entre 1 y 3.");
    }

    try {
        // Importación específica para Vite
        const response = await fetch(new URL('../assets/lenguajes/instructions.txt', import.meta.url));
        
        if (!response.ok) throw new Error("No se pudo cargar el archivo.");
        
        const text = await response.text();
        
        return text
            .split("\n")
            .filter(line => line.trim() !== "")
            .map(line => line.split(";")[language - 1]) // Ajuste a índice 0-based
            .filter(Boolean);
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};