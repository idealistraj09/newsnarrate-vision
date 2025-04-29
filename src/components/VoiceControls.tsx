
import React, { useEffect, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { speechService } from "@/utils/speech";

interface VoiceControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onVoiceChange?: (voiceName: string) => void;
  speed: number;
  pitch: number;
}

export const VoiceControls = ({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onPitchChange,
  onVoiceChange,
  speed,
  pitch
}: VoiceControlsProps) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    // Get available voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      } else {
        // If voices aren't loaded yet, set up a listener for when they are
        const checkVoices = () => {
          const newVoices = window.speechSynthesis.getVoices();
          if (newVoices.length > 0) {
            setAvailableVoices(newVoices);
            window.removeEventListener('voiceschanged', checkVoices);
          }
        };
        window.addEventListener('voiceschanged', checkVoices);
        return () => window.removeEventListener('voiceschanged', checkVoices);
      }
    }
  }, []);

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
              aria-label="Start Reading"
            >
              <SkipBack className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Resume"}
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
              aria-label="Stop"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};
