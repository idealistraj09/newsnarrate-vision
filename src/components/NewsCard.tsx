
import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { speechService } from '../utils/speech';

interface NewsCardProps {
  article: {
    title: string;
    description: string;
    source: string;
  };
  index: number;
  playingIndex: number | null;
  setPlayingIndex: (index: number | null) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, index, playingIndex, setPlayingIndex }) => {
  const handlePlayPause = (text: string) => {
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

  const isPlaying = playingIndex === index;

  return (
    <Card 
      className="overflow-hidden animate-fade-up hover:shadow-lg transition-all duration-300 border-border/40 hover:border-brand-purple/40" 
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-2 border-b">
        <CardTitle className="line-clamp-2 text-xl">{article.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          {article.source}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="read" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="listen">Listen</TabsTrigger>
          </TabsList>
          <TabsContent value="read">
            <p className="text-sm text-foreground/90 line-clamp-4">{article.description}</p>
          </TabsContent>
          <TabsContent value="listen">
            <div className="flex justify-center">
              <Button
                onClick={() => handlePlayPause(article.description || article.title)}
                className={`w-full ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-purple hover:bg-brand-purple/90'}`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Listen Now
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
