
import Fuse from "fuse.js";

export interface DuplicatePair {
  record1: any;
  record2: any;
  index1: number;
  index2: number;
  similarity: number;
}

/**
 * Find duplicates in general data based on selected columns
 */
export const findDuplicatesForGeneralData = (
  data: any[],
  columns: string[],
  threshold: number
): DuplicatePair[] => {
  const duplicates: DuplicatePair[] = [];
  const normalizedThreshold = threshold / 100; // Convert percentage to decimal

  // Don't process if no columns are selected or data is empty
  if (columns.length === 0 || data.length === 0) {
    return duplicates;
  }

  // Configure Fuse.js options
  const options = {
    includeScore: true,
    keys: columns, // Use the selected columns for comparison
    threshold: 1.0 - normalizedThreshold, // Fuse uses distance, not similarity
  };

  // Compare each record with every other record
  for (let i = 0; i < data.length; i++) {
    const record1 = data[i];
    
    // Create a fuse instance with all records except the current one and those already processed
    const fuse = new Fuse(
      data.filter((_, index) => index > i), // Only check records we haven't compared yet
      options
    );

    // Create a search string that concatenates all selected column values
    const searchString = columns
      .map(column => record1[column] || "")
      .join(" ");

    // Search for possible duplicates
    const results = fuse.search(searchString);

    // Process results
    for (const result of results) {
      const record2 = result.item;
      const score = result.score || 0;
      const similarity = Math.round((1 - score) * 100); // Convert to percentage
      
      // Only include pairs that meet our threshold
      if (similarity >= threshold) {
        duplicates.push({
          record1,
          record2,
          index1: i,
          index2: data.indexOf(record2),
          similarity
        });
      }
    }
  }

  // Sort duplicates by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

/**
 * Deduplicate data by removing duplicate records
 */
export const deduplicateGeneralData = (
  data: any[],
  duplicates: DuplicatePair[]
): any[] => {
  // Create a set of indices to remove
  const indicesToRemove = new Set<number>();
  
  // For each duplicate pair, mark the second record for removal
  for (const pair of duplicates) {
    indicesToRemove.add(pair.index2);
  }
  
  // Filter the original data to remove duplicates
  return data.filter((_, index) => !indicesToRemove.has(index));
};
