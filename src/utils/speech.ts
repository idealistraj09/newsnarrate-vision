
class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;
  private text: string = '';
  private currentPosition: number = 0;
  private chunkSize: number = 200; // Process text in smaller chunks to avoid issues

  constructor() {
    this.setupVoiceChangeListener();
  }

  private setupVoiceChangeListener() {
    if (typeof window !== 'undefined') {
      speechSynthesis.addEventListener('voiceschanged', () => {
        console.log('Voices loaded:', speechSynthesis.getVoices().length);
      });
    }
  }

  setStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onStateChange = callback;
  }

  async speak(text: string, speed: number = 1, pitch: number = 1) {
    this.stop();
    
    if (!text || text.length === 0) {
      console.warn("No text to speak");
      return;
    }
    
    this.text = text;
    this.currentPosition = 0;
    
    // Some browsers have limitations on text length, so we'll process in chunks
    this.speakCurrentChunk(speed, pitch);
  }

  private speakCurrentChunk(speed: number, pitch: number) {
    if (this.currentPosition >= this.text.length) {
      this.onStateChange?.(false);
      return;
    }
    
    const chunk = this.text.substring(
      this.currentPosition, 
      this.currentPosition + this.chunkSize
    );
    
    this.utterance = new SpeechSynthesisUtterance(chunk);
    this.utterance.rate = speed;
    this.utterance.pitch = pitch;

    // Get available voices
    const voices = speechSynthesis.getVoices();
    // Try to find an English voice
    const englishVoice = voices.find(voice => voice.lang.includes('en'));
    if (englishVoice) {
      this.utterance.voice = englishVoice;
    }

    this.utterance.onstart = () => {
      this.onStateChange?.(true);
    };

    this.utterance.onend = () => {
      this.currentPosition += this.chunkSize;
      
      if (this.currentPosition < this.text.length) {
        // Continue with next chunk
        this.speakCurrentChunk(speed, pitch);
      } else {
        this.onStateChange?.(false);
      }
    };

    this.utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.onStateChange?.(false);
    };

    speechSynthesis.speak(this.utterance);
  }

  pause() {
    speechSynthesis.pause();
    this.onStateChange?.(false);
  }

  resume() {
    speechSynthesis.resume();
    this.onStateChange?.(true);
  }

  stop() {
    speechSynthesis.cancel();
    this.currentPosition = 0;
    this.onStateChange?.(false);
  }

  setSpeed(speed: number) {
    if (this.utterance) {
      this.utterance.rate = speed;
    }
  }

  setPitch(pitch: number) {
    if (this.utterance) {
      this.utterance.pitch = pitch;
    }
  }
}

export const speechService = new SpeechService();
