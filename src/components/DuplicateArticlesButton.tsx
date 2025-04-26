
import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader } from "lucide-react";

interface DuplicateArticlesButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing: boolean;
  buttonText?: string;
}

const DuplicateArticlesButton: React.FC<DuplicateArticlesButtonProps> = ({
  onClick,
  disabled,
  isProcessing,
  buttonText = "Find Duplicate Articles"
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="w-full bg-app-blue hover:bg-app-blue-dark text-white"
    >
      {isProcessing ? (
        <>
          <Loader className="w-4 h-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        <>
          <Search className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
};

export default DuplicateArticlesButton;
