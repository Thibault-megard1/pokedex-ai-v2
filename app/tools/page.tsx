"use client";

import Link from 'next/link';

export default function ToolsHubPage() {
  const tools = [
    {
      title: 'Calculateur IV/EV',
      description: 'Calculez les statistiques finales de vos Pokémon avec IVs, EVs, et natures',
      icon: '📊',
      href: '/tools/iv-ev',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Calculateur de Dégâts Pro',
      description: 'Simulez les dégâts avec modificateurs avancés: météo, terrain, objets',
      icon: '⚔️',
      href: '/tools/damage',
      color: 'from-red-500 to-orange-600',
    },
    {
      title: 'Visionneuse 3D',
      description: 'Explorez les Pokémon en 3D avec rotation et zoom (en développement)',
      icon: '🎨',
      href: '/viewer/3d',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🛠️ Outils Compétitifs
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Des outils professionnels pour optimiser vos stratégies Pokémon
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool, idx) => (
            <Link
              key={idx}
              href={tool.href}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className={`w-16 h-16 mb-4 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center text-4xl`}>
                {tool.icon}
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                {tool.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
              <div className="mt-4 flex items-center text-blue-600 font-bold">
                Accéder →
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">À propos des outils</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">📊 Calculateurs</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• <strong>IV/EV:</strong> Optimisez les stats de vos Pokémon</li>
                <li>• <strong>Dégâts:</strong> Prédisez l'issue des combats</li>
                <li>• Formules officielles Pokémon</li>
                <li>• Support complet des modificateurs</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3 text-purple-600">🎨 Visualisation</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• <strong>3D Viewer:</strong> Explorez en 3 dimensions</li>
                <li>• Contrôles interactifs</li>
                <li>• Fallback vers sprites 2D</li>
                <li>• En développement continu</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
            <p className="text-center text-blue-800 dark:text-blue-300">
              <strong>💡 Astuce:</strong> Tous les outils sont disponibles sans connexion grâce au mode hors ligne !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
