
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFileError(null);
    const file = acceptedFiles[0];
    
    if (file && file.type === "application/pdf") {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        setFileError("PDF file is too large. Maximum size is 15MB.");
        toast.error("PDF file is too large. Maximum size is 15MB.");
        return;
      }
      
      toast.success("PDF file selected successfully!");
      onFileSelect(file);
    } else {
      setFileError("Please upload a valid PDF file");
      toast.error("Please upload a valid PDF file");
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragActive || isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <Upload className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-medium">Drag and drop your newspaper PDF here</p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to select a file (max 15MB)
            </p>
          </div>
        </div>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}
      
      <div className="text-sm text-muted-foreground mt-4">
        <p className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> 
          Supported format: PDF files only
        </p>
        <p className="text-xs mt-1">
          Note: For best results, use PDFs with selectable text. This simple reader works with most modern PDF files.
        </p>
      </div>
    </div>
  );
};
