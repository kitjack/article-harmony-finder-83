import { Handler } from '@netlify/functions';
import Fuse from 'fuse.js';

interface ArticleData {
  Title: string;
  Doi: string;
  [key: string]: string;
}

interface DuplicatePair {
  article1: ArticleData;
  article2: ArticleData;
  index1: number;
  index2: number;
  similarity: number;
}

const findDuplicatesInChunk = (
  articles: ArticleData[],
  threshold: number,
  fuseOptions = {
    includeScore: true,
    keys: ["Title"],
    threshold: 0.4,
    ignoreLocation: true
  }
): DuplicatePair[] => {
  try {
    const duplicates: DuplicatePair[] = [];
    
    const fuse = new Fuse(articles, fuseOptions);

    const maxComparisons = Math.min(articles.length, 1000);
    
    for (let i = 0; i < maxComparisons; i++) {
      const article1 = articles[i];
      if (!article1?.Title) continue;
      
      const searchResult = fuse.search(article1.Title);
      
      const filteredResults = searchResult
        .filter(result => {
          const article2 = articles[result.refIndex];
          return result.refIndex > i && article2?.Title;
        })
        .slice(0, 50);
      
      for (const match of filteredResults) {
        if (match.score !== undefined) {
          const similarity = Math.round((1 - match.score) * 100);
          if (similarity >= threshold) {
            duplicates.push({
              article1,
              article2: articles[match.refIndex],
              index1: i,
              index2: match.refIndex,
              similarity
            });
          }
        }
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error("Error in findDuplicatesInChunk:", error);
    throw error;
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }),
      };
    }

    const { articles, threshold } = parsedBody;

    if (!articles || !Array.isArray(articles)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid input: articles must be an array',
          received: typeof articles
        }),
      };
    }

    if (threshold === undefined || isNaN(Number(threshold))) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid input: threshold must be a number',
          received: threshold
        }),
      };
    }

    const maxArticles = 500;
    const processableArticles = articles.slice(0, maxArticles);
    
    if (articles.length > maxArticles) {
      console.log(`Processing truncated to ${maxArticles} articles from ${articles.length} total`);
    }

    const duplicates = findDuplicatesInChunk(processableArticles, Number(threshold));

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        duplicates,
        processed: processableArticles.length,
        total: articles.length,
        truncated: articles.length > maxArticles
      }),
    };
  } catch (error) {
    console.error("Server processing error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
    };
  }
};
