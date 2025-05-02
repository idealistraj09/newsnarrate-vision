
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
      const availableVoices = window.speechSynthesis.getVoices();
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
      voice.name.toLowerCase().includes('neural') ||
      voice.name.toLowerCase().includes('natural')
    );

    // Then natural-sounding voices
    const naturalVoices = voices.filter(voice => 
      !voice.name.toLowerCase().includes('premium') &&
      !voice.name.toLowerCase().includes('enhanced') &&
      !voice.name.toLowerCase().includes('neural')
    );

    return [...premiumVoices, ...naturalVoices];
  }

  private setupVoiceChangeListener() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        this.voices = this.filterAndPrioritizeVoices(window.speechSynthesis.getVoices());
        this.isInitialized = true;
        console.log('Voices loaded:', this.voices.length);
      });
    }
  }

  setStateChangeCallback(callback: (isPlaying: boolean) => void) {
    this.onStateChange = callback;
  }

  async speak(text: string, speed: number = 1, pitch: number = 1) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error("Speech synthesis not supported");
      throw new Error("Speech synthesis not supported in this browser");
    }

    // Cancel any ongoing speech
    this.stop();
    
    if (!text || text.length === 0) {
      console.warn("No text to speak");
      return;
    }

    // Preprocess text to improve speech quality and naturalness
    text = this.preprocessText(text);
    
    this.text = text;
    this.currentPosition = 0;
    
    // For longer texts, we use advanced sentence chunking for more natural pauses
    if (text.length > 500) {
      this.chunkSize = 300; // Larger chunks for more context
      const sentences = this.splitIntoSentences(text);
      await this.speakSentences(sentences, speed, pitch);
    } else {
      // For shorter texts, we use the simpler approach
      this.speakCurrentChunk(speed, pitch);
    }
  }

  private splitIntoSentences(text: string): string[] {
    // More sophisticated sentence splitting
    return text
      .replace(/([.!?])\s+/g, "$1|")
      .replace(/([.!?])([^|])/g, "$1|$2")
      .split("|")
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private async speakSentences(sentences: string[], speed: number, pitch: number) {
    for (let i = 0; i < sentences.length; i++) {
      if (i > 0 && this.currentPosition === -1) {
        // Speech was stopped
        break;
      }
      
      const sentence = sentences[i];
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.rate = speed;
        utterance.pitch = pitch;
        
        // Set voice based on selection
        this.setUtteranceVoice(utterance);
        
        utterance.onstart = () => {
          this.onStateChange?.(true);
        };
        
        utterance.onend = () => {
          resolve();
        };
        
        utterance.onerror = () => {
          console.error("Error speaking sentence:", sentence);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      });
    }
    
    this.onStateChange?.(false);
  }

  private preprocessText(text: string): string {
    return text
      .replace(/(\b[A-Z]{2,})/g, (match) => match.split('').join(' '))
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

    this.setUtteranceVoice(this.utterance);

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

    try {
      window.speechSynthesis.speak(this.utterance);
    } catch (error) {
      console.error("Error starting speech synthesis:", error);
      this.onStateChange?.(false);
      throw error;
    }
  }

  private setUtteranceVoice(utterance: SpeechSynthesisUtterance) {
    // Get available voices
    if (!this.isInitialized || this.voices.length === 0) {
      this.voices = this.filterAndPrioritizeVoices(window.speechSynthesis.getVoices());
    }

    // Try to find a natural-sounding voice
    let selectedVoice = null;
    
    if (this.selectedVoice) {
      // Use previously selected voice if available
      selectedVoice = this.voices.find(voice => voice.name === this.selectedVoice);
    }
    
    if (!selectedVoice) {
      // Prefer premium voices
      selectedVoice = this.voices.find(voice => 
        voice.name.toLowerCase().includes('premium') || 
        voice.name.toLowerCase().includes('enhanced')
      ) || this.voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      this.selectedVoice = selectedVoice.name; // Remember this voice
    }
  }

  pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      this.onStateChange?.(false);
    }
  }

  resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      this.onStateChange?.(true);
    }
  }

  stop() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        this.currentPosition = -1; // Mark as stopped
        this.onStateChange?.(false);
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
      return window.speechSynthesis.getVoices();
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
