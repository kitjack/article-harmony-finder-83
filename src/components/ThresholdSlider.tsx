
import React from "react";
import { Slider } from "@/components/ui/slider";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ThresholdSliderProps {
  threshold: number;
  onChange: (value: number) => void;
}

const ThresholdSlider: React.FC<ThresholdSliderProps> = ({
  threshold,
  onChange,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold">Fuzzy Match Threshold</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-gray-400 hover:text-gray-600">
                <HelpCircle className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Adjust how similar titles need to be to count as duplicates. A
                higher value means titles must be more similar to match.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="mb-2">
        <Slider
          value={[threshold]}
          min={50}
          max={100}
          step={1}
          onValueChange={(values) => onChange(values[0])}
          className="py-4"
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>More Results (50%)</span>
        <span className="font-semibold text-app-blue">
          {threshold}%
        </span>
        <span>Fewer Results (100%)</span>
      </div>
    </div>
  );
};

export default ThresholdSlider;
