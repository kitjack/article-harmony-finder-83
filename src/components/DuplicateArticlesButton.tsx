
import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface DuplicateArticlesButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing: boolean;
}

const DuplicateArticlesButton: React.FC<DuplicateArticlesButtonProps> = ({
  onClick,
  disabled,
  isProcessing,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className="w-full bg-app-blue hover:bg-app-blue-dark flex items-center justify-center gap-2 py-6 text-base"
    >
      {isProcessing ? (
        <>
          <div className="animate-spinner h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          <span>Deduplicate Articles</span>
        </>
      )}
    </Button>
  );
};

export default DuplicateArticlesButton;
