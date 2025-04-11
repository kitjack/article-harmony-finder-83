import React, { useState, useMemo } from "react";
import { DuplicatePair } from "@/utils/fuzzyMatchUtils";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown, ArrowUp, ArrowDown, FileText, Copy, FileSearch, CheckCircle } from "lucide-react";
import DeduplicationStats from "./DeduplicationStats";
import { ArticleData, downloadCSV } from "@/utils/csvUtils";
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

interface ResultsTableProps {
  duplicates: DuplicatePair[];
  onDownloadOriginal: () => void;
  onDownloadDeduplicated: () => void;
  totalArticles: number;
  allArticles?: ArticleData[];
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
        const uniqueArticlesInDuplicates = new Set<string>();
        duplicates.forEach(pair => {
          uniqueArticlesInDuplicates.add(pair.article1.Doi);
          uniqueArticlesInDuplicates.add(pair.article2.Doi);
        });
        
        return { 
          type: "articles", 
          data: allArticles.filter(article => !uniqueArticlesInDuplicates.has(article.Doi)) 
        };
      }
      return { type: "articles", data: [] };
    }

    return { type: "duplicates", data: duplicates };
  }, [viewMode, duplicates, allArticles]);

  const sortedData = useMemo(() => {
    let dataToSort = [...filteredData.data];
    
    if (filteredData.type === "duplicates") {
      return (dataToSort as DuplicatePair[]).sort((a, b) => {
        if (sortField === "title1") {
          return sortDirection === "asc" 
            ? a.article1.Title.localeCompare(b.article1.Title)
            : b.article1.Title.localeCompare(a.article1.Title);
        } else if (sortField === "title2") {
          return sortDirection === "asc" 
            ? a.article2.Title.localeCompare(b.article2.Title)
            : b.article2.Title.localeCompare(a.article2.Title);
        } else {
          return sortDirection === "asc" 
            ? a.similarity - b.similarity
            : b.similarity - a.similarity;
        }
      });
    } else {
      return (dataToSort as ArticleData[]).sort((a, b) => {
        return sortDirection === "asc" 
          ? a.Title.localeCompare(b.Title)
          : b.Title.localeCompare(a.Title);
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
      csvData = (filteredData.data as DuplicatePair[]).map(pair => ({
        "Title 1": pair.article1.Title,
        "Doi 1": pair.article1.Doi,
        "Title 2": pair.article2.Title,
        "Doi 2": pair.article2.Doi,
        "Similarity": `${pair.similarity}%`
      }));
      
      if (viewMode === "exact") {
        filename = "exact-duplicates.csv";
      } else if (viewMode === "fuzzy") {
        filename = "fuzzy-duplicates.csv";
      } else {
        filename = "duplicate-articles.csv";
      }
    } else {
      csvData = filteredData.data as ArticleData[];
      filename = viewMode === "clean" ? "clean-records.csv" : "all-articles.csv";
    }
    
    downloadCSV(csvData, filename);
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case "all": return "All Articles";
      case "exact": return "Exact Duplicates";
      case "fuzzy": return "Fuzzy Duplicates";
      case "clean": return "Clean Records";
      default: return "Duplicate Results";
    }
  };

  const getDownloadButtonText = () => {
    switch (viewMode) {
      case "all": return "Download All Articles";
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
            {viewMode === "duplicates" && `Found ${duplicates.length} potential duplicate${duplicates.length !== 1 ? "s" : ""} out of ${totalArticles} articles`}
            {viewMode === "exact" && `Found ${sortedData.length} exact duplicate${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "fuzzy" && `Found ${sortedData.length} fuzzy duplicate${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "clean" && `${sortedData.length} clean record${sortedData.length !== 1 ? "s" : ""}`}
            {viewMode === "all" && `Showing ${sortedData.length} article${sortedData.length !== 1 ? "s" : ""}`}
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
                      Title 1 {getSortIcon("title1")}
                    </Button>
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold w-[40%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-semibold"
                      onClick={() => handleSort("title2")}
                    >
                      Title 2 {getSortIcon("title2")}
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
                  (paginatedData as DuplicatePair[]).map((pair, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">{pair.article1.Title}</TableCell>
                      <TableCell className="px-4 py-3">{pair.article2.Title}</TableCell>
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
                      Title {getSortIcon("title1")}
                    </Button>
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold">
                    DOI
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
                  (paginatedData as ArticleData[]).map((article, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">{article.Title}</TableCell>
                      <TableCell className="px-4 py-3">{article.Doi}</TableCell>
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
