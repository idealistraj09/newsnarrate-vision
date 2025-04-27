class SpeechService {
  private utterance: SpeechSynthesisUtterance | null = null;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;
  private text: string = '';
  private currentPosition: number = 0;
  private chunkSize: number = 200; // Process text in smaller chunks to avoid issues
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized: boolean = false;
  private selectedVoice: string | null = null;

  constructor() {
    this.setupVoiceChangeListener();
    this.initializeBrowserSpeech();
  }

  private initializeBrowserSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Check if voices are already loaded
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        // Filter for high-quality voices and prioritize them
        this.voices = this.filterAndPrioritizeVoices(availableVoices);
        this.isInitialized = true;
        console.log("Speech synthesis initialized with", this.voices.length, "voices");
      }
    } else {
      console.warn("Speech synthesis not supported in this browser");
    }
  }

  private filterAndPrioritizeVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    // Prioritize premium/enhanced voices
    const premiumVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('premium') || 
      voice.name.toLowerCase().includes('enhanced') ||
      voice.name.toLowerCase().includes('neural')
    );

    // Then natural-sounding English voices
    const naturalVoices = voices.filter(voice => 
      voice.lang.includes('en') && 
      !voice.name.toLowerCase().includes('premium') &&
      !voice.name.toLowerCase().includes('enhanced') &&
      !voice.name.toLowerCase().includes('neural')
    );

    return [...premiumVoices, ...naturalVoices];
  }

  private setupVoiceChangeListener() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        this.voices = speechSynthesis.getVoices();
        this.isInitialized = true;
        console.log('Voices loaded:', this.voices.length);
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

    // Preprocess text to improve speech quality
    text = this.preprocessText(text);
    
    // Check browser support
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      throw new Error("Speech synthesis not supported in this browser");
    }
    
    this.text = text;
    this.currentPosition = 0;
    
    // Some browsers have limitations on text length, so we'll process in chunks
    this.speakCurrentChunk(speed, pitch);
  }

  private preprocessText(text: string): string {
    return text
      .replace(/(\d+)\.(\d+)/g, "$1 point $2")
      .replace(/&/g, " and ")
      .replace(/(\w)-(\w)/g, "$1 $2")
      .replace(/([.!?])\s+/g, "$1\n\n")
      .replace(/([A-Z][a-z]+)\s+([A-Z])/g, "$1.\n$2")
      .replace(/([^.!?])\s*\n/g, "$1. ")
      .replace(/\s+/g, " ")
      .trim();
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
    if (!this.isInitialized || this.voices.length === 0) {
      this.voices = speechSynthesis.getVoices();
    }

    // Try to find a natural-sounding English voice
    let selectedVoice = null;
    
    if (this.selectedVoice) {
      // Use previously selected voice if available
      selectedVoice = this.voices.find(voice => voice.name === this.selectedVoice);
    }
    
    if (!selectedVoice) {
      // Look for premium voices first (usually sound better)
      selectedVoice = this.voices.find(voice => 
        voice.name.includes('Premium') && voice.lang.includes('en')
      );
      
      // Fall back to any English voice
      if (!selectedVoice) {
        selectedVoice = this.voices.find(voice => voice.lang.includes('en'));
      }
    }
    
    if (selectedVoice) {
      this.utterance.voice = selectedVoice;
      this.selectedVoice = selectedVoice.name; // Remember this voice
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
      if (event.error === 'interrupted') {
        console.log('Speech synthesis was interrupted.');
      } else {
        console.error('Speech synthesis error:', event);
      }
      this.onStateChange?.(false);
    };

    try {
      speechSynthesis.speak(this.utterance);
    } catch (error) {
      console.error("Error starting speech synthesis:", error);
      this.onStateChange?.(false);
      throw error;
    }
  }

  pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.pause();
      this.onStateChange?.(false);
    }
  }

  resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.resume();
      this.onStateChange?.(true);
    }
  }

  stop() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.cancel();
        this.currentPosition = 0;
        this.onStateChange?.(false);
        console.log('Speech synthesis stopped successfully.');
      }
    } catch (error) {
      console.error('Error stopping speech synthesis:', error);
    }
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

  setVolume(volume: number) {
    if (this.utterance) {
      this.utterance.volume = volume;
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return speechSynthesis.getVoices();
    }
    return [];
  }

  setVoice(voiceName: string) {
    this.selectedVoice = voiceName;
  }

  isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
}

export const speechService = new SpeechService();
