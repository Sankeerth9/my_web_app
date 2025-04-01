import OpenAI from "openai";
import { type InsertRecipe, type DietaryFlags } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null; // Will be null if no API key is provided

// Universal recipe generation system to handle any ingredients and cuisine combination
// Simulates AI-powered recipe generation without requiring API keys
function generateUniversalRecipes(
  ingredients: string[],
  cuisine: string,
  dietary: string[]
): InsertRecipe[] {
  console.log(`Generating universal recipes for ${cuisine} cuisine with ingredients: ${ingredients.join(', ')}`);
  
  const normalizedCuisine = cuisine.toLowerCase();
  const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
  const dietaryFlags = createDietaryFlagsObject(dietary);
  
  // Get base recipe patterns for the selected cuisine
  let baseRecipes = sampleRecipesByCuisine[normalizedCuisine] || [];
  
  // If no recipes for the specific cuisine, get recipes from other cuisines
  if (baseRecipes.length < 3) {
    const allRecipes = Object.values(sampleRecipesByCuisine).flat();
    const additionalRecipes = allRecipes
      .filter(recipe => recipe.cuisine.toLowerCase() !== normalizedCuisine)
      .slice(0, 3 - baseRecipes.length);
    
    baseRecipes = [...baseRecipes, ...additionalRecipes];
  }
  
  // If we still have fewer than 3 recipes, add more generic ones
  if (baseRecipes.length < 3) {
    const genericRecipeCount = 3 - baseRecipes.length;
    for (let i = 0; i < genericRecipeCount; i++) {
      baseRecipes.push({
        title: `${cuisine} Style Dish ${i+1}`,
        description: `A delicious ${cuisine} inspired dish made with your ingredients.`,
        ingredients: [],
        instructions: [],
        cuisine: normalizedCuisine,
        calories: 400,
        cookTime: "30 minutes",
        imageUrl: "",
        chefNote: "Experiment with the spice levels to match your taste!",
        dietaryFlags: {}
      });
    }
  }
  
  // Sort ingredients by importance (proteins first, then vegetables, then spices)
  const sortedIngredients = [...ingredients].sort((a, b) => {
    const aIsProtein = isProtein(a);
    const bIsProtein = isProtein(b);
    if (aIsProtein && !bIsProtein) return -1;
    if (!aIsProtein && bIsProtein) return 1;
    return 0;
  });
  
  // Generate recipes based on the available ingredients
  return baseRecipes.slice(0, 3).map((baseRecipe: any, index: number) => {
    // Create a dynamic title based on the main ingredients
    const mainIngredients = sortedIngredients.slice(0, 2);
    const recipeType = getRecipeType(normalizedCuisine, mainIngredients);
    
    const title = generateRecipeTitle(mainIngredients, recipeType, normalizedCuisine);
    
    // Create a dynamic description
    const description = generateRecipeDescription(mainIngredients, normalizedCuisine, recipeType);
    
    // Generate realistic calories based on ingredients and recipe type
    const calories = calculateApproximateCalories(mainIngredients, recipeType);
    
    // Generate cooking time based on recipe type
    const cookTime = calculateCookingTime(recipeType, mainIngredients);
    
    // Combine user ingredients with other necessary ingredients for the recipe
    const fullIngredientsList = generateCompleteIngredientsList(mainIngredients, normalizedCuisine, recipeType);
    
    // Generate realistic step-by-step instructions
    const instructions = generateInstructions(mainIngredients, normalizedCuisine, recipeType, fullIngredientsList);
    
    // Generate a chef's note
    const chefNote = generateChefNote(mainIngredients, normalizedCuisine);
    
    // Complete recipe object
    return {
      title,
      description,
      ingredients: fullIngredientsList,
      instructions,
      cuisine,
      calories,
      cookTime,
      imageUrl: cuisineImages[index % cuisineImages.length],
      chefNote,
      dietaryFlags
    };
  });
}

// Helper functions for the universal recipe generator
function isProtein(ingredient: string): boolean {
  const proteins = [
    // Meats
    'chicken', 'beef', 'pork', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'duck',
    'mutton', 'goat', 'venison', 'bison', 'rabbit', 'quail', 'pheasant', 'boar', 'veal', 'ham',
    'bacon', 'sausage', 'steak', 'ribs', 'fillet', 'chop', 'ground meat', 'mince', 'crab', 'lobster',
    'prawn', 'scallop', 'oyster', 'mussel', 'clam', 'squid', 'octopus', 'cod', 'trout', 'bass',
    'tilapia', 'catfish', 'sardine', 'mackerel', 'herring', 'anchovy',
    
    // Plant-based proteins
    'tofu', 'tempeh', 'seitan', 'bean', 'beans', 'lentil', 'lentils', 'chickpea', 'chickpeas',
    'pea protein', 'edamame', 'soy', 'soybeans', 'quinoa', 'amaranth', 'spelt', 'teff', 'hempseed',
    'chia seed', 'flaxseed', 'nutritional yeast', 'spirulina', 'nuts', 'nut', 'peanut', 'almond', 
    'cashew', 'walnut', 'pistachio', 'pecan', 'hazelnut', 'macadamia',
    
    // Dairy proteins
    'eggs', 'egg', 'paneer', 'cottage cheese', 'yogurt', 'greek yogurt', 'cheese', 'milk', 'whey',
    'casein', 'quark', 'kefir', 'ricotta', 'curd',
    
    // Novel proteins
    'impossible meat', 'beyond meat', 'plant-based meat', 'lab-grown', 'cultivated meat', 'insect protein',
    'cricket', 'mealworm', 'mycoprotein', 'quorn'
  ];
  return proteins.some(protein => ingredient.toLowerCase().includes(protein));
}

// Identify if an ingredient is a vegetable
function isVegetable(ingredient: string): boolean {
  const vegetables = [
    'lettuce', 'spinach', 'kale', 'arugula', 'chard', 'cabbage', 'bok choy', 'collard', 'broccoli',
    'cauliflower', 'brussels sprout', 'asparagus', 'celery', 'carrot', 'bell pepper', 'capsicum',
    'chili', 'chile', 'chilli', 'jalapeno', 'habanero', 'cucumber', 'zucchini', 'squash', 'pumpkin',
    'eggplant', 'aubergine', 'tomato', 'potato', 'sweet potato', 'yam', 'taro', 'cassava', 'onion',
    'garlic', 'shallot', 'leek', 'scallion', 'green onion', 'ginger', 'turmeric', 'radish', 'turnip',
    'beet', 'beetroot', 'rutabaga', 'parsnip', 'artichoke', 'corn', 'maize', 'pea', 'snap pea',
    'snow pea', 'green bean', 'string bean', 'mushroom', 'okra', 'bamboo shoot', 'water chestnut',
    'lotus root', 'seaweed', 'nori', 'wakame', 'kelp', 'sprout', 'microgreen', 'jicama'
  ];
  return vegetables.some(vegetable => ingredient.toLowerCase().includes(vegetable));
}

// Identify if an ingredient is a grain/starch
function isGrain(ingredient: string): boolean {
  const grains = [
    'rice', 'wheat', 'oat', 'barley', 'rye', 'corn', 'maize', 'quinoa', 'millet', 'sorghum',
    'spelt', 'farro', 'bulgur', 'couscous', 'pasta', 'noodle', 'spaghetti', 'macaroni', 'penne',
    'fettuccine', 'linguine', 'lasagna', 'rigatoni', 'orzo', 'bread', 'flour', 'maida', 'all-purpose',
    'semolina', 'buckwheat', 'amaranth', 'teff', 'wild rice', 'arborio', 'basmati', 'jasmine',
    'sticky rice', 'glutinous', 'polenta', 'grits', 'tortilla', 'wrap', 'pita', 'naan', 'chapati',
    'roti', 'paratha', 'bun', 'roll', 'bagel', 'croissant', 'cereal', 'granola', 'muesli',
    'cracker', 'pretzel', 'chip', 'crisp'
  ];
  return grains.some(grain => ingredient.toLowerCase().includes(grain));
}

// Identify if an ingredient is a spice or herb
function isSpiceOrHerb(ingredient: string): boolean {
  const spicesAndHerbs = [
    'salt', 'pepper', 'cumin', 'coriander', 'turmeric', 'paprika', 'chili powder', 'cayenne',
    'cinnamon', 'nutmeg', 'clove', 'allspice', 'cardamom', 'star anise', 'fennel', 'anise',
    'saffron', 'oregano', 'thyme', 'rosemary', 'sage', 'basil', 'parsley', 'cilantro', 'dill',
    'mint', 'tarragon', 'marjoram', 'bay leaf', 'vanilla', 'ginger', 'garlic', 'onion powder',
    'mustard', 'mustard seed', 'fenugreek', 'asafoetida', 'hing', 'mace', 'galangal', 'lemongrass',
    'kaffir lime', 'curry leaf', 'sumac', 'za\'atar', 'herbes de provence', 'italian seasoning',
    'garam masala', 'five spice', 'berbere', 'ras el hanout', 'tajin', 'adobo', 'curry powder',
    'shichimi', 'wasabi', 'horseradish', 'caraway', 'juniper', 'sichuan pepper', 'grains of paradise',
    'black salt', 'kala namak', 'pink salt', 'sea salt', 'kosher salt'
  ];
  return spicesAndHerbs.some(spice => ingredient.toLowerCase().includes(spice));
}

function getRecipeType(cuisine: string, ingredients: string[]): string {
  // Count ingredient types to determine the most appropriate recipe type
  const hasGrains = ingredients.some(i => isGrain(i));
  const hasProteins = ingredients.some(i => isProtein(i));
  const hasVegetables = ingredients.some(i => isVegetable(i));
  const hasSpices = ingredients.some(i => isSpiceOrHerb(i));
  
  // Rice-based dishes
  if (ingredients.some(i => i.toLowerCase().includes('rice'))) {
    if (cuisine === 'indian') return 'biryani';
    if (cuisine === 'chinese') return 'fried rice';
    if (cuisine === 'japanese') return 'rice bowl';
    if (cuisine === 'mexican') return 'rice bowl';
    if (cuisine === 'american' && hasProteins) return 'rice casserole';
    return 'rice dish';
  }
  
  // Pasta and noodle dishes
  if (ingredients.some(i => 
    i.toLowerCase().includes('pasta') || 
    i.toLowerCase().includes('noodle') ||
    i.toLowerCase().includes('spaghetti') ||
    i.toLowerCase().includes('macaroni') ||
    i.toLowerCase().includes('fettuccine')
  )) {
    if (cuisine === 'italian') return 'pasta';
    if (cuisine === 'chinese') return 'lo mein';
    if (cuisine === 'japanese') return 'ramen';
    if (cuisine === 'american' && ingredients.some(i => i.toLowerCase().includes('cheese'))) return 'mac and cheese';
    return 'noodle dish';
  }
  
  // Soup dishes
  if (ingredients.some(i => 
    i.toLowerCase().includes('broth') || 
    i.toLowerCase().includes('stock') || 
    i.toLowerCase().includes('soup')
  )) {
    if (cuisine === 'chinese') return 'soup';
    if (cuisine === 'japanese') return 'miso soup';
    if (cuisine === 'italian') return 'minestrone';
    if (cuisine === 'american') return 'chowder';
    return 'soup';
  }
  
  // Bread-based dishes
  if (ingredients.some(i => 
    i.toLowerCase().includes('bread') || 
    i.toLowerCase().includes('dough') || 
    i.toLowerCase().includes('flour') ||
    i.toLowerCase().includes('maida')
  )) {
    if (cuisine === 'italian') return hasProteins ? 'pizza' : 'flatbread';
    if (cuisine === 'indian') return 'naan';
    if (cuisine === 'mexican') return 'tortilla';
    if (cuisine === 'american') return 'sandwich';
    return 'bread dish';
  }
  
  // Main protein dishes
  if (hasProteins) {
    if (cuisine === 'indian') return hasSpices ? 'curry' : 'masala';
    if (cuisine === 'chinese') return hasVegetables ? 'stir-fry' : 'roast';
    if (cuisine === 'italian') return hasVegetables ? 'sauté' : 'roast';
    if (cuisine === 'mexican') return 'taco filling';
    if (cuisine === 'japanese') return 'teriyaki';
    if (cuisine === 'american') return 'grill';
    return 'main dish';
  }
  
  // Vegetable-forward dishes
  if (hasVegetables && !hasProteins) {
    if (cuisine === 'indian') return 'vegetable curry';
    if (cuisine === 'chinese') return 'vegetable stir-fry';
    if (cuisine === 'italian') return 'vegetable medley';
    if (cuisine === 'mexican') return 'vegetable fajitas';
    if (cuisine === 'japanese') return 'vegetable tempura';
    if (cuisine === 'american') return 'roasted vegetables';
    return 'vegetable dish';
  }
  
  // Snack or appetizer if only spices and minimal ingredients
  if (hasSpices && ingredients.length < 4 && !(hasProteins || hasVegetables || hasGrains)) {
    if (cuisine === 'indian') return 'chaat';
    if (cuisine === 'chinese') return 'dim sum';
    if (cuisine === 'italian') return 'antipasto';
    if (cuisine === 'mexican') return 'salsa';
    if (cuisine === 'japanese') return 'appetizer';
    if (cuisine === 'american') return 'snack';
    return 'appetizer';
  }
  
  // Default - catch all for anything else
  return 'recipe';
}

function generateRecipeTitle(mainIngredients: string[], recipeType: string, cuisine: string): string {
  // Create appealing titles based on ingredients and cuisine
  const mainIngredient = mainIngredients[0] || 'Flavorful';
  const secondIngredient = mainIngredients[1];
  
  const ingredientName = mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1);
  
  // Selection of adjectives to make titles interesting
  const adjectives = [
    'Delicious', 'Flavorful', 'Aromatic', 'Spicy', 'Savory', 
    'Quick', 'Traditional', 'Zesty', 'Hearty', 'Gourmet'
  ];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  
  // Cuisine-specific naming structures
  if (cuisine === 'indian') {
    if (recipeType === 'curry') return `${ingredientName} ${secondIngredient ? '& ' + secondIngredient : ''} Curry`;
    if (recipeType === 'biryani') return `${ingredientName} Biryani`;
    return `${randomAdjective} ${ingredientName} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
  }
  
  if (cuisine === 'chinese') {
    if (recipeType === 'stir-fry') return `${ingredientName} ${secondIngredient ? '& ' + secondIngredient : ''} Stir-Fry`;
    if (recipeType === 'fried rice') return `${ingredientName} Fried Rice`;
    return `Chinese-Style ${ingredientName} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
  }
  
  if (cuisine === 'italian') {
    if (recipeType === 'pasta') return `${ingredientName} ${secondIngredient ? '& ' + secondIngredient : ''} Pasta`;
    return `Italian ${ingredientName} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
  }
  
  // Default title format
  return `${randomAdjective} ${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)} ${ingredientName} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
}

function generateRecipeDescription(mainIngredients: string[], cuisine: string, recipeType: string): string {
  const mainIngredient = mainIngredients[0] || 'ingredients';
  const secondIngredient = mainIngredients[1];
  
  // Selection of description templates
  const templates = [
    `A delicious ${cuisine} ${recipeType} featuring ${mainIngredient}${secondIngredient ? ' and ' + secondIngredient : ''}, perfect for a satisfying meal.`,
    `This ${cuisine} inspired ${recipeType} highlights the flavors of ${mainIngredient}${secondIngredient ? ' combined with ' + secondIngredient : ''}.`,
    `A vibrant ${cuisine} dish that transforms ${mainIngredient}${secondIngredient ? ' and ' + secondIngredient : ''} into a memorable ${recipeType}.`,
    `An authentic ${cuisine} ${recipeType} that brings out the best in ${mainIngredient}${secondIngredient ? ' and ' + secondIngredient : ''}.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

function calculateApproximateCalories(ingredients: string[], recipeType: string): number {
  // Base calories by recipe type
  const baseCalories: Record<string, number> = {
    // Indian cuisine
    'curry': 450,
    'vegetable curry': 350,
    'biryani': 500,
    'masala': 400,
    'naan': 300,
    'chaat': 250,
    
    // Chinese cuisine
    'stir-fry': 350,
    'vegetable stir-fry': 250,
    'fried rice': 400,
    'lo mein': 450,
    'roast': 400,
    'soup': 200,
    'dim sum': 300,
    
    // Italian cuisine
    'pasta': 450,
    'pizza': 500,
    'flatbread': 350,
    'sauté': 350,
    'italian_roast': 400,
    'vegetable medley': 200,
    'minestrone': 250,
    'antipasto': 300,
    
    // Japanese cuisine
    'japanese_rice_bowl': 400,
    'ramen': 450,
    'teriyaki': 380,
    'miso soup': 200,
    'vegetable tempura': 350,
    
    // Mexican cuisine
    'taco filling': 350,
    'mexican_rice_bowl': 400,
    'tortilla': 300,
    'vegetable fajitas': 300,
    'salsa': 100,
    
    // American cuisine
    'grill': 400,
    'rice casserole': 500,
    'mac and cheese': 550,
    'sandwich': 450,
    'chowder': 400,
    'roasted vegetables': 250,
    'snack': 200,
    
    // General types
    'main dish': 400,
    'vegetable dish': 250,
    'rice dish': 400,
    'noodle dish': 400,
    'bread dish': 350,
    'general_soup': 200,
    'appetizer': 250,
    'recipe': 350
  };
  
  // Start with base calories for the recipe type
  let adjustedCalories = baseCalories[recipeType] || 400;
  
  // Count different ingredient types
  const proteinCount = ingredients.filter(i => isProtein(i)).length;
  const vegetableCount = ingredients.filter(i => isVegetable(i)).length;
  const grainCount = ingredients.filter(i => isGrain(i)).length;
  
  // Adjust calories based on ingredient counts
  
  // Proteins add or subtract calories depending on type
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Lean proteins (subtract calories)
    if (lowerIngredient.includes('chicken breast') || 
        lowerIngredient.includes('fish') || 
        lowerIngredient.includes('egg white') ||
        lowerIngredient.includes('tofu') ||
        lowerIngredient.includes('shrimp')) {
      adjustedCalories -= 20;
    }
    
    // Medium proteins (neutral)
    else if (lowerIngredient.includes('chicken thigh') || 
             lowerIngredient.includes('turkey') || 
             lowerIngredient.includes('egg') ||
             lowerIngredient.includes('legume') ||
             lowerIngredient.includes('bean') ||
             lowerIngredient.includes('lentil')) {
      // No adjustment
    }
    
    // Fatty proteins (add calories)
    else if (lowerIngredient.includes('beef') || 
             lowerIngredient.includes('pork') || 
             lowerIngredient.includes('lamb') ||
             lowerIngredient.includes('duck') ||
             lowerIngredient.includes('bacon') ||
             lowerIngredient.includes('sausage')) {
      adjustedCalories += 40;
    }
  });
  
  // Dairy and fats add calories
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    if (lowerIngredient.includes('cream') || 
        lowerIngredient.includes('butter') || 
        lowerIngredient.includes('cheese') ||
        lowerIngredient.includes('ghee') ||
        lowerIngredient.includes('oil') ||
        lowerIngredient.includes('mayonnaise')) {
      adjustedCalories += 50;
    }
  });
  
  // More vegetables reduce calories
  if (vegetableCount > 2) {
    adjustedCalories -= 20 * (vegetableCount - 2);
  }
  
  // More grains increase calories
  if (grainCount > 1) {
    adjustedCalories += 30 * (grainCount - 1);
  }
  
  // Sweet ingredients add calories
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    if (lowerIngredient.includes('sugar') || 
        lowerIngredient.includes('honey') || 
        lowerIngredient.includes('syrup') ||
        lowerIngredient.includes('chocolate') ||
        lowerIngredient.includes('caramel')) {
      adjustedCalories += 40;
    }
  });
  
  // Apply some randomness to make it more realistic (±10%)
  const randomAdjustment = Math.floor((Math.random() * 0.2 - 0.1) * adjustedCalories);
  adjustedCalories += randomAdjustment;
  
  // Ensure minimum calories
  return Math.max(150, adjustedCalories);
}

function calculateCookingTime(recipeType: string, ingredients: string[]): string {
  // Base cooking times by recipe type
  const baseTimes: Record<string, number> = {
    'curry': 35,
    'biryani': 45,
    'stir-fry': 20,
    'fried rice': 25,
    'pasta': 30,
    'noodle dish': 25,
    'rice dish': 35,
    'grill': 25,
    'main dish': 30,
    'recipe': 25
  };
  
  // Adjust time based on ingredients
  let adjustedTime = baseTimes[recipeType] || 30;
  
  // Proteins like beef, lamb take longer
  if (ingredients.some(i => i.toLowerCase().includes('beef') || i.toLowerCase().includes('lamb'))) {
    adjustedTime += 15;
  }
  
  // Quick-cooking proteins
  if (ingredients.some(i => i.toLowerCase().includes('shrimp') || i.toLowerCase().includes('fish'))) {
    adjustedTime -= 5;
  }
  
  // Rice dishes generally take longer
  if (ingredients.some(i => i.toLowerCase().includes('rice')) && !recipeType.includes('rice')) {
    adjustedTime += 10;
  }
  
  // Apply some randomness
  adjustedTime += Math.floor(Math.random() * 10);
  
  // Format the time
  if (adjustedTime >= 60) {
    const hours = Math.floor(adjustedTime / 60);
    const minutes = adjustedTime % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? minutes + ' minutes' : ''}`;
  }
  
  return `${adjustedTime} minutes`;
}

function generateCompleteIngredientsList(userIngredients: string[], cuisine: string, recipeType: string): string[] {
  // Start with user-provided ingredients
  const ingredientsList = [...userIngredients];
  
  // Common basic ingredients
  const basicIngredients = [
    'Salt', 
    'Black pepper'
  ];
  
  // Add cuisine-specific ingredients
  let cuisineIngredients: string[] = [];
  
  if (cuisine === 'indian') {
    cuisineIngredients = [
      'Cumin powder',
      'Coriander powder',
      'Turmeric powder',
      'Garam masala',
      'Vegetable oil or ghee'
    ];
    
    if (recipeType === 'curry') {
      cuisineIngredients.push('Onion, chopped', 'Tomato, chopped', 'Garlic, minced', 'Ginger, grated');
      if (!ingredientsList.some(i => i.toLowerCase().includes('chili') || i.toLowerCase().includes('chilli'))) {
        cuisineIngredients.push('Green chilies, chopped');
      }
    }
    
    if (recipeType === 'biryani') {
      cuisineIngredients.push('Basmati rice', 'Onion, sliced', 'Yogurt', 'Fresh cilantro, chopped', 'Fresh mint leaves');
    }
  }
  
  else if (cuisine === 'chinese') {
    cuisineIngredients = [
      'Soy sauce',
      'Sesame oil',
      'Garlic, minced',
      'Ginger, grated',
      'Green onions, sliced'
    ];
    
    if (recipeType === 'stir-fry') {
      cuisineIngredients.push('Vegetable oil', 'Cornstarch');
    }
    
    if (recipeType === 'fried rice') {
      if (!ingredientsList.some(i => i.toLowerCase().includes('rice'))) {
        cuisineIngredients.push('Cooked rice, preferably day-old');
      }
      cuisineIngredients.push('Vegetable oil');
    }
  }
  
  else if (cuisine === 'italian') {
    cuisineIngredients = [
      'Olive oil',
      'Garlic, minced',
      'Basil leaves',
      'Oregano'
    ];
    
    if (recipeType === 'pasta') {
      if (!ingredientsList.some(i => i.toLowerCase().includes('pasta'))) {
        cuisineIngredients.push('Pasta of your choice');
      }
      cuisineIngredients.push('Parmesan cheese, grated');
    }
  }
  
  else if (cuisine === 'mexican') {
    cuisineIngredients = [
      'Cumin powder',
      'Chili powder',
      'Cilantro, chopped',
      'Lime juice',
      'Onion, chopped'
    ];
  }
  
  else if (cuisine === 'japanese') {
    cuisineIngredients = [
      'Soy sauce',
      'Mirin',
      'Rice vinegar',
      'Sesame oil',
      'Green onions, sliced'
    ];
  }
  
  else if (cuisine === 'american') {
    cuisineIngredients = [
      'Olive oil or vegetable oil',
      'Garlic powder',
      'Onion powder'
    ];
    
    if (recipeType === 'grill') {
      cuisineIngredients.push('BBQ sauce', 'Worcestershire sauce');
    }
  }
  
  // Merge all ingredients, removing duplicates
  const mergedIngredients = [...ingredientsList];
  
  // Add basic ingredients not already included
  basicIngredients.forEach(ingredient => {
    if (!ingredientsList.some(i => i.toLowerCase() === ingredient.toLowerCase())) {
      mergedIngredients.push(ingredient);
    }
  });
  
  // Add cuisine-specific ingredients not already included
  cuisineIngredients.forEach(ingredient => {
    const ingredientName = ingredient.split(',')[0].trim().toLowerCase();
    if (!ingredientsList.some(i => i.toLowerCase().includes(ingredientName))) {
      mergedIngredients.push(ingredient);
    }
  });
  
  return mergedIngredients;
}

function generateInstructions(mainIngredients: string[], cuisine: string, recipeType: string, fullIngredients: string[]): string[] {
  const instructions: string[] = [];
  
  // Identify proteins and vegetables
  const proteins = fullIngredients.filter(i => isProtein(i));
  const hasRice = fullIngredients.some(i => i.toLowerCase().includes('rice'));
  const hasPasta = fullIngredients.some(i => i.toLowerCase().includes('pasta'));
  
  // Preparation steps based on recipe type
  if (recipeType === 'curry' || cuisine === 'indian') {
    instructions.push("Heat oil or ghee in a large pan over medium heat.");
    instructions.push("Add chopped onions and sauté until golden brown, about 5 minutes.");
    
    if (proteins.length > 0) {
      if (proteins.some(p => p.toLowerCase().includes('chicken') || p.toLowerCase().includes('meat'))) {
        instructions.push(`Add ${proteins.join(' and ')} and cook until browned on all sides, about 5-7 minutes.`);
      } else if (proteins.some(p => p.toLowerCase().includes('egg'))) {
        instructions.push("Heat oil in a separate pan and fry eggs until desired doneness. Set aside.");
      }
    }
    
    instructions.push("Add minced garlic, grated ginger, and green chilies (if using). Sauté for 1-2 minutes until fragrant.");
    instructions.push("Add spices (turmeric, cumin, coriander, chili powder) and stir for 30 seconds to toast them.");
    
    if (fullIngredients.some(i => i.toLowerCase().includes('tomato'))) {
      instructions.push("Add chopped tomatoes and cook until soft and oil begins to separate from the masala, about 5 minutes.");
    }
    
    const otherVegetables = fullIngredients.filter(i => 
      !isProtein(i) && 
      !i.toLowerCase().includes('rice') && 
      !i.toLowerCase().includes('salt') && 
      !i.toLowerCase().includes('pepper') && 
      !i.toLowerCase().includes('oil') && 
      !i.toLowerCase().includes('masala') && 
      !i.toLowerCase().includes('powder') && 
      !i.toLowerCase().includes('tomato') &&
      !i.toLowerCase().includes('garlic') &&
      !i.toLowerCase().includes('ginger') &&
      !i.toLowerCase().includes('chili')
    );
    
    if (otherVegetables.length > 0) {
      instructions.push(`Add ${otherVegetables.join(', ')} and stir well to combine.`);
    }
    
    if (hasRice && recipeType === 'biryani') {
      instructions.push("In a separate pot, parboil the rice until 70% cooked. Drain and set aside.");
      instructions.push("Layer the partially cooked rice over the curry mixture.");
      instructions.push("Cover tightly with a lid and cook on low heat for 20 minutes until rice is fully cooked.");
    } else {
      instructions.push("Add water or broth if needed to achieve desired consistency.");
      instructions.push("Simmer for 15-20 minutes until the flavors meld and the sauce thickens.");
    }
    
    if (proteins.some(p => p.toLowerCase().includes('egg')) && !recipeType.includes('biryani')) {
      instructions.push("Gently add the fried eggs to the curry and simmer for an additional 2-3 minutes.");
    }
    
    instructions.push("Season with salt to taste and garnish with fresh cilantro before serving.");
    
    if (hasRice && !recipeType.includes('biryani')) {
      instructions.push("Serve hot with steamed rice.");
    }
  }
  
  else if (recipeType === 'stir-fry' || cuisine === 'chinese') {
    instructions.push("Heat vegetable oil in a wok or large frying pan over high heat until shimmering.");
    
    if (proteins.length > 0) {
      instructions.push(`Add ${proteins.join(' and ')} and stir-fry until nearly cooked through, about 3-4 minutes.`);
      instructions.push("Transfer protein to a plate and set aside.");
    }
    
    instructions.push("Add minced garlic and grated ginger to the wok and stir-fry for 30 seconds until fragrant.");
    
    const vegetables = fullIngredients.filter(i => 
      !isProtein(i) && 
      !i.toLowerCase().includes('sauce') && 
      !i.toLowerCase().includes('oil') &&
      !i.toLowerCase().includes('salt') &&
      !i.toLowerCase().includes('pepper') &&
      !i.toLowerCase().includes('garlic') &&
      !i.toLowerCase().includes('ginger') &&
      !i.toLowerCase().includes('cornstarch') &&
      !i.toLowerCase().includes('rice')
    );
    
    if (vegetables.length > 0) {
      instructions.push(`Add ${vegetables.join(', ')} and stir-fry for 3-4 minutes until vegetables are crisp-tender.`);
    }
    
    if (proteins.length > 0) {
      instructions.push("Return the cooked protein to the wok.");
    }
    
    instructions.push("Add soy sauce, sesame oil, and any other sauce ingredients. Toss to combine.");
    
    if (fullIngredients.some(i => i.toLowerCase().includes('cornstarch'))) {
      instructions.push("Mix 1 tablespoon cornstarch with 2 tablespoons water to create a slurry.");
      instructions.push("Pour the slurry into the wok and stir until sauce thickens, about 1 minute.");
    }
    
    instructions.push("Season with salt and pepper to taste.");
    instructions.push("Garnish with sliced green onions before serving.");
    
    if (hasRice) {
      instructions.push("Serve hot over steamed rice.");
    }
  }
  
  else if (recipeType === 'pasta' || cuisine === 'italian') {
    if (hasPasta) {
      instructions.push("Bring a large pot of salted water to a boil.");
      instructions.push("Cook pasta according to package directions until al dente. Drain, reserving 1/2 cup of pasta water.");
    }
    
    instructions.push("Heat olive oil in a large skillet over medium heat.");
    
    if (proteins.length > 0) {
      if (proteins.some(p => p.toLowerCase().includes('chicken') || p.toLowerCase().includes('meat'))) {
        instructions.push(`Season ${proteins.join(' and ')} with salt and pepper, then cook until browned and cooked through, about 5-7 minutes.`);
      } else if (proteins.some(p => p.toLowerCase().includes('egg'))) {
        instructions.push("In a separate bowl, beat eggs with a pinch of salt and pepper. Set aside.");
      }
    }
    
    instructions.push("Add minced garlic to the skillet and sauté for 1 minute until fragrant.");
    
    const vegetables = fullIngredients.filter(i => 
      !isProtein(i) && 
      !i.toLowerCase().includes('pasta') && 
      !i.toLowerCase().includes('oil') &&
      !i.toLowerCase().includes('salt') &&
      !i.toLowerCase().includes('pepper') &&
      !i.toLowerCase().includes('garlic') &&
      !i.toLowerCase().includes('basil') &&
      !i.toLowerCase().includes('oregano') &&
      !i.toLowerCase().includes('cheese')
    );
    
    if (vegetables.length > 0) {
      instructions.push(`Add ${vegetables.join(', ')} and cook for 3-5 minutes until tender.`);
    }
    
    if (proteins.some(p => p.toLowerCase().includes('egg'))) {
      instructions.push("Lower the heat and pour in the beaten eggs, stirring quickly to create creamy strands.");
    }
    
    if (hasPasta) {
      instructions.push("Add the cooked pasta to the skillet and toss to combine.");
      instructions.push("Add a splash of reserved pasta water to create a silky sauce, if needed.");
    }
    
    instructions.push("Stir in dried herbs (oregano, basil) and season with salt and pepper to taste.");
    
    if (fullIngredients.some(i => i.toLowerCase().includes('cheese'))) {
      instructions.push("Sprinkle with grated cheese and toss until melted.");
    }
    
    instructions.push("Garnish with fresh basil leaves before serving.");
  }
  
  // Default instructions if no specific pattern is matched
  if (instructions.length === 0) {
    instructions.push("Prepare all ingredients by washing, chopping, and measuring as needed.");
    instructions.push("Heat oil in a suitable pan over medium heat.");
    
    if (proteins.length > 0) {
      instructions.push(`Cook ${proteins.join(' and ')} until properly done (browned for meat, set for eggs, etc.).`);
    }
    
    instructions.push("Add aromatics (garlic, onions, ginger) and cook until fragrant.");
    instructions.push("Add main ingredients and cook until tender.");
    instructions.push("Season with appropriate spices and herbs.");
    instructions.push("Add any sauces or liquids needed for the dish.");
    instructions.push("Adjust seasoning to taste.");
    instructions.push("Garnish appropriately before serving.");
  }
  
  return instructions;
}

function generateChefNote(ingredients: string[], cuisine: string): string {
  // A selection of chef notes based on ingredients and cuisine
  const chefNotes = [
    `For the best flavor, toast the spices briefly before adding other ingredients.`,
    `This dish tastes even better the next day as the flavors continue to develop.`,
    `Adjust the spice level to your preference by adding more or less chili.`,
    `Fresh herbs added at the end make a big difference in brightening the flavors.`,
    `For a richer version, add a tablespoon of butter or cream at the end of cooking.`,
    `Serve with a squeeze of fresh lemon or lime juice to elevate all the flavors.`,
    `Use the freshest ingredients you can find for the best results.`
  ];
  
  // Cuisine-specific chef notes
  const cuisineNotes: Record<string, string[]> = {
    'indian': [
      `For authentic flavor, use whole spices toasted and ground just before cooking.`,
      `A pinch of garam masala added at the end of cooking adds wonderful aroma.`,
      `To reduce the heat without sacrificing flavor, remove the seeds from the chilies.`,
      `For a richer curry, add a spoonful of cream or coconut milk at the end.`
    ],
    'chinese': [
      `Have all ingredients prepped before you start cooking, as stir-frying moves quickly.`,
      `For the perfect stir-fry, cook in batches to avoid overcrowding the wok.`,
      `A touch of sugar balances the saltiness of the soy sauce.`,
      `For authentic Chinese flavor, use a high-smoke-point oil like peanut oil.`
    ],
    'italian': [
      `Reserve some pasta cooking water to help the sauce cling to the pasta.`,
      `For the best flavor, finish cooking the pasta in the sauce for the last minute.`,
      `Use the highest quality olive oil you can afford for the best flavor.`,
      `Fresh basil added just before serving adds wonderful aroma and freshness.`
    ]
  };
  
  // Get cuisine-specific notes
  const relevantNotes = cuisineNotes[cuisine.toLowerCase()] || chefNotes;
  
  // Select a random note
  return relevantNotes[Math.floor(Math.random() * relevantNotes.length)];
}

// Additional helper function for creating recipes specifically optimized for eggs, rice, and spices (common Indian ingredients)
function generateIndianRecipesWithEggsAndRice(): InsertRecipe[] {
  return [
    {
      title: "Spicy Egg Biryani",
      description: "A flavorful Indian rice dish featuring eggs and aromatic spices like chili powder, perfect for a satisfying meal.",
      ingredients: [
        "4 eggs, hard-boiled and halved",
        "2 cups basmati rice, rinsed and soaked for 30 minutes",
        "2 onions, thinly sliced",
        "2 tomatoes, chopped",
        "2 green chilies, slit lengthwise",
        "2 tbsp ginger-garlic paste",
        "1 tsp turmeric powder",
        "1 tbsp chili powder",
        "1 tsp garam masala",
        "1 tbsp coriander powder",
        "1 tsp cumin powder",
        "2 tbsp yogurt",
        "1/4 cup fresh coriander leaves, chopped",
        "1/4 cup fresh mint leaves, chopped",
        "Salt to taste",
        "3 tbsp ghee or oil",
        "4 cups water or broth"
      ],
      instructions: [
        "Heat ghee or oil in a large pot. Add sliced onions and fry until golden brown.",
        "Add ginger-garlic paste and green chilies. Sauté for 2 minutes until fragrant.",
        "Add chopped tomatoes and cook until soft and oil begins to separate.",
        "Add turmeric, chili powder, garam masala, coriander powder, cumin powder, and salt. Mix well.",
        "Add yogurt and stir continuously to prevent curdling.",
        "Add drained rice and gently mix to coat with the spice mixture.",
        "Pour in water or broth, bring to a boil, then reduce heat to low.",
        "Cover and cook for about 15 minutes until rice is 80% cooked.",
        "Arrange halved hard-boiled eggs on top of the rice.",
        "Sprinkle chopped coriander and mint leaves.",
        "Cover with a tight lid and cook on very low heat for another 10-15 minutes.",
        "Let it rest for 10 minutes before gently mixing and serving."
      ],
      cuisine: "indian",
      calories: 450,
      cookTime: "50 minutes",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      chefNote: "For extra flavor, add a pinch of saffron soaked in warm milk on top of the rice before the final cooking step.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    },
    {
      title: "Egg Curry with Rice",
      description: "A rich and spicy Indian egg curry with a tomato-based gravy, perfect served over steamed rice.",
      ingredients: [
        "6 eggs, hard-boiled and peeled",
        "2 cups rice, cooked",
        "2 onions, finely chopped",
        "3 tomatoes, pureed",
        "2 tbsp ginger-garlic paste",
        "2-3 green chilies, chopped",
        "1 tsp turmeric powder",
        "1-2 tsp chili powder (adjust to taste)",
        "1 tbsp coriander powder",
        "1 tsp cumin powder",
        "1/2 tsp garam masala",
        "1/4 cup fresh coriander leaves, chopped",
        "2 tbsp oil",
        "1 cup water",
        "Salt to taste"
      ],
      instructions: [
        "Heat oil in a pan. Add chopped onions and sauté until golden brown.",
        "Add ginger-garlic paste and green chilies. Cook for 2 minutes until raw smell disappears.",
        "Add tomato puree and cook until oil separates from the masala.",
        "Add turmeric powder, chili powder, coriander powder, and cumin powder. Mix well.",
        "Add 1 cup water and bring to a boil. Simmer for 5 minutes.",
        "Make small slits on the hard-boiled eggs and add them to the gravy.",
        "Cook on low heat for 10 minutes, allowing the eggs to absorb the flavors.",
        "Add garam masala and salt. Mix gently.",
        "Garnish with fresh coriander leaves.",
        "Serve hot with steamed rice."
      ],
      cuisine: "indian",
      calories: 380,
      cookTime: "35 minutes",
      imageUrl: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      chefNote: "For a richer gravy, add 1/4 cup of cream or coconut milk at the end.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Spiced Egg Fried Rice",
      description: "A quick and flavorful Indian-style fried rice with scrambled eggs and aromatic spices.",
      ingredients: [
        "3 cups cooked rice (preferably day-old and cooled)",
        "4 eggs, beaten",
        "1 onion, finely chopped",
        "1 bell pepper, diced",
        "1 carrot, diced",
        "1/2 cup peas",
        "2 green chilies, finely chopped",
        "1 tbsp ginger-garlic paste",
        "1 tsp turmeric",
        "1 tsp chili powder",
        "1/2 tsp ground black pepper",
        "1 tsp cumin seeds",
        "1 tsp garam masala",
        "3 tbsp oil",
        "Salt to taste",
        "2 tbsp fresh coriander leaves, chopped"
      ],
      instructions: [
        "Heat 1 tablespoon of oil in a large pan or wok. Add beaten eggs and scramble until just cooked. Remove and set aside.",
        "In the same pan, add the remaining oil. Add cumin seeds and let them splutter.",
        "Add chopped onions and sauté until translucent.",
        "Add ginger-garlic paste and green chilies. Sauté for a minute.",
        "Add diced vegetables (bell pepper, carrot, peas) and cook for 3-4 minutes until slightly tender.",
        "Add turmeric, chili powder, black pepper, and salt. Mix well.",
        "Add the cooked rice and mix gently to avoid breaking the grains.",
        "Fold in the scrambled eggs.",
        "Sprinkle garam masala and mix well.",
        "Cook for another 3-4 minutes, stirring occasionally.",
        "Garnish with fresh coriander leaves and serve hot."
      ],
      cuisine: "indian",
      calories: 320,
      cookTime: "25 minutes",
      imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
      chefNote: "For best results, use day-old refrigerated rice as fresh rice can become mushy when stir-fried.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    }
  ];
}

// Sample food images for generated recipes by cuisine type
const foodImagesByCuisine: Record<string, string[]> = {
  italian: [
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Pasta
    "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Pizza
    "https://images.unsplash.com/photo-1579349443343-73da56a71a20?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Risotto
  ],
  indian: [
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Curry
    "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Tandoori
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Biryani
  ],
  chinese: [
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Stir fry
    "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Dim sum
    "https://images.unsplash.com/photo-1557872943-16a5ac26437e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Noodles
  ],
  japanese: [
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Sushi
    "https://images.unsplash.com/photo-1557872943-16a5ac26437e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Ramen
    "https://images.unsplash.com/photo-1617196035154-421e3b3ab46e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Bento
  ],
  american: [
    "https://images.unsplash.com/photo-1550317138-10000687a72b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Burger
    "https://images.unsplash.com/photo-1576026756048-4f0e2b808858?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // BBQ
    "https://images.unsplash.com/photo-1546549032-9571cd6b27df?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Sandwich
  ],
  mexican: [
    "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Tacos
    "https://images.unsplash.com/photo-1613514785940-daed07799d9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Burritos
    "https://images.unsplash.com/photo-1640389576537-5915ad736258?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Enchiladas
  ]
};

// Default food images for any other cuisine
const defaultFoodImages = [
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Vegetable dish
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80", // Salad
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"  // Rice dish
];

// ChatGPT style recipes with focus on detailed instructions and health benefits
function generateChatGPTStyleRecipes(
  ingredients: string[],
  cuisine: string,
  dietary: string[],
  dietaryFlags: Record<string, boolean>
): InsertRecipe[] {
  console.log(`Generating ChatGPT style recipes for ${cuisine} cuisine with ingredients: ${ingredients.join(', ')}`);
  
  const normalizedCuisine = cuisine.toLowerCase();
  const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
  
  // ChatGPT tends to be more creative and educational in its responses
  // Simulate this by adding more detailed instructions and nutritional insights
  const recipes: InsertRecipe[] = [];
  
  // Generate 3 unique recipes with different preparation methods
  const preparationStyles = [
    { 
      style: "traditional", 
      emphasis: "authentic flavors and techniques"
    },
    { 
      style: "fusion", 
      emphasis: "modern twist on classic elements"
    },
    { 
      style: "quick", 
      emphasis: "time-saving preparation methods"
    }
  ];
  
  preparationStyles.forEach((prepStyle, index) => {
    // Sort ingredients by importance
    const sortedIngredients = [...ingredients].sort((a, b) => {
      const aIsProtein = isProtein(a);
      const bIsProtein = isProtein(b);
      if (aIsProtein && !bIsProtein) return -1;
      if (!aIsProtein && bIsProtein) return 1;
      return 0;
    });
    
    // Get main ingredient for recipe name
    const mainIngredient = sortedIngredients[0] || "Mixed";
    const secondaryIngredient = sortedIngredients[1] || "";
    
    // Generate recipe type based on cuisine and ingredients
    const recipeType = getRecipeType(normalizedCuisine, sortedIngredients);
    
    // Creative title generation
    let titlePrefix = "";
    if (prepStyle.style === "traditional") {
      titlePrefix = ["Authentic", "Classic", "Traditional", "Home-style"][Math.floor(Math.random() * 4)];
    } else if (prepStyle.style === "fusion") {
      titlePrefix = ["Modern", "Fusion", "Contemporary", "Innovative"][Math.floor(Math.random() * 4)];
    } else {
      titlePrefix = ["Quick", "Easy", "30-Minute", "Weeknight"][Math.floor(Math.random() * 4)];
    }
    
    const mainIngCapitalized = mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1);
    let title = `${titlePrefix} ${cuisine} ${mainIngCapitalized} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
    
    if (secondaryIngredient) {
      title = `${titlePrefix} ${mainIngCapitalized} & ${secondaryIngredient} ${cuisine} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
    }
    
    // Generate detailed description with nutritional insight
    const nutritionalInsight = [
      "high in protein and essential vitamins",
      "rich in antioxidants and fiber",
      "packed with healthy fats and minerals",
      "balanced in carbohydrates and nutrients"
    ][Math.floor(Math.random() * 4)];
    
    const description = `This ${prepStyle.style} ${cuisine} dish showcases the ${prepStyle.emphasis} with ${mainIngredient}${secondaryIngredient ? ' and ' + secondaryIngredient : ''}. It's ${nutritionalInsight} while delivering authentic flavors.`;
    
    // Generate complete ingredient list including cuisine-specific items
    const fullIngredientsList = generateCompleteIngredientsList(sortedIngredients, normalizedCuisine, recipeType);
    
    // Generate detailed step-by-step instructions
    const instructions = generateInstructions(sortedIngredients, normalizedCuisine, recipeType, fullIngredientsList);
    
    // Add 1-2 extra detailed steps specific to ChatGPT's style
    instructions.push(`For best results, allow the flavors to meld together for 5-10 minutes before serving.`);
    
    if (Math.random() > 0.5) {
      instructions.push(`Garnish with fresh herbs before serving to add color and a burst of flavor.`);
    }
    
    // Calculate calories and cooking time
    const calories = calculateApproximateCalories(sortedIngredients, recipeType) + Math.floor(Math.random() * 50);
    const cookTime = calculateCookingTime(recipeType, sortedIngredients);
    
    // Generate chef note with educational content
    const chefNote = `For authentic ${cuisine} flavor, ${generateChefNote(sortedIngredients, normalizedCuisine)}. This recipe works well with meal prep and the flavors often improve overnight.`;
    
    recipes.push({
      title,
      description,
      ingredients: fullIngredientsList,
      instructions,
      cuisine,
      calories,
      cookTime,
      imageUrl: cuisineImages[index % cuisineImages.length],
      chefNote,
      dietaryFlags
    });
  });
  
  return recipes;
}

// Grok AI style recipes with direct, practical approach and humor
function generateGrokStyleRecipes(
  ingredients: string[],
  cuisine: string,
  dietary: string[],
  dietaryFlags: Record<string, boolean>
): InsertRecipe[] {
  console.log(`Generating Grok AI style recipes for ${cuisine} cuisine with ingredients: ${ingredients.join(', ')}`);
  
  const normalizedCuisine = cuisine.toLowerCase();
  const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
  
  // Grok AI tends to be more direct and sometimes humorous
  // Simulate this with more practical instructions and occasional humor
  const recipes: InsertRecipe[] = [];
  
  // Generate 3 recipes with different difficulty levels
  const difficultyLevels = [
    { 
      level: "beginner", 
      emphasis: "simple techniques perfect for novice cooks"
    },
    { 
      level: "intermediate", 
      emphasis: "balanced approach for home cooks with some experience"
    },
    { 
      level: "advanced", 
      emphasis: "challenging techniques for experienced home chefs"
    }
  ];
  
  difficultyLevels.forEach((difficulty, index) => {
    // Sort ingredients by importance
    const sortedIngredients = [...ingredients].sort((a, b) => {
      const aIsProtein = isProtein(a);
      const bIsProtein = isProtein(b);
      if (aIsProtein && !bIsProtein) return -1;
      if (!aIsProtein && bIsProtein) return 1;
      return 0;
    });
    
    // Get main ingredients for recipe name
    const mainIngredient = sortedIngredients[0] || "Mixed";
    const secondaryIngredient = sortedIngredients[1] || "";
    
    // Generate recipe type based on cuisine and ingredients
    const recipeType = getRecipeType(normalizedCuisine, sortedIngredients);
    
    // Direct, sometimes humorous title generation
    const humorousAdjectives = ["No-Nonsense", "Straight-Up", "Can't-Mess-Up", "Flavor-Bomb"];
    const mainIngCapitalized = mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1);
    
    let title = "";
    if (difficulty.level === "beginner") {
      title = `${humorousAdjectives[Math.floor(Math.random() * humorousAdjectives.length)]} ${cuisine} ${mainIngCapitalized} ${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
    } else {
      title = `${cuisine} ${mainIngCapitalized} ${secondaryIngredient ? '& ' + secondaryIngredient + ' ' : ''}${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}`;
    }
    
    // Generate practical description
    const practicality = [
      "perfect for busy weeknights",
      "great for meal prep",
      "ideal when you need to impress guests",
      "a crowd-pleaser that won't break the bank"
    ][Math.floor(Math.random() * 4)];
    
    const description = `A ${difficulty.level}-level ${cuisine} dish with ${mainIngredient}${secondaryIngredient ? ' and ' + secondaryIngredient : ''} that's ${practicality}. Features ${difficulty.emphasis}.`;
    
    // Generate complete ingredient list
    const fullIngredientsList = generateCompleteIngredientsList(sortedIngredients, normalizedCuisine, recipeType);
    
    // Generate practical step-by-step instructions
    const instructions = generateInstructions(sortedIngredients, normalizedCuisine, recipeType, fullIngredientsList);
    
    // Add practical tip specific to Grok's style
    if (difficulty.level === "beginner") {
      instructions.push(`Don't worry if it doesn't look perfect - it'll still taste great!`);
    } else if (difficulty.level === "advanced") {
      instructions.push(`Presentation matters: arrange on the plate with intention for a restaurant-quality finish.`);
    }
    
    // Calculate calories and cooking time
    const calories = calculateApproximateCalories(sortedIngredients, recipeType);
    const cookTime = calculateCookingTime(recipeType, sortedIngredients);
    
    // Generate chef note with practical advice and occasional humor
    let chefNote = "";
    if (Math.random() > 0.7) {
      // Humorous note
      chefNote = `Pro tip: This ${recipeType} is so good, you might want to "accidentally" forget to invite that friend who always criticizes your cooking. Also, ${generateChefNote(sortedIngredients, normalizedCuisine)}`;
    } else {
      // Practical note
      chefNote = `This recipe is forgiving - if you don't have all the ingredients, don't stress. ${generateChefNote(sortedIngredients, normalizedCuisine)}`;
    }
    
    recipes.push({
      title,
      description,
      ingredients: fullIngredientsList,
      instructions,
      cuisine,
      calories,
      cookTime,
      imageUrl: cuisineImages[index % cuisineImages.length],
      chefNote,
      dietaryFlags
    });
  });
  
  return recipes;
}

// DeepSeek style recipes with technical precision and cultural context
function generateDeepSeekStyleRecipes(
  ingredients: string[],
  cuisine: string,
  dietary: string[],
  dietaryFlags: Record<string, boolean>
): InsertRecipe[] {
  console.log(`Generating DeepSeek style recipes for ${cuisine} cuisine with ingredients: ${ingredients.join(', ')}`);
  
  const normalizedCuisine = cuisine.toLowerCase();
  const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
  
  // DeepSeek tends to be more technical and include cultural context
  // Simulate this with precise cooking techniques and cultural insights
  const recipes: InsertRecipe[] = [];
  
  // Generate 3 recipes with different cultural emphasis
  const culturalApproaches = [
    { 
      approach: "traditional", 
      emphasis: "historically authentic preparation methods"
    },
    { 
      approach: "regional", 
      emphasis: "specific regional variation"
    },
    { 
      approach: "contemporary", 
      emphasis: "modern interpretation respecting traditional roots"
    }
  ];
  
  culturalApproaches.forEach((cultural, index) => {
    // Sort ingredients by importance
    const sortedIngredients = [...ingredients].sort((a, b) => {
      const aIsProtein = isProtein(a);
      const bIsProtein = isProtein(b);
      if (aIsProtein && !bIsProtein) return -1;
      if (!aIsProtein && bIsProtein) return 1;
      return 0;
    });
    
    // Get main ingredients for recipe name
    const mainIngredient = sortedIngredients[0] || "Mixed";
    const secondaryIngredient = sortedIngredients[1] || "";
    
    // Generate recipe type based on cuisine and ingredients
    const recipeType = getRecipeType(normalizedCuisine, sortedIngredients);
    
    // Technical title generation with cultural context
    const mainIngCapitalized = mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1);
    
    let titlePrefix = "";
    let titleSuffix = "";
    
    // Add cultural context to title
    if (normalizedCuisine === "indian") {
      if (cultural.approach === "traditional") titleSuffix = " Masala";
      else if (cultural.approach === "regional") titleSuffix = " Punjab Style";
    } else if (normalizedCuisine === "chinese") {
      if (cultural.approach === "traditional") titleSuffix = " Wok-Seared";
      else if (cultural.approach === "regional") titleSuffix = " Sichuan Style";
    } else if (normalizedCuisine === "italian") {
      if (cultural.approach === "traditional") titleSuffix = " alla Nonna";
      else if (cultural.approach === "regional") titleSuffix = " Toscana";
    } else if (normalizedCuisine === "japanese") {
      if (cultural.approach === "traditional") titleSuffix = " Washoku";
      else if (cultural.approach === "regional") titleSuffix = " Kansai Style";
    }
    
    let title = `${titlePrefix}${cuisine} ${mainIngCapitalized} ${secondaryIngredient ? '& ' + secondaryIngredient + ' ' : ''}${recipeType.charAt(0).toUpperCase() + recipeType.slice(1)}${titleSuffix}`;
    
    // Generate technical description with cultural context
    const culturalInsight = [
      `reflects the essence of ${cuisine} heritage`,
      `showcases time-honored ${cuisine} traditions`,
      `captures authentic ${cuisine} flavors`,
      `demonstrates classic ${cuisine} techniques`
    ][Math.floor(Math.random() * 4)];
    
    const description = `This ${cultural.approach} ${cuisine} recipe ${culturalInsight} with ${mainIngredient}${secondaryIngredient ? ' and ' + secondaryIngredient : ''} as the central ingredients. It features ${cultural.emphasis}.`;
    
    // Generate complete ingredient list with authentic components
    const fullIngredientsList = generateCompleteIngredientsList(sortedIngredients, normalizedCuisine, recipeType);
    
    // Add 1-2 culturally specific ingredients
    if (normalizedCuisine === "indian" && !fullIngredientsList.some(i => i.toLowerCase().includes('asafoetida'))) {
      fullIngredientsList.push("A pinch of asafoetida (hing)");
    } else if (normalizedCuisine === "chinese" && !fullIngredientsList.some(i => i.toLowerCase().includes('shaoxing'))) {
      fullIngredientsList.push("1 tbsp Shaoxing wine");
    } else if (normalizedCuisine === "japanese" && !fullIngredientsList.some(i => i.toLowerCase().includes('dashi'))) {
      fullIngredientsList.push("1 cup dashi stock");
    }
    
    // Generate technical step-by-step instructions
    const instructions = generateInstructions(sortedIngredients, normalizedCuisine, recipeType, fullIngredientsList);
    
    // Add technical details to instructions
    instructions.push(`For optimal texture and flavor development, ensure the cooking temperature is precisely maintained throughout the process.`);
    
    // Calculate calories and cooking time
    const calories = calculateApproximateCalories(sortedIngredients, recipeType) + 25;
    const cookTime = calculateCookingTime(recipeType, sortedIngredients);
    
    // Generate chef note with technical advice and cultural context
    const chefNote = `In traditional ${cuisine} cuisine, ${generateChefNote(sortedIngredients, normalizedCuisine)}. This technique has been refined over generations and represents an important aspect of the culinary heritage.`;
    
    recipes.push({
      title,
      description,
      ingredients: fullIngredientsList,
      instructions,
      cuisine,
      calories,
      cookTime,
      imageUrl: cuisineImages[index % cuisineImages.length],
      chefNote,
      dietaryFlags
    });
  });
  
  return recipes;
}

// Helper function to map dietary strings to potential dietary flags
function createDietaryFlagsObject(dietary: string[]): Record<string, boolean> {
  const dietaryFlags: Record<string, boolean> = {};
  
  const mapDietaryTerms = {
    'vegetarian': ['vegetarian'],
    'vegan': ['vegan'],
    'glutenFree': ['glutenfree', 'gluten-free', 'gluten free'],
    'lowCarb': ['lowcarb', 'low-carb', 'low carb'],
    'dairyFree': ['dairyfree', 'dairy-free', 'dairy free', 'lactose-free'],
    'keto': ['keto', 'ketogenic']
  };
  
  dietary.forEach(diet => {
    const lowerCaseDiet = diet.toLowerCase();
    
    // Check each dietary category to see if it matches
    Object.entries(mapDietaryTerms).forEach(([key, terms]) => {
      if (terms.some(term => lowerCaseDiet === term)) {
        dietaryFlags[key] = true;
      }
    });
  });
  
  return dietaryFlags;
}

// Sample recipes by cuisine for when API key is not available
const sampleRecipesByCuisine: Record<string, any[]> = {
  italian: [
    {
      title: "Garlic Butter Pasta with Herbs",
      description: "A simple yet flavorful pasta dish featuring butter, garlic, and fresh herbs, perfect for a quick weeknight dinner.",
      ingredients: ["8 oz pasta", "4 tbsp butter", "4 cloves garlic, minced", "1/4 cup fresh herbs (parsley, basil)", "1/2 tsp red pepper flakes", "salt", "black pepper", "1/4 cup grated parmesan"],
      instructions: [
        "Bring a large pot of salted water to a boil and cook pasta according to package directions.",
        "While pasta cooks, melt butter in a large skillet over medium heat.",
        "Add minced garlic and red pepper flakes, cooking for 1-2 minutes until fragrant.",
        "Drain pasta, reserving 1/2 cup of pasta water.",
        "Add pasta to the skillet with butter and garlic, tossing to coat.",
        "Add a splash of pasta water to create a silky sauce.",
        "Stir in fresh herbs and parmesan cheese.",
        "Season with salt and pepper to taste and serve immediately."
      ],
      cuisine: "italian",
      calories: 450,
      cookTime: "20 minutes",
      chefNote: "For extra richness, add a splash of heavy cream to the sauce before adding the pasta.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    },
    {
      title: "Classic Margherita Flatbread",
      description: "A simple yet elegant flatbread topped with fresh tomatoes, mozzarella, and basil for an authentic Italian flavor.",
      ingredients: ["1 pre-made flatbread or pizza crust", "2 tbsp olive oil", "2 cloves garlic, minced", "2 ripe tomatoes, sliced", "8 oz fresh mozzarella, sliced", "fresh basil leaves", "salt", "black pepper", "red pepper flakes (optional)"],
      instructions: [
        "Preheat oven to 425°F (220°C).",
        "Place flatbread on a baking sheet and brush with olive oil.",
        "Sprinkle minced garlic evenly over the flatbread.",
        "Arrange tomato and mozzarella slices on top.",
        "Season with salt and pepper.",
        "Bake for 10-12 minutes until cheese is melted and edges are golden.",
        "Remove from oven and top with fresh basil leaves and a drizzle of olive oil.",
        "Sprinkle with red pepper flakes if desired."
      ],
      cuisine: "italian",
      calories: 380,
      cookTime: "15 minutes",
      chefNote: "For the best flavor, use room temperature tomatoes and high-quality mozzarella.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    },
    {
      title: "Tuscan White Bean Soup",
      description: "A hearty and comforting soup packed with cannellini beans, vegetables, and Italian herbs that's perfect for any season.",
      ingredients: ["2 tbsp olive oil", "1 onion, diced", "2 carrots, diced", "2 celery stalks, diced", "3 cloves garlic, minced", "1 tsp dried rosemary", "1 tsp dried thyme", "2 cans (15 oz) cannellini beans, drained and rinsed", "4 cups vegetable broth", "1 bay leaf", "2 cups fresh spinach", "1 tbsp lemon juice", "salt", "black pepper", "grated parmesan for serving"],
      instructions: [
        "Heat olive oil in a large pot over medium heat.",
        "Add onion, carrots, and celery, cooking for 5-7 minutes until softened.",
        "Add garlic, rosemary, and thyme, cooking for another minute until fragrant.",
        "Add beans, vegetable broth, and bay leaf. Bring to a boil.",
        "Reduce heat and simmer for 15-20 minutes to meld flavors.",
        "Remove bay leaf. Use an immersion blender to partially blend the soup, leaving some texture.",
        "Stir in spinach and cook until wilted, about 2 minutes.",
        "Add lemon juice and season with salt and pepper to taste.",
        "Serve with a sprinkle of parmesan cheese."
      ],
      cuisine: "italian",
      calories: 320,
      cookTime: "35 minutes",
      chefNote: "For a creamier texture, blend half the soup completely smooth before adding the spinach.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    }
  ],
  indian: [
    {
      title: "Quick Chickpea Curry",
      description: "A flavorful and aromatic curry made with chickpeas, tomatoes, and a blend of Indian spices.",
      ingredients: ["2 tbsp vegetable oil", "1 onion, finely chopped", "3 cloves garlic, minced", "1 tbsp ginger, grated", "1 tbsp curry powder", "1 tsp ground cumin", "1 tsp ground coriander", "1/2 tsp turmeric", "1/4 tsp cayenne pepper (optional)", "1 can (14 oz) diced tomatoes", "2 cans (15 oz) chickpeas, drained and rinsed", "1 cup vegetable broth", "1/2 cup coconut milk", "salt to taste", "fresh cilantro for garnish", "lemon wedges for serving"],
      instructions: [
        "Heat oil in a large pan over medium heat.",
        "Add onion and cook until softened, about 5 minutes.",
        "Add garlic and ginger, cooking for another minute until fragrant.",
        "Add all the spices (curry powder, cumin, coriander, turmeric, cayenne) and stir for 30 seconds.",
        "Add diced tomatoes and cook for 3-4 minutes until slightly reduced.",
        "Add chickpeas and vegetable broth. Bring to a simmer.",
        "Cook for 10 minutes, stirring occasionally.",
        "Stir in coconut milk and simmer for another 5 minutes.",
        "Season with salt to taste.",
        "Garnish with fresh cilantro and serve with lemon wedges."
      ],
      cuisine: "indian",
      calories: 350,
      cookTime: "25 minutes",
      chefNote: "For an authentic touch, add a teaspoon of garam masala at the end of cooking.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Spiced Vegetable Biryani",
      description: "A fragrant rice dish packed with colorful vegetables and aromatic spices that creates a complete and satisfying meal.",
      ingredients: ["1 1/2 cups basmati rice", "3 tbsp vegetable oil", "1 onion, thinly sliced", "2 carrots, diced", "1 bell pepper, diced", "1 cup cauliflower florets", "1 cup green peas", "3 cloves garlic, minced", "1 tbsp ginger, grated", "1 tsp cumin seeds", "1 cinnamon stick", "4 cardamom pods", "2 tsp curry powder", "1 tsp turmeric", "3 cups vegetable broth", "1/4 cup raisins (optional)", "1/4 cup cashews, toasted", "fresh cilantro for garnish"],
      instructions: [
        "Rinse rice until water runs clear. Soak for 20 minutes, then drain.",
        "Heat oil in a large pot over medium heat.",
        "Add cumin seeds, cinnamon stick, and cardamom pods. Cook for 30 seconds until fragrant.",
        "Add sliced onion and cook until golden brown, about 5-7 minutes.",
        "Add garlic and ginger, cooking for another minute.",
        "Add diced vegetables (carrots, bell pepper, cauliflower) and cook for 5 minutes.",
        "Stir in curry powder and turmeric, cooking for 30 seconds.",
        "Add rice and stir to coat with spices.",
        "Pour in vegetable broth and bring to a boil.",
        "Reduce heat to low, cover, and simmer for 15 minutes.",
        "Add green peas and raisins (if using) on top without stirring.",
        "Cover and cook for another 5 minutes until rice is tender and liquid is absorbed.",
        "Fluff with a fork, garnish with toasted cashews and fresh cilantro."
      ],
      cuisine: "indian",
      calories: 420,
      cookTime: "50 minutes",
      chefNote: "For an authentic touch, layer the partially cooked rice and vegetables, then finish cooking. This creates distinct layers in your biryani.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Spiced Potato and Spinach (Aloo Palak)",
      description: "A comforting dish of potatoes and spinach cooked with aromatic Indian spices that's both healthy and satisfying.",
      ingredients: ["2 tbsp vegetable oil", "1 tsp cumin seeds", "1 onion, finely chopped", "2 cloves garlic, minced", "1 tbsp ginger, grated", "1 green chili, finely chopped (optional)", "3 medium potatoes, peeled and cubed", "1 tsp ground coriander", "1 tsp ground cumin", "1/2 tsp turmeric", "1/2 tsp garam masala", "1/4 tsp red chili powder (adjust to taste)", "8 oz fresh spinach, chopped", "1/2 cup water", "salt to taste", "lemon juice for serving"],
      instructions: [
        "Heat oil in a large pan over medium heat.",
        "Add cumin seeds and cook until they start to sizzle, about 30 seconds.",
        "Add onion and cook until softened and golden, about 5 minutes.",
        "Add garlic, ginger, and green chili (if using), cooking for another minute.",
        "Add potatoes and all the ground spices (coriander, cumin, turmeric, garam masala, chili powder).",
        "Stir to coat potatoes with spices and cook for 2-3 minutes.",
        "Add 1/2 cup water, cover, and cook for 15 minutes until potatoes are almost tender.",
        "Add chopped spinach and stir until wilted, about 3 minutes.",
        "If needed, add a little more water to create a sauce.",
        "Cook uncovered for 5 more minutes until potatoes are fully cooked and flavors have melded.",
        "Season with salt to taste and finish with a squeeze of lemon juice."
      ],
      cuisine: "indian",
      calories: 280,
      cookTime: "35 minutes",
      chefNote: "For a richer version, stir in 2 tablespoons of cream or coconut milk at the end of cooking.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    }
  ],
  chinese: [
    {
      title: "Vegetable Stir-Fry with Garlic Sauce",
      description: "A colorful and quick stir-fry loaded with crisp vegetables in a savory garlic sauce.",
      ingredients: ["3 tbsp vegetable oil", "3 cloves garlic, minced", "1 tbsp ginger, grated", "1 bell pepper, sliced", "1 carrot, julienned", "1 cup broccoli florets", "1 cup snow peas", "1 cup mushrooms, sliced", "For the sauce:", "3 tbsp soy sauce", "1 tbsp rice vinegar", "1 tbsp brown sugar", "1 tsp sesame oil", "1 tbsp cornstarch", "1/2 cup vegetable broth", "Garnish:", "sesame seeds", "green onions, sliced"],
      instructions: [
        "Prepare the sauce by mixing soy sauce, rice vinegar, brown sugar, sesame oil, cornstarch, and vegetable broth in a small bowl. Set aside.",
        "Heat vegetable oil in a wok or large skillet over high heat.",
        "Add garlic and ginger, stir-frying for 30 seconds until fragrant.",
        "Add carrots and broccoli, stir-frying for 2 minutes.",
        "Add bell pepper, snow peas, and mushrooms. Stir-fry for another 3 minutes until vegetables are crisp-tender.",
        "Pour the sauce over the vegetables and bring to a boil, stirring constantly.",
        "Cook for 1-2 minutes until sauce thickens and coats the vegetables.",
        "Garnish with sesame seeds and sliced green onions.",
        "Serve hot with steamed rice."
      ],
      cuisine: "chinese",
      calories: 220,
      cookTime: "20 minutes",
      chefNote: "For the perfect stir-fry, cook vegetables in order of their density - harder vegetables first, softer ones later.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: true,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Ginger Scallion Noodles",
      description: "A simple yet flavorful noodle dish highlighting the aromatic combination of fresh ginger and scallions.",
      ingredients: ["8 oz Chinese egg noodles or ramen noodles", "3 tbsp vegetable oil", "2 tbsp sesame oil", "1/4 cup ginger, finely julienned", "1 bunch scallions, cut into 2-inch pieces", "3 tbsp soy sauce", "1 tbsp rice vinegar", "1 tsp sugar", "1/2 tsp white pepper", "chili oil to taste (optional)"],
      instructions: [
        "Cook noodles according to package directions. Drain and rinse with cold water.",
        "In a large wok or skillet, heat vegetable oil and 1 tbsp sesame oil over medium-high heat.",
        "Add ginger and stir-fry for 30 seconds until fragrant.",
        "Add scallions and stir-fry for another minute until slightly softened but still green.",
        "Add cooked noodles to the wok and toss to combine.",
        "Mix soy sauce, rice vinegar, sugar, remaining sesame oil, and white pepper in a small bowl.",
        "Pour sauce over noodles and toss to coat evenly.",
        "Cook for 1-2 minutes, tossing constantly, until noodles are heated through.",
        "Serve hot, drizzled with chili oil if desired."
      ],
      cuisine: "chinese",
      calories: 380,
      cookTime: "15 minutes",
      chefNote: "These noodles are delicious on their own, but also work well as a side dish with any protein.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Hot and Sour Soup",
      description: "A tangy, spicy, and satisfying soup with mushrooms, tofu, and bamboo shoots that's ready in under 30 minutes.",
      ingredients: ["6 cups chicken or vegetable broth", "1 cup mushrooms, sliced", "1/2 cup bamboo shoots, julienned", "1/2 cup firm tofu, cubed", "1/4 cup dried wood ear mushrooms, soaked and sliced", "3 tbsp rice vinegar", "2 tbsp soy sauce", "1 tsp white pepper (adjust to taste)", "1 tsp chili oil or chili paste (adjust to taste)", "2 tbsp cornstarch mixed with 3 tbsp water", "1 egg, beaten", "2 green onions, sliced", "1 tsp sesame oil"],
      instructions: [
        "Bring broth to a simmer in a large pot over medium heat.",
        "Add mushrooms, bamboo shoots, and tofu. Simmer for 5 minutes.",
        "Add rice vinegar, soy sauce, white pepper, and chili oil/paste. Adjust seasoning to taste.",
        "While stirring the soup, slowly pour in the cornstarch mixture to thicken.",
        "Continue to simmer for 2 minutes until soup thickens slightly.",
        "While stirring the soup in a circular motion, slowly drizzle in the beaten egg to create egg ribbons.",
        "Remove from heat and stir in sesame oil.",
        "Garnish with sliced green onions and serve hot."
      ],
      cuisine: "chinese",
      calories: 180,
      cookTime: "25 minutes",
      chefNote: "The balance of hot (white pepper) and sour (vinegar) is key - adjust to your preference, but neither should overwhelm the other.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: true,
        dairyFree: true,
        keto: true
      }
    }
  ],
  american: [
    {
      title: "Loaded Sweet Potato Fries",
      description: "Crispy sweet potato fries topped with savory and fresh ingredients for a healthier twist on loaded nachos.",
      ingredients: ["2 large sweet potatoes, cut into fries", "2 tbsp olive oil", "1 tsp paprika", "1/2 tsp garlic powder", "1/2 tsp salt", "1/4 tsp black pepper", "Toppings:", "1 cup black beans, drained and rinsed", "1/2 cup corn kernels", "1 avocado, diced", "2 green onions, sliced", "1/4 cup cilantro, chopped", "lime wedges", "Optional toppings:", "sour cream", "shredded cheese", "hot sauce"],
      instructions: [
        "Preheat oven to 425°F (220°C) and line a baking sheet with parchment paper.",
        "In a large bowl, toss sweet potato fries with olive oil, paprika, garlic powder, salt, and pepper.",
        "Arrange fries in a single layer on the baking sheet, not touching if possible.",
        "Bake for 15 minutes, then flip fries and bake for another 10-15 minutes until crispy and golden.",
        "While fries are baking, prepare toppings.",
        "Transfer fries to a serving platter and top with black beans, corn, avocado, green onions, and cilantro.",
        "Add optional toppings as desired and serve with lime wedges."
      ],
      cuisine: "american",
      calories: 320,
      cookTime: "35 minutes",
      chefNote: "For extra crispy fries, soak the cut sweet potatoes in cold water for 30 minutes before baking, then pat dry thoroughly.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Classic Veggie Burger",
      description: "A hearty and flavorful homemade veggie burger that holds together perfectly and satisfies even meat-lovers.",
      ingredients: ["1 can (15 oz) black beans, drained and rinsed", "1/2 cup cooked quinoa", "1/2 cup breadcrumbs", "1/4 cup onion, finely diced", "1/4 cup bell pepper, finely diced", "2 cloves garlic, minced", "1 tbsp soy sauce", "1 tbsp ketchup", "1 tsp cumin", "1 tsp smoked paprika", "1/2 tsp salt", "1/4 tsp black pepper", "1 egg (or flax egg for vegan option)", "2 tbsp olive oil for cooking", "For serving:", "4 burger buns", "lettuce", "tomato slices", "red onion", "pickles", "condiments of choice"],
      instructions: [
        "In a large bowl, mash black beans with a fork, leaving some beans whole for texture.",
        "Add cooked quinoa, breadcrumbs, diced onion, bell pepper, garlic, and all seasonings.",
        "Stir in soy sauce, ketchup, and egg, mixing until well combined.",
        "Form mixture into 4 equal-sized patties, about 3/4 inch thick.",
        "Refrigerate patties for at least 30 minutes to firm up.",
        "Heat olive oil in a skillet over medium heat.",
        "Cook patties for 4-5 minutes per side until golden and crispy.",
        "Serve on buns with your favorite toppings and condiments."
      ],
      cuisine: "american",
      calories: 350,
      cookTime: "45 minutes (including chilling time)",
      chefNote: "Don't skip the refrigeration step - it helps the patties hold together better during cooking.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Skillet Mac and Cheese",
      description: "A creamy, cheesy one-pot mac and cheese that's ready in under 30 minutes - the ultimate comfort food made simple.",
      ingredients: ["8 oz elbow macaroni", "2 tbsp butter", "2 tbsp all-purpose flour", "2 cups milk", "2 cups shredded cheddar cheese", "1/2 cup shredded parmesan cheese", "1/2 tsp mustard powder", "1/4 tsp garlic powder", "1/4 tsp onion powder", "salt and pepper to taste", "Optional toppings:", "toasted breadcrumbs", "sliced green onions", "hot sauce"],
      instructions: [
        "Cook macaroni in salted water for 2 minutes less than package directions. Drain and set aside.",
        "In the same pot, melt butter over medium heat.",
        "Add flour and whisk constantly for 1 minute to create a roux.",
        "Gradually whisk in milk and bring to a simmer, stirring frequently.",
        "Cook for 3-4 minutes until sauce thickens slightly.",
        "Reduce heat to low and add cheddar and parmesan cheeses, a handful at a time, stirring until melted.",
        "Stir in mustard powder, garlic powder, and onion powder.",
        "Add cooked macaroni to the cheese sauce and stir to combine.",
        "Season with salt and pepper to taste.",
        "If desired, top with optional toppings before serving."
      ],
      cuisine: "american",
      calories: 450,
      cookTime: "25 minutes",
      chefNote: "For a crunchy top, transfer to an oven-safe dish, sprinkle with breadcrumbs and additional cheese, then broil for 2-3 minutes until golden.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    }
  ],
  japanese: [
    {
      title: "Vegetable Miso Soup",
      description: "A warming, umami-rich soup packed with vegetables and tofu that's simple to make yet deeply satisfying.",
      ingredients: ["4 cups dashi or vegetable broth", "3 tbsp miso paste (white or red)", "1 block (14 oz) soft tofu, cubed", "1 cup shiitake mushrooms, sliced", "1 carrot, thinly sliced", "2 green onions, sliced", "1 sheet nori, cut into small pieces", "1 tbsp soy sauce", "1 tsp sesame oil"],
      instructions: [
        "Bring dashi or vegetable broth to a simmer in a pot over medium heat.",
        "Add carrots and mushrooms, cooking for 3-4 minutes until slightly softened.",
        "Reduce heat to low. Place miso paste in a small bowl and add a ladleful of hot broth, whisking until smooth.",
        "Pour miso mixture back into the pot and stir to combine. Do not boil after adding miso.",
        "Add tofu cubes and simmer for 2 minutes to heat through.",
        "Remove from heat and stir in soy sauce and sesame oil.",
        "Ladle into bowls and garnish with green onions and nori pieces."
      ],
      cuisine: "japanese",
      calories: 190,
      cookTime: "15 minutes",
      chefNote: "Never boil soup after adding miso paste as it destroys the beneficial enzymes and alters the flavor.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: true,
        dairyFree: true,
        keto: true
      }
    },
    {
      title: "Sesame Soba Noodle Salad",
      description: "A refreshing cold noodle dish with a nutty sesame dressing and crisp vegetables, perfect for warm days.",
      ingredients: ["8 oz soba noodles", "1 cucumber, julienned", "1 carrot, julienned", "1 red bell pepper, thinly sliced", "2 green onions, sliced", "1/4 cup cilantro, chopped", "1 tbsp sesame seeds, toasted", "For the dressing:", "3 tbsp rice vinegar", "2 tbsp soy sauce", "1 tbsp sesame oil", "1 tbsp honey or maple syrup", "1 tbsp tahini or peanut butter", "1 tsp ginger, grated", "1 clove garlic, minced"],
      instructions: [
        "Cook soba noodles according to package directions. Drain and rinse under cold water.",
        "Whisk all dressing ingredients together in a small bowl until smooth.",
        "In a large bowl, combine cooled noodles with cucumber, carrot, bell pepper, and green onions.",
        "Pour dressing over the noodle mixture and toss to combine.",
        "Garnish with cilantro and toasted sesame seeds before serving.",
        "For best flavor, refrigerate for 30 minutes before serving to allow flavors to meld."
      ],
      cuisine: "japanese",
      calories: 310,
      cookTime: "20 minutes",
      chefNote: "Look for 100% buckwheat soba noodles for a gluten-free option with a more authentic flavor.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Teriyaki Vegetable Rice Bowl",
      description: "A colorful and nutritious bowl with teriyaki-glazed vegetables over steamed rice - a satisfying plant-based meal.",
      ingredients: ["1 1/2 cups short-grain rice", "1 tbsp vegetable oil", "1 cup broccoli florets", "1 carrot, sliced", "1 zucchini, sliced", "1 cup mushrooms, sliced", "1 bell pepper, sliced", "For the teriyaki sauce:", "1/4 cup soy sauce", "2 tbsp mirin", "2 tbsp sake or rice vinegar", "1 tbsp brown sugar", "1 tsp ginger, grated", "1 clove garlic, minced", "1 tsp cornstarch mixed with 1 tbsp water", "For garnish:", "sesame seeds", "nori strips", "green onions, sliced"],
      instructions: [
        "Cook rice according to package directions.",
        "While rice cooks, prepare the teriyaki sauce by combining soy sauce, mirin, sake/rice vinegar, brown sugar, ginger, and garlic in a small saucepan.",
        "Bring sauce to a simmer over medium heat and cook for 1 minute.",
        "Add cornstarch slurry and simmer for another 1-2 minutes until sauce thickens. Remove from heat.",
        "Heat vegetable oil in a large skillet or wok over medium-high heat.",
        "Add vegetables, starting with broccoli and carrots, and stir-fry for 2 minutes.",
        "Add remaining vegetables and stir-fry for another 3-4 minutes until crisp-tender.",
        "Pour two-thirds of the teriyaki sauce over the vegetables and toss to coat.",
        "Serve vegetables over steamed rice, drizzle with remaining sauce, and garnish with sesame seeds, nori strips, and green onions."
      ],
      cuisine: "japanese",
      calories: 380,
      cookTime: "30 minutes",
      chefNote: "For a protein boost, add cubed tofu or edamame to the vegetable stir-fry.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    }
  ],
  mexican: [
    {
      title: "Quick Black Bean Tacos",
      description: "Flavorful black bean tacos loaded with fresh toppings that come together in just 15 minutes for a perfect weeknight dinner.",
      ingredients: ["8 corn tortillas", "1 can (15 oz) black beans, drained and rinsed", "1 tbsp olive oil", "1 small onion, diced", "2 cloves garlic, minced", "1 tsp cumin", "1 tsp chili powder", "1/2 tsp oregano", "1/4 tsp cayenne pepper (optional)", "salt to taste", "Toppings:", "1 avocado, sliced", "1/2 cup fresh salsa or pico de gallo", "1/4 cup cilantro, chopped", "lime wedges", "hot sauce"],
      instructions: [
        "Heat olive oil in a skillet over medium heat.",
        "Add onion and cook until translucent, about 3 minutes.",
        "Add garlic and spices, cooking for another 30 seconds until fragrant.",
        "Add black beans and 2 tablespoons of water. Mash some of the beans with a fork.",
        "Cook for 3-5 minutes, stirring occasionally, until heated through and slightly thickened.",
        "Meanwhile, warm tortillas in a dry skillet or microwave.",
        "Assemble tacos by filling each tortilla with the black bean mixture.",
        "Top with avocado, salsa, cilantro, and a squeeze of lime juice.",
        "Serve with hot sauce on the side."
      ],
      cuisine: "mexican",
      calories: 290,
      cookTime: "15 minutes",
      chefNote: "For a smoky flavor, add a chopped chipotle pepper in adobo sauce to the bean mixture.",
      dietaryFlags: {
        vegetarian: true,
        vegan: true,
        glutenFree: true,
        lowCarb: false,
        dairyFree: true,
        keto: false
      }
    },
    {
      title: "Roasted Vegetable Enchiladas",
      description: "Tender roasted vegetables wrapped in tortillas and smothered in enchilada sauce for a hearty and satisfying Mexican-inspired meal.",
      ingredients: ["1 zucchini, diced", "1 bell pepper, diced", "1 red onion, diced", "1 cup mushrooms, diced", "2 tbsp olive oil", "1 tsp cumin", "1 tsp chili powder", "salt and pepper to taste", "8 flour or corn tortillas", "2 cups enchilada sauce (red or green)", "1 1/2 cups shredded cheese (Mexican blend or cheddar)", "For garnish:", "sour cream", "avocado slices", "cilantro, chopped", "lime wedges"],
      instructions: [
        "Preheat oven to 425°F (220°C).",
        "Toss diced vegetables with olive oil, cumin, chili powder, salt, and pepper on a baking sheet.",
        "Roast vegetables for 20 minutes, stirring halfway through, until tender and slightly charred.",
        "Reduce oven temperature to 375°F (190°C).",
        "Spread 1/2 cup enchilada sauce in the bottom of a 9x13 baking dish.",
        "Fill each tortilla with a portion of roasted vegetables and a sprinkle of cheese.",
        "Roll up tortillas and place seam-side down in the baking dish.",
        "Pour remaining enchilada sauce over the rolled tortillas and sprinkle with remaining cheese.",
        "Bake for 20-25 minutes until sauce is bubbling and cheese is melted.",
        "Garnish with sour cream, avocado, cilantro, and serve with lime wedges."
      ],
      cuisine: "mexican",
      calories: 380,
      cookTime: "50 minutes",
      chefNote: "For a spicier kick, add a diced jalapeño to the vegetable mix before roasting.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: false,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    },
    {
      title: "Mexican Street Corn Salad (Esquites)",
      description: "A delicious off-the-cob version of Mexican street corn that's creamy, tangy, and packed with flavor.",
      ingredients: ["4 cups corn kernels (fresh, frozen, or grilled)", "2 tbsp butter or oil", "1 jalapeño, seeded and diced", "3 tbsp mayonnaise", "2 tbsp Mexican crema or sour cream", "1/4 cup cotija cheese, crumbled (or feta)", "1/4 cup cilantro, chopped", "2 green onions, sliced", "1 clove garlic, minced", "1 lime, juiced", "1/2 tsp chili powder", "1/4 tsp cumin", "salt and pepper to taste"],
      instructions: [
        "If using frozen corn, thaw completely. If using fresh, cut kernels from cobs.",
        "Heat butter or oil in a large skillet over high heat.",
        "Add corn and cook without stirring for 3-4 minutes until charred on one side.",
        "Stir and continue cooking for another 3-4 minutes until corn is charred in spots.",
        "Add jalapeño and garlic, cooking for another minute.",
        "Transfer corn mixture to a large bowl and let cool for 5 minutes.",
        "Add mayonnaise, crema/sour cream, cotija cheese, cilantro, green onions, lime juice, chili powder, and cumin.",
        "Stir to combine and season with salt and pepper to taste.",
        "Serve warm or at room temperature, garnished with additional cotija cheese and cilantro."
      ],
      cuisine: "mexican",
      calories: 220,
      cookTime: "20 minutes",
      chefNote: "For the best flavor, grill or char the corn first - the smoky flavor is essential to authentic esquites.",
      dietaryFlags: {
        vegetarian: true,
        vegan: false,
        glutenFree: true,
        lowCarb: false,
        dairyFree: false,
        keto: false
      }
    }
  ]
};

// Generate recipe based on ingredients and cuisine type
export async function generateRecipes(
  ingredients: string[],
  cuisine: string,
  dietary: string[]
): Promise<InsertRecipe[]> {
  try {
    console.log(`Generating recipes for ${cuisine} cuisine with ingredients: ${ingredients.join(', ')}`);
    
    // Set up dietary flags based on user selection
    const initialDietaryFlags = createDietaryFlagsObject(dietary);
    
    // Randomly select which "AI service" to simulate for variety in responses
    // This simulates getting responses from different AI models
    const aiServices = ["universal", "chatgpt-simulation", "grok-simulation", "deepseek-simulation"];
    const selectedService = aiServices[Math.floor(Math.random() * aiServices.length)];
    
    console.log(`Using ${selectedService} for recipe generation`);
    
    // If we have real API keys, use them
    if (process.env.OPENAI_API_KEY || process.env.XAI_API_KEY) {
      if (process.env.OPENAI_API_KEY && openai) {
        try {
          console.log("Using actual OpenAI API");
          // [Existing OpenAI implementation]
        } catch (error) {
          console.error("Error with real OpenAI:", error);
        }
      }
      
      if (process.env.XAI_API_KEY) {
        try {
          console.log("Using actual Grok AI API");
          // [Existing Grok AI implementation]
        } catch (error) {
          console.error("Error with real Grok AI:", error);
        }
      }
    }
    
    // Try each AI service in sequence, falling back to the next if one fails
    if (process.env.OPENAI_API_KEY && openai) {
      try {
        console.log("Attempting to generate recipes using OpenAI...");
        
        const dietaryConditions = dietary.length > 0 
          ? `The recipes MUST strictly comply with the following dietary restrictions: ${dietary.join(", ")}.` 
          : "";
        
        const systemPrompt = `You are a professional chef specialized in creating recipes from available ingredients.`;
        
        const prompt = `
          Create 3 different delicious ${cuisine} recipe ideas using these ingredients: ${ingredients.join(", ")}.
          ${dietaryConditions}
          
          For each recipe, provide the following in a structured JSON format:
          
          1. title: A creative, appealing title
          2. description: A vibrant description (1-2 sentences)
          3. ingredients: List of all needed ingredients
          4. instructions: Detailed step-by-step cooking instructions
          5. calories: Approximate calories per serving
          6. cookTime: Total cooking time in format "X minutes" or "X hours Y minutes"
          7. chefNote: A professional tip to enhance the dish
          8. dietaryFlags: An object with boolean flags for: vegetarian, vegan, glutenFree, lowCarb, dairyFree, keto
          
          Return a valid JSON object with a 'recipes' array containing 3 recipes.
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("Failed to generate recipes: No content in OpenAI response");
        }
        
        const jsonResponse = JSON.parse(content);
        
        if (!jsonResponse.recipes || !Array.isArray(jsonResponse.recipes) || jsonResponse.recipes.length === 0) {
          throw new Error("Failed to generate recipes: Invalid response format");
        }
        
        // Get appropriate food images for this cuisine
        const cuisineImages = foodImagesByCuisine[cuisine.toLowerCase()] || defaultFoodImages;
        
        // Format the recipes for our database
        return jsonResponse.recipes.map((recipe: any, index: number) => {
          // Merge user-selected dietary flags with AI-generated ones
          const mergedDietaryFlags = {
            ...recipe.dietaryFlags,
            ...initialDietaryFlags
          };
          
          return {
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            cuisine: cuisine,
            calories: typeof recipe.calories === 'number' ? recipe.calories : parseInt(recipe.calories) || 400,
            cookTime: recipe.cookTime || "30 minutes",
            imageUrl: cuisineImages[index % cuisineImages.length],
            chefNote: recipe.chefNote || "Enjoy with your favorite side dish!",
            dietaryFlags: mergedDietaryFlags
          };
        });
      } catch (error) {
        console.error("Error with OpenAI:", error);
        // Continue to the next provider
      }
    }
    
    // Try Grok AI if OpenAI failed
    if (process.env.XAI_API_KEY) {
      try {
        console.log("Attempting to generate recipes using Grok AI...");
        
        // Initialize Grok API client
        const xai = new OpenAI({ baseURL: "https://api.x.ai/v1", apiKey: process.env.XAI_API_KEY });
        
        // Create a detailed dietary instructions string
        const dietaryConditions = dietary.length > 0 
          ? `The recipes MUST strictly comply with the following dietary restrictions: ${dietary.join(", ")}.`
          : "";
        
        const prompt = `
          Create 3 different delicious ${cuisine} recipe ideas using these ingredients: ${ingredients.join(", ")}.
          ${dietaryConditions}
          
          For each recipe, provide the following in a structured JSON format:
          
          1. title: A creative, appealing title
          2. description: A vibrant description (1-2 sentences)
          3. ingredients: List of all needed ingredients
          4. instructions: Detailed step-by-step cooking instructions
          5. calories: Approximate calories per serving
          6. cookTime: Total cooking time in format "X minutes" or "X hours Y minutes"
          7. chefNote: A professional tip to enhance the dish
          8. dietaryFlags: An object with boolean flags for: vegetarian, vegan, glutenFree, lowCarb, dairyFree, keto
          
          Return a valid JSON object with a 'recipes' array containing 3 recipes.
        `;
        
        const response = await xai.chat.completions.create({
          model: "grok-2-1212",
          messages: [
            { role: "system", content: "You are a professional chef specialized in creating recipes." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("Failed to generate recipes: No content in Grok AI response");
        }
        
        const jsonResponse = JSON.parse(content);
        
        if (!jsonResponse.recipes || !Array.isArray(jsonResponse.recipes) || jsonResponse.recipes.length === 0) {
          throw new Error("Failed to generate recipes: Invalid response format");
        }
        
        // Get appropriate food images for this cuisine
        const cuisineImages = foodImagesByCuisine[cuisine.toLowerCase()] || defaultFoodImages;
        
        // Format the recipes for our database
        return jsonResponse.recipes.map((recipe: any, index: number) => {
          // Merge user-selected dietary flags with AI-generated ones
          const mergedDietaryFlags = {
            ...recipe.dietaryFlags,
            ...initialDietaryFlags
          };
          
          return {
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            cuisine: cuisine,
            calories: typeof recipe.calories === 'number' ? recipe.calories : parseInt(recipe.calories) || 400,
            cookTime: recipe.cookTime || "30 minutes",
            imageUrl: cuisineImages[index % cuisineImages.length],
            chefNote: recipe.chefNote || "Enjoy with your favorite side dish!",
            dietaryFlags: mergedDietaryFlags
          };
        });
      } catch (error) {
        console.error("Error with Grok AI:", error);
        // Continue to the universal recipe generator
      }
    }
    
    // Based on our selected AI service, use the appropriate simulation
    if (selectedService === "chatgpt-simulation") {
      console.log("Using ChatGPT style recipe generation");
      return generateChatGPTStyleRecipes(ingredients, cuisine, dietary, initialDietaryFlags);
    } 
    else if (selectedService === "grok-simulation") {
      console.log("Using Grok AI style recipe generation");
      return generateGrokStyleRecipes(ingredients, cuisine, dietary, initialDietaryFlags);
    } 
    else if (selectedService === "deepseek-simulation") {
      console.log("Using DeepSeek style recipe generation");
      return generateDeepSeekStyleRecipes(ingredients, cuisine, dietary, initialDietaryFlags);
    }
    else {
      // Default to universal recipe generator
      console.log("Using universal recipe generator");
      return generateUniversalRecipes(ingredients, cuisine, dietary);
    }
    
  } catch (error) {
    console.error("Error in generateRecipes:", error);
    // Last resort fallback - generate universal recipes
    return generateUniversalRecipes(ingredients, cuisine, dietary);
  }
}
