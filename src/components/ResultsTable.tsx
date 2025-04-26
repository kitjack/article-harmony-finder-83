
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, Copy, FileSearch, CheckCircle } from "lucide-react";
import DeduplicationStats from "./DeduplicationStats";
import { ArticleData, downloadCSV } from "@/utils/csvUtils";
import { DuplicatePair as ArticleDuplicatePair } from "@/utils/fuzzyMatchUtils";
import { DuplicatePair as GeneralDuplicatePair } from "@/utils/generalDuplicationUtils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Union type to handle both article and general duplicate pairs
type CombinedDuplicatePair = ArticleDuplicatePair | GeneralDuplicatePair;

// Function to check if a duplicate pair is an article pair
const isArticleDuplicatePair = (pair: CombinedDuplicatePair): pair is ArticleDuplicatePair => {
  return 'article1' in pair && 'article2' in pair;
};

interface ResultsTableProps {
  duplicates: CombinedDuplicatePair[];
  onDownloadOriginal: () => void;
  onDownloadDeduplicated: () => void;
  totalArticles: number;
  allArticles?: any[];
}

type SortField = "title1" | "title2" | "similarity";
type SortDirection = "asc" | "desc";
type ViewMode = "duplicates" | "exact" | "fuzzy" | "clean" | "all";

const ResultsTable: React.FC<ResultsTableProps> = ({
  duplicates,
  onDownloadOriginal,
  onDownloadDeduplicated,
  totalArticles,
  allArticles = []
}) => {
  const [sortField, setSortField] = useState<SortField>("similarity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("duplicates");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Function to get titles from duplicate pairs regardless of type
  const getTitle1 = (pair: CombinedDuplicatePair): string => {
    if (isArticleDuplicatePair(pair)) {
      return pair.article1.Title;
    }
    return pair.record1?.Title || Object.values(pair.record1 || {})[0] || "";
  };

  const getTitle2 = (pair: CombinedDuplicatePair): string => {
    if (isArticleDuplicatePair(pair)) {
      return pair.article2.Title;
    }
    return pair.record2?.Title || Object.values(pair.record2 || {})[0] || "";
  };

  const getId1 = (pair: CombinedDuplicatePair): string => {
    if (isArticleDuplicatePair(pair)) {
      return pair.article1.Doi;
    }
    return pair.record1?.Doi || "";
  };

  const getId2 = (pair: CombinedDuplicatePair): string => {
    if (isArticleDuplicatePair(pair)) {
      return pair.article2.Doi;
    }
    return pair.record2?.Doi || "";
  };

  // This should only include the duplicate articles/records (the ones that would be removed)
  const duplicateIdSet = useMemo(() => {
    const idSet = new Set<string>();
    duplicates.forEach(pair => {
      // We only add the second article/record (the one that would be removed in deduplication)
      if (isArticleDuplicatePair(pair)) {
        idSet.add(pair.article2.Doi);
      } else {
        if (pair.record2?.Doi) {
          idSet.add(pair.record2.Doi);
        } else {
          // For general records without a Doi field, use index
          idSet.add(`index-${pair.index2}`);
        }
      }
    });
    return idSet;
  }, [duplicates]);

  const filteredData = useMemo(() => {
    if (viewMode === "all" && allArticles.length > 0) {
      return { type: "articles", data: allArticles };
    }

    if (viewMode === "exact") {
      return { 
        type: "duplicates", 
        data: duplicates.filter(pair => pair.similarity === 100) 
      };
    }

    if (viewMode === "fuzzy") {
      return { 
        type: "duplicates", 
        data: duplicates.filter(pair => pair.similarity < 100) 
      };
    }

    if (viewMode === "clean") {
      if (allArticles.length > 0) {
        return { 
          type: "articles", 
          data: allArticles.filter(article => {
            // Check if article should be excluded based on duplicateIdSet
            if (article.Doi && duplicateIdSet.has(article.Doi)) {
              return false;
            }
            // For records without Doi, check by index
            return !duplicateIdSet.has(`index-${allArticles.indexOf(article)}`);
          }) 
        };
      }
      return { type: "articles", data: [] };
    }

    return { type: "duplicates", data: duplicates };
  }, [viewMode, duplicates, allArticles, duplicateIdSet]);

  const sortedData = useMemo(() => {
    let dataToSort = [...filteredData.data];
    
    if (filteredData.type === "duplicates") {
      return (dataToSort as CombinedDuplicatePair[]).sort((a, b) => {
        if (sortField === "title1") {
          return sortDirection === "asc" 
            ? getTitle1(a).localeCompare(getTitle1(b))
            : getTitle1(b).localeCompare(getTitle1(a));
        } else if (sortField === "title2") {
          return sortDirection === "asc" 
            ? getTitle2(a).localeCompare(getTitle2(b))
            : getTitle2(b).localeCompare(getTitle2(a));
        } else {
          return sortDirection === "asc" 
            ? a.similarity - b.similarity
            : b.similarity - a.similarity;
        }
      });
    } else {
      return (dataToSort as any[]).sort((a, b) => {
        const titleA = a.Title || Object.values(a)[0] || "";
        const titleB = b.Title || Object.values(b)[0] || "";
        return sortDirection === "asc" 
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      });
    }
  }, [filteredData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4" /> 
      : <ArrowDown className="h-4 w-4" />;
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const handleDownloadView = () => {
    if (filteredData.data.length === 0) return;
    
    let csvData: any[] = [];
    let filename = "";
    
    if (filteredData.type === "duplicates") {
      csvData = (filteredData.data as CombinedDuplicatePair[]).map(pair => {
        if (isArticleDuplicatePair(pair)) {
          return {
            "Title 1": pair.article1.Title,
            "Doi 1": pair.article1.Doi,
            "Title 2": pair.article2.Title,
            "Doi 2": pair.article2.Doi,
            "Similarity": `${pair.similarity}%`
          };
        } else {
          const record = {
            "Similarity": `${pair.similarity}%`
          };
          
          // Add all fields from both records
          const allKeys = new Set([
            ...Object.keys(pair.record1 || {}),
            ...Object.keys(pair.record2 || {})
          ]);
          
          allKeys.forEach(key => {
            record[`${key} 1`] = pair.record1?.[key] || "";
            record[`${key} 2`] = pair.record2?.[key] || "";
          });
          
          return record;
        }
      });
      
      if (viewMode === "exact") {
        filename = "exact-duplicates.csv";
      } else if (viewMode === "fuzzy") {
        filename = "fuzzy-duplicates.csv";
      } else {
        filename = "duplicate-records.csv";
      }
    } else {
      csvData = filteredData.data as any[];
      filename = viewMode === "clean" ? "clean-records.csv" : "all-records.csv";
    }
    
    downloadCSV(csvData, filename);
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case "all": return "All Records";
      case "exact": return "Exact Duplicates";
      case "fuzzy": return "Fuzzy Duplicates";
      case "clean": return "Clean Records";
      default: return "Duplicate Results";
    }
  };

  const getDownloadButtonText = () => {
    switch (viewMode) {
      case "all": return "Download All Records";
      case "exact": return "Download Exact Duplicates";
      case "fuzzy": return "Download Fuzzy Duplicates";
      case "clean": return "Download Clean Records";
      default: return "Download Duplicates";
    }
  };

  const getDownloadIcon = () => {
    switch (viewMode) {
      case "all": return <FileText className="h-4 w-4" />;
      case "exact": return <Copy className="h-4 w-4" />;
      case "fuzzy": return <FileSearch className="h-4 w-4" />;
      case "clean": return <CheckCircle className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  // Function to get column names for table headers
  const getMainColumnName = (): string => {
    if (filteredData.type === "articles" && allArticles.length > 0) {
      // Try to find the first text column in the data
      const firstItem = allArticles[0];
      if (firstItem) {
        if (firstItem.Title) return "Title";
        if (firstItem.Name) return "Name";
        return Object.keys(firstItem)[0] || "Item";
      }
    }
    return "Title";
  };

  const getIdColumnName = (): string => {
    if (filteredData.type === "articles" && allArticles.length > 0) {
      // Try to find an ID-like column in the data
      const firstItem = allArticles[0];
      if (firstItem) {
        if (firstItem.Doi) return "DOI";
        if (firstItem.ID || firstItem.Id || firstItem.id) return "ID";
        if (firstItem.Email) return "Email";
        return Object.keys(firstItem)[1] || "Identifier";
      }
    }
    return "DOI";
  };

  if (duplicates.length === 0 && viewMode !== "all") {
    return null;
  }

  return (
    <div className="mt-8">
      <DeduplicationStats 
        totalArticles={totalArticles} 
        duplicates={duplicates}
        onCardClick={handleViewModeChange}
        activeView={viewMode}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{getViewTitle()}</h2>
          <p className="text-gray-600">
            {viewMode === "duplicates" && `Found ${duplicates.length} potential duplicate${duplicates.length !== 1 ? "s" : ""} out of ${totalArticles} records`}
            {viewMode === "exact" && `Found ${sortedData.length} exact duplicate${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "fuzzy" && `Found ${sortedData.length} fuzzy duplicate${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "clean" && `${sortedData.length} clean record${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "all" && `Showing ${sortedData.length} record${sortedData.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleDownloadView}
          >
            {getDownloadIcon()}
            <span>{getDownloadButtonText()}</span>
          </Button>
          
          {viewMode === "duplicates" && (
            <Button
              className="flex items-center gap-2 bg-app-blue hover:bg-app-blue-dark"
              onClick={onDownloadDeduplicated}
            >
              <Download className="h-4 w-4" />
              <span>Download Deduplicated</span>
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          {filteredData.type === "duplicates" ? (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold w-[40%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => handleSort("title1")}
                    >
                      {getMainColumnName()} 1 {getSortIcon("title1")}
                    </Button>
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold w-[40%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => handleSort("title2")}
                    >
                      {getMainColumnName()} 2 {getSortIcon("title2")}
                    </Button>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-center font-semibold w-[20%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => handleSort("similarity")}
                    >
                      Similarity {getSortIcon("similarity")}
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                      No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  (paginatedData as CombinedDuplicatePair[]).map((pair, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">{getTitle1(pair)}</TableCell>
                      <TableCell className="px-4 py-3">{getTitle2(pair)}</TableCell>
                      <TableCell className="px-4 py-3 text-center">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => handleSort("title1")}
                    >
                      {getMainColumnName()} {getSortIcon("title1")}
                    </Button>
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    {getIdColumnName()}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-6 text-gray-500">
                      No results found
                    </TableCell>
                  </TableRow>
                ) : (
                  (paginatedData as any[]).map((record, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">
                        {record.Title || record.Name || Object.values(record)[0] || ""}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {record.Doi || record.ID || record.Id || record.id || record.Email || Object.values(record)[1] || ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={pageNum === currentPage}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ResultsTable;
