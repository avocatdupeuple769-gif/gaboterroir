import { ProductCategory } from '@/types';

export const CATEGORIES: { label: ProductCategory; icon: string; emoji: string }[] = [
  { label: 'Tubercules', icon: 'leaf', emoji: '🥔' },
  { label: 'Fruits', icon: 'nutrition', emoji: '🍌' },
  { label: 'Légumes', icon: 'nutrition', emoji: '🥦' },
  { label: 'Céréales', icon: 'grain', emoji: '🌾' },
  { label: 'Viande & Poisson', icon: 'fish', emoji: '🐟' },
  { label: 'Épices', icon: 'flame', emoji: '🌶️' },
  { label: 'Boissons', icon: 'water', emoji: '🥤' },
  { label: 'Autre', icon: 'ellipsis', emoji: '📦' },
];
