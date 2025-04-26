
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, ChevronRight, Brain, Sparkles, Globe } from "lucide-react";
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
            News Narrate Pro
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Experience the future of document comprehension with our intelligent voice reader & AI analyzer
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
          
          {/* New badge for AI features */}
          <div className="mt-8 inline-flex items-center px-4 py-2 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30 animate-pulse">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="font-medium">New AI Features Available!</span>
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
            Advanced <span className="text-gradient">AI-Powered</span> Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <BookOpen className="text-brand-purple w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">PDF to Speech</h3>
              <p className="text-gray-600">
                Upload any PDF document and have it read aloud to you in a natural-sounding voice with adjustable speed and pitch.
              </p>
            </div>
            
            {/* Feature 2 - NEW */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Brain className="text-brand-purple w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Summarization</h3>
              <p className="text-gray-600">
                Get instant AI-generated summaries of your documents to quickly understand key points and save time.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card p-6 card-hover animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <div className="bg-brand-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                <Headphones className="text-brand-purple w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trending News</h3>
              <p className="text-gray-600">
                Stay updated with the latest news stories, available in various categories and ready to be read aloud.
              </p>
            </div>
          </div>
          
          {/* New Feature Showcase */}
          <div className="mt-16">
            <div className="bg-gradient-to-r from-brand-purple/5 to-brand-blue/5 rounded-2xl p-8 shadow-soft">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="md:w-1/2 animate-fade-in">
                  <h3 className="text-2xl font-bold mb-4 flex items-center">
                    <Sparkles className="text-brand-purple mr-2 h-5 w-5" /> 
                    Intelligent Document Analysis
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Our advanced AI algorithms analyze your documents to extract key information, identify main topics, and provide concise summaries - helping you digest information faster than ever.
                  </p>
                  <ul className="space-y-2">
                    {['Instant document summarization', 'Key point extraction', 'Reduce reading time by up to 80%', 'Perfect for research and study'].map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-brand-purple/20 flex items-center justify-center mr-2 mt-1">
                          <div className="h-2 w-2 rounded-full bg-brand-purple"></div>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="md:w-1/2 animate-fade-in">
                  <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-1 mb-3">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex items-center mb-3">
                        <div className="h-7 w-20 bg-brand-purple/20 rounded mr-1"></div>
                        <div className="h-7 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-24 bg-gray-100 rounded-md mb-3 p-2">
                        <div className="h-2 w-4/5 bg-gray-300 rounded mb-2"></div>
                        <div className="h-2 w-3/5 bg-gray-300 rounded mb-2"></div>
                        <div className="h-2 w-4/5 bg-gray-300 rounded"></div>
                      </div>
                      <div className="h-32 bg-brand-purple/10 rounded-md p-2">
                        <div className="flex items-center mb-2">
                          <div className="h-4 w-4 rounded-full bg-brand-purple mr-2"></div>
                          <div className="h-3 w-24 bg-brand-purple/30 rounded"></div>
                        </div>
                        <div className="h-2 w-4/5 bg-gray-300 rounded mb-2"></div>
                        <div className="h-2 w-3/5 bg-gray-300 rounded mb-2"></div>
                        <div className="h-2 w-2/3 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* NEW: Language Support Section */}
      <section className="bg-gradient-radial from-brand-purple/5 to-background section-padding">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">
                <span className="text-gradient">Global Accessibility</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our intelligent voice system supports multiple languages and voice options, making content accessible to diverse audiences worldwide.
              </p>
              <div className="flex flex-wrap gap-2">
                {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'].map((lang) => (
                  <span key={lang} className="px-3 py-1 bg-white/80 rounded-full text-sm border border-brand-purple/20 shadow-sm">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="h-48 w-48 rounded-full bg-brand-purple/10 absolute animate-pulse"></div>
                <Globe className="h-40 w-40 text-brand-purple/60 relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="bg-gradient-to-r from-brand-purple/20 to-brand-blue/10 section-padding">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform how you consume information?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start using News Narrate Pro today and experience the power of AI-enhanced document analysis.
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
