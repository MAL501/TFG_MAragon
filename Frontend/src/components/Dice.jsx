import React from 'react';
import '../styles/dices.css'; // Asegúrate de importar tu CSS

const Dice = ({ face }) => {
  // Convertir face a número si es una cadena
  const faceNumber = Number(face);

  const renderDots = () => {
    switch (faceNumber) {
      case 1:
        return (
          <div className="dice">
            <div className="face one">
              <span></span>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="dice">
            <div className="face two">
              <span></span>
              <span></span>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="dice">
            <div className="face three">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="dice">
            <div className="face four">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="dice">
            <div className="face four">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="dice">
            <div className="face six">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        );
      default:
        console.error("Cara no válida:", faceNumber);
        return null; 
    }
  };

  return renderDots();
};

export default Dice;