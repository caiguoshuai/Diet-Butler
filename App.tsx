import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import RecipeManager from './components/RecipeManager';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import { Recipe, WeeklyPlan, MealType } from './types';
import { ChefHat, Calendar, ShoppingCart, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'planner' | 'shopping'>('recipes');
  
  // Persisted State
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('mealmaster_recipes', []);
  const [plan, setPlan] = useLocalStorage<WeeklyPlan>('mealmaster_plan', {});

  // Handlers
  const handleAddRecipe = (newRecipe: Recipe) => {
    setRecipes([...recipes, newRecipe]);
  };

  const handleEditRecipe = (updatedRecipe: Recipe) => {
    setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
    
    // Clean up deleted recipes from plan
    const newPlan = { ...plan };
    Object.keys(newPlan).forEach(day => {
      const dayPlan = newPlan[day];
      if (!dayPlan) return;

      (['Breakfast', 'Lunch', 'Dinner'] as MealType[]).forEach(meal => {
          const mealData = dayPlan[meal];
          // Handle both legacy (string) and new (array) format
          if (Array.isArray(mealData)) {
              dayPlan[meal] = mealData.filter(rid => rid !== id);
          } else if (mealData === id) {
              dayPlan[meal] = [];
          }
      });
    });
    setPlan(newPlan);
  };

  const handleUpdatePlan = (day: string, meal: MealType, recipeId: string, action: 'add' | 'remove') => {
    setPlan(prev => {
        const currentDayPlan = prev[day] || { Breakfast: [], Lunch: [], Dinner: [] };
        // Safe access and migration from potential legacy string data
        let currentMealIds: string[] = [];
        const mealData = currentDayPlan[meal];
        
        if (Array.isArray(mealData)) {
            currentMealIds = mealData;
        } else if (typeof mealData === 'string') {
            currentMealIds = [mealData];
        }

        let newMealIds = [...currentMealIds];
        if (action === 'add') {
            // Prevent duplicates
            if (!newMealIds.includes(recipeId)) {
                newMealIds.push(recipeId);
            }
        } else if (action === 'remove') {
            newMealIds = newMealIds.filter(id => id !== recipeId);
        }

        return {
            ...prev,
            [day]: {
                ...currentDayPlan,
                [meal]: newMealIds
            }
        };
    });
  };

  const handleClearPlan = () => {
    setPlan({});
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">膳食管家</span>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => setActiveTab('recipes')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors ${
                  activeTab === 'recipes'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                食谱管理
              </button>
              <button
                onClick={() => setActiveTab('planner')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors ${
                  activeTab === 'planner'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                每周计划
              </button>
              <button
                onClick={() => setActiveTab('shopping')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors ${
                  activeTab === 'shopping'
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                购物清单
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recipes' && (
          <RecipeManager 
            recipes={recipes} 
            onAddRecipe={handleAddRecipe} 
            onEditRecipe={handleEditRecipe}
            onDeleteRecipe={handleDeleteRecipe} 
          />
        )}
        {activeTab === 'planner' && (
          <MealPlanner 
            recipes={recipes} 
            plan={plan} 
            onUpdatePlan={handleUpdatePlan} 
            onClearPlan={handleClearPlan}
          />
        )}
        {activeTab === 'shopping' && (
          <ShoppingList 
            recipes={recipes} 
            plan={plan} 
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50 safe-area-bottom">
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'recipes' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <Menu size={24} />
          <span className="text-xs font-medium">食谱</span>
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'planner' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <Calendar size={24} />
          <span className="text-xs font-medium">计划</span>
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'shopping' ? 'text-indigo-600' : 'text-gray-500'}`}
        >
          <ShoppingCart size={24} />
          <span className="text-xs font-medium">清单</span>
        </button>
      </div>
    </div>
  );
};

export default App;