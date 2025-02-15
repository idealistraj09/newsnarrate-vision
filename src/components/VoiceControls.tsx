
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, SkipBack, SkipForward, Play, Pause } from "lucide-react";

interface VoiceControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSpeedChange: (value: number) => void;
  onPitchChange: (value: number) => void;
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
  speed,
  pitch,
}: VoiceControlsProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t p-4">
      <div className="container max-w-4xl mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkipBack}
              title="Skip back 10 seconds"
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
              title="Skip forward 10 seconds"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};
