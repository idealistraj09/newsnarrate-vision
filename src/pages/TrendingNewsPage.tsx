import React, { useEffect, useState } from 'react';
import { speechService } from '../utils/speech';

const categories = ['All', 'Politics', 'Sports', 'Technology', 'Entertainment'];

const TrendingNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchTrendingNews(selectedCategory);
  }, [selectedCategory]);

  const fetchTrendingNews = async (category: string) => {
    setLoading(true);
    console.log('Fetching trending news for category:', category); // Debug statement
    try {
      const response = await fetch('http://localhost:8080/api/fetch-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Response data from Gemini API:', data); // Debug statement
        
        const articles = parseGeminiResponse(data);
        console.log('Parsed articles:', articles); // Debug statement
        setArticles(articles);
      } else {
        console.error('Failed to fetch news:', response.statusText); // Debug statement
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseGeminiResponse = (data: any) => {
    try {
      // Get the text content from the response
      let text = data?.candidates[0]?.content?.parts[0]?.text || '';
      
      // Check if the text starts with any unwanted message, and remove it
      // Remove any prefix text before the valid JSON data
      const jsonPattern = /```json\s*([\s\S]*)\s*```/; // Regex to match JSON block
      const match = text.match(jsonPattern);
  
      if (match && match[1]) {
        // Parse the cleaned JSON part
        const parsedData = JSON.parse(match[1]);
  
        if (Array.isArray(parsedData)) {
          return parsedData.map((article: any) => ({
            title: article.title || 'No title',
            description: article.description || 'No description',
            source: article.source || 'No source',
          }));
        } else {
          console.error('Parsed data is not an array:', parsedData);
          return [];
        }
      } else {
        console.error('No valid JSON found in response:', text);
        return [];
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return [];
    }
  };
  
  

  const handlePlayPause = (index: number, text: string) => {
    if (playingIndex === index) {
      speechService.stop();
      setPlayingIndex(null);
    } else {
      speechService.speak(text);
      setPlayingIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 p-4">
      <h1 className="text-3xl font-bold text-center text-white mb-6">Trending News</h1>
      <div className="flex justify-center mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 mx-2 ${selectedCategory === category ? 'bg-blue-700' : 'bg-blue-500'} text-white rounded-lg`}
          >
            {category}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-white">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <div key={index} className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-2">{article.title}</h2>
              <p className="text-gray-200 mb-2">{article.description}</p>
              <p className="text-sm text-gray-400 mb-2">Source: {article.source}</p>
              <button
                onClick={() => handlePlayPause(index, article.description || article.title)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
              >
                {playingIndex === index ? 'Pause' : 'Play'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingNewsPage;
