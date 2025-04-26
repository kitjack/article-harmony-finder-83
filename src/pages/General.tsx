import React, { useState, useCallback } from "react";
import { ArrowLeft, FileDigit, Coffee, Download, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import ThresholdSlider from "@/components/ThresholdSlider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DuplicateArticlesButton from "@/components/DuplicateArticlesButton";
import ResultsTable from "@/components/ResultsTable";
import { toast } from "sonner";
import { findDuplicatesForGeneralData, DuplicatePair } from "@/utils/generalDuplicationUtils";
import { downloadCSV } from "@/utils/csvUtils";

const General: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [threshold, setThreshold] = useState<number>(85);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileLoaded = useCallback((loadedData: any[]) => {
    setData(loadedData);
    setDuplicates([]);
    setSelectedColumns([]); // Reset selected columns when new file is loaded

    // Extract column names from the first row
    if (loadedData.length > 0) {
      const columns = Object.keys(loadedData[0]);
      setAvailableColumns(columns);
      
      toast.success("CSV file loaded successfully!", {
        description: `Found ${columns.length} columns and ${loadedData.length} records`,
      });
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    toast.error("Error processing file", {
      description: error.message,
    });
  }, []);

  const handleThresholdChange = useCallback((value: number) => {
    setThreshold(value);
    
    // If we already have duplicates, recalculate based on new threshold
    if (data.length > 0 && duplicates.length > 0 && selectedColumns.length > 0) {
      const newDuplicates = findDuplicatesForGeneralData(data, selectedColumns, value);
      setDuplicates(newDuplicates);
    }
  }, [data, duplicates, selectedColumns]);

  const handleColumnToggle = useCallback((column: string) => {
    setSelectedColumns(prev => {
      // If column is already selected, remove it
      if (prev.includes(column)) {
        return prev.filter(col => col !== column);
      }
      
      // If trying to add more than 2 columns, show warning and don't add
      if (prev.length >= 2) {
        toast.warning("Column selection limit reached", {
          description: "You can only select up to 2 columns for comparison"
        });
        return prev;
      }
      
      // Add the new column
      return [...prev, column];
    });
  }, []);

  const handleDeduplicate = useCallback(async () => {
    if (data.length === 0) {
      toast.error("No data to process", {
        description: "Please upload a CSV file first",
      });
      return;
    }

    if (selectedColumns.length === 0) {
      toast.error("No columns selected", {
        description: "Please select at least one column for comparison",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Using setTimeout to ensure the UI updates for processing state
      setTimeout(() => {
        const newDuplicates = findDuplicatesForGeneralData(data, selectedColumns, threshold);
        setDuplicates(newDuplicates);
        
        if (newDuplicates.length === 0) {
          toast.info("No duplicates found", {
            description: "All records appear to be unique based on current threshold"
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
  }, [data, selectedColumns, threshold]);

  const handleDownloadDuplicates = useCallback(() => {
    if (duplicates.length === 0) return;
    
    // Create a flattened array of duplicate pairs
    const flatData = duplicates.map(pair => {
      const record: any = {};
      
      selectedColumns.forEach(col => {
        record[`${col} 1`] = pair.record1[col];
        record[`${col} 2`] = pair.record2[col];
      });
      
      record["Similarity"] = `${pair.similarity}%`;
      return record;
    });
    
    downloadCSV(flatData, "duplicate-records.csv");
    toast.success("Duplicate pairs downloaded");
  }, [duplicates, selectedColumns]);

  const handleDownloadDeduplicated = useCallback(() => {
    if (data.length === 0 || duplicates.length === 0) return;
    
    // Create a set of indices to remove
    const indicesToRemove = new Set<number>();
    duplicates.forEach(pair => {
      indicesToRemove.add(pair.index2);
    });
    
    // Filter the original data to remove duplicates
    const deduplicatedData = data.filter((_, index) => !indicesToRemove.has(index));
    
    downloadCSV(deduplicatedData, "deduplicated-data.csv");
    toast.success("Deduplicated dataset downloaded", {
      description: `${data.length - deduplicatedData.length} duplicates removed`
    });
  }, [data, duplicates]);

  const generateSampleCSV = useCallback(() => {
    const headers = ["Name", "Email", "Phone", "Address", "Company"];
    const rows = [
      ["John Smith", "john.smith@example.com", "555-1234", "123 Main St", "ACME Inc"],
      ["J. Smith", "john.smith@example.com", "555-1234", "123 Main Street", "ACME Inc"],
      ["Jane Doe", "jane.doe@example.com", "555-5678", "456 Oak Ave", "XYZ Corp"],
      ["Janet Doe", "jane.doe@example.com", "555-5678", "456 Oak Avenue", "XYZ Corp"],
      ["Michael Johnson", "mike@example.com", "555-9012", "789 Pine Rd", "ABC Ltd"],
      ["Robert Wilson", "robert@example.com", "555-3456", "101 Elm Blvd", "QRS Company"],
      ["Sarah Brown", "sarah@example.com", "555-7890", "202 Cedar Ln", "LMN Industries"]
    ];

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-contacts.csv";
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success("Sample CSV downloaded");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-indigo-600">
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
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <FileDigit className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Deduper
                </h1>
                <p className="text-indigo-100">
                  General Purpose Deduplication
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="bg-white hover:bg-gray-100 text-purple-600 flex items-center gap-2"
            >
              <Coffee className="h-4 w-4" />
              <span>Buy Me a Coffee</span>
            </Button>
          </div>

          <h2 className="text-xl md:text-2xl text-white font-light">
            Deduplicate any dataset with customizable matching criteria
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
                  onClick={generateSampleCSV}
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
                Select up to 2 columns to compare and set similarity threshold
              </p>
              
              {availableColumns.length > 0 && (
                <div className="mb-6">
                  <Alert className="mb-4">
                    <Search className="h-4 w-4" />
                    <AlertDescription>
                      Select 1-2 columns that contain the values you want to compare for finding duplicates
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-wrap gap-2">
                    {availableColumns.map(column => (
                      <Button
                        key={column}
                        variant={selectedColumns.includes(column) ? "default" : "outline"}
                        size="sm"
                        className={selectedColumns.includes(column) ? "bg-purple-600 hover:bg-purple-700" : ""}
                        onClick={() => handleColumnToggle(column)}
                      >
                        {column}
                      </Button>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedColumns.length}/2 columns selected
                  </p>
                </div>
              )}
              
              <ThresholdSlider 
                threshold={threshold} 
                onChange={handleThresholdChange} 
              />
              
              <DuplicateArticlesButton 
                onClick={handleDeduplicate}
                disabled={data.length === 0 || selectedColumns.length === 0}
                isProcessing={isProcessing}
                buttonText="Find Duplicates"
              />
            </div>
          </div>
          
          <ResultsTable 
            duplicates={duplicates}
            onDownloadOriginal={handleDownloadDuplicates}
            onDownloadDeduplicated={handleDownloadDeduplicated}
            totalArticles={data.length}
            allArticles={data}
          />
        </div>
      </div>
    </div>
  );
};

export default General;
