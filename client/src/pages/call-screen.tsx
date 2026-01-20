import { lazy, Suspense } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Phone } from "lucide-react";

const StyledCalculator = lazy(() => import("@/pages/styled-calculator"));

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
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <StyledCalculator isCallScreenMode={true} />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
}
