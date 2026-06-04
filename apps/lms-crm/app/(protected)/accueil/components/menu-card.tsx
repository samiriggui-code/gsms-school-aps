import React from 'react';
import { LucideIcon } from 'lucide-react';
import { getIcon } from '@/lib/icons';

interface MenuCardProps {
  moduleKey: string;
  title: string;
  description: string;
  icon: LucideIcon | string;
  path: string;
  badge: string;
  backgroundImage: string;
  subSections: string[];
}

export function MenuCard({
  moduleKey,
  title,
  description,
  icon,
  path,
  badge,
  backgroundImage,
  subSections
}: MenuCardProps) {
  const Icon = getIcon(icon);
  
  return (
    <div>
      {/* Placeholder for MenuCard with props */}
      <div className="p-4 border rounded-lg">
        <Icon className="w-8 h-8 mb-2" />
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">{badge}</span>
      </div>
    </div>
  );
}