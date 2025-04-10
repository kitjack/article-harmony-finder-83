
import React from "react";
import { Coffee, FileDigit } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div className="flex items-center">
          <FileDigit className="h-8 w-8 text-white mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-white">Deduper</h1>
            <p className="text-blue-100">Article Harmony</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0 bg-white hover:bg-gray-100 text-app-blue flex items-center gap-2"
        >
          <Coffee className="h-4 w-4" />
          <span>Buy Me a Coffee</span>
        </Button>
      </div>
      <h2 className="text-xl md:text-2xl text-white font-light">
        Deduplicate your article database with precision and ease
      </h2>
    </div>
  );
};

export default Header;
