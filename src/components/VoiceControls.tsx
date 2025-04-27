
import React, { useEffect, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, Globe } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { speechService } from "@/utils/speech";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

interface VoiceControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onVoiceChange?: (voiceName: string) => void;
  onLanguageChange?: (language: string) => void;
  speed: number;
  pitch: number;
  language?: string;
}

export const VoiceControls = ({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onPitchChange,
  onVoiceChange,
  onLanguageChange,
  speed,
  pitch,
  language = 'en-US'
}: VoiceControlsProps) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<{code: string, name: string}[]>([]);
  
  useEffect(() => {
    // Get available voices
    const voices = speechService.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices.filter(voice => voice.lang.includes(language.split('-')[0])));
    } else {
      // If voices aren't loaded yet, set up a listener for when they are
      const checkVoices = () => {
        const newVoices = speechService.getVoices();
        if (newVoices.length > 0) {
          setAvailableVoices(newVoices.filter(voice => voice.lang.includes(language.split('-')[0])));
          window.removeEventListener('voiceschanged', checkVoices);
        }
      };
      window.addEventListener('voiceschanged', checkVoices);
      return () => window.removeEventListener('voiceschanged', checkVoices);
    }
    
    // Get available languages
    if (typeof speechSynthesis !== 'undefined') {
      const languages = speechService.getAvailableLanguages();
      setAvailableLanguages(languages);
    }
  }, [language]);

  const handleVoiceChange = (voiceName: string) => {
    if (onVoiceChange) {
      onVoiceChange(voiceName);
    }
  };
  
  const handleLanguageChange = (langCode: string) => {
    if (onLanguageChange) {
      onLanguageChange(langCode);
      
      // Update available voices for this language
      const voices = speechService.getVoices();
      setAvailableVoices(voices.filter(voice => voice.lang.includes(langCode.split('-')[0])));
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkipBack}
              title="Restart from beginning"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onSkipForward}
              title="Stop"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TooltipProvider>
              <div>
                <label className="text-sm font-medium mb-2 block">Speed: {speed.toFixed(1)}x</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Slider
                        value={[speed]}
                        onValueChange={(value) => onSpeedChange(value[0])}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reading speed: {speed.toFixed(1)}x</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Pitch: {pitch.toFixed(1)}</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Slider
                        value={[pitch]}
                        onValueChange={(value) => onPitchChange(value[0])}
                        min={0.5}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voice pitch: {pitch.toFixed(1)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div>
              <label className="text-sm font-medium mb-2 block">Language</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full flex justify-between items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    <span>{availableLanguages.find(lang => lang.code === language)?.name || 'English'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-60 overflow-y-auto">
                  {availableLanguages.map((lang) => (
                    <DropdownMenuItem 
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Voice</label>
              {availableVoices.length > 0 ? (
                <Select onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">Loading voices...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
