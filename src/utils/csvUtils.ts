
import Papa from "papaparse";
import { saveAs } from "file-saver";

export interface ArticleData {
  Title: string;
  Doi: string;
  [key: string]: string;
}

export const parseCSV = (file: File): Promise<ArticleData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<ArticleData>(file, {
      header: true,
      complete: (results) => {
        if (!results.data.some(item => "Title" in item && "Doi" in item)) {
          reject(new Error("CSV must include 'Title' and 'Doi' columns"));
          return;
        }
        resolve(results.data.filter(item => item.Title && item.Doi));
      },
      error: (error) => {
        reject(error);
      }
    });
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
