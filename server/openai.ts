import OpenAI from "openai";
import { type InsertRecipe, type DietaryFlags } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null; // Will be null if no API key is provided

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
    // Set up dietary flags based on user selection
    const initialDietaryFlags = createDietaryFlagsObject(dietary);
    
    // If OpenAI is available, use it to generate recipes
    if (openai) {
      console.log("Using OpenAI to generate recipes");
      // Create a detailed dietary instructions string
      const dietaryConditions = dietary.length > 0 
        ? `The recipes MUST strictly comply with the following dietary restrictions: ${dietary.join(", ")}. 
          Make sure every ingredient and cooking method adheres to these restrictions. 
          Be precise with the dietaryFlags object to accurately reflect these restrictions.`
        : "";
      
      const systemPrompt = `
        You are a professional chef specialized in creating recipes from available ingredients. 
        You excel at ${cuisine} cuisine and understanding dietary restrictions. 
        Always provide detailed, accurate recipes with precise instructions.
        Make sure your dietaryFlags object is accurate and reflects the exact dietary needs.
      `;
      
      const prompt = `
        Create 3 different delicious ${cuisine} recipe ideas using these ingredients: ${ingredients.join(", ")}.
        ${dietaryConditions}
        
        For each recipe, provide the following information in a structured JSON format:
        
        1. title: A creative, appealing title
        2. description: A vibrant description (1-2 sentences) highlighting flavors and appearance
        3. ingredients: List of all needed ingredients (including the ones provided and additional common ingredients)
        4. instructions: Detailed step-by-step cooking instructions
        5. calories: Approximate calories per serving (realistic number)
        6. cookTime: Total cooking time in format "X minutes" or "X hours Y minutes" 
        7. chefNote: A professional tip to enhance the dish
        8. dietaryFlags: An object with boolean flags for:
           - vegetarian (true if no meat/fish)
           - vegan (true if no animal products)
           - glutenFree (true if no gluten)
           - lowCarb (true if low in carbohydrates)
           - dairyFree (true if no dairy products)
           - keto (true if keto-friendly)
        
        Return a valid JSON object with a 'recipes' array containing exactly 3 recipes with all the fields mentioned above.
      `;

      const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
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
    } 
    // If no OpenAI API key is available, use pre-defined recipes
    else {
      console.log("Using pre-defined recipes (no OpenAI API key available)");
      
      // Normalize cuisine name to match our sample data keys
      const normalizedCuisine = cuisine.toLowerCase();
      
      // Get recipes for the requested cuisine, or default to a mixed selection
      let availableRecipes = sampleRecipesByCuisine[normalizedCuisine] || [];
      
      // If no recipes for the specific cuisine or not enough, add recipes from other cuisines
      if (availableRecipes.length < 3) {
        const allRecipes = Object.values(sampleRecipesByCuisine).flat();
        const additionalRecipes = allRecipes
          .filter(recipe => recipe.cuisine.toLowerCase() !== normalizedCuisine)
          .slice(0, 3 - availableRecipes.length);
        
        availableRecipes = [...availableRecipes, ...additionalRecipes];
      }
      
      // Enhanced recipe customization based on user's ingredients
      const customizedRecipes = availableRecipes.slice(0, 3).map((recipe: any) => {
        // Find which user ingredients are already in the recipe
        const userIngredientsInRecipe: string[] = [];
        const additionalIngredients: string[] = [];
        
        // Process each user ingredient
        ingredients.forEach(userIngredient => {
          const userIngredientLower = userIngredient.toLowerCase().trim();
          
          // Check if this ingredient or something similar is already in the recipe
          const alreadyIncluded = recipe.ingredients.some((recipeIngredient: string) => 
            recipeIngredient.toLowerCase().includes(userIngredientLower) ||
            userIngredientLower.includes(recipeIngredient.toLowerCase().split(',')[0].trim())
          );
          
          if (alreadyIncluded) {
            userIngredientsInRecipe.push(userIngredient);
          } else {
            additionalIngredients.push(userIngredient);
          }
        });
        
        // Generate a more dynamic title based on the ingredients
        let newTitle = recipe.title;
        if (additionalIngredients.length > 0 && additionalIngredients.length <= 2) {
          newTitle = `${recipe.title} with ${additionalIngredients.join(' & ')}`;
        } else if (additionalIngredients.length > 2) {
          // If there are many new ingredients, create a more general updated title
          const primaryIngredient = additionalIngredients[0];
          newTitle = `${primaryIngredient.charAt(0).toUpperCase() + primaryIngredient.slice(1)} ${recipe.title}`;
        }
        
        // Create a modified description mentioning the user's ingredients
        let newDescription = recipe.description;
        if (userIngredientsInRecipe.length > 0 || additionalIngredients.length > 0) {
          const allUserIngredients = [...userIngredientsInRecipe, ...additionalIngredients];
          const highlightIngredients = allUserIngredients.slice(0, 3);
          
          // Append to the existing description
          newDescription = `${recipe.description} Made with your ${highlightIngredients.join(', ')}.`;
        }
        
        // Update instructions when adding new ingredients
        let newInstructions = [...recipe.instructions];
        if (additionalIngredients.length > 0) {
          // Add a new step or modify existing steps to include the new ingredients
          newInstructions.push(`Add ${additionalIngredients.join(', ')} to enhance the flavor and make the dish your own.`);
        }
        
        // Create a modified recipe with user's ingredients incorporated
        const modifiedRecipe = {
          ...recipe,
          ingredients: [...recipe.ingredients, ...additionalIngredients],
          title: newTitle,
          description: newDescription,
          instructions: newInstructions,
          dietaryFlags: {
            ...recipe.dietaryFlags,
            ...initialDietaryFlags
          }
        };
        
        // Get appropriate food images for this cuisine
        const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
        
        return {
          ...modifiedRecipe,
          cuisine: cuisine, // Ensure cuisine matches user selection
          imageUrl: cuisineImages[Math.floor(Math.random() * cuisineImages.length)]
        };
      });
      
      return customizedRecipes;
    }
  } catch (error) {
    console.error("Error generating recipes:", error);
    
    // Fallback to sample recipes with enhanced customization if API call fails
    console.log("Falling back to customized sample recipes due to error");
    
    const normalizedCuisine = cuisine.toLowerCase();
    const fallbackRecipes = sampleRecipesByCuisine[normalizedCuisine] || 
                          Object.values(sampleRecipesByCuisine).flat().slice(0, 3);
    
    // Get appropriate food images for this cuisine
    const cuisineImages = foodImagesByCuisine[normalizedCuisine] || defaultFoodImages;
    
    // Apply more advanced customization to the fallback recipes
    return fallbackRecipes.slice(0, 3).map((recipe: any, index: number) => {
      // Find which user ingredients can be incorporated
      const userIngredientsInRecipe: string[] = [];
      const additionalIngredients: string[] = [];
      
      // Process each user ingredient
      ingredients.forEach(userIngredient => {
        const userIngredientLower = userIngredient.toLowerCase().trim();
        
        // Check if this ingredient or something similar is already in the recipe
        const alreadyIncluded = recipe.ingredients.some((recipeIngredient: string) => 
          recipeIngredient.toLowerCase().includes(userIngredientLower)
        );
        
        if (alreadyIncluded) {
          userIngredientsInRecipe.push(userIngredient);
        } else {
          additionalIngredients.push(userIngredient);
        }
      });
      
      // Create a custom title highlighting the user's ingredients
      let newTitle = recipe.title;
      if (additionalIngredients.length > 0) {
        if (additionalIngredients.length <= 2) {
          newTitle = `${recipe.title} with ${additionalIngredients.join(' & ')}`;
        } else {
          // Focus on the main new ingredient for the title
          newTitle = `${additionalIngredients[0].charAt(0).toUpperCase() + additionalIngredients[0].slice(1)} ${recipe.title}`;
        }
      }
      
      // Enhance the description to acknowledge the user's ingredients
      let newDescription = recipe.description;
      if (additionalIngredients.length > 0) {
        newDescription = `${recipe.description} This recipe has been customized with your ${additionalIngredients.slice(0, 3).join(', ')}.`;
      }
      
      // Enhance the instructions to incorporate new ingredients
      let newInstructions = [...recipe.instructions];
      if (additionalIngredients.length > 0) {
        newInstructions.push(`Add your ${additionalIngredients.join(', ')} to make this dish uniquely yours.`);
      }
      
      return {
        ...recipe,
        title: newTitle,
        description: newDescription,
        ingredients: [...recipe.ingredients, ...additionalIngredients],
        instructions: newInstructions,
        cuisine: cuisine,
        dietaryFlags: {
          ...recipe.dietaryFlags,
          ...createDietaryFlagsObject(dietary)
        },
        imageUrl: cuisineImages[index % cuisineImages.length]
      };
    });
  }
}
