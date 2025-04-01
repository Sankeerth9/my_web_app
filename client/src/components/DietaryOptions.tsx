import { useState } from 'react';

interface DietaryOptionsProps {
  selectedDietary: string[];
  setSelectedDietary: (dietary: string[]) => void;
}

interface DietOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const DietaryOptions = ({ selectedDietary, setSelectedDietary }: DietaryOptionsProps) => {
  const [showOptions, setShowOptions] = useState(true);
  
  const dietOptions: DietOption[] = [
    { 
      value: 'vegetarian', 
      label: 'Vegetarian', 
      emoji: '🥦', 
      color: 'bg-green-100 border-green-400 text-green-800',
      description: 'No meat, fish or poultry'
    },
    { 
      value: 'vegan', 
      label: 'Vegan', 
      emoji: '🌱', 
      color: 'bg-emerald-100 border-emerald-400 text-emerald-800',
      description: 'No animal products or by-products'
    },
    { 
      value: 'glutenfree', 
      label: 'Gluten Free', 
      emoji: '🌾', 
      color: 'bg-amber-100 border-amber-400 text-amber-800',
      description: 'No wheat, barley or rye'
    },
    { 
      value: 'lowcarb', 
      label: 'Low Carb', 
      emoji: '🥩', 
      color: 'bg-red-100 border-red-400 text-red-800',
      description: 'Low in carbohydrates'
    },
    { 
      value: 'dairyfree', 
      label: 'Dairy Free', 
      emoji: '🥛', 
      color: 'bg-blue-100 border-blue-400 text-blue-800',
      description: 'No milk products'
    },
    { 
      value: 'keto', 
      label: 'Keto', 
      emoji: '🥑', 
      color: 'bg-purple-100 border-purple-400 text-purple-800',
      description: 'High fat, adequate protein, very low carb'
    },
  ];

  const toggleDietaryOption = (value: string) => {
    const isSelected = selectedDietary.includes(value);
    if (isSelected) {
      setSelectedDietary(selectedDietary.filter(d => d !== value));
    } else {
      setSelectedDietary([...selectedDietary, value]);
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center justify-between">
        <label className="block text-lg font-semibold flex items-center">
          <span className="text-xl mr-2">🥗</span>
          Dietary Preferences
        </label>
        <button 
          className="text-secondary hover:text-primary transition-colors flex items-center text-sm font-medium"
          onClick={() => setShowOptions(!showOptions)}
        >
          {showOptions ? 'Hide options' : 'Show options'}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ml-1 transition-transform ${showOptions ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {showOptions && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {dietOptions.map((diet) => (
            <div key={diet.value} className="diet-option">
              <input 
                type="checkbox" 
                id={`diet-${diet.value}`} 
                name="diet" 
                value={diet.value} 
                className="hidden"
                checked={selectedDietary.includes(diet.value)}
                onChange={() => toggleDietaryOption(diet.value)}
              />
              <label 
                htmlFor={`diet-${diet.value}`} 
                className={`
                  cursor-pointer rounded-lg p-3 text-sm flex items-center
                  border-2 transition-all hover:shadow-md w-full
                  ${selectedDietary.includes(diet.value) 
                    ? diet.color + ' border-current' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-2xl mr-3">{diet.emoji}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{diet.label}</span>
                  <span className="text-xs opacity-75">{diet.description}</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
