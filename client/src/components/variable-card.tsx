import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VariableCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
}

export default function VariableCard({ variable, onDelete }: VariableCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">{variable.name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(variable.id)}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-gray-600">Type:</label>
          <span className="text-gray-900 ml-1 capitalize">{variable.type}</span>
        </div>
        <div>
          <label className="text-gray-600">
            {variable.type === 'select' ? 'Options:' : 'Unit:'}
          </label>
          <span className="text-gray-900 ml-1">
            {variable.type === 'select' 
              ? variable.options?.length || 0
              : variable.unit || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
