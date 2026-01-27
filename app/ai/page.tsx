"use client";

import Link from 'next/link';

export default function AIHubPage() {
  const features = [
    {
      title: 'Assistant Pokédex',
      description: 'Chatbot IA pour répondre à vos questions sur les Pokémon et l\'application',
      icon: '🤖',
      href: '/assistant',
      color: 'from-blue-500 to-cyan-600',
      status: 'Disponible',
    },
    {
      title: 'Constructeur d\'Équipe IA',
      description: 'Suggestions intelligentes pour compléter votre équipe avec synergie',
      icon: '🧠',
      href: '/team',
      color: 'from-green-500 to-emerald-600',
      status: 'Intégré',
    },
    {
      title: 'Commentateur de Combat',
      description: 'Commentaires dynamiques pendant vos batailles (en développement)',
      icon: '🎙️',
      href: '/battle',
      color: 'from-red-500 to-orange-600',
      status: 'Beta',
    },
    {
      title: 'Quiz Adaptatif',
      description: 'Questions personnalisées basées sur vos performances',
      icon: '🎯',
      href: '/quiz',
      color: 'from-purple-500 to-pink-600',
      status: 'Amélioré',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            🤖 Fonctionnalités IA
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Intelligence artificielle propulsée par Mistral AI
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, idx) => (
            <Link
              key={idx}
              href={feature.href}
              className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-4xl`}>
                  {feature.icon}
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                  {feature.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {feature.description}
              </p>
              <div className="flex items-center text-blue-600 font-bold">
                Utiliser →
              </div>
            </Link>
          ))}
        </div>

        {/* Configuration Section */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 rounded-lg p-8 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">⚙️</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-yellow-900 dark:text-yellow-300">
                Configuration requise
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Pour utiliser les fonctionnalités IA, vous devez configurer une clé API Mistral.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                <p className="text-gray-600 dark:text-gray-400 mb-2">Ajoutez dans votre fichier <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">.env.local</code>:</p>
                <code className="block bg-gray-900 text-green-400 p-3 rounded">
                  MISTRAL_API_KEY=your_api_key_here
                </code>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                <strong>Note:</strong> Obtenez votre clé sur{' '}
                <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  console.mistral.ai
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Features Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Capacités de l'IA</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">🧠 Stratégie</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Suggestions d'équipe personnalisées</li>
                <li>• Analyse de couverture de types</li>
                <li>• Recommandations de rôles (Sweeper, Tank, Support)</li>
                <li>• Synergies entre Pokémon</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3 text-purple-600">💬 Assistance</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Réponses en temps réel</li>
                <li>• Contexte conversationnel</li>
                <li>• Base de connaissances Pokémon complète</li>
                <li>• Navigation dans l'application</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3 text-green-600">🎯 Apprentissage</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Quiz adaptatifs à votre niveau</li>
                <li>• Questions variées et pertinentes</li>
                <li>• Explications détaillées</li>
                <li>• Progression suivie</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-3 text-red-600">⚡ Performance</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Réponses rapides (1-3 secondes)</li>
                <li>• Optimisé pour le coût</li>
                <li>• Appels serveur uniquement</li>
                <li>• Sécurité API garantie</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
          <p className="text-center text-blue-800 dark:text-blue-300">
            <strong>🔒 Confidentialité:</strong> Vos conversations avec l'IA ne sont pas stockées sur nos serveurs. 
            Seule Mistral AI traite vos requêtes de manière sécurisée.
          </p>
        </div>
      </div>
    </div>
  );
}
