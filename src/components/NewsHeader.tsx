
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Filter, Newspaper, Globe, Volume2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { speechService } from '@/utils/speech';

interface NewsHeaderProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  currentLanguage?: string;
  onLanguageChange?: (language: string) => void;
}

const NewsHeader: React.FC<NewsHeaderProps> = ({ 
  selectedCategory, 
  setSelectedCategory, 
  categories,
  currentLanguage = 'en-US',
  onLanguageChange
}) => {
  const navigate = useNavigate();
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([]);

  React.useEffect(() => {
    if (typeof speechSynthesis !== 'undefined') {
      const languages = speechService.getAvailableLanguages();
      setAvailableLanguages(languages);
    }
  }, []);

  return (
    <header className="bg-gradient-to-r from-brand-purple to-brand-blue py-12 relative overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Newspaper className="w-8 h-8" />
              Trending News
            </h1>
            <p className="text-lg text-white/80">Stay updated with the latest news from around the world</p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Language
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableLanguages.slice(0, 10).map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code}
                    onClick={() => onLanguageChange?.(lang.code)}
                    className={currentLanguage === lang.code ? "bg-accent" : ""}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
        
        <div className="flex items-center overflow-x-auto pb-2 gap-2 mt-8">
          <Filter className="text-white/70 mr-2" />
          {categories.map(category => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={`
                whitespace-nowrap transition-all duration-300
                ${selectedCategory === category 
                  ? 'bg-white text-brand-purple border-white scale-105' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30 hover:scale-105'}
              `}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default NewsHeader;
