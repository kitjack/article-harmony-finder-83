
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Copy, FileSearch, CheckCircle } from "lucide-react";
import { DuplicatePair } from "@/utils/fuzzyMatchUtils";

interface DeduplicationStatsProps {
  totalArticles: number;
  duplicates: DuplicatePair[];
}

const DeduplicationStats: React.FC<DeduplicationStatsProps> = ({
  totalArticles,
  duplicates,
}) => {
  // Count exact duplicates (100% similarity)
  const exactDuplicates = duplicates.filter((pair) => pair.similarity === 100).length;
  
  // Count fuzzy duplicates (not 100% similarity)
  const fuzzyDuplicates = duplicates.filter((pair) => pair.similarity < 100).length;
  
  // Clean records = total - (pairs that would be removed)
  const cleanRecords = totalArticles - duplicates.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="flex items-center p-6">
          <FileText className="h-8 w-8 text-app-blue mr-4" />
          <div>
            <p className="text-sm text-gray-500">Total Articles</p>
            <p className="text-2xl font-bold">{totalArticles}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <Copy className="h-8 w-8 text-orange-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Exact Duplicates</p>
            <p className="text-2xl font-bold">{exactDuplicates}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <FileSearch className="h-8 w-8 text-yellow-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Fuzzy Duplicates</p>
            <p className="text-2xl font-bold">{fuzzyDuplicates}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Clean Records</p>
            <p className="text-2xl font-bold">{cleanRecords}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeduplicationStats;
