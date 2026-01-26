"use client";

import Link from "next/link";
import { useState } from "react";

interface MenuItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

interface MenuGroupProps {
  title: string;
  icon: string;
  items: MenuItem[];
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function MenuGroup({ title, icon, items, isOpen = false, onToggle, className = "" }: MenuGroupProps) {
  const [internalOpen, setInternalOpen] = useState(isOpen);
  const open = onToggle ? isOpen : internalOpen;
  const toggle = onToggle || (() => setInternalOpen(!internalOpen));

  return (
    <div className={`menu-group ${className}`}>
      <button
        onClick={toggle}
        className="w-full px-3 py-2 rounded-lg text-white hover:bg-white/20 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <img src={icon} alt={title} className="w-5 h-5" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>
      
      {open && (
        <div className="mt-1 ml-4 space-y-1 border-l-2 border-white/20 pl-2">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all no-underline"
            >
              <img src={item.icon} alt={item.label} className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
