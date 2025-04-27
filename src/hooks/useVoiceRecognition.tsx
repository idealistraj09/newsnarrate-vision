
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseVoiceRecognitionOptions {
  commands?: Record<string, () => void>;
  continuous?: boolean;
  language?: string;
  autoStart?: boolean;
}

// Helper function to safely call click on DOM elements
const safeClick = (element: Element | null) => {
  if (element && 'click' in element) {
    (element as HTMLElement).click();
  }
};

export const useVoiceRecognition = (options: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [commands, setCommands] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(options.language || 'en-US');
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  // Initialize recognition
  useEffect(() => {
    // Use browser prefixed version if standard is not available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = options.continuous ?? true;
      recognition.interimResults = true;
      recognition.lang = currentLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        
        // Auto restart if needed
        if (options.autoStart) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Ignore errors on auto-restart
            }
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech Recognition Error', event);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        setInterimTranscript(interimText);
        
        if (finalText) {
          setTranscript(finalText);
          processCommand(finalText.toLowerCase().trim());
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Error initializing speech recognition:', err);
      setError('Failed to initialize speech recognition');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [options.continuous, currentLanguage, options.autoStart]);

  // Update commands when options.commands changes
  useEffect(() => {
    if (options.commands) {
      // Convert to mutable array before setting state
      setCommands(Object.keys(options.commands).slice());
    }
  }, [options.commands]);

  // Auto-start if configured
  useEffect(() => {
    if (options.autoStart && recognitionRef.current) {
      startListening();
    }
  }, [options.autoStart]);

  const processCommand = useCallback((text: string) => {
    console.log('Processing command:', text);
    
    // Check for built-in navigation commands
    if (text.includes('go to home') || text.includes('go home')) {
      navigate('/');
      return;
    } else if (text.includes('go to main') || text.includes('go main')) {
      navigate('/main');
      return;
    } else if (text.includes('go to news') || text.includes('show news') || 
               text.includes('trending news') || text.includes('news page')) {
      navigate('/trending-news');
      return;
    } else if (text.includes('upload pdf') || text.includes('upload document') || 
               text.includes('new document') || text.includes('add pdf')) {
      navigate('/main');
      return;
    } else if (text.includes('refresh page') || text.includes('reload page')) {
      window.location.reload();
      return;
    }
    
    // Check for play/pause commands
    if (text.includes('play audio') || text.includes('start audio') || 
        text.includes('start reading') || text.includes('listen to this')) {
      const playButton = document.querySelector('[aria-label="Start Reading"]');
      safeClick(playButton);
      return;
    }
    
    if (text.includes('pause audio') || text.includes('stop audio') || 
        text.includes('pause reading') || text.includes('pause voice')) {
      const pauseButton = document.querySelector('[aria-label="Pause"]');
      safeClick(pauseButton);
      return;
    }
    
    if (text.includes('resume audio') || text.includes('continue reading') || 
        text.includes('resume voice') || text.includes('continue audio')) {
      const resumeButton = document.querySelector('[aria-label="Resume"]');
      safeClick(resumeButton);
      return;
    }
    
    if (text.includes('stop speech') || text.includes('stop voice') || 
        text.includes('quiet') || text.includes('silence')) {
      const stopButton = document.querySelector('[aria-label="Stop"]');
      safeClick(stopButton);
      return;
    }

    // Category navigation for news
    if (text.includes('show politics') || text.includes('politics news')) {
      const politicsButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Politics'));
      safeClick(politicsButton);
      return;
    }

    if (text.includes('show sports') || text.includes('sports news')) {
      const sportsButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Sports'));
      safeClick(sportsButton);
      return;
    }

    if (text.includes('show technology') || text.includes('tech news')) {
      const techButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Technology'));
      safeClick(techButton);
      return;
    }

    if (text.includes('show all news') || text.includes('all categories')) {
      const allButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent === 'All');
      safeClick(allButton);
      return;
    }

    // Check for user-defined commands
    if (options.commands) {
      for (const [command, action] of Object.entries(options.commands)) {
        if (text.includes(command.toLowerCase())) {
          action();
          return;
        }
      }
    }
  }, [navigate, options.commands]);

  const changeLanguage = (language: string) => {
    console.log(`Changing voice recognition language to: ${language}`);
    setCurrentLanguage(language);
    
    // Restart recognition with new language
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.lang = language;
            recognitionRef.current.start();
          } catch (e) {
            console.error('Error restarting recognition with new language:', e);
          }
        }, 300);
      } catch (e) {
        console.error('Error stopping recognition to change language:', e);
      }
    }
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    error,
    commands,
    currentLanguage,
    changeLanguage
  };
};
