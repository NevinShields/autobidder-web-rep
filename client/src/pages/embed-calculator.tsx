import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import CalculatorPreview from "@/components/calculator-preview";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmbedCalculator() {
  const { embedId } = useParams<{ embedId: string }>();

  const { data: formula, isLoading, error } = useQuery({
    queryKey: ["/api/embed", embedId],
    enabled: !!embedId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !formula) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Calculator Not Found</h1>
          <p className="text-gray-500">The calculator you're looking for doesn't exist or has been disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CalculatorPreview formula={formula as any} />
    </div>
  );
}
