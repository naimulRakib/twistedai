import React, { useState } from 'react';

const TroubleNote = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="max-w-md">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-blue-600 text-sm font-semibold hover:underline focus:outline-none mb-2"
      >
        Having trouble?
      </button>

      {isOpen && (
        <p className='text-sm p-6 border border-gray-200 bg-gray-50 rounded-xl text-gray-700 leading-relaxed shadow-sm transition-all duration-300 ease-in-out'>
          <strong>Note:</strong> Seeing a black screen in the Preview Card's reply section when changing frames? 
          If you are a PC user, please wait 3–5 seconds, and it will resolve automatically. 
          If you are an Android user, try selecting the text on the black screen to fix it immediately. 
          Sorry for the inconvenience!
        </p>
      )}
    </div>
  );
};

export default TroubleNote;