
import Fuse from "fuse.js";
import { processInChunks } from "./csvUtils";

export interface DuplicatePair {
  record1: any;
  record2: any;
  index1: number;
  index2: number;
  similarity: number;
}

export const findDuplicatesForGeneralData = async (
  data: any[], 
  columns: string[], 
  threshold: number,
  onProgress?: (progress: number) => void
): Promise<DuplicatePair[]> => {
  if (data.length === 0 || columns.length === 0) return [];

  // Create an array of all possible pairs to check
  const totalPairs = []
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      totalPairs.push([i, j]);
    }
  }

  // Config for Fuse
  const options = {
    includeScore: true,
    keys: columns,
    threshold: 0.4, // Lower threshold means more strict matching
    ignoreLocation: true
  };

  // If dataset is small enough, process directly
  if (data.length < 500) {
    return findDuplicatesDirectly(data, totalPairs, options, threshold);
  }

  // For large datasets, process in chunks
  return processInChunks(
    totalPairs,
    (chunk) => findDuplicatesDirectly(data, chunk, options, threshold),
    5000, // Process 5000 pairs at a time
    onProgress
  );
};

const findDuplicatesDirectly = (
  data: any[],
  pairs: number[][],
  fuseOptions: any,
  threshold: number
): DuplicatePair[] => {
  // Filter out invalid records to ensure we're working with valid data
  const validData = data.filter(record => record && typeof record === 'object');
  
  try {
    // Initialize Fuse with the filtered data
    const fuse = new Fuse(validData, fuseOptions);
    const duplicates: DuplicatePair[] = [];

    for (const [i, j] of pairs) {
      try {
        const record1 = validData[i];
        const record2 = validData[j];
        
        // Skip if either record is undefined
        if (!record1 || !record2) continue;
        
        // For each selected column, check if it exists on both records
        const allColumnsValid = fuseOptions.keys.every((key: string) => 
          record1[key] !== undefined && record2[key] !== undefined
        );
        
        if (!allColumnsValid) continue;
        
        // Calculate similarity using Fuse search
        const searchResult = fuse.search(record1);
        const matchResult = searchResult.find(result => {
          const matchedRecord = validData[result.refIndex];
          return matchedRecord === record2;
        });
        
        if (matchResult) {
          // Convert Fuse score (0-1 where 0 is perfect match) to similarity percentage
          const similarity = Math.round((1 - (matchResult.score || 0)) * 100);
          
          if (similarity >= threshold) {
            duplicates.push({
              record1,
              record2,
              index1: i,
              index2: j,
              similarity
            });
          }
        }
      } catch (error) {
        console.error("Error comparing records:", error);
        continue;
      }
    }

    return duplicates;
  } catch (error) {
    console.error("Error in duplicate detection:", error);
    return [];
  }
};

export const deduplicateGeneralData = (
  data: any[],
  duplicates: DuplicatePair[]
): any[] => {
  // Get indices of records to remove (the duplicates)
  const indicesToRemove = new Set(duplicates.map(pair => pair.index2));
  
  // Filter out the duplicates
  return data.filter((_, index) => !indicesToRemove.has(index));
};
