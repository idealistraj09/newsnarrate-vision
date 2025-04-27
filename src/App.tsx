
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TrendingNewsPage from './pages/TrendingNewsPage';
import VoiceCommandPanel from './components/VoiceCommandPanel';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <div className="page-transition">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/main" element={<Index />} />
              <Route path="/trending-news" element={<TrendingNewsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <VoiceCommandPanel />
          </div>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
