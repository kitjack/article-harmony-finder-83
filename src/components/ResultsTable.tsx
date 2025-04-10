
import React from "react";
import { DuplicatePair } from "@/utils/fuzzyMatchUtils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ArticleData } from "@/utils/csvUtils";

interface ResultsTableProps {
  duplicates: DuplicatePair[];
  onDownloadOriginal: () => void;
  onDownloadDeduplicated: () => void;
  totalArticles: number;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  duplicates,
  onDownloadOriginal,
  onDownloadDeduplicated,
  totalArticles,
}) => {
  if (duplicates.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Duplicate Results</h2>
          <p className="text-gray-600">
            Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? "s" : ""} out of {totalArticles} articles
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={onDownloadOriginal}
          >
            <Download className="h-4 w-4" />
            <span>Download Duplicates</span>
          </Button>
          <Button
            className="flex items-center gap-2 bg-app-blue hover:bg-app-blue-dark"
            onClick={onDownloadDeduplicated}
          >
            <Download className="h-4 w-4" />
            <span>Download Deduplicated</span>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title 1</th>
                <th className="px-4 py-3 text-left font-semibold">Title 2</th>
                <th className="px-4 py-3 text-center font-semibold w-32">
                  Similarity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {duplicates.map((pair, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{pair.article1.Title}</td>
                  <td className="px-4 py-3">{pair.article2.Title}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        pair.similarity >= 90
                          ? "bg-green-100 text-green-800"
                          : pair.similarity >= 80
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {pair.similarity}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
