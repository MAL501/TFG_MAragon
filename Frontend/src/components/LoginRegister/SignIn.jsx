import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const inputStyle = "w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400";
const buttonStyle = "w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
const errorStyle = "text-red-500 text-sm mb-2 text-center";

/**
 * Expresión regular para que la contraseña sea válida:
 * - Al menos 8 caracteres
 * - Al menos una letra minúscula
 * - Al menos una letra mayúscula
 * - Al menos un número
 * - Al menos un carácter especial (como !@#$%^&*...)
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const validateForm = () => {
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.');
      return false;
    }
    
    if (!passwordRegex.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, una minúscula, una mayúscula, un número y un carácter especial.');
      return false;
    }
    
    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(username, password);
      
      if (result.success) {
        setSuccess('Registro exitoso. Redirigiendo...');
        setUsername('');
        setPassword('');
        setRepeatPassword('');
        
        
      } else {
        setError(result.error || 'Error en el registro');
      }
    } catch (error) {
      setError('Error inesperado en el registro');
      console.error('Error en el registro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6 text-center">Registro</h2>
      
      {error && <div className={errorStyle}>{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2 text-center">{success}</div>}
      
      <input
        className={inputStyle}
        type="text"
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        disabled={isLoading}
        minLength={3}
        required
      />
      
      <input
        className={inputStyle}
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      
      <input
        className={inputStyle}
        type="password"
        placeholder="Repite la contraseña"
        value={repeatPassword}
        onChange={e => setRepeatPassword(e.target.value)}
        disabled={isLoading}
        required
      />
      
      <button 
        className={buttonStyle} 
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
};

export default SignUp;