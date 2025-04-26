
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle, Info, AlertTriangle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { hasPDFExtractableText, estimatePDFPageCount, extractTextFromPDF } from "@/utils/pdfProcessing";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  resetFileState?: () => void;
  showResetButton?: boolean;
}

export const FileUpload = ({ onFileSelect, resetFileState, showResetButton = false }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pdfInfo, setPdfInfo] = useState<{ pages: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Reset previous state
    setFileError(null);
    setFileWarning(null);
    setPdfInfo(null);

    const file = acceptedFiles[0];

    if (!file || file.type !== "application/pdf") {
      setFileError("Please upload a valid PDF file");
      toast.error("Please upload a valid PDF file");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError("PDF file is too large. Maximum size is 15MB.");
      toast.error("PDF file is too large. Maximum size is 15MB.");
      return;
    }

    try {
      setIsAnalyzing(true);
      toast.info("Analyzing PDF file...");

      const arrayBuffer = await file.arrayBuffer();
      const pageCount = await estimatePDFPageCount(arrayBuffer);
      setPdfInfo({ pages: pageCount });

      const sampleText = await extractTextFromPDF(file);
      const hasText = await hasPDFExtractableText(file);

      const isLikelyPoorQuality =
        sampleText.includes("Text/Image") ||
        sampleText.includes("endobj") ||
        sampleText.includes("XObject") ||
        /[^\x20-\x7E\s.,?!;:'"()[\]{}]/.test(sampleText.slice(0, 500)) ||
        sampleText.split(/\s+/).filter(w => w.length > 2).length < 20;

      if (isLikelyPoorQuality) {
        setFileWarning("This PDF may contain scanned content or complex formatting. Text extraction quality might be limited.");
        toast.warning("This PDF may have limited extractable text or complex formatting.");
      } else if (!hasText) {
        setFileWarning("This PDF might have limited extractable text. Results may vary.");
        toast.warning("Limited extractable text found.");
      } else {
        toast.success("PDF file contains clean, extractable text!");
      }

      onFileSelect(file);
    } catch (err: any) {
      console.error("PDF analysis failed:", err);
      toast.error("Error analyzing PDF file: " + err.message);
    } finally {
      setIsAnalyzing(false);
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
              <p className="text-lg font-medium">Analyzing PDF...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-brand-purple" />
              <div className="text-center">
                <p className="text-lg font-medium">Drag and drop your PDF here</p>
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

      {fileWarning && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{fileWarning}</AlertDescription>
        </Alert>
      )}

      {pdfInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            PDF with approximately {pdfInfo.pages} {pdfInfo.pages === 1 ? "page" : "pages"} detected.
          </AlertDescription>
        </Alert>
      )}

      {/* Add a reset button if resetFileState is provided and showResetButton is true */}
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
