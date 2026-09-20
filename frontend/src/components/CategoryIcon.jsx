import React from 'react';
import { 
  Construction, 
  Lightbulb, 
  Trash2, 
  Droplets, 
  AlertCircle, 
  Building2, 
  HelpCircle 
} from 'lucide-react';

export const CATEGORY_ICONS = {
  Pothole: Construction,
  Streetlight: Lightbulb,
  Garbage: Trash2,
  'Water Leakage': Droplets,
  'Traffic Signal': AlertCircle,
  'Public Infrastructure': Building2,
  Other: HelpCircle
};

export default function CategoryIcon({ category, size = 18, color = 'currentColor', style = {} }) {
  const IconComponent = CATEGORY_ICONS[category] || HelpCircle;
  return <IconComponent size={size} color={color} style={style} aria-hidden="true" />;
}
