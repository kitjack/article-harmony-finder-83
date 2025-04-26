
import Papa from "papaparse";
import { saveAs } from "file-saver";

export interface ArticleData {
  Title: string;
  Doi: string;
  [key: string]: string;
}

export interface ParseProgressCallback {
  (progress: number): void;
}

export const parseCSV = (file: File, onProgress?: ParseProgressCallback): Promise<ArticleData[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    let hasHeaderRow = false;
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: (row, parser) => {
        if (!hasHeaderRow) {
          hasHeaderRow = true;
          return;
        }
        
        if (row.data && typeof row.data === 'object' && Object.keys(row.data).length > 0) {
          // Ensure all values are strings to prevent type errors during comparisons
          const sanitizedRow: any = {};
          Object.entries(row.data).forEach(([key, value]) => {
            if (value === null || value === undefined) {
              sanitizedRow[key] = "";
            } else if (typeof value === 'object') {
              sanitizedRow[key] = JSON.stringify(value);
            } else {
              sanitizedRow[key] = String(value);
            }
          });
          results.push(sanitizedRow);
        }
      },
      complete: () => {
        if (results.length === 0) {
          reject(new Error("No valid data found in CSV"));
          return;
        }
        
        // For article-specific validation
        if (file.name.includes("article") && !results.some(item => "Title" in item && "Doi" in item)) {
          reject(new Error("CSV must include 'Title' and 'Doi' columns"));
          return;
        }
        
        resolve(results);
      },
      error: (error) => {
        reject(error);
      },
      chunkSize: 1024 * 1024 * 5, // 5MB chunks
      worker: true,
      chunk: (results, parser) => {
        const totalRows = file.size / 50; // rough estimate of rows based on file size
        const processedRows = results.data.length;
        const progress = Math.min(Math.round((processedRows / totalRows) * 100), 99);
        
        if (onProgress) {
          onProgress(progress);
        }
      }
    });
  });
};

// For processing large datasets in chunks
export const processInChunks = <T, R>(
  items: T[],
  processFn: (chunk: T[]) => R[],
  chunkSize = 1000,
  onProgress?: (progress: number) => void
): Promise<R[]> => {
  return new Promise((resolve) => {
    const chunks = Math.ceil(items.length / chunkSize);
    let processedChunks = 0;
    let results: R[] = [];
    
    // If there are no items, resolve immediately
    if (items.length === 0) {
      if (onProgress) onProgress(100);
      resolve([]);
      return;
    }
    
    const processNextChunk = () => {
      if (processedChunks >= chunks) {
        if (onProgress) onProgress(100);
        resolve(results);
        return;
      }
      
      const start = processedChunks * chunkSize;
      const end = Math.min(start + chunkSize, items.length);
      const chunk = items.slice(start, end);
      
      try {
        // Use setTimeout to prevent UI blocking
        setTimeout(() => {
          try {
            const chunkResults = processFn(chunk);
            results = results.concat(chunkResults);
            processedChunks++;
            
            if (onProgress) {
              onProgress(Math.round((processedChunks / chunks) * 100));
            }
            
            processNextChunk();
          } catch (error) {
            console.error("Error processing chunk:", error);
            processedChunks++;
            if (onProgress) {
              onProgress(Math.round((processedChunks / chunks) * 100));
            }
            processNextChunk();
          }
        }, 0);
      } catch (error) {
        console.error("Error scheduling chunk processing:", error);
        processedChunks++;
        if (onProgress) {
          onProgress(Math.round((processedChunks / chunks) * 100));
        }
        processNextChunk();
      }
    };
    
    processNextChunk();
  });
};

export const generateSampleCSV = (): string => {
  const headers = ["Title", "Doi", "Author", "Journal", "Year"];
  const rows = [
    ["Machine Learning in Healthcare", "10.1234/jmlr.2023.001", "Smith, J.", "Journal of ML Research", "2023"],
    ["Artificial Intelligence and Ethics", "10.5678/ethics.2023.002", "Johnson, A.", "Ethics in Computing", "2023"],
    ["Deep Learning Applications", "10.9012/ieee.2023.003", "Williams, B.", "IEEE Transactions", "2023"],
    ["Machine Learning for Medical Imaging", "10.2345/jmir.2023.004", "Brown, C.", "Journal of Medical Imaging", "2023"],
    ["Deep Learning in Healthcare", "10.6789/aijh.2023.005", "Taylor, M.", "AI in Healthcare", "2023"]
  ];

  // Convert to CSV format
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (data: any[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename);
};

// Sample data for preview
export const sampleData: ArticleData[] = [
  { Title: "Machine Learning in Healthcare", Doi: "10.1234/jmlr.2023.001" },
  { Title: "Artificial Intelligence and Ethics", Doi: "10.5678/ethics.2023.002" },
  { Title: "Deep Learning Applications", Doi: "10.9012/ieee.2023.003" },
];
