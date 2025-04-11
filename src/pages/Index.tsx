
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import ThresholdSlider from "@/components/ThresholdSlider";
import ResultsTable from "@/components/ResultsTable";
import CSVFormatGuide from "@/components/CSVFormatGuide";
import DuplicateArticlesButton from "@/components/DuplicateArticlesButton";
import Header from "@/components/Header";
import { ArticleData, downloadCSV, generateSampleCSV } from "@/utils/csvUtils";
import { DuplicatePair, findDuplicates, deduplicate } from "@/utils/fuzzyMatchUtils";

const Index: React.FC = () => {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [threshold, setThreshold] = useState<number>(85);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

    try {
      // Using setTimeout to ensure the UI updates for processing state
      setTimeout(() => {
        const newDuplicates = findDuplicates(articles, threshold);
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
      }, 500);
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
        <Header />
        
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
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
              
              <DuplicateArticlesButton 
                onClick={handleDeduplicate}
                disabled={articles.length === 0}
                isProcessing={isProcessing}
              />
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

export default Index;
