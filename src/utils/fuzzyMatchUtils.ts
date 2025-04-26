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
    // Send data to Netlify function
    onProgress?.(50); // Show some progress while we wait for the server

    const response = await fetch('/.netlify/functions/processDuplicates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articles: validArticles,
        threshold,
      }),
    });

    if (!response.ok) {
      throw new Error('Server processing failed');
    }

    const { duplicates } = await response.json();
    onProgress?.(100);
    return duplicates;
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
