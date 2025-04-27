
import React, { useState } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { Mic, MicOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const VoiceCommandPanel: React.FC = () => {
  const [showCommands, setShowCommands] = useState(false);
  const {
    isListening,
    toggleListening,
    transcript,
    interimTranscript,
    error
  } = useVoiceRecognition({
    autoStart: false
  });

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
                  <li>"Show politics news"</li>
                  <li>"Show sports news"</li>
                  <li>"Show tech news"</li>
                  <li>"Show all news"</li>
                  <li>"Refresh page"</li>
                </ul>
              </div>
              
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
