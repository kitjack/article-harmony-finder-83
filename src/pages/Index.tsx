
import React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, FileSpreadsheet } from "lucide-react";

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-app-blue to-app-blue-light">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">
            Smart Deduplication Solutions
          </h1>
          <p className="text-xl text-blue-100">
            Choose the deduplication tool that best fits your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Article Deduplication Card */}
          <div
            onClick={() => navigate("/articles")}
            className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full border-2 border-transparent hover:border-blue-300">
              <div className="p-8">
                <div className="w-16 h-16 bg-app-blue rounded-lg flex items-center justify-center mb-6 group-hover:bg-app-blue-dark transition-colors">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  Article Deduplication
                </h3>
                <p className="text-gray-600 mb-6">
                  Specialized tool for academic and research articles. Intelligently matches
                  similar titles and DOIs to identify duplicate entries.
                </p>
                <div className="flex items-center text-app-blue font-medium">
                  Learn more
                  <span className="ml-2 transform group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* General Purpose Card */}
          <div
            onClick={() => navigate("/general")}
            className="group cursor-pointer transform transition-all duration-300 hover:-translate-y-2"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full border-2 border-transparent hover:border-blue-300">
              <div className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mb-6">
                  <FileSpreadsheet className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  General Purpose Deduplication
                </h3>
                <p className="text-gray-600 mb-6">
                  Flexible deduplication tool for any CSV data. Customize your matching
                  criteria and find duplicates across any columns.
                </p>
                <div className="flex items-center text-app-blue font-medium">
                  Learn more
                  <span className="ml-2 transform group-hover:translate-x-2 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
