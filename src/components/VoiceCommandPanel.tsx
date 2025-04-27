
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2, Globe } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { speechService } from '@/utils/speech';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface VoiceCommandPanelProps {
  className?: string;
}

const VoiceCommandPanel: React.FC<VoiceCommandPanelProps> = ({ className }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([]);
  
  const {
    isListening,
    startListening,
    stopListening,
    changeLanguage,
    currentLanguage
  } = useVoiceRecognition({
    autoStart: false
  });
  
  useEffect(() => {
    // Get available languages
    if (typeof speechSynthesis !== 'undefined') {
      const languages = speechService.getAvailableLanguages();
      setAvailableLanguages(languages);
    }
  }, []);
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      toast.info('Voice commands disabled');
    } else {
      startListening();
      toast.success('Voice commands enabled. Say "help" to see available commands');
    }
  };
  
  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    speechService.setLanguage(langCode);
    
    const langName = availableLanguages.find(l => l.code === langCode)?.name || langCode;
    toast.success(`Language changed to ${langName}`);
  };
  
  return (
    <div className={`fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 ${className}`}>
      {isListening && (
        <div className="bg-background/90 backdrop-blur-sm border rounded-full px-3 py-1 text-xs flex items-center animate-pulse text-brand-purple">
          <span>Listening...</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/90 backdrop-blur-sm border shadow-md"
              title="Change language"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableLanguages.slice(0, 10).map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={currentLanguage === lang.code ? "bg-accent" : ""}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full bg-background/90 backdrop-blur-sm border shadow-md ${
            isListening ? "bg-brand-purple text-white" : ""
          }`}
          onClick={toggleListening}
          title={isListening ? "Disable voice commands" : "Enable voice commands"}
        >
          {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default VoiceCommandPanel;
