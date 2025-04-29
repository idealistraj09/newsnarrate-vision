
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsHeaderProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

const NewsHeader: React.FC<NewsHeaderProps> = ({
  selectedCategory,
  setSelectedCategory,
  categories
}) => {
  return (
    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>
          
          <h1 className="text-xl font-bold">Trending News</h1>
          
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>
        
        <div className="pb-2 overflow-x-auto hide-scrollbar">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`whitespace-nowrap relative ${
                  selectedCategory === category ? "bg-brand-purple hover:bg-brand-purple/90" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
                {selectedCategory === category && (
                  <span className="absolute inset-0 bg-brand-purple rounded-md -z-10 animate-pulse-subtle" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsHeader;
