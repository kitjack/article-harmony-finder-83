
import React from "react";
import { FileText, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sampleData } from "@/utils/csvUtils";

interface CSVFormatGuideProps {
  onDownloadSample: () => void;
}

const CSVFormatGuide: React.FC<CSVFormatGuideProps> = ({ onDownloadSample }) => {
  return (
    <div className="mt-16 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="text-app-blue mr-2 h-6 w-6" />
          <h2 className="text-xl font-semibold">CSV Format Guide</h2>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onDownloadSample}
        >
          <Download className="h-4 w-4" />
          <span>Download Sample CSV</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <Info className="text-app-blue mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Required Format</h3>
          </div>
          
          <p className="mb-4 text-gray-600">
            Your CSV file must include the following columns in order to work with Deduper:
          </p>
          
          <ul className="space-y-3 list-disc list-inside text-gray-700">
            <li>
              <span className="font-semibold">Title</span> - The title of the article (required for both exact and fuzzy matching)
            </li>
            <li>
              <span className="font-semibold">Doi</span> - Digital Object Identifier, a unique identifier for the article
            </li>
            <li>
              Additional columns are preserved in the output file
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <FileText className="text-app-blue mr-2 h-5 w-5" />
            <h3 className="text-lg font-semibold">Sample Preview</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Title</th>
                  <th className="px-4 py-2 text-left font-semibold">Doi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sampleData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{row.Title}</td>
                    <td className="px-4 py-2 font-mono text-xs">{row.Doi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVFormatGuide;
