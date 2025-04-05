
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasPDFExtractableText, estimatePDFPageCount } from "@/utils/pdfProcessing";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<{pages: number} | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFileError(null);
    setPdfInfo(null);
    const file = acceptedFiles[0];
    
    if (file && file.type === "application/pdf") {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit
        setFileError("PDF file is too large. Maximum size is 15MB.");
        toast.error("PDF file is too large. Maximum size is 15MB.");
        return;
      }
      
      try {
        setIsAnalyzing(true);
        toast.info("Analyzing PDF file...");
        
        // Get page count estimate
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const pageCount = estimatePDFPageCount(e.target.result as ArrayBuffer);
            setPdfInfo({ pages: pageCount });
            
            // Check if PDF has extractable text
            const hasText = await hasPDFExtractableText(file);
            
            if (!hasText) {
              toast.warning("This PDF might have limited extractable text. Results may vary.", {
                duration: 5000
              });
            }
            
            toast.success("PDF file selected successfully!");
            onFileSelect(file);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Error analyzing PDF:", error);
        toast.error("Error analyzing PDF file");
      } finally {
        setIsAnalyzing(false);
      }
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
    disabled: isAnalyzing
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isAnalyzing ? "opacity-50 cursor-not-allowed" : ""
        } ${
          isDragActive || isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          {isAnalyzing ? (
            <>
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="text-lg font-medium">Analyzing PDF...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium">Drag and drop your newspaper PDF here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to select a file (max 15MB)
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
      
      {pdfInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            PDF with approximately {pdfInfo.pages} {pdfInfo.pages === 1 ? 'page' : 'pages'} detected.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="text-sm text-muted-foreground mt-4">
        <p className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> 
          Supported format: PDF files only
        </p>
        <p className="flex items-center gap-2 mt-2">
          <Info className="h-4 w-4" /> 
          For best results, use PDFs with selectable text. Our enhanced reader works with most modern PDF files.
        </p>
      </div>
    </div>
  );
};
