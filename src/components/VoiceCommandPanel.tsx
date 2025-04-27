
import React, { useState } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Mic, MicOff, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const VoiceCommandPanel: React.FC = () => {
  const [showCommands, setShowCommands] = useState(false);
  const {
    isListening,
    toggleListening,
    transcript,
    interimTranscript,
    error,
    commands,
    currentLanguage,
    changeLanguage
  } = useVoiceRecognition({
    autoStart: false
  });

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'it-IT', name: 'Italiano' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'zh-CN', name: '中文 (简体)' },
    { code: 'ru-RU', name: 'Русский' },
    { code: 'ar-SA', name: 'العربية' },
  ];

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    toast.success(`Voice commands now in ${languages.find(l => l.code === langCode)?.name || langCode}`);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {isListening && (
          <div className="absolute -top-16 right-0 w-64 bg-background/90 border rounded-lg shadow-lg p-3 backdrop-blur-sm mb-2 transition-all">
            <div className="text-xs text-muted-foreground mb-1">Listening...</div>
            <div className="font-medium text-sm">
              {interimTranscript || transcript || "Say something..."}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {showCommands && (
            <div className="p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg animate-fade-left mb-12 max-w-xs absolute bottom-0 right-16">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Voice Commands</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCommands(false)}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>
              
              <div className="text-xs space-y-1 mb-3">
                <p>Try saying:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>"Go to home"</li>
                  <li>"Go to main"</li>
                  <li>"Go to news"</li>
                  <li>"Upload PDF"</li>
                  <li>"Start reading"</li>
                  <li>"Pause" / "Resume"</li>
                  <li>"Stop reading"</li>
                  <li>"Switch to [language]"</li>
                </ul>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Language: {languages.find(l => l.code === currentLanguage)?.name || currentLanguage}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languages.map((lang) => (
                    <DropdownMenuItem 
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className="flex items-center justify-between"
                    >
                      {lang.name}
                      {currentLanguage === lang.code && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-background shadow-lg hover:bg-primary/10 border-primary/20"
            onClick={() => setShowCommands(!showCommands)}
          >
            <Settings className="h-5 w-5 text-primary" />
          </Button>

          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            className={`rounded-full h-14 w-14 shadow-lg ${
              isListening 
                ? "bg-primary text-primary-foreground animate-pulse" 
                : "bg-background hover:bg-primary/10 border-primary/20"
            }`}
            onClick={toggleListening}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6 text-primary" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandPanel;
