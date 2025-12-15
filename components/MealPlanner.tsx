import React from 'react';
import { Recipe, WeeklyPlan, DAYS_OF_WEEK, MealType } from '../types';
import { Trash2, Plus, X } from 'lucide-react';

interface MealPlannerProps {
  recipes: Recipe[];
  plan: WeeklyPlan;
  onUpdatePlan: (day: string, meal: MealType, recipeId: string, action: 'add' | 'remove') => void;
  onClearPlan: () => void;
}

// Helper component for rendering a single meal slot (used in both desktop and mobile views)
const MealSlot: React.FC<{
  day: string;
  meal: MealType;
  selectedIds: string[];
  recipes: Recipe[];
  onUpdatePlan: (day: string, meal: MealType, recipeId: string, action: 'add' | 'remove') => void;
}> = ({ day, meal, selectedIds, recipes, onUpdatePlan }) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Selected Recipes List */}
      {selectedIds.map(id => {
        const recipe = recipes.find(r => r.id === id);
        if (!recipe) return null;
        return (
          <div key={id} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 text-indigo-900 px-2 py-1.5 rounded-md text-sm group">
            <span className="truncate mr-2 font-medium">{recipe.name}</span>
            <button 
              onClick={() => onUpdatePlan(day, meal, id, 'remove')}
              className="text-indigo-400 hover:text-red-500 transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="移除"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      
      {/* Add Recipe Dropdown */}
      <div className="relative">
        <select
          value=""
          onChange={(e) => {
            if(e.target.value) {
              onUpdatePlan(day, meal, e.target.value, 'add');
            }
          }}
          className="w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white text-gray-500 cursor-pointer hover:border-indigo-300 transition-colors appearance-none"
          style={{ backgroundImage: 'none' }} // Remove default arrow in some browsers to keep style consistent if needed, though usually standard select is fine.
        >
          <option value="">+ 添加菜品...</option>
          {recipes.filter(r => !selectedIds.includes(r.id)).map((recipe) => (
            <option key={recipe.id} value={recipe.id}>
              {recipe.name}
            </option>
          ))}
        </select>
        {/* CSS Arrow fix would go here if we hid appearance, but standard select is robust enough */}
      </div>
    </div>
  );
};

const MealPlanner: React.FC<MealPlannerProps> = ({ recipes, plan, onUpdatePlan, onClearPlan }) => {
  const mealTypes: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

  const DAY_LABELS: Record<string, string> = {
    Monday: '周一',
    Tuesday: '周二',
    Wednesday: '周三',
    Thursday: '周四',
    Friday: '周五',
    Saturday: '周六',
    Sunday: '周日'
  };

  const MEAL_LABELS: Record<MealType, string> = {
    Breakfast: '早餐',
    Lunch: '午餐',
    Dinner: '晚餐'
  };

  // Helper to safely get the list of recipes for a slot
  const getRecipesForSlot = (day: string, meal: MealType): string[] => {
    const dayPlan = plan[day];
    if (!dayPlan) return [];
    const mealData = dayPlan[meal];
    
    // Legacy support: if it's a string, convert to array
    if (typeof mealData === 'string') return [mealData];
    // If it's undefined or null, return empty array
    if (!mealData) return [];
    // If it's already an array, return it
    if (Array.isArray(mealData)) return mealData;
    
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">本周计划</h2>
        <button
          onClick={() => {
            if (window.confirm("确定要清空本周的所有计划吗？")) {
              onClearPlan();
            }
          }}
          className="text-red-600 hover:text-red-800 text-sm font-medium border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center"
        >
          <Trash2 size={16} className="mr-2" /> 清空本周
        </button>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-4 text-left font-semibold text-gray-600 w-24">日期</th>
                {mealTypes.map(type => (
                  <th key={type} className="py-4 px-4 text-left font-semibold text-gray-600 w-1/3">{MEAL_LABELS[type]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DAYS_OF_WEEK.map((day) => (
                <tr key={day} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4 font-medium text-gray-800 whitespace-nowrap">{DAY_LABELS[day] || day}</td>
                  {mealTypes.map((meal) => {
                    const selectedIds = getRecipesForSlot(day, meal);
                    return (
                      <td key={`${day}-${meal}`} className="py-3 px-3 align-top">
                        <MealSlot 
                          day={day} 
                          meal={meal} 
                          selectedIds={selectedIds} 
                          recipes={recipes} 
                          onUpdatePlan={onUpdatePlan} 
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-lg text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center">
               <span className="w-2 h-5 bg-indigo-500 rounded-full mr-2"></span>
               {DAY_LABELS[day] || day}
            </h3>
            <div className="space-y-4">
              {mealTypes.map((meal) => {
                const selectedIds = getRecipesForSlot(day, meal);
                return (
                  <div key={meal}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center">
                        {MEAL_LABELS[meal]}
                    </h4>
                    <MealSlot 
                      day={day} 
                      meal={meal} 
                      selectedIds={selectedIds} 
                      recipes={recipes} 
                      onUpdatePlan={onUpdatePlan} 
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      {recipes.length === 0 && (
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm border border-yellow-200">
          <strong>提示：</strong> 你还没有添加任何食谱。请先去“食谱”标签页添加一些食谱以便进行规划！
        </div>
      )}
    </div>
  );
};

export default MealPlanner;