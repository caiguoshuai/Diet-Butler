declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
    export interface IconProps extends SVGProps<SVGSVGElement> {
        size?: string | number;
        color?: string;
        strokeWidth?: string | number;
    }
    export type Icon = FC<IconProps>;
    export const Trash2: Icon;
    export const Plus: Icon;
    export const ChevronDown: Icon;
    export const ChevronUp: Icon;
    export const BookOpen: Icon;
    export const ChefHat: Icon;
    export const Calendar: Icon;
    export const ShoppingCart: Icon;
    export const Menu: Icon;
    export const CheckCircle: Icon;
    export const Circle: Icon;
    export const Edit: Icon;
    export const Copy: Icon;
    export const X: Icon;
    export const Search: Icon;
    export const Check: Icon;
    export const Download: Icon;
    export const FileSpreadsheet: Icon;
}