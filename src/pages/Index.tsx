import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { speechService } from "@/utils/speech";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2, BookOpen, RotateCw, UploadCloud } from "lucide-react";
import { extractTextFromPDF } from "@/utils/pdfProcessing";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VoiceControls } from "@/components/VoiceControls";
import { TextSummary } from "@/components/TextSummary";
import { generateSummary } from "@/utils/summarizer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UploadedFile {
  id: string;
  name: string;
  pdf_url: string;
}

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [contentProcessed, setContentProcessed] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');

  const abortController = useRef(new AbortController());

  useEffect(() => {
    loadPreviousUploads();
    speechService.setStateChangeCallback(setIsPlaying);
    
    return () => {
      abortController.current.abort();
      speechService.stop();
    };
  }, []);

  const loadPreviousUploads = async () => {
    try {
      console.log("Loading previous uploads...");
      const { data, error } = await supabase
        .from('newspapers')
        .select('id, title, pdf_url')
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching uploads:", error);
        throw error;
      }

      console.log("Fetched data:", data);

      if (data) {
        const formattedData: UploadedFile[] = data.map(item => ({
          id: item.id,
          name: item.title,
          pdf_url: item.pdf_url || ''
        }));
        console.log("Formatted data:", formattedData);
        setUploadedFiles(formattedData);
      }
    } catch (err) {
      console.error("Error loading previous uploads:", err);
      toast.error("Failed to load previous uploads");
    }
  };

  const resetFileState = () => {
    speechService.stop();
    setSelectedFile(null);
    setExtractedText("");
    setSummary(null);
    setIsLoading(false);
    setContentProcessed(false);
    setActiveTab("content");
  };

  const handleDeleteConfirmation = async () => {
    speechService.stop(); // Stop any ongoing speech
  
    if (!fileToDelete) {
      setIsModalOpen(false);
      return;
    }
  
    try {
      console.log("Starting deletion for file ID:", fileToDelete.id);
  
      // Delete from the database
      const { error: dbError, data: deletedData } = await supabase
        .from('newspapers')
        .delete()
        .eq('id', fileToDelete.id)
        .select();
  
      if (dbError) {
        console.error("Database deletion error:", dbError);
        throw dbError;
      }
  
      console.log("Database deletion response:", deletedData);
  
      // Verification: check if any record still exists
      const { data: checkData, error: checkError } = await supabase
        .from('newspapers')
        .select('id')
        .eq('id', fileToDelete.id)
        .limit(1);
  
      if (checkError) {
        console.error("Error verifying deletion:", checkError);
        throw checkError;
      }
  
      if (checkData && checkData.length > 0) {
        console.error("❌ Deletion verification failed - record still exists:", checkData);
        throw new Error("Failed to delete record from database");
      }
  
      console.log("✅ Deletion verification passed - record no longer exists");
  
      // Extract the file name from the URL
      const urlParts = fileToDelete.pdf_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
  
      // Delete from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('newspapers')
        .remove([fileName]);
  
      if (storageError) {
        console.warn("Storage deletion error:", storageError);
        toast.warning("File deleted from database but storage cleanup failed");
      } else {
        console.log("✅ Storage file deleted successfully");
      }
  
      // Update local state to remove the file from the list
      setUploadedFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
  
      // Reset file view if the deleted file is active
      if (selectedFile && 'name' in selectedFile && selectedFile.name === fileToDelete.name) {
        setSelectedFile(null);
        setExtractedText("");
      }
  
      toast.success("File deleted successfully");
    } catch (err) {
      console.error("Error in deletion process:", err);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setFileToDelete(null);
      setIsModalOpen(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      resetFileState(); // Reset previous file state
      toast.loading("Extracting text from PDF...");
      setIsLoading(true);
      setSelectedFile(file); // Set the file immediately

      console.log("Processing PDF file:", file.name, "Size:", (file.size / (1024 * 1024)).toFixed(2) + "MB");
      
      const text = await extractTextFromPDF(file);
      console.log("Text extracted, length:", text.length, "characters");
      setExtractedText(text);

      if (text.trim().length < 50) {
        toast.warning("Limited text could be extracted. This might be a scanned document.");
      } else {
        toast.success("PDF text extracted successfully!");
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('newspapers')
        .upload(filePath, file);

      if (storageError) {
        console.error("Storage error:", storageError);
        toast.error("Failed to upload PDF to storage");
        throw storageError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('newspapers')
        .getPublicUrl(filePath);

      const { data: dbData, error: dbError } = await supabase
        .from('newspapers')
        .insert({
          title: file.name,
          extracted_text: text.substring(0, 10000),
          pdf_url: publicUrl
        })
        .select();

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Failed to save PDF information");
        throw dbError;
      }

      loadPreviousUploads();
      setContentProcessed(true); // Mark content as processed

    } catch (error: any) {
      toast.dismiss();
      console.error('Processing Error:', error);
      toast.error(error.message || 'Error processing PDF!');
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  const handleStartSpeech = () => {
    if (extractedText) {
      speechService.setLanguage(currentLanguage);
      speechService.speak(extractedText, speed, pitch);
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
    if (extractedText) {
      speechService.speak(extractedText, speed, pitch);
    }
  };

  const handleSkipForward = () => {
    speechService.stop();
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    speechService.setSpeed(value);

    if (isPlaying && extractedText) {
      speechService.stop();
      setTimeout(() => {
        speechService.speak(extractedText, value, pitch);
      }, 100);
    }
  };

  const handlePitchChange = (value: number) => {
    setPitch(value);
    speechService.setPitch(value);

    if (isPlaying && extractedText) {
      speechService.stop();
      setTimeout(() => {
        speechService.speak(extractedText, speed, value);
      }, 100);
    }
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    speechService.setVoice(voiceName);

    if (isPlaying && extractedText) {
      speechService.stop();
      setTimeout(() => {
        speechService.speak(extractedText, speed, pitch);
      }, 100);
    }
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    speechService.setLanguage(language);
    
    if (isPlaying && extractedText) {
      speechService.stop();
      setTimeout(() => {
        speechService.speak(extractedText, speed, pitch);
      }, 100);
    }
  };

  const handleLoadSaved = async (id: string, shouldAutoPlay = false) => {
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
      setSummary(null);
      setContentProcessed(true);

      toast.success("Document loaded successfully!");

      if (shouldAutoPlay) {
        await new Promise(resolve => setTimeout(resolve, 500));
        speechService.speak(data.extracted_text || '', speed, pitch);
      }

    } catch (error: any) {
      console.error('Error loading saved document:', error);
      toast.error(error.message || 'Failed to load document');
    } finally {
      toast.dismiss();
    }
  };

  const handleSummarize = async () => {
    if (!extractedText || extractedText.trim().length < 100) {
      toast.warning("Not enough text to summarize");
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await generateSummary(extractedText);
      setSummary(result);
      toast.success("Summary generated successfully");
      setActiveTab("summary");
    } catch (error) {
      console.error("Summarization error:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="flex">
      <div className="flex-1 relative">
        <div className="min-h-screen pb-24 page-transition">
          <div className="container max-w-4xl mx-auto py-12">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-brand-purple">PDF Voice Reader</h1>
              <p className="text-lg text-muted-foreground">
                Upload, read, and listen to your PDFs with AI-powered insights
              </p>
            </div>

            {isLoading && (
              <div className="text-center my-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-2">Processing PDF, please wait...</p>
              </div>
            )}

            <div className="space-y-6">
              <FileUpload 
                onFileSelect={handleFileSelect} 
                resetFileState={resetFileState}
                showResetButton={contentProcessed}
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-8 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                      Previously Uploaded Documents
                    </h2>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadPreviousUploads}
                    >
                      <RotateCw className="mr-2 h-4 w-4" /> Refresh List
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {uploadedFiles.map((file) => (
                      <Card 
                        key={file.id} 
                        className="group relative card-hover overflow-hidden"
                      >
                        <CardContent
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => handleLoadSaved(file.id, false)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <BookOpen className="w-4 h-4 text-brand-purple flex-shrink-0" />
                            <p className="truncate max-w-[200px]">
                              {file.name}
                            </p>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-red-500 ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDelete(file);
                              setIsModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete "{fileToDelete?.name}"?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this PDF? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsModalOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirmation}>
                      Confirm Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {selectedFile && contentProcessed && (
              <Card className="animate-fade-up shadow-soft mt-6">
                <CardHeader>
                  <CardTitle>{selectedFile.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-muted-foreground">
                        Your PDF has been processed. Use the controls below to listen to the text.
                      </p>
                      <Button
                        onClick={handleStartSpeech}
                        variant="outline"
                        size="sm"
                        className="text-brand-purple hover:bg-brand-purple/10"
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Start Reading
                      </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content">PDF Content</TabsTrigger>
                        <TabsTrigger value="summary">AI Summary</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="content">
                        <div className="max-h-96 overflow-y-auto p-4 bg-muted/50 rounded border">
                          {extractedText ? (
                            <div className="whitespace-pre-line">{extractedText}</div>
                          ) : (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>No text could be extracted from this PDF.</AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="summary">
                        <TextSummary 
                          originalText={extractedText}
                          onSummarize={handleSummarize}
                          summary={summary}
                          isLoading={isSummarizing}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <VoiceControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            onSpeedChange={handleSpeedChange}
            onPitchChange={handlePitchChange}
            onVoiceChange={handleVoiceChange}
            speed={speed}
            pitch={pitch}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
