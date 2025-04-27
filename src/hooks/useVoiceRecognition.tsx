
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  autoStart?: boolean;
}

interface VoiceCommand {
  command: string | RegExp;
  callback: (args?: string) => void;
  description?: string;
}

export const useVoiceRecognition = (options: VoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState(options.language || 'en-US');
  
  const recognitionRef = useRef<any>(null);
  const commandsRef = useRef<VoiceCommand[]>([]);
  const navigate = useNavigate();
  
  // Initialize SpeechRecognition with browser prefixes
  const initRecognition = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = true;
    recognition.lang = currentLanguage;
    
    recognition.onstart = () => {
      console.log('Voice recognition started');
      setIsListening(true);
    };
    
    recognition.onend = () => {
      console.log('Voice recognition ended');
      setIsListening(false);
      
      // Auto restart if continuous mode is enabled
      if ((options.continuous ?? true) && recognitionRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition:', e);
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable it to use voice commands.');
      }
    };
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      if (finalTranscript) {
        console.log('Voice command received:', finalTranscript);
        setTranscript(finalTranscript);
        processCommand(finalTranscript.toLowerCase().trim());
      }
    };
    
    return recognition;
  }, [currentLanguage, options.continuous]);
  
  const processCommand = useCallback((transcript: string) => {
    for (const { command, callback } of commandsRef.current) {
      if (typeof command === 'string') {
        if (transcript.includes(command.toLowerCase())) {
          callback();
          return;
        }
      } else if (command instanceof RegExp) {
        const match = transcript.match(command);
        if (match) {
          // Extract the parameter if available (usually in capture group 1)
          const param = match[1] || match[0];
          callback(param);
          return;
        }
      }
    }
  }, []);
  
  const registerCommands = useCallback((commands: VoiceCommand[]) => {
    commandsRef.current = commands;
  }, []);
  
  const initDefaultCommands = useCallback(() => {
    const defaultCommands: VoiceCommand[] = [
      {
        command: /go to (home|main|trending news|news)/i,
        callback: (destination) => {
          let route = '/';
          if (destination) {
            if (destination.includes('main')) route = '/main';
            else if (destination.includes('news') || destination.includes('trending')) route = '/trending-news';
          }
          toast.info(`Navigating to ${destination}`);
          navigate(route);
        },
        description: 'Navigate to pages, e.g. "go to home"'
      },
      {
        command: /(start|begin|play) reading/i,
        callback: () => {
          document.querySelector('button:contains("Start Reading")')?.click();
          toast.info('Starting to read');
        },
        description: 'Start reading the document'
      },
      {
        command: /(stop|pause) reading/i,
        callback: () => {
          toast.info('Stopping reading');
          document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent?.includes('Pause')) btn.click();
          });
        },
        description: 'Stop reading'
      },
      {
        command: /show (summary|summarize)/i,
        callback: () => {
          document.querySelector('[value="summary"]')?.click();
          toast.info('Switching to summary view');
        },
        description: 'Show document summary'
      },
      {
        command: /show content/i,
        callback: () => {
          document.querySelector('[value="content"]')?.click();
          toast.info('Switching to content view');
        },
        description: 'Show document content'
      },
      {
        command: /upload (document|file|pdf)/i,
        callback: () => {
          document.querySelector('input[type="file"]')?.click();
          toast.info('Please select a file to upload');
        },
        description: 'Open file upload dialog'
      },
      {
        command: /help/i,
        callback: () => {
          const commands = commandsRef.current
            .filter(cmd => cmd.description)
            .map(cmd => `• ${cmd.description}`)
            .join('\n');
          
          toast.info(
            <div>
              <p className="font-semibold">Available voice commands:</p>
              <ul className="list-disc pl-4 mt-2 text-sm">
                {commandsRef.current
                  .filter(cmd => cmd.description)
                  .map((cmd, i) => (
                    <li key={i}>{cmd.description}</li>
                  ))
                }
              </ul>
            </div>,
            {
              duration: 8000,
            }
          );
        },
        description: 'Show available voice commands'
      }
    ];
    
    registerCommands(defaultCommands);
  }, [navigate, registerCommands]);
  
  useEffect(() => {
    // Initialize available languages
    if (typeof window !== 'undefined' && navigator.languages) {
      setAvailableLanguages(navigator.languages);
    }
    
    // Set up default commands
    initDefaultCommands();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initDefaultCommands]);
  
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    recognitionRef.current = initRecognition();
    
    if (options.autoStart && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  }, [currentLanguage, initRecognition, options.autoStart]);
  
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  }, [initRecognition, isListening]);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
  }, []);
  
  const changeLanguage = useCallback((language: string) => {
    setCurrentLanguage(language);
  }, []);
  
  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    registerCommands,
    changeLanguage,
    currentLanguage,
    availableLanguages
  };
};
