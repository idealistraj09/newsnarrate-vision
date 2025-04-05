
import React, { useEffect, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  pitch,
}: VoiceControlsProps) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  useEffect(() => {
    // Get available voices
    const voices = speechService.getVoices();
    if (voices.length > 0) {
      setAvailableVoices(voices.filter(voice => voice.lang.includes('en')));
    } else {
      // If voices aren't loaded yet, set up a listener for when they are
      const checkVoices = () => {
        const newVoices = speechService.getVoices();
        if (newVoices.length > 0) {
          setAvailableVoices(newVoices.filter(voice => voice.lang.includes('en')));
          window.removeEventListener('voiceschanged', checkVoices);
        }
      };
      window.addEventListener('voiceschanged', checkVoices);
      return () => window.removeEventListener('voiceschanged', checkVoices);
    }
  }, []);

  const handleVoiceChange = (voiceName: string) => {
    if (onVoiceChange) {
      onVoiceChange(voiceName);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Speed: {speed.toFixed(1)}x</label>
              <Slider
                value={[speed]}
                onValueChange={(value) => onSpeedChange(value[0])}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Pitch: {pitch.toFixed(1)}</label>
              <Slider
                value={[pitch]}
                onValueChange={(value) => onPitchChange(value[0])}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Voice</label>
              {availableVoices.length > 0 ? (
                <Select onValueChange={handleVoiceChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
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
