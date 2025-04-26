
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
  const duplicates: DuplicatePair[] = [];
  const fuse = new Fuse(articles, fuseOptions);

  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const article1 = articles[i];
      const article2 = articles[j];

      if (!article1?.Title || !article2?.Title) continue;

      const searchResult = fuse.search(article1.Title);
      const matchResult = searchResult.find(result => 
        articles[result.refIndex] === article2
      );

      if (matchResult && matchResult.score !== undefined) {
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
    }
  }

  return duplicates;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { articles, threshold } = JSON.parse(event.body || '{}');

    if (!articles || !Array.isArray(articles) || !threshold) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid input' }),
      };
    }

    const duplicates = findDuplicatesInChunk(articles, threshold);

    return {
      statusCode: 200,
      body: JSON.stringify({ duplicates }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

