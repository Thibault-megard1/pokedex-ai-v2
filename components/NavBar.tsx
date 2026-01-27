"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./ThemeProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";
import { t } from "@/lib/i18n";
import { MenuGroup } from "./MenuGroup";
import AIStatusIndicator from "./AIStatusIndicator";

type Me = { username: string } | null;

export default function NavBar() {
  const { lang } = useLanguage();
  const [me, setMe] = useState<Me>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openDesktopDropdown, setOpenDesktopDropdown] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function refresh() {
    // Éviter les appels multiples simultanés
    if (fetchingRef.current) return;
    
    fetchingRef.current = true;
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json();
      setMe(data.user ?? null);
    } finally {
      fetchingRef.current = false;
    }
  }

  useEffect(() => { refresh(); }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Handle dropdown hover with delay
  const handleDropdownEnter = (groupId: string) => {
    // Cancel any pending close
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpenDesktopDropdown(groupId);
  };

  const handleDropdownLeave = () => {
    // Start close delay (700ms)
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDesktopDropdown(null);
      closeTimeoutRef.current = null;
    }, 700);
  };

  // Handle keyboard navigation
  const handleDropdownKeyDown = (e: React.KeyboardEvent, groupId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpenDesktopDropdown(openDesktopDropdown === groupId ? null : groupId);
    } else if (e.key === 'Escape') {
      setOpenDesktopDropdown(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDesktopDropdown(null);
    };
    
    if (openDesktopDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDesktopDropdown]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    window.location.href = "/";
  }

  // Grouped navigation structure
  const menuGroups = [
    {
      id: "pokedex",
      title: t(lang, "nav.pokedex"),
      icon: "/icons/ui/nav-pokedex.png",
      items: [
        { href: "/pokemon", label: t(lang, "nav.list"), icon: "/icons/ui/ic-pokemon.png" },
        { href: "/favorites", label: t(lang, "nav.favorites"), icon: "/icons/ui/ic-success.png" },
        { href: "/compare", label: t(lang, "nav.compare"), icon: "/icons/ui/ic-filter.png" },
        { href: "/stats", label: t(lang, "nav.stats"), icon: "/icons/ui/ic-search.png" },
      ]
    },
    {
      id: "battle",
      title: t(lang, "nav.battle"),
      icon: "/icons/ui/nav-battle.png",
      items: [
        { href: "/battle", label: t(lang, "nav.battle.1v1"), icon: "/icons/ui/nav-battle.png" },
        { href: "/tournament", label: t(lang, "nav.battle.tournament"), icon: "/icons/ui/ic-success.png" },
        { href: "/damage-calculator", label: t(lang, "nav.battle.calculator"), icon: "/icons/ui/ic-filter.png" },
      ]
    },
    {
      id: "trainer",
      title: t(lang, "nav.trainer"),
      icon: "/icons/ui/ic-trainer.png",
      items: [
        { href: "/team", label: t(lang, "nav.team"), icon: "/icons/ui/nav-team.png" },
        { href: "/quiz", label: t(lang, "nav.quiz"), icon: "/icons/ui/nav-quiz.png" },
      ]
    },
    {
      id: "tools",
      title: "🛠️ Outils",
      icon: "/icons/ui/ic-filter.png",
      items: [
        { href: "/tools", label: "📊 Hub Outils", icon: "/icons/ui/ic-search.png" },
        { href: "/tools/iv-ev", label: "📊 Calculateur IV/EV", icon: "/icons/ui/ic-filter.png" },
        { href: "/tools/damage", label: "⚔️ Dégâts Pro", icon: "/icons/ui/nav-battle.png" },
        { href: "/viewer/3d", label: "🎨 Visionneuse 3D", icon: "/icons/ui/ic-pokemon.png" },
      ]
    },
    {
      id: "ai",
      title: "🤖 IA",
      icon: "/icons/ui/ic-success.png",
      items: [
        { href: "/ai", label: "🤖 Hub IA", icon: "/icons/ui/ic-success.png" },
        { href: "/assistant", label: "💬 Assistant IA", icon: "/icons/ui/ic-pokemon.png" },
        { href: "/team", label: "🧠 Team Builder IA", icon: "/icons/ui/nav-team.png" },
      ]
    }
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-xl bg-gradient-to-b from-red-600 to-red-700 border-b-4 border-red-800">
      {/* Main Header Container */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          
          {/* LEFT: Logo / Brand */}
          <Link
            href="/pokemon"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all no-underline group shrink-0">
            <img 
              src="/icons/icon-192x192.png" 
              alt="Pokéball" 
              className="w-12 h-12 group-hover:scale-110 transition-transform"
            />
            <span className="text-white font-bold text-xl pokemon-text hidden sm:block">
              POKÉDEX AI
            </span>
          </Link>

          {/* CENTER: Main Navigation */}
          {me && (
            <nav className="hidden lg:flex items-center gap-2 flex-1 justify-center">
              <Link
                href="/"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/20 transition-all no-underline flex items-center gap-2"
              >
                <img src="/icons/ui/ic-home.png" alt="Home" className="w-5 h-5 icon-light-mode" />
                <span>{t(lang, "nav.home")}</span>
              </Link>
              
              {menuGroups.map(group => (
                <div 
                  key={group.id} 
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter(group.id)}
                  onMouseLeave={handleDropdownLeave}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/20 transition-all flex items-center gap-2"
                    onClick={() => setOpenDesktopDropdown(openDesktopDropdown === group.id ? null : group.id)}
                    onKeyDown={(e) => handleDropdownKeyDown(e, group.id)}
                    aria-expanded={openDesktopDropdown === group.id}
                    aria-controls={`dropdown-${group.id}`}
                    aria-haspopup="true"
                  >
                    <img src={group.icon} alt={group.title} className="w-5 h-5 icon-light-mode" />
                    <span>{group.title}</span>
                    <span className="text-xs ml-1">▾</span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openDesktopDropdown === group.id && (
                    <div 
                      id={`dropdown-${group.id}`}
                      className="absolute top-full left-0 mt-2 bg-red-700 rounded-lg shadow-xl border-2 border-red-800 min-w-[200px] z-50"
                      role="menu"
                      aria-label={`${group.title} menu`}
                    >
                      <div className="py-2">
                        {group.items.map(item => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="px-4 py-2.5 text-sm text-white hover:bg-white/20 transition-all no-underline flex items-center gap-3 whitespace-nowrap"
                            role="menuitem"
                            onClick={() => setOpenDesktopDropdown(null)}
                          >
                            <img src={item.icon} alt={item.label} className="w-4 h-4 icon-light-mode" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* RIGHT: Status & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* AI Status */}
            <div className="hidden md:flex">
              <AIStatusIndicator />
            </div>
            
            {/* Settings Group */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/10">
              <LanguageSwitcher />
              <div className="w-px h-6 bg-white/20"></div>
              <ThemeToggle />
            </div>
            
            {/* User Actions */}
            {me ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:flex items-center gap-2 text-sm text-white/90 bg-white/10 px-4 py-2 rounded-lg font-medium">
                  <span className="hidden xl:inline text-white/70">{t(lang, "nav.trainer.label")}</span>
                  <b className="text-white">{me.username}</b>
                </span>
                <button 
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                >
                  {t(lang, "nav.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  className="px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-all no-underline shadow-md" 
                  href="/auth/login"
                >
                  {t(lang, "nav.login")}
                </Link>
                <Link 
                  className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold text-sm transition-all no-underline shadow-lg hover:shadow-xl" 
                  href="/auth/register"
                >
                  {t(lang, "nav.register")}
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            {me && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all text-xl"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? "✕" : "☰"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {me && mobileMenuOpen && (
        <div className="lg:hidden bg-red-700 border-t border-red-800/50">
          <nav className="px-4 py-4 space-y-2 max-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Mobile AI Status */}
            <div className="mb-3 pb-3 border-b border-white/10">
              <AIStatusIndicator />
            </div>
            
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-white hover:bg-white/20 transition-all no-underline flex items-center gap-3 font-medium"
            >
              <img src="/icons/ui/ic-home.png" alt="Home" className="w-5 h-5 icon-light-mode" />
              <span>{t(lang, "nav.home")}</span>
            </Link>
            
            {menuGroups.map(group => (
              <MenuGroup
                key={group.id}
                title={group.title}
                icon={group.icon}
                items={group.items}
                isOpen={openGroup === group.id}
                onToggle={() => setOpenGroup(openGroup === group.id ? null : group.id)}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
