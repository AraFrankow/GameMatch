import React, { useState } from 'react';

const TextoExpandible = ({ texto, limite = 45 }) => {
  const [expandido, setExpandido] = useState(false);

  if (!texto) return <span>-</span>;
  if (texto.length <= limite) return <span>{texto}</span>;

  return (
    <span>
      {expandido ? texto : `${texto.slice(0, limite)}...`}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpandido(!expandido);
        }}
        className="ml-2 text-purple-400 hover:text-purple-300 font-semibold text-xs underline focus:outline-none cursor-pointer"
      >
        {expandido ? 'Ver menos' : 'Ver más'}
      </button>
    </span>
  );
};

export default TextoExpandible;