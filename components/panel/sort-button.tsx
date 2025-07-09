import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type SortOption = 'price' | 'discount' | 'stock' | 'updateTime';
type SortDirection = 'asc' | 'desc';

interface SortButtonProps {
  option: SortOption;
  label: string;
  currentSortOption: SortOption;
  currentSortDirection: SortDirection;
  onSortChange: (option: SortOption, direction: SortDirection) => void;
}

export function SortButton({
  option,
  label,
  currentSortOption,
  currentSortDirection,
  onSortChange
}: SortButtonProps) {
  const isActive = currentSortOption === option;
  
  const handleClick = () => {
    if (isActive) {
      onSortChange(option, currentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(option, 'asc');
    }
  };

  return (
    <button 
      className={`px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-all ${
        isActive 
          ? 'bg-[#786DF6] text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      onClick={handleClick}
    >
      <span>{label}</span>
      {isActive && (
        currentSortDirection === 'asc' 
          ? <ArrowUp className="h-3 w-3" /> 
          : <ArrowDown className="h-3 w-3" />
      )}
    </button>
  );
}