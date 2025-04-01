interface CuisineSelectorProps {
  selectedCuisine: string;
  setSelectedCuisine: (cuisine: string) => void;
}

interface CuisineOption {
  value: string;
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const CuisineSelector = ({ selectedCuisine, setSelectedCuisine }: CuisineSelectorProps) => {
  const cuisineOptions: CuisineOption[] = [
    { 
      value: 'indian', 
      label: 'Indian', 
      emoji: '🍛', 
      color: 'from-orange-500 to-red-500',
      description: 'Aromatic spices & bold flavors'
    },
    { 
      value: 'italian', 
      label: 'Italian', 
      emoji: '🍝', 
      color: 'from-green-500 to-red-500',
      description: 'Fresh herbs & rich tomato sauces'
    },
    { 
      value: 'chinese', 
      label: 'Chinese', 
      emoji: '🥢', 
      color: 'from-red-500 to-yellow-500',
      description: 'Balance of flavors & quick cooking'
    },
    { 
      value: 'american', 
      label: 'American', 
      emoji: '🍔', 
      color: 'from-blue-500 to-red-500',
      description: 'Hearty comfort foods & grilling'
    },
    { 
      value: 'japanese', 
      label: 'Japanese', 
      emoji: '🍣', 
      color: 'from-red-500 to-white',
      description: 'Fresh seafood & delicate flavors'
    },
    { 
      value: 'mexican', 
      label: 'Mexican', 
      emoji: '🌮', 
      color: 'from-green-500 to-red-500',
      description: 'Vibrant chilis & corn-based dishes'
    },
  ];

  return (
    <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <label className="block text-lg font-semibold mb-4 flex items-center">
        <span className="text-xl mr-2">🌍</span>
        Select Cuisine Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cuisineOptions.map((cuisine) => (
          <div key={cuisine.value} className="cuisine-option">
            <input 
              type="radio" 
              id={`cuisine-${cuisine.value}`} 
              name="cuisine" 
              value={cuisine.value} 
              className="hidden" 
              checked={selectedCuisine === cuisine.value}
              onChange={() => setSelectedCuisine(cuisine.value)}
            />
            <label 
              htmlFor={`cuisine-${cuisine.value}`} 
              className={`
                cursor-pointer border-2 border-gray-200 rounded-xl p-4 
                flex flex-col items-center text-center transition-all 
                hover:shadow-md overflow-hidden
                ${selectedCuisine === cuisine.value ? 'ring-2 ring-primary border-primary' : ''}
              `}
            >
              <div className={`
                w-16 h-16 rounded-full mb-3 flex items-center justify-center
                bg-gradient-to-br ${cuisine.color} text-white
              `}>
                <span className="cuisine-emoji text-3xl">{cuisine.emoji}</span>
              </div>
              <span className="font-medium text-gray-800">{cuisine.label}</span>
              <span className="text-xs text-gray-500 mt-1">{cuisine.description}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
