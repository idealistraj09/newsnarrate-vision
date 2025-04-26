import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate('/main'); // Assuming your main page route is '/main'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg p-8 max-w-lg mx-auto text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to News Narrate</h1>
        <p className="text-lg text-white mb-8">
          Experience the future of news reading with our PDF voice reader.
        </p>
        <button
          onClick={handleButtonClick}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          Read News from PDF
        </button>
        <button
          onClick={() => navigate('/trending-news')}
          className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300 mt-4"
        >
          Listen to Trending News
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
