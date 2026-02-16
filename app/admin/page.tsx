"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  teamSize: number;
};

type UserDetail = {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  team: Array<{ slot: number; pokemonId: number; pokemonName: string }>;
  favoritePokemons: number[];
};

type ThemeColors = {
  background: string;
  text: string;
  primary: string;
  card: string;
};

type SiteSettings = {
  light: ThemeColors;
  dark: ThemeColors;
};

type Analytics = {
  totalUsers: number;
  adminCount: number;
  teamsCount: number;
  avgTeamSize: string;
  topFavorites: Array<{ pokemonId: number; count: number }>;
  totalQuizCompletions: number;
  topQuizResults: Array<{ pokemonName: string; count: number }>;
};

const pokemonThemes = {
  fire: { primary: "#FF4500", accent: "#FF6347" },
  water: { primary: "#1E90FF", accent: "#4169E1" },
  grass: { primary: "#32CD32", accent: "#228B22" },
  electric: { primary: "#FFD700", accent: "#FFA500" },
  psychic: { primary: "#FF1493", accent: "#FF69B4" },
  dark: { primary: "#4B0082", accent: "#8B008B" },
  dragon: { primary: "#7B68EE", accent: "#9370DB" },
  default: { primary: "#ef4444", accent: "#dc2626" }
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "theme" | "analytics">("users");
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  
  // Theme state
  const [settings, setSettings] = useState<SiteSettings>({
    light: { background: "#f3f4f6", text: "#1f2937", primary: "#ef4444", card: "#ffffff" },
    dark: { background: "#111827", text: "#f9fafb", primary: "#ef4444", card: "#1f2937" }
  });
  const [editMode, setEditMode] = useState<"light" | "dark">("light");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Maintenance state
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    // Verifie la session et les droits admin avant de charger les donnees.
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      
      if (!data.user) {
        router.push("/auth/login");
        return;
      }
      
      // Check if user is admin by fetching users list
      // If we get 403, user is not admin
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.status === 403 || usersRes.status === 401) {
        router.push("/");
        return;
      }
      
      setLoading(false);
      loadUsers();
      loadTheme();
      loadAnalytics();
    } catch (err) {
      router.push("/");
    }
  }

  async function loadUsers() {
    // Charge la liste des utilisateurs (admin uniquement).
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function loadUserDetail(userId: string) {
    // Charge le detail d'un utilisateur pour la vue admin.
    setLoadingUser(true);
    setSelectedUser(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setSelectedUser(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingUser(false);
    }
  }

  async function toggleAdmin(userId: string, currentStatus: boolean) {
    // Bascule le statut admin d'un utilisateur.
    if (!confirm(`Changer le statut admin de cet utilisateur ?`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      
      if (!res.ok) throw new Error("Erreur de mise à jour");
      
      await loadUsers();
      if (selectedUser?.id === userId) {
        await loadUserDetail(userId);
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteUser(userId: string) {
    // Suppression definitive d'un compte.
    if (!confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de suppression");
      }
      
      await loadUsers();
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function loadTheme() {
    // Recupere le theme personnalise si disponible.
    try {
      const res = await fetch("/api/admin/theme");
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      // Use defaults
    }
  }

  async function saveTheme() {
    // Sauvegarde et applique le theme en direct.
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings })
      });
      
      if (!res.ok) throw new Error("Erreur de sauvegarde");
      
      setSaveSuccess(true);
      
      // Apply theme immediately without page reload
      applyTheme(settings);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function applyTheme(themeSettings: SiteSettings) {
    // Applique le theme courant via des variables CSS.
    // Clear cache so DynamicThemeApplier fetches fresh data
    localStorage.removeItem("siteThemeCache");
    
    // Broadcast event to trigger theme reload globally
    window.dispatchEvent(new CustomEvent("themeUpdated"));
    
    // Also apply directly for instant feedback
    const isDark = document.documentElement.classList.contains("dark");
    const theme = isDark ? themeSettings.dark : themeSettings.light;
    const root = document.documentElement;
    
    root.style.setProperty("--bg-primary", theme.background);
    root.style.setProperty("--bg-secondary", theme.card);
    root.style.setProperty("--surface", theme.card);
    root.style.setProperty("--text-primary", theme.text);
    root.style.setProperty("--pokedex-red", theme.primary);
    root.style.setProperty("--pokedex-red-dark", theme.primary);
  }

  async function resetTheme() {
    // Reinitialise le theme aux valeurs par defaut.
    if (!confirm("Réinitialiser le thème aux valeurs par défaut ?")) return;
    const defaults: SiteSettings = {
      light: { background: "#f3f4f6", text: "#1f2937", primary: "#ef4444", card: "#ffffff" },
      dark: { background: "#111827", text: "#f9fafb", primary: "#ef4444", card: "#1f2937" }
    };
    setSettings(defaults);
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: defaults })
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde");
      setSaveSuccess(true);
      applyTheme(defaults);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function applyPokemonTheme(themeName: keyof typeof pokemonThemes) {
    const theme = pokemonThemes[themeName];
    setSettings({
      ...settings,
      [editMode]: {
        ...settings[editMode],
        primary: theme.primary
      }
    });
  }

  async function loadAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) return;
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (err) {
      // Ignore
    }
  }
  
  async function clearCache() {
    if (!confirm("Vider le cache Pokémon ? Les données seront rechargées à la prochaine utilisation.")) return;
    
    setMaintenanceLoading(true);
    setMaintenanceMessage("");
    
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-cache" })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setMaintenanceMessage(`✓ ${data.message}`);
      } else {
        setMaintenanceMessage(`✗ ${data.message}`);
      }
      
      setTimeout(() => setMaintenanceMessage(""), 5000);
    } catch (err: any) {
      setMaintenanceMessage(`✗ ${err.message}`);
    } finally {
      setMaintenanceLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Vérification des droits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <img src="/icons/ui/ic-success.png" alt="Admin" className="w-10 h-10" />
              Panneau d&apos;Administration
            </h1>
            <Link 
              href="/"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors no-underline"
            >
              ← Retour
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les utilisateurs, personnalisez le thème et consultez les statistiques
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "users"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            👥 Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab("theme")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "theme"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            🎨 Thème
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === "analytics"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* User List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Liste des utilisateurs ({users.length})
              </h2>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => loadUserDetail(user.id)}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Team: {user.teamSize} Pokémon
                        </p>
                      </div>
                      {user.isAdmin && (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Detail */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                Détails utilisateur
              </h2>
              
              {loadingUser && (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {!loadingUser && !selectedUser && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-12">
                  Sélectionnez un utilisateur pour voir les détails
                </p>
              )}
              
              {!loadingUser && selectedUser && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedUser.username}
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedUser.isAdmin ? (
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full">
                          USER
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Créé le: {new Date(selectedUser.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Team: {selectedUser.team.length} Pokémon
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Favoris: {selectedUser.favoritePokemons.length} Pokémon
                    </p>
                  </div>
                  
                  {selectedUser.team.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">Team</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedUser.team.map(slot => (
                          <div
                            key={slot.slot}
                            className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center"
                          >
                            <img
                              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.pokemonId}.png`}
                              alt={slot.pokemonName}
                              className="w-16 h-16 mx-auto"
                            />
                            <p className="text-xs text-gray-700 dark:text-gray-300 capitalize mt-1">
                              {slot.pokemonName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Actions</h4>
                    
                    <button
                      onClick={() => toggleAdmin(selectedUser.id, selectedUser.isAdmin)}
                      className={`w-full px-4 py-2 rounded-lg font-semibold transition-colors ${
                        selectedUser.isAdmin
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-green-500 hover:bg-green-600 text-white"
                      }`}
                    >
                      {selectedUser.isAdmin ? "Retirer admin" : "Promouvoir admin"}
                    </button>
                    
                    <button
                      onClick={() => deleteUser(selectedUser.id)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Supprimer l&apos;utilisateur
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Theme Tab */}
        {activeTab === "theme" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Personnalisation du thème
                </h2>
                {saveSuccess && (
                  <span className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold">
                    ✓ Sauvegardé
                  </span>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setEditMode("light")}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    editMode === "light"
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  ☀️ Mode Clair
                </button>
                <button
                  onClick={() => setEditMode("dark")}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    editMode === "dark"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  🌙 Mode Sombre
                </button>
              </div>

              {/* Pokémon Presets */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  Palettes Pokémon
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(pokemonThemes).map(themeName => (
                    <button
                      key={themeName}
                      onClick={() => applyPokemonTheme(themeName as keyof typeof pokemonThemes)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold capitalize transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                      style={{
                        borderLeft: `4px solid ${pokemonThemes[themeName as keyof typeof pokemonThemes].primary}`
                      }}
                    >
                      {themeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="space-y-4 mb-6">
                {["background", "text", "primary", "card"].map(colorKey => (
                  <div key={colorKey}>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">
                      {colorKey === "background" && "Couleur de fond"}
                      {colorKey === "text" && "Couleur du texte"}
                      {colorKey === "primary" && "Couleur principale"}
                      {colorKey === "card" && "Couleur des cartes"}
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={settings[editMode][colorKey as keyof ThemeColors]}
                        onChange={(e) => setSettings({
                          ...settings,
                          [editMode]: {
                            ...settings[editMode],
                            [colorKey]: e.target.value
                          }
                        })}
                        className="w-16 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings[editMode][colorKey as keyof ThemeColors]}
                        onChange={(e) => setSettings({
                          ...settings,
                          [editMode]: {
                            ...settings[editMode],
                            [colorKey]: e.target.value
                          }
                        })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={saveTheme}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                >
                  {saving ? "Sauvegarde..." : "💾 Sauvegarder"}
                </button>
                <button
                  onClick={resetTheme}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
                >
                  ↺ Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Statistiques du site
              </h2>
              
              {!analytics ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {analytics.totalUsers}
                      </div>
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        Utilisateurs
                      </div>
                    </div>

                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {analytics.adminCount}
                      </div>
                      <div className="text-sm text-red-800 dark:text-red-300">
                        Admins
                      </div>
                    </div>

                    <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {analytics.teamsCount}
                      </div>
                      <div className="text-sm text-green-800 dark:text-green-300">
                        Teams créées
                      </div>
                    </div>

                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {analytics.avgTeamSize}
                      </div>
                      <div className="text-sm text-purple-800 dark:text-purple-300">
                        Taille moy. team
                      </div>
                    </div>
                  </div>

                  {/* Quiz Statistics */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Quiz Completions Card */}
                      <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-200 dark:border-pink-700 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">🔮</span>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            Quiz de Personnalité
                          </h3>
                        </div>
                        <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                          {analytics.totalQuizCompletions}
                        </div>
                        <div className="text-sm text-purple-800 dark:text-purple-300">
                          Utilisateurs ont complété le quiz
                        </div>
                      </div>

                      {/* Top Quiz Results */}
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                          <span>⭐</span>
                          <span>Top 5 Résultats Quiz</span>
                        </h3>
                        {analytics.topQuizResults && analytics.topQuizResults.length > 0 ? (
                          <div className="space-y-2">
                            {analytics.topQuizResults.map((result, index) => (
                              <div
                                key={result.pokemonName}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-600 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-gray-400">
                                    #{index + 1}
                                  </span>
                                  <span className="capitalize font-semibold text-gray-900 dark:text-white">
                                    {result.pokemonName}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                  {result.count} fois
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Aucun quiz complété pour le moment
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Favorites */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  
                  {/* Maintenance Section */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                      Maintenance
                    </h3>
                    
                    {maintenanceMessage && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        maintenanceMessage.startsWith("✓") 
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                      }`}>
                        {maintenanceMessage}
                      </div>
                    )}
                    
                    <button
                      onClick={clearCache}
                      disabled={maintenanceLoading}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-bold transition-colors"
                    >
                      {maintenanceLoading ? "Nettoyage..." : "🗑️ Vider le cache Pokémon"}
                    </button>
                  </div>
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">
                      Top 10 Pokémon favoris
                    </h3>
                    <div className="space-y-2">
                      {analytics.topFavorites.map((fav, index) => (
                        <div
                          key={fav.pokemonId}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="text-2xl font-bold text-gray-400 w-8">
                            #{index + 1}
                          </div>
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fav.pokemonId}.png`}
                            alt={`#${fav.pokemonId}`}
                            className="w-12 h-12"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              Pokémon #{fav.pokemonId}
                            </div>
                          </div>
                          <div className="px-3 py-1 bg-red-500 text-white rounded-full font-bold">
                            {fav.count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
