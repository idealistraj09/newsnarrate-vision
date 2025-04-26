
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TextSummaryProps {
  originalText: string;
  onSummarize: () => void;
  summary: string | null;
  isLoading: boolean;
}

export const TextSummary: React.FC<TextSummaryProps> = ({
  originalText,
  onSummarize,
  summary,
  isLoading
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Summary copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy summary");
    }
  };

  const getWordCount = (text: string): number => {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  const originalWordCount = getWordCount(originalText);
  const summaryWordCount = summary ? getWordCount(summary) : 0;
  const reductionPercentage = originalWordCount > 0 && summary 
    ? Math.round((1 - summaryWordCount / originalWordCount) * 100) 
    : 0;

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">AI Summary</h3>
        
        <div className="flex items-center gap-2">
          {summary && (
            <Badge variant="outline" className="text-brand-purple">
              {reductionPercentage}% shorter
            </Badge>
          )}
          
          <Button 
            onClick={onSummarize} 
            disabled={isLoading || !originalText}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Summarizing...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Summarize
              </>
            )}
          </Button>
        </div>
      </div>

      {summary ? (
        <div className="relative">
          <div className="p-4 bg-secondary/40 rounded-lg border border-border text-foreground relative">
            <p className="whitespace-pre-line">{summary}</p>
            
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 opacity-70 hover:opacity-100"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground flex justify-between">
            <span>{summaryWordCount} words</span>
            <span>AI-generated summary</span>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-secondary/20 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p>Analyzing text and generating summary...</p>
              <p className="text-xs mt-1">This might take a moment for longer documents</p>
            </>
          ) : (
            <>
              <BookOpen className="h-8 w-8 mb-2" />
              <p>Click "Summarize" to generate an AI summary of this document</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
