
import { ArticleData } from "./csvUtils";

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

  // Validate articles first
  const validArticles = articles.filter(article => 
    article && typeof article === 'object' && 'Title' in article && article.Title
  );

  if (validArticles.length === 0) return [];

  try {
    // For large datasets, process in chunks and show warning
    const maxArticlesPerRequest = 500;
    const totalArticles = validArticles.length;
    const allDuplicates: DuplicatePair[] = [];
    
    if (totalArticles > maxArticlesPerRequest) {
      // Process the first chunk only for now
      const firstChunk = validArticles.slice(0, maxArticlesPerRequest);
      
      onProgress?.(10);
      console.log(`Processing first ${maxArticlesPerRequest} articles out of ${totalArticles}`);
      
      try {
        const response = await fetch('/.netlify/functions/processDuplicates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articles: firstChunk,
            threshold,
          }),
          // Add a longer timeout
          signal: AbortSignal.timeout(25000), // 25 second timeout
        });

        onProgress?.(90);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || 'Unknown server error';
          } catch {
            errorMessage = errorText || `Server error (${response.status})`;
          }
          
          throw new Error(`Server processing failed: ${errorMessage}`);
        }

        const { duplicates, truncated } = await response.json();
        allDuplicates.push(...duplicates);
        
        onProgress?.(100);
        
        if (truncated) {
          console.warn(`Only processed first ${maxArticlesPerRequest} articles to prevent timeout. For complete results, try reducing your dataset.`);
        }
        
        return allDuplicates;
      } catch (fetchError) {
        // Handle timeout or network errors
        if (fetchError.name === 'AbortError') {
          throw new Error('Server processing timed out. Try with a smaller dataset or higher threshold.');
        }
        throw fetchError;
      }
    } else {
      // Process all articles in one request if below threshold
      onProgress?.(20);

      try {
        const response = await fetch('/.netlify/functions/processDuplicates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articles: validArticles,
            threshold,
          }),
          signal: AbortSignal.timeout(25000), // 25 second timeout
        });

        onProgress?.(80);
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || 'Unknown server error';
          } catch {
            errorMessage = errorText || `Server error (${response.status})`;
          }
          
          throw new Error(`Server processing failed: ${errorMessage}`);
        }

        const { duplicates } = await response.json();
        onProgress?.(100);
        return duplicates;
      } catch (fetchError) {
        // Handle timeout or network errors
        if (fetchError.name === 'AbortError') {
          throw new Error('Server processing timed out. Try with a smaller dataset or higher threshold.');
        }
        throw fetchError;
      }
    }
  } catch (error) {
    console.error("Error processing duplicates:", error);
    throw error;
  }
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
