
import Fuse from "fuse.js";
import { ArticleData, processInChunks } from "./csvUtils";

export interface DuplicatePair {
  article1: ArticleData;
  article2: ArticleData;
  index1: number;
  index2: number;
  similarity: number;
}

export const findDuplicates = async (
  articles: ArticleData[], 
  threshold: number,
  onProgress?: (progress: number) => void
): Promise<DuplicatePair[]> => {
  if (articles.length === 0) return [];

  // Create an array of all possible pairs to check
  const totalPairs = []
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      totalPairs.push([i, j]);
    }
  }

  // Config for Fuse
  const options = {
    includeScore: true,
    keys: ["Title"],
    threshold: 0.4,
    ignoreLocation: true
  };

  // For small datasets, process directly
  if (articles.length < 500) {
    return findDuplicatesDirectly(articles, totalPairs, options, threshold);
  }

  // For large datasets, process in chunks
  return processInChunks(
    totalPairs,
    (chunk) => findDuplicatesDirectly(articles, chunk, options, threshold),
    5000, // Process 5000 pairs at a time
    onProgress
  );
};

const findDuplicatesDirectly = (
  articles: ArticleData[],
  pairs: number[][],
  fuseOptions: any,
  threshold: number
): DuplicatePair[] => {
  const fuse = new Fuse(articles, fuseOptions);
  const duplicates: DuplicatePair[] = [];

  for (const [i, j] of pairs) {
    const article1 = articles[i];
    const article2 = articles[j];
    
    // Skip if either article is undefined
    if (!article1 || !article2) continue;
    
    // Calculate similarity using Fuse search
    const searchResult = fuse.search(article1);
    const matchResult = searchResult.find(result => result.refIndex === j);
    
    if (matchResult) {
      // Convert Fuse score (0-1 where 0 is perfect match) to similarity percentage
      const similarity = Math.round((1 - (matchResult.score || 0)) * 100);
      
      if (similarity >= threshold) {
        duplicates.push({
          article1,
          article2,
          index1: i,
          index2: j,
          similarity
        });
      }
    }
  }

  return duplicates;
};

export const deduplicate = (
  articles: ArticleData[],
  duplicates: DuplicatePair[]
): ArticleData[] => {
  // Get indices of articles to remove (the duplicates)
  const indicesToRemove = new Set(duplicates.map(pair => pair.index2));
  
  // Filter out the duplicates
  return articles.filter((_, index) => !indicesToRemove.has(index));
};
