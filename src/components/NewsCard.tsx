
import React, { useState } from 'react';
import { Play, Pause, Volume2, ArrowDown, ArrowUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(false);
  const isPlaying = playingIndex === index;
  
  const handlePlayPause = (text: string) => {
    if (isPlaying) {
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

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Check if description is long enough to need expansion
  const isLongDescription = article.description.length > 300;
  const displayDescription = expanded || !isLongDescription 
    ? article.description 
    : article.description.substring(0, 300) + '...';

  return (
    <Card 
      className="overflow-hidden animate-fade-up hover:shadow-lg transition-all duration-300 border-border/40 hover:border-brand-purple/40 h-full flex flex-col" 
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <CardHeader className="pb-2 border-b">
        <CardTitle className="line-clamp-2 text-xl">{article.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          {article.source}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex-grow">
        <Tabs defaultValue="read" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="read">Read</TabsTrigger>
            <TabsTrigger value="listen">Listen</TabsTrigger>
          </TabsList>
          <TabsContent value="read" className="min-h-[240px] max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed">{displayDescription}</p>
              
              {isLongDescription && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={toggleExpand}
                  className="flex items-center gap-1 text-xs text-foreground hover:text-brand-purple mx-auto mt-2"
                >
                  {expanded ? (
                    <>
                      <ArrowUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3 w-3" /> Read more
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
          <TabsContent value="listen" className="min-h-[240px] flex items-center justify-center p-6">
            <Button
              onClick={() => handlePlayPause(article.title + ". " + article.description)}
              className={`w-full ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-purple hover:bg-brand-purple/90'}`}
              aria-label={isPlaying ? "Pause" : "Start Reading"}
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NewsCard;
