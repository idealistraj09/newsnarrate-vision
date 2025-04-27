
import React, { useEffect, useState } from 'react';
import { speechService } from '../utils/speech';
import { Loader2 } from 'lucide-react';
import NewsHeader from '../components/NewsHeader';
import NewsCard from '../components/NewsCard';
import { fetchNewsArticles } from '../utils/newsService';

const categories = ['All', 'Politics', 'Sports', 'Technology', 'Entertainment', 'Science', 'Health', 'Business', 'World'];

const TrendingNewsPage: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    fetchNews(selectedCategory);
    
    return () => {
      speechService.stop();
    };
  }, [selectedCategory]);

  const fetchNews = async (category: string) => {
    setLoading(true);
    console.log('Fetching trending news for category:', category);
    
    try {
      const articles = await fetchNewsArticles(category);
      setArticles(articles);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95 pb-20">
      <NewsHeader 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />

      <main className="container mx-auto px-4 py-12">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <NewsCard
                key={index}
                article={article}
                index={index}
                playingIndex={playingIndex}
                setPlayingIndex={setPlayingIndex}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrendingNewsPage;
