
import Fuse from "fuse.js";
import { ArticleData } from "./csvUtils";

export interface DuplicatePair {
  article1: ArticleData;
  article2: ArticleData;
  similarity: number;
}

export const findDuplicates = (
  data: ArticleData[],
  threshold: number
): DuplicatePair[] => {
  const duplicates: DuplicatePair[] = [];
  const normalizedThreshold = threshold / 100; // Convert percentage to decimal

  // Configure Fuse.js options
  const options = {
    includeScore: true,
    keys: ["Title"],
    threshold: 1.0 - normalizedThreshold, // Fuse uses distance, not similarity
  };

  // Compare each article with every other article
  for (let i = 0; i < data.length; i++) {
    const article1 = data[i];
    
    // Create a fuse instance with all articles except the current one
    const fuse = new Fuse(
      data.filter((_, index) => index > i), // Only check articles we haven't compared yet
      options
    );

    // Search for possible duplicates
    const results = fuse.search(article1.Title);

    // Process results
    for (const result of results) {
      const article2 = result.item;
      const score = result.score || 0;
      const similarity = Math.round((1 - score) * 100); // Convert to percentage
      
      // Only include pairs that meet our threshold
      if (similarity >= threshold) {
        duplicates.push({
          article1,
          article2,
          similarity
        });
      }
    }
  }

  // Sort duplicates by similarity (highest first)
  return duplicates.sort((a, b) => b.similarity - a.similarity);
};

export const deduplicate = (
  data: ArticleData[],
  duplicates: DuplicatePair[]
): ArticleData[] => {
  // Create a set of DOIs to remove (only article2 from each pair)
  const doisToRemove = new Set<string>();
  
  // For each duplicate pair, mark the second article for removal
  for (const pair of duplicates) {
    doisToRemove.add(pair.article2.Doi);
  }
  
  // Filter the original data to remove duplicates
  return data.filter((article) => !doisToRemove.has(article.Doi));
};
