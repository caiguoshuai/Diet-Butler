export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  instructions: string;
  ingredients: Ingredient[];
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export interface DayPlan {
  Breakfast: string[]; 
  Lunch: string[];     
  Dinner: string[];    
}

export interface WeeklyPlan {
  [day: string]: DayPlan;
}

export interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
}

export const COMMON_INGREDIENTS = [
  "鸡蛋", "猪肉", "牛肉", "鸡胸肉", "鸡腿", "排骨", "培根", "火腿", 
  "番茄", "土豆", "洋葱", "大蒜", "生姜", "青椒", "胡萝卜", "黄瓜", "茄子", "西兰花", "生菜", "菠菜", "白菜", "芹菜", "蘑菇", "金针菇", "豆腐",
  "米饭", "面条", "馒头", "面包", "吐司",
  "牛奶", "酸奶", "奶酪", "黄油",
  "酱油", "生抽", "老抽", "醋", "料酒", "盐", "糖", "蚝油", "豆瓣酱", "辣椒酱", "黑胡椒", "淀粉", "食用油",
  "苹果", "香蕉", "橙子", "草莓", "蓝莓"
];

export const INGREDIENT_TEMPLATES: Record<string, Ingredient[]> = {
  "基础调味": [
    { name: "盐", quantity: 3, unit: "克" },
    { name: "鸡精", quantity: 2, unit: "克" },
    { name: "生抽", quantity: 1, unit: "勺" },
    { name: "食用油", quantity: 10, unit: "ml" }
  ],
  "家常炒菜佐料": [
    { name: "葱", quantity: 1, unit: "根" },
    { name: "姜", quantity: 2, unit: "片" },
    { name: "蒜", quantity: 2, unit: "瓣" },
    { name: "干辣椒", quantity: 2, unit: "个" }
  ],
  "简单早餐": [
      { name: "鸡蛋", quantity: 1, unit: "个" },
      { name: "牛奶", quantity: 200, unit: "ml" },
      { name: "吐司", quantity: 2, unit: "片" }
  ],
  "烘焙基础": [
      { name: "面粉", quantity: 100, unit: "克" },
      { name: "鸡蛋", quantity: 2, unit: "个" },
      { name: "白糖", quantity: 30, unit: "克" },
      { name: "黄油", quantity: 20, unit: "克" }
  ]
};