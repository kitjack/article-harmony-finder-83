
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import ThresholdSlider from "@/components/ThresholdSlider";
import ResultsTable from "@/components/ResultsTable";
import CSVFormatGuide from "@/components/CSVFormatGuide";
import DuplicateArticlesButton from "@/components/DuplicateArticlesButton";
import { Progress } from "@/components/ui/progress";
import { ArticleData, downloadCSV, generateSampleCSV } from "@/utils/csvUtils";
import { DuplicatePair, findDuplicates, deduplicate } from "@/utils/fuzzyMatchUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, FileDigit, Coffee, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [threshold, setThreshold] = useState<number>(85);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const navigate = useNavigate();

  const handleFileLoaded = useCallback((data: ArticleData[]) => {
    setArticles(data);
    setDuplicates([]);
    toast.success("CSV file loaded successfully!", {
      description: `Loaded ${data.length} articles`,
    });
  }, []);

  const handleError = useCallback((error: Error) => {
    toast.error("Error processing file", {
      description: error.message,
    });
  }, []);

  const handleThresholdChange = useCallback((value: number) => {
    setThreshold(value);
    
    // If we already have duplicates, recalculate based on new threshold
    if (articles.length > 0 && duplicates.length > 0) {
      const newDuplicates = findDuplicates(articles, value);
      setDuplicates(newDuplicates);
    }
  }, [articles, duplicates]);

  const handleDeduplicate = useCallback(async () => {
    if (articles.length === 0) {
      toast.error("No data to process", {
        description: "Please upload a CSV file first",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Using the new chunked processing function
      const newDuplicates = await findDuplicates(
        articles, 
        threshold,
        setProcessingProgress
      );
      
      setDuplicates(newDuplicates);
      
      if (newDuplicates.length === 0) {
        toast.info("No duplicates found", {
          description: "All articles appear to be unique based on current threshold"
        });
      } else {
        toast.success("Duplicate analysis complete", {
          description: `Found ${newDuplicates.length} potential duplicates`
        });
      }
      
      setIsProcessing(false);
      setProcessingProgress(100);
    } catch (error) {
      setIsProcessing(false);
      toast.error("Error during deduplication", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }, [articles, threshold]);

  const handleDownloadDuplicates = useCallback(() => {
    if (duplicates.length === 0) return;
    
    // Create a flattened array of duplicate pairs
    const flatData = duplicates.map(pair => ({
      "Title 1": pair.article1.Title,
      "Doi 1": pair.article1.Doi,
      "Title 2": pair.article2.Title,
      "Doi 2": pair.article2.Doi,
      "Similarity": `${pair.similarity}%`
    }));
    
    downloadCSV(flatData, "duplicate-articles.csv");
    toast.success("Duplicate pairs downloaded");
  }, [duplicates]);

  const handleDownloadDeduplicated = useCallback(() => {
    if (articles.length === 0 || duplicates.length === 0) return;
    
    const deduplicatedData = deduplicate(articles, duplicates);
    downloadCSV(deduplicatedData, "deduplicated-articles.csv");
    
    toast.success("Deduplicated dataset downloaded", {
      description: `${articles.length - deduplicatedData.length} duplicates removed`
    });
  }, [articles, duplicates]);

  const handleDownloadSample = useCallback(() => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-articles.csv";
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success("Sample CSV downloaded");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-app-blue to-app-blue-light">
      <div className="container mx-auto px-4 pb-16">
        <div className="py-6">
          <Button
            variant="outline"
            className="bg-white mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
              <FileDigit className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">Deduper</h1>
                <p className="text-blue-100">Article Harmony</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-100 text-app-blue flex items-center gap-2"
            >
              <Coffee className="h-4 w-4" />
              <span>Buy Me a Coffee</span>
            </Button>
          </div>
          
          <h2 className="text-xl md:text-2xl text-white font-light">
            Deduplicate your article database with precision and ease
          </h2>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Upload Your CSV File</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleDownloadSample}
                >
                  <Download className="h-4 w-4" />
                  Sample CSV
                </Button>
              </div>
              
              <FileUpload 
                onFileLoaded={handleFileLoaded} 
                onError={handleError} 
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-2">Configure Settings</h2>
              <p className="text-gray-600 mb-4">
                Adjust how similar titles need to be to count as duplicates
              </p>
              
              <ThresholdSlider 
                threshold={threshold} 
                onChange={handleThresholdChange} 
              />
              
              {isProcessing ? (
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader className="h-5 w-5 text-app-blue animate-spin" />
                    <span className="font-medium text-app-blue">
                      Processing data in chunks...
                    </span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {processingProgress}% complete
                  </p>
                </div>
              ) : (
                <DuplicateArticlesButton 
                  onClick={handleDeduplicate}
                  disabled={articles.length === 0}
                  isProcessing={false}
                />
              )}
            </div>
          </div>
          
          <ResultsTable 
            duplicates={duplicates}
            onDownloadOriginal={handleDownloadDuplicates}
            onDownloadDeduplicated={handleDownloadDeduplicated}
            totalArticles={articles.length}
            allArticles={articles}
          />
          
          <CSVFormatGuide onDownloadSample={handleDownloadSample} />
        </div>
      </div>
    </div>
  );
};

export default Articles;
