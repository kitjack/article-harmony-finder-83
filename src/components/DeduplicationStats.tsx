
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Copy, FileSearch, CheckCircle } from "lucide-react";
import { DuplicatePair as ArticleDuplicatePair } from "@/utils/fuzzyMatchUtils";
import { DuplicatePair as GeneralDuplicatePair } from "@/utils/generalDuplicationUtils";
import { cn } from "@/lib/utils";

type ViewMode = "duplicates" | "exact" | "fuzzy" | "clean" | "all";
type CombinedDuplicatePair = ArticleDuplicatePair | GeneralDuplicatePair;

interface DeduplicationStatsProps {
  totalArticles: number;
  duplicates: CombinedDuplicatePair[];
  onCardClick?: (mode: ViewMode) => void;
  activeView?: ViewMode;
}

const DeduplicationStats: React.FC<DeduplicationStatsProps> = ({
  totalArticles,
  duplicates,
  onCardClick,
  activeView = "duplicates"
}) => {
  // Count exact duplicates (100% similarity)
  const exactDuplicates = duplicates.filter((pair) => pair.similarity === 100).length;
  
  // Count fuzzy duplicates (not 100% similarity)
  const fuzzyDuplicates = duplicates.filter((pair) => pair.similarity < 100).length;
  
  // Create a set of unique records that are in duplicate pairs
  const recordsInDuplicates = new Set<string | number>();
  
  // For each duplicate pair, we only add the second record (the one that would be removed)
  duplicates.forEach(pair => {
    if ('article2' in pair) {
      recordsInDuplicates.add(pair.article2.Doi);
    } else if ('record2' in pair) {
      // For general records, use their index
      recordsInDuplicates.add(pair.index2);
    }
  });
  
  // Clean records = total - records that are duplicates
  const cleanRecords = totalArticles - recordsInDuplicates.size;

  const createCardClass = (mode: ViewMode) => {
    return cn(
      "cursor-pointer transition-all duration-200 hover:shadow-md", 
      activeView === mode ? "ring-2 ring-app-blue" : ""
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card 
        className={createCardClass("all")}
        onClick={() => onCardClick?.("all")}
      >
        <CardContent className="flex items-center p-6">
          <FileText className="h-8 w-8 text-app-blue mr-4" />
          <div>
            <p className="text-sm text-gray-500">Total Records</p>
            <p className="text-2xl font-bold">{totalArticles}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={createCardClass("exact")}
        onClick={() => onCardClick?.("exact")}
      >
        <CardContent className="flex items-center p-6">
          <Copy className="h-8 w-8 text-orange-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Exact Duplicates</p>
            <p className="text-2xl font-bold">{exactDuplicates}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={createCardClass("fuzzy")}
        onClick={() => onCardClick?.("fuzzy")}
      >
        <CardContent className="flex items-center p-6">
          <FileSearch className="h-8 w-8 text-yellow-500 mr-4" />
          <div>
            <p className="text-sm text-gray-500">Fuzzy Duplicates</p>
            <p className="text-2xl font-bold">{fuzzyDuplicates}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card 
        className={createCardClass("clean")}
        onClick={() => onCardClick?.("clean")}
      >
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
