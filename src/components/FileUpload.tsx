
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Info, AlertTriangle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { extractTextFromPDF } from "@/utils/pdfProcessing";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  resetFileState?: () => void;
  showResetButton?: boolean;
}

export const FileUpload = ({ onFileSelect, resetFileState, showResetButton = false }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<{ pages: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFileError(null);
    setPdfInfo(null);

    const file = acceptedFiles[0];

    if (!file || file.type !== "application/pdf") {
      setFileError("Please upload a valid PDF file");
      toast.error("Please upload a valid PDF file");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setFileError("PDF file is too large. Maximum size is 30MB.");
      toast.error("PDF file is too large. Maximum size is 30MB.");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.loading("Processing PDF file...");

      // Extract text from PDF
      await extractTextFromPDF(file);

      // If we got here without errors, the PDF is valid
      toast.success("PDF processed successfully!");
      
      // Call the parent's callback with the file
      onFileSelect(file);
    } catch (err: any) {
      console.error("PDF processing failed:", err);
      setFileError(`Error processing PDF: ${err.message}`);
      toast.error(`Error processing PDF: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
      toast.dismiss();
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    disabled: isAnalyzing,
  });

  const handleReset = () => {
    if (resetFileState) {
      resetFileState();
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isAnalyzing ? "opacity-50 cursor-not-allowed" : ""
        } ${
          isDragActive || isDragging
            ? "border-brand-purple bg-brand-purple/5"
            : "border-muted-foreground/25 hover:border-brand-purple/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isAnalyzing ? (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-brand-purple border-t-transparent animate-spin"></div>
              <p className="text-lg font-medium">Processing PDF...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-brand-purple" />
              <div className="text-center">
                <p className="text-lg font-medium">Drag and drop your PDF here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to select a file (max 30MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {resetFileState && showResetButton && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="text-brand-purple hover:bg-brand-purple/10"
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Upload Another PDF
          </Button>
        </div>
      )}

      <div className="text-sm text-muted-foreground mt-4">
        <p className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Supported format: PDF files only
        </p>
        <p className="flex items-center gap-2 mt-2">
          <Info className="h-4 w-4" />
          For best results, use PDFs with selectable text rather than scanned images.
        </p>
      </div>
    </div>
  );
};
