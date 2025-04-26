import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speechService } from '../utils/speech';
import { Home, Play, Pause, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const categories = ['All', 'Politics', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health'];

const TrendingNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingNews(selectedCategory);
    
    return () => {
      speechService.stop();
    };
  }, [selectedCategory]);

  const fetchTrendingNews = async (category: string) => {
    setLoading(true);
    console.log('Fetching trending news for category:', category);
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
        console.log('Response data from Gemini API:', data);
        
        const articles = parseGeminiResponse(data);
        console.log('Parsed articles:', articles);
        setArticles(articles);
      } else {
        console.error('Failed to fetch news:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseGeminiResponse = (data: any) => {
    try {
      let text = data?.candidates[0]?.content?.parts[0]?.text || '';
      
      const jsonPattern = /```json\s*([\s\S]*)\s*```/;
      const match = text.match(jsonPattern);
  
      if (match && match[1]) {
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
      if (playingIndex !== null) {
        speechService.stop();
      }
      speechService.speak(text);
      setPlayingIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-brand-purple to-brand-blue py-8 animate-fade-in">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-white">Trending News</h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
          <p className="text-white/80 mb-6">Stay updated with the latest news from around the world</p>
          
          <div className="flex items-center overflow-x-auto pb-2 gap-2">
            <Filter className="text-white/70 mr-2" />
            {categories.map(category => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className={`
                  whitespace-nowrap
                  ${selectedCategory === category 
                    ? 'bg-white text-brand-purple border-white' 
                    : 'bg-white/20 text-white border-white/30 hover:bg-white/30'}
                `}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 text-brand-purple animate-spin mb-4" />
            <p className="text-muted-foreground">Loading news articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found. Try another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <Card key={index} className="overflow-hidden animate-fade-up card-hover shadow-soft" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                  <CardDescription>Source: {article.source}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-600 line-clamp-4">{article.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handlePlayPause(index, article.description || article.title)}
                    className={`w-full ${playingIndex === index ? 'bg-red-500 hover:bg-red-600' : 'button-gradient'}`}
                  >
                    {playingIndex === index ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrendingNewsPage;
