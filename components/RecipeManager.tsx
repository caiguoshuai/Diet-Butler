import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Recipe, Ingredient, COMMON_INGREDIENTS, INGREDIENT_TEMPLATES } from '../types';
import { Trash2, Plus, ChevronDown, ChevronUp, BookOpen, Edit, X, Download, Check, FileSpreadsheet } from 'lucide-react';

interface RecipeManagerProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}

// Ingredient Input Component with Autocomplete
const IngredientInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
}> = ({ value, onChange, suggestions, placeholder }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredIngredients = value
    ? suggestions.filter(item => item.toLowerCase().includes(value.toLowerCase()) && item !== value)
    : suggestions;

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onFocus={() => setShowSuggestions(true)}
        onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                setShowSuggestions(false);
            }
        }}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:outline-none"
        placeholder={placeholder}
      />
      {showSuggestions && (
        <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filteredIngredients.length > 0 ? (
             filteredIngredients.map((item) => (
                <div
                  key={item}
                  className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center group"
                  onClick={() => {
                    onChange(item);
                    setShowSuggestions(false);
                  }}
                >
                  <span>{item}</span>
                </div>
              ))
          ) : (
              <div 
                className="px-3 py-2 text-sm text-indigo-600 cursor-pointer hover:bg-indigo-50 flex items-center"
                onClick={() => setShowSuggestions(false)}
              >
                <Plus size={14} className="mr-1"/> 使用 "{value}"
              </div>
          )}
        </div>
      )}
    </div>
  );
};

const RecipeManager: React.FC<RecipeManagerProps> = ({ recipes, onAddRecipe, onEditRecipe, onDeleteRecipe }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  
  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: '', quantity: 1, unit: '个' }
  ]);

  // Compute suggestions from common ingredients AND existing recipes
  const suggestionList = useMemo(() => {
      const usedIngredients = recipes.flatMap(r => r.ingredients.map(i => i.name.trim()));
      // Merge and remove duplicates
      const all = Array.from(new Set([...COMMON_INGREDIENTS, ...usedIngredients]));
      return all.sort((a, b) => a.localeCompare(b, 'zh-CN'));
  }, [recipes]);

  const resetForm = () => {
    setName('');
    setInstructions('');
    setIngredients([{ name: '', quantity: 1, unit: '个' }]);
    setEditingId(null);
    setIsFormOpen(false);
    setIsImportModalOpen(false);
    setImportText('');
  };

  const startEditing = (recipe: Recipe) => {
    setName(recipe.name);
    setInstructions(recipe.instructions);
    setIngredients(recipe.ingredients.map(i => ({...i})));
    setEditingId(recipe.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: 1, unit: '个' }]);
  };

  const handleImportTemplate = (templateName: string) => {
      const template = INGREDIENT_TEMPLATES[templateName];
      if (template) {
          let currentIngredients = [...ingredients];
          if (currentIngredients.length === 1 && !currentIngredients[0].name.trim()) {
              currentIngredients = [];
          }
          setIngredients([...currentIngredients, ...template.map(i => ({...i}))]);
      }
  };

  const handleBulkImport = () => {
      if (!importText.trim()) return;

      const lines = importText.split('\n');
      const parsedIngredients: Ingredient[] = [];

      lines.forEach(line => {
          line = line.trim();
          if (!line) return;

          let name = '';
          let quantity = 1;
          let unit = '个';

          // Strategy 1: Tab separation (Excel default)
          const tabParts = line.split('\t').map(p => p.trim()).filter(p => p);
          
          if (tabParts.length >= 2) {
              // Assume standard: Name | Quantity | Unit(optional)
              name = tabParts[0];
              const qtyParse = parseFloat(tabParts[1]);
              if (!isNaN(qtyParse)) quantity = qtyParse;
              if (tabParts[2]) unit = tabParts[2];
          } else {
              // Strategy 2: Space separation, try to identify the number
              // Regex looks for: (Name part) (Number part) (Unit part)
              const match = line.match(/^([^\d]+)\s+(\d+(\.\d+)?)\s*(.*)$/);
              
              if (match) {
                  name = match[1].trim();
                  quantity = parseFloat(match[2]);
                  if (match[4]) unit = match[4].trim();
              } else {
                  // Fallback: entire line is name, try to split by space if format is just "Name 1"
                  const spaceParts = line.split(/\s+/);
                  if (spaceParts.length >= 2 && !isNaN(parseFloat(spaceParts[spaceParts.length-1]))) {
                      quantity = parseFloat(spaceParts.pop() || '1');
                      name = spaceParts.join(' ');
                  } else {
                      name = line;
                  }
              }
          }

          if (name) {
              parsedIngredients.push({ name, quantity, unit });
          }
      });

      if (parsedIngredients.length > 0) {
          let currentIngredients = [...ingredients];
          if (currentIngredients.length === 1 && !currentIngredients[0].name.trim()) {
              currentIngredients = [];
          }
          setIngredients([...currentIngredients, ...parsedIngredients]);
          setIsImportModalOpen(false);
          setImportText('');
      } else {
          alert('无法识别格式，请确保每行包含食材名称和数量。');
      }
  };

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validIngredients = ingredients.filter(i => i.name.trim() !== '');
    if (validIngredients.length === 0) {
        alert("请至少添加一种食材");
        return;
    }

    const recipeData: Recipe = {
      id: editingId || Date.now().toString(),
      name,
      instructions,
      ingredients: validIngredients
    };

    if (editingId) {
        onEditRecipe(recipeData);
    } else {
        onAddRecipe(recipeData);
    }
    
    resetForm();
  };

  const toggleExpand = (id: string) => {
    setExpandedRecipeId(expandedRecipeId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">我的食谱</h2>
        <button
          onClick={() => {
            if (isFormOpen) {
                resetForm();
            } else {
                setIsFormOpen(true);
                setEditingId(null);
            }
          }}
          className={`${isFormOpen ? 'bg-gray-100 text-gray-700' : 'bg-indigo-600 text-white'} px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-colors shadow-sm`}
        >
          {isFormOpen ? <><X size={20} className="mr-2" /> 取消</> : <><Plus size={20} className="mr-2" /> 添加食谱</>}
        </button>
      </div>

      {isImportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                      <FileSpreadsheet className="mr-2 text-green-600" /> 批量导入食材
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                      直接从 Excel 或表格中复制内容并粘贴到下方。
                      <br />推荐格式：<span className="bg-gray-100 px-1 rounded">名称</span> <span className="bg-gray-100 px-1 rounded">数量</span> <span className="bg-gray-100 px-1 rounded">单位</span> (列之间用 Tab 或空格分隔)
                  </p>
                  <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                      placeholder={`例如：\n鸡蛋\t2\t个\n牛奶\t200\tml\n苹果 1 个`}
                  />
                  <div className="flex justify-end gap-3 mt-4">
                      <button
                          onClick={() => setIsImportModalOpen(false)}
                          className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                      >
                          取消
                      </button>
                      <button
                          onClick={handleBulkImport}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm flex items-center"
                      >
                          <Check size={18} className="mr-1" /> 识别并添加
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{editingId ? '编辑食谱' : '创建新食谱'}</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">食谱名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="例如：番茄炒蛋"
              required
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-2 flex-wrap gap-2">
                <label className="block text-sm font-medium text-gray-700">食材清单</label>
                <div className="flex space-x-2">
                    <button 
                        type="button" 
                        onClick={() => setIsImportModalOpen(true)}
                        className="text-xs flex items-center text-green-700 hover:text-green-800 font-medium bg-green-50 px-2 py-1 rounded border border-green-200"
                    >
                        <FileSpreadsheet size={14} className="mr-1" /> Excel 粘贴导入
                    </button>
                    <div className="relative group">
                        <button type="button" className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                            <Download size={14} className="mr-1" /> 导入常用模板
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-20">
                            {Object.keys(INGREDIENT_TEMPLATES).map(key => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleImportTemplate(key)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-start sm:items-center flex-col sm:flex-row bg-gray-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <input
                        type="number"
                        min="0"
                        step="any"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:outline-none"
                        placeholder="数量"
                        />
                        <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:outline-none"
                        placeholder="单位"
                        />
                    </div>
                    
                    <div className="flex gap-2 w-full">
                        <IngredientInput 
                            value={ing.name}
                            onChange={(val) => handleIngredientChange(index, 'name', val)}
                            suggestions={suggestionList}
                            placeholder="输入食材名称"
                        />
                        <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700 p-2">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
                ))}
            </div>
            
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center mt-3 bg-white border border-indigo-200 px-3 py-1.5 rounded-md shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <Plus size={16} className="mr-1" /> 手动添加食材行
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">制作步骤</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32"
              placeholder="请填写详细的制作步骤..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
             <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              {editingId ? '更新食谱' : '保存食谱'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.length === 0 && !isFormOpen && (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>暂无食谱。点击“添加食谱”开始吧！</p>
          </div>
        )}
        
        {recipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden group">
            <div 
              className="p-5 cursor-pointer relative"
              onClick={() => toggleExpand(recipe.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-800">{recipe.name}</h3>
                {expandedRecipeId === recipe.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {recipe.ingredients.length} 种食材
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.ingredients.slice(0, 3).map((ing, i) => (
                  <span key={i} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {ing.name}
                  </span>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                    +{recipe.ingredients.length - 3} 更多
                  </span>
                )}
              </div>
            </div>

            {expandedRecipeId === recipe.id && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 mt-2 bg-gray-50">
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-2">食材清单</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex justify-between border-b border-gray-200 border-dashed pb-1 last:border-0">
                        <span>{ing.name}</span>
                        <span className="font-medium">{ing.quantity} {ing.unit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-2">制作步骤</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{recipe.instructions || "暂无步骤描述。"}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        startEditing(recipe);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center px-3 py-1 hover:bg-indigo-50 rounded transition-colors"
                  >
                    <Edit size={16} className="mr-1" /> 编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定要删除这个食谱吗？')) onDeleteRecipe(recipe.id);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center px-3 py-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} className="mr-1" /> 删除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipeManager;