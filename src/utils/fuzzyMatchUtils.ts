
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

  // Validate articles first to ensure all have required data
  const validArticles = articles.filter(article => 
    article && typeof article === 'object' && 'Title' in article && article.Title
  );

  if (validArticles.length === 0) return [];

  // Create an array of all possible pairs to check
  const totalPairs = []
  for (let i = 0; i < validArticles.length; i++) {
    for (let j = i + 1; j < validArticles.length; j++) {
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

  // Adjust chunk size based on dataset size
  const chunkSize = validArticles.length > 5000 ? 1000 : 5000;

  // For small datasets, process directly
  if (validArticles.length < 300) {
    try {
      return findDuplicatesDirectly(validArticles, totalPairs, options, threshold);
    } catch (error) {
      console.error("Error finding duplicates directly:", error);
      return [];
    }
  }

  // For large datasets, process in chunks
  try {
    return processInChunks(
      totalPairs,
      (chunk) => findDuplicatesDirectly(validArticles, chunk, options, threshold),
      chunkSize,
      onProgress
    );
  } catch (error) {
    console.error("Error processing in chunks:", error);
    return [];
  }
};

const findDuplicatesDirectly = (
  articles: ArticleData[],
  pairs: number[][],
  fuseOptions: any,
  threshold: number
): DuplicatePair[] => {
  // Create a defensive copy of articles to ensure we're working with valid data
  const validArticles = articles.filter(article => 
    article && typeof article === 'object' && 'Title' in article && article.Title
  );
  
  if (validArticles.length === 0) {
    return [];
  }

  // Initialize Fuse with the valid articles
  let fuse: Fuse<any>;
  try {
    fuse = new Fuse(validArticles, fuseOptions);
  } catch (error) {
    console.error("Error initializing Fuse:", error);
    return [];
  }

  const duplicates: DuplicatePair[] = [];

  for (const [i, j] of pairs) {
    // Skip invalid indices
    if (i >= validArticles.length || j >= validArticles.length || i < 0 || j < 0) {
      continue;
    }

    // Get the actual articles using the indices
    const article1 = validArticles[i];
    const article2 = validArticles[j];
    
    // Skip if either article is undefined or doesn't have required properties
    if (!article1 || !article2 || !article1.Title || !article2.Title) {
      continue;
    }
    
    try {
      // Calculate similarity using Fuse search
      const searchResult = fuse.search(String(article1.Title));
      
      // Find the matching article in the search results
      const matchResult = searchResult.find(result => {
        // Check if refIndex is valid
        if (result.refIndex === undefined || result.refIndex >= validArticles.length) {
          return false;
        }
        
        // Map the refIndex back to the original array index
        const originalArticle = validArticles[result.refIndex];
        return originalArticle === article2;
      });
      
      if (matchResult && matchResult.score !== undefined) {
        // Convert Fuse score (0-1 where 0 is perfect match) to similarity percentage
        const similarity = Math.round((1 - matchResult.score) * 100);
        
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
    } catch (error) {
      console.error("Error comparing articles:", error);
      // Continue with next pair if there's an error
      continue;
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
