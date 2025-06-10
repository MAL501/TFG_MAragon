import React from 'react';
import { Link } from 'react-router-dom';

const CloseButton = () => {
  return (
    <Link to={'/'}>
      <button className="absolute top-[1%] right-[1%] bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition">
        Cerrar
      </button>
    </Link>
  );
};

export default CloseButton;