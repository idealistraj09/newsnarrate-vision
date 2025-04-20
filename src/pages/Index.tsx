import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
// Removed the import for VoiceControls due to the error
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { speechService } from "@/utils/speech";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2 } from "lucide-react";
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
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { VoiceControls } from "@/components/VoiceControls";

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
      const { data, error } = await supabase
        .from('newspapers')
        .select('id, title, pdf_url')
        .order('uploaded_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const formattedData: UploadedFile[] = data.map(item => ({
          id: item.id,
          name: item.title,
          pdf_url: item.pdf_url || ''
        }));
        setUploadedFiles(formattedData);
      }
    } catch (err) {
      console.error("Error loading previous uploads:", err);
      toast.error("Failed to load previous uploads");
    }
  };
  const handleDeleteConfirmation = async () => {
    window.speechSynthesis.cancel(); // Stop speech
    console.log("Deleting file:", fileToDelete);

    if (!fileToDelete) return;

    try {
      // Extract the file path from the URL
      const filePath = fileToDelete.pdf_url.split("/").pop();

      if (!filePath) throw new Error("Invalid file URL");

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from("newspapers")
        .remove([filePath]);

      if (error) throw error;

      // Remove from local state
      setUploadedFiles((prev) =>
        prev.filter((file) => file.id !== fileToDelete.id)
      );

      toast.success("File deleted successfully");

    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("Failed to delete file");
    } finally {
      setFileToDelete(null);
      setIsModalOpen(false);
    }
  };




  const handleFileSelect = async (file: File) => {
    try {
      setSelectedFile(file);
      toast.loading("Extracting text from PDF...");
      setIsLoading(true);

      const text = await extractTextFromPDF(file);
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

      await new Promise(resolve => setTimeout(resolve, 500));
      speechService.speak(text, speed, pitch);

    } catch (error: any) {
      toast.dismiss();
      console.error('Processing Error:', error);
      toast.error(error.message || 'Error processing PDF!');
    } finally {
      setIsLoading(false);
      toast.dismiss();
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

  const handleLoadSaved = async (id: string, shouldAutoPlay = true) => {
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

  return (
    <div className="min-h-screen pb-24 page-transition">
      <div className="container max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">PDF Voice Reader</h1>
          <p className="text-lg text-muted-foreground">
            Upload your PDF and listen to it read aloud with clean, natural voice
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
                    <Card key={file.id} className="group relative">
                      <CardContent
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleLoadSaved(file.id, true)}
                      >
                        <p className="truncate">{file.name}</p>

                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileToDelete(file);
                            setIsModalOpen(true);
                          }}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>

                      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete “{fileToDelete?.name}”?</AlertDialogTitle>
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
                    </Card>


                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{selectedFile.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your PDF has been processed. Use the controls below to listen to the text.
                </p>
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
  );
};

export default Index;
