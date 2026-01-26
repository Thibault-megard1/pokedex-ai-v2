"use client";

import Link from "next/link";

interface SectionItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
  color?: string;
  requireAuth?: boolean;
}

interface SectionMenuProps {
  title: string;
  items: SectionItem[];
  isLocked?: boolean;
  columns?: number;
}

export function SectionMenu({ title, items, isLocked = false, columns = 3 }: SectionMenuProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "md:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4"
  }[columns] || "lg:grid-cols-3";

  return (
    <div className="section-menu mb-8">
      <h2 className="text-pokemon text-2xl mb-4 flex items-center gap-3">
        <span>{title}</span>
        {isLocked && <span className="text-xs bg-red-600 text-white px-3 py-1 rounded-full inline-flex items-center gap-1">
          <img src="/icons/ui/ic-error.png" alt="Locked" className="w-3 h-3" />
          CONNEXION REQUISE
        </span>}
      </h2>
      
      <div className={`grid grid-cols-1 ${gridClass} gap-4`}>
        {items.map(item => (
          <Link
            key={item.href}
            href={isLocked ? "/auth/login" : item.href}
            className={`pokedex-card group ${isLocked ? 'opacity-60' : ''}`}
          >
            <div className={`pokedex-card-header ${item.color || 'bg-gradient-to-r from-gray-500 to-gray-600'} py-6`}>
              <div className="flex items-center justify-center gap-3">
                <img src={item.icon} alt={item.label} className="w-12 h-12" />
                <h3 className="text-white font-bold text-lg pokemon-text">
                  {item.label}
                </h3>
              </div>
            </div>
            
            {item.description && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
