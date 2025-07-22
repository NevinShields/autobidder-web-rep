import { useState } from "react";
import { Variable } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Edit3, Check } from "lucide-react";

interface VariableCardProps {
  variable: Variable;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Variable>) => void;
}

export default function VariableCard({ variable, onDelete, onUpdate }: VariableCardProps) {
  const [isEditingId, setIsEditingId] = useState(false);
  const [editId, setEditId] = useState(variable.id);

  const handleSaveId = () => {
    if (onUpdate && editId.trim() && editId !== variable.id) {
      onUpdate(variable.id, { id: editId.trim() });
    }
    setIsEditingId(false);
    setEditId(variable.id);
  };

  const handleCancelEdit = () => {
    setIsEditingId(false);
    setEditId(variable.id);
  };

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
      
      {/* Variable ID Section */}
      <div className="mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 font-medium">Variable ID:</label>
          {!isEditingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingId(true)}
              className="text-gray-400 hover:text-blue-500 p-1"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
        </div>
        {isEditingId ? (
          <div className="flex items-center space-x-1 mt-1">
            <Input
              value={editId}
              onChange={(e) => setEditId(e.target.value)}
              className="text-xs h-6 px-2"
              placeholder="variableId"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveId}
              className="text-green-600 hover:text-green-700 p-1"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <code className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded font-mono">
            {variable.id}
          </code>
        )}
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
