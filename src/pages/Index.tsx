
import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { VoiceControls } from "@/components/VoiceControls";
import { toast } from "sonner";
import * as pdfjs from 'pdfjs-dist';
import { supabase } from "@/integrations/supabase/client";
import { speechService } from "@/utils/speech";
import { textToSpeech } from "@/utils/googleTTS";
import { Card, CardContent } from "@/components/ui/card";

// Ensure proper PDF.js worker configuration
const pdfWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; id: string }[]>([]);

  // Add abort controller for cleanup
  const abortController = useRef(new AbortController());

  useEffect(() => {
    // Initialize PDF.js
    console.log("PDF.js worker initialized with:", pdfWorkerSrc);
    
    // Load previous uploads
    loadPreviousUploads();
    
    speechService.setStateChangeCallback(setIsPlaying);
    return () => {
      abortController.current.abort();
      speechService.stop();
    };
  }, []);

  const loadPreviousUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('newspapers')
        .select('id, title')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        setUploadedFiles(data.map(file => ({ name: file.title, id: file.id })));
      }
    } catch (err) {
      console.error("Error loading previous uploads:", err);
    }
  };

  // Improved text extraction with better error handling
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log("Extracting text from PDF:", file.name);
      setIsLoading(true);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log("File loaded into buffer, size:", arrayBuffer.byteLength);
      
      // Load the PDF document
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        disableAutoFetch: true,
        disableStream: true
      });
      
      console.log("PDF loading task created");
      const pdf = await loadingTask.promise;
      console.log("PDF loaded successfully with", pdf.numPages, "pages");

      let fullText = '';
      const pagesToParse = Math.min(pdf.numPages, 50); // Limit to 50 pages

      for (let i = 1; i <= pagesToParse; i++) {
        if (abortController.current.signal.aborted) break;
        
        console.log(`Processing page ${i}/${pagesToParse}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += pageText.replace(/\s+/g, ' ') + '\n';
        
        // Provide feedback for long documents
        if (i % 5 === 0 && pagesToParse > 10) {
          toast.info(`Processing page ${i}/${pagesToParse}...`);
        }
      }

      console.log("Text extraction complete, length:", fullText.length);
      return fullText.trim();
    } catch (error) {
      console.error('PDF Extraction Error:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced file handling with validation and better error handling
  const handleFileSelect = async (file: File) => {
    try {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size exceeds 10MB limit');
      }

      setSelectedFile(file);
      toast.loading("Extracting text from PDF...");
      
      const text = await extractTextFromPDF(file);
      setExtractedText(text);
      
      toast.dismiss();
      toast.success("PDF text extracted successfully!");

      // Upload to Supabase
      const uploadPromise = supabase.storage
        .from('newspapers')
        .upload(`${crypto.randomUUID()}.pdf`, file);

      // TypeScript fix: Safely handle the response
      const { data: storageData, error: storageError } = await uploadPromise;

      toast.promise(
        uploadPromise,
        {
          loading: 'Uploading PDF...',
          success: 'PDF uploaded successfully!',
          error: 'Upload failed'
        }
      );

      if (storageError) throw storageError;

      // Database operations
      const { error: dbError } = await supabase
        .from('newspapers')
        .insert({
          title: file.name,
          extracted_text: text.substring(0, 10000), // Store first 10k chars
          pdf_url: storageData?.path || ''
        });

      if (dbError) throw dbError;
      
      // Refresh the file list
      loadPreviousUploads();

      // Add preload before speaking
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use Web Speech API by default with fallback to Google TTS
      try {
        speechService.speak(text, speed, pitch);
      } catch (speechError) {
        console.error("Web Speech API error, falling back to Google TTS:", speechError);
        const audioUrl = await textToSpeech({ 
          text: text.substring(0, 3000), // First 3000 chars for demo
          languageCode: 'en-US'
        });
        // Here you would handle playing the returned audio URL
        console.log("Google TTS URL (for demo):", audioUrl);
      }

    } catch (error: any) {
      toast.dismiss();
      setSelectedFile(null);
      setExtractedText('');
      console.error('Processing Error:', error);
      toast.error(error.message || 'Error processing PDF!');
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      speechService.pause();
    } else {
      if (extractedText) {
        speechService.resume();
      }
    }
  };

  const handleSkipBack = () => {
    // Reset and start from the beginning
    if (extractedText) {
      speechService.speak(extractedText, speed, pitch);
    }
  };

  const handleSkipForward = () => {
    // For now, this just stops the current speech
    speechService.stop();
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    speechService.setSpeed(value);
  };

  const handlePitchChange = (value: number) => {
    setPitch(value);
    speechService.setPitch(value);
  };

  const handleLoadSaved = async (id: string) => {
    try {
      toast.loading("Loading saved document...");
      const { data, error } = await supabase
        .from('newspapers')
        .select('title, extracted_text, pdf_url')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Document not found');

      setSelectedFile({ name: data.title } as File);
      setExtractedText(data.extracted_text || '');
      
      toast.success("Document loaded successfully!");
      
      // Start speaking the loaded text
      await new Promise(resolve => setTimeout(resolve, 500));
      speechService.speak(data.extracted_text || '', speed, pitch);
      
    } catch (error: any) {
      console.error('Error loading saved document:', error);
      toast.error(error.message || 'Failed to load document');
    } finally {
      toast.dismiss();
    }
  };

  return (
    <div className="min-h-screen pb-24 page-transition">
      <div className="container max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Voice Newspaper</h1>
          <p className="text-lg text-muted-foreground">
            Upload your newspaper PDF and listen to it
          </p>
        </div>

        {isLoading && (
          <div className="text-center my-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2">Processing PDF, please wait...</p>
          </div>
        )}

        {!selectedFile ? (
          <div className="space-y-6">
            <FileUpload onFileSelect={handleFileSelect} />
            
            {uploadedFiles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Previously Uploaded Documents</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {uploadedFiles.map((file) => (
                    <Card key={file.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleLoadSaved(file.id)}>
                      <CardContent className="p-4">
                        <p className="truncate">{file.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">
              {selectedFile.name}
            </h2>
            <p className="text-muted-foreground mb-4">
              Your PDF is ready. Use the controls below to manage playback.
            </p>
            <div className="max-h-96 overflow-y-auto p-4 bg-muted/50 rounded">
              {extractedText}
            </div>
          </div>
        )}
      </div>

      <VoiceControls
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onSkipBack={handleSkipBack}
        onSkipForward={handleSkipForward}
        onSpeedChange={handleSpeedChange}
        onPitchChange={handlePitchChange}
        speed={speed}
        pitch={pitch}
      />
    </div>
  );
};

export default Index;
