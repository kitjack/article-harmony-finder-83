
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const General: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-indigo-600">
      <div className="container mx-auto px-4 pb-16">
        <div className="py-6">
          <Button
            variant="outline"
            className="bg-white mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                General Purpose Deduplication
              </h1>
              <p className="text-indigo-100">
                Customize your deduplication process
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-purple-500" />
            <h2 className="text-2xl font-semibold mb-4">
              Coming Soon
            </h2>
            <p className="text-gray-600">
              We're working on making this feature available soon. Check back later!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default General;
