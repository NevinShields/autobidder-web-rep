import DashboardLayout from "@/components/dashboard-layout";
import StyledCalculator from "@/pages/styled-calculator";
import { Phone } from "lucide-react";

export default function CallScreen() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Call Screen
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quick pricing calculator for phone conversations
              </p>
            </div>
          </div>
        </div>

        {/* Calculator with Call Screen Mode */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 md:p-6">
          <StyledCalculator isCallScreenMode={true} />
        </div>
      </div>
    </DashboardLayout>
  );
}
