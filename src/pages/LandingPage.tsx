
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleButtonClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-brand-blue/5 z-0"></div>
        
        {/* Animated background circles */}
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-brand-light-purple/20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-brand-blue/10 blur-3xl animate-pulse"></div>
        
        <div className="container mx-auto px-4 py-16 z-10 text-center animate-fade-in">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient">
            News Narrate
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience the future of news consumption with our intelligent voice reader.
            Upload PDFs or listen to trending news - all in one place.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <Button 
              onClick={() => handleButtonClick('/main')}
              className="button-gradient px-8 py-6 text-lg rounded-xl flex items-center gap-2 shadow-lg"
            >
              <BookOpen className="w-5 h-5" />
              Read from PDF
              <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
            
            <Button
              onClick={() => handleButtonClick('/trending-news')}
              variant="outline"
              className="px-8 py-6 text-lg rounded-xl flex items-center gap-2 border-2 border-brand-purple/30 hover:border-brand-purple/70 shadow-lg"
            >
              <Headphones className="w-5 h-5" />
              Listen to Trending News
            </Button>
          </div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,213.3C672,203,768,149,864,138.7C960,128,1056,160,1152,170.7C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-white section-padding">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Why Choose <span className="text-gradient">News Narrate</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <BookOpen className="text-brand-purple w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF to Speech</h3>
              <p className="text-gray-600">
                Upload any PDF document and have it read aloud to you in a natural-sounding voice.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Headphones className="text-brand-purple w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trending News</h3>
              <p className="text-gray-600">
                Stay updated with the latest news stories, available in various categories and ready to be played.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-brand-purple w-8 h-8" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your documents and listening preferences are kept private and secure at all times.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="bg-gradient-to-r from-brand-purple/20 to-brand-blue/10 section-padding">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform how you consume news?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start using News Narrate today and never miss an important update again.
          </p>
          
          <Button 
            onClick={() => handleButtonClick('/main')}
            className="button-gradient px-8 py-6 text-lg rounded-xl shadow-lg"
          >
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
