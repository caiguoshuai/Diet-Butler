import React, { useMemo, useState } from 'react';
import { Recipe, WeeklyPlan, DAYS_OF_WEEK, ShoppingItem } from '../types';
import { ShoppingCart, CheckCircle, Circle, Copy, Check } from 'lucide-react';

interface ShoppingListProps {
  recipes: Recipe[];
  plan: WeeklyPlan;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ recipes, plan }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const shoppingList = useMemo(() => {
    const itemsMap: Record<string, ShoppingItem> = {};

    DAYS_OF_WEEK.forEach((day) => {
      const dayPlan = plan[day];
      if (!dayPlan) return;

      Object.values(dayPlan).forEach((mealData) => {
        // Normalize mealData to array to handle both single string (legacy) and array (new)
        let recipeIds: string[] = [];
        if (Array.isArray(mealData)) {
            recipeIds = mealData;
        } else if (typeof mealData === 'string') {
            recipeIds = [mealData];
        }

        recipeIds.forEach(recipeId => {
            const recipe = recipes.find((r) => r.id === recipeId);
            if (recipe) {
              recipe.ingredients.forEach((ing) => {
                const key = `${ing.name.toLowerCase().trim()}-${ing.unit.toLowerCase().trim()}`;
                
                if (itemsMap[key]) {
                  itemsMap[key].quantity += ing.quantity;
                } else {
                  itemsMap[key] = {
                    name: ing.name.trim(),
                    unit: ing.unit.trim(),
                    quantity: ing.quantity,
                    checked: false,
                  };
                }
              });
            }
        });
      });
    });

    return Object.values(itemsMap).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }, [recipes, plan]);

  const toggleCheck = (key: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedItems(newChecked);
  };

  const handleCopyList = () => {
    if (shoppingList.length === 0) return;

    const text = "🛒 膳食管家购物清单:\n\n" + shoppingList.map(item => {
        const key = `${item.name}-${item.unit}`;
        const isChecked = checkedItems.has(key);
        return `${isChecked ? '[x]' : '[ ]'} ${item.name}: ${Math.round(item.quantity * 100) / 100} ${item.unit}`;
    }).join('\n');

    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalItems = shoppingList.length;
  const checkedCount = Array.from(checkedItems).filter(k => shoppingList.some(item => `${item.name}-${item.unit}` === k)).length;
  const progress = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">购物清单</h2>
        <div className="flex items-center space-x-2">
            {totalItems > 0 && (
                <button 
                    onClick={handleCopyList}
                    className="flex items-center space-x-1 text-sm bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors mr-2 shadow-sm"
                >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    <span>{copied ? '已复制' : '复制清单'}</span>
                </button>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
                <ShoppingCart size={16} />
                <span>{totalItems} 项</span>
            </div>
        </div>
      </div>

      {totalItems > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-indigo-900">计划摘要</p>
               <p className="text-xs text-indigo-700 mt-1">根据每周膳食计划自动生成</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-indigo-600">{progress}%</span>
              <span className="text-xs text-indigo-500 block uppercase tracking-wide">完成</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {shoppingList.map((item, index) => {
               const key = `${item.name}-${item.unit}`; 
               const isChecked = checkedItems.has(key);

               return (
                <div 
                  key={index} 
                  onClick={() => toggleCheck(key)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isChecked ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <button className={`text-gray-400 transition-colors ${isChecked ? 'text-green-500' : 'hover:text-indigo-500'}`}>
                      {isChecked ? <CheckCircle size={24} className="fill-green-100" /> : <Circle size={24} />}
                    </button>
                    <div className={isChecked ? 'opacity-50 line-through' : ''}>
                      <p className="font-medium text-gray-800">{item.name}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isChecked ? 'bg-gray-200 text-gray-500 line-through opacity-50' : 'bg-indigo-100 text-indigo-700'}`}>
                    {Math.round(item.quantity * 100) / 100} {item.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <ShoppingCart className="mx-auto h-16 w-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">清单为空</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            请先在“周计划”中安排膳食，系统将自动生成购物清单。
          </p>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;