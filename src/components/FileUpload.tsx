
import React, { useState, useCallback } from "react";
import { Upload, FileUp, Loader } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileLoaded: (data: any[]) => void;
  onError: (error: Error) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  onError
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        throw new Error("Please upload a CSV file");
      }
      setFileName(file.name);
      setIsProcessing(true);
      setProgress(0);

      const { parseCSV } = await import("../utils/csvUtils");
      const data = await parseCSV(file, (progressValue) => {
        setProgress(progressValue);
      });
      
      // Add a small delay to show 100% completion before finishing
      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        onFileLoaded(data);
      }, 500);
    } catch (error) {
      setFileName(null);
      setIsProcessing(false);
      onError(error instanceof Error ? error : new Error("Unknown error occurred"));
    }
  }, [onFileLoaded, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div className="mb-6">
      <p className="text-gray-600 mb-4">
        Upload a CSV file to start finding duplicates
      </p>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-app-blue bg-blue-50" : "border-gray-300 hover:border-app-blue"
        }`} 
        onDrop={handleDrop} 
        onDragOver={handleDragOver} 
        onDragLeave={handleDragLeave} 
        onClick={() => document.getElementById("fileInput")?.click()}
      >
        <input 
          id="fileInput" 
          type="file" 
          accept=".csv" 
          className="hidden" 
          onChange={handleFileInput} 
        />
        
        <div className="flex flex-col items-center gap-2">
          {!fileName ? (
            <>
              <FileUp className="w-12 h-12 text-app-blue mb-2" strokeWidth={1.5} />
              <p className="text-lg font-medium">
                Drop your CSV file here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Upload any CSV file with column headers
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Large files will be processed in chunks to prevent browser freezing
              </p>
            </>
          ) : isProcessing ? (
            <>
              <Loader className="w-12 h-12 text-app-blue mb-2 animate-spin" strokeWidth={1.5} />
              <p className="text-lg font-medium text-app-blue">
                Processing file...
              </p>
              <p className="text-sm text-gray-700">{fileName}</p>
              <div className="w-full mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{progress}% complete</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-green-600 mb-2" strokeWidth={1.5} />
              <p className="text-lg font-medium text-green-600">
                File uploaded successfully!
              </p>
              <p className="text-sm text-gray-700">{fileName}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
