"use client";

import { useState, useEffect } from "react";

type QuizMode = "silhouette" | "cry" | "stats";
type QuizState = {
  pokemon: { id: number; name: string };
  options: string[];
  score: number;
  total: number;
  answered: boolean;
  correct: boolean;
};

function getRandomPokemon(allPokemonNames: string[]) {
  const randomIndex = Math.floor(Math.random() * allPokemonNames.length);
  const name = allPokemonNames[randomIndex];
  return { id: randomIndex + 1, name };
}

function getRandomOptions(correct: string, allPokemonNames: string[], count: number = 4) {
  const options = [correct];
  while (options.length < count) {
    const random = allPokemonNames[Math.floor(Math.random() * allPokemonNames.length)];
    if (!options.includes(random)) {
      options.push(random);
    }
  }
  return options.sort(() => Math.random() - 0.5);
}

export default function QuizPage() {
  const [allPokemonNames, setAllPokemonNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<QuizMode>("silhouette");
  const [state, setState] = useState<QuizState | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function loadPokemonNames() {
      try {
        const response = await fetch('/api/pokemon-names');
        const names = await response.json();
        setAllPokemonNames(names);
      } catch (error) {
        console.error('Failed to load pokemon names:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPokemonNames();
  }, []);

  function startQuiz() {
    if (!allPokemonNames.length) return;
    const pokemon = getRandomPokemon(allPokemonNames);
    setState({
      pokemon,
      options: getRandomOptions(pokemon.name, allPokemonNames),
      score: 0,
      total: 0,
      answered: false,
      correct: false
    });
    
    if (mode === "stats") {
      loadStats(pokemon.name);
    }
  }

  async function loadStats(name: string) {
    try {
      const res = await fetch(`/api/pokemon?name=${name}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data.pokemon.stats);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function nextQuestion() {
    if (!allPokemonNames.length) return;
    const pokemon = getRandomPokemon(allPokemonNames);
    setState(prev => prev ? {
      pokemon,
      options: getRandomOptions(pokemon.name, allPokemonNames),
      score: prev.score,
      total: prev.total,
      answered: false,
      correct: false
    } : null);
    setStats(null);
    
    if (mode === "stats") {
      loadStats(pokemon.name);
    }
  }

  function checkAnswer(answer: string) {
    if (!state || state.answered) return;
    
    const correct = answer === state.pokemon.name;
    setState({
      ...state,
      answered: true,
      correct,
      score: state.score + (correct ? 1 : 0),
      total: state.total + 1
    });
  }

  if (loading) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center max-w-2xl mx-auto">
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="page-content mt-24">
        <div className="card p-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">🎮 Quiz Pokémon</h1>
          <p className="text-gray-600 mb-6">Testez vos connaissances !</p>
          
          <div className="space-y-4">
            <button
              className="btn btn-primary w-full text-lg py-4"
              onClick={() => { setMode("silhouette"); startQuiz(); }}
            >
              🌑 Qui est ce Pokémon ? (Silhouette)
            </button>
            
            <button
              className="btn btn-primary w-full text-lg py-4"
              onClick={() => { setMode("cry"); startQuiz(); }}
            >
              🔊 Devine par le cri
            </button>
            
            <button
              className="btn btn-primary w-full text-lg py-4"
              onClick={() => { setMode("stats"); startQuiz(); }}
            >
              📊 Devine par les stats
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content mt-24">
      <div className="card p-8 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {mode === "silhouette" && "🌑 Qui est ce Pokémon ?"}
            {mode === "cry" && "🔊 Devine par le cri"}
            {mode === "stats" && "📊 Devine par les stats"}
          </h2>
          <div className="text-lg font-semibold">
            Score: {state.score}/{state.total}
          </div>
        </div>

        {/* Affichage selon le mode */}
        <div className="mb-8 flex justify-center">
          {mode === "silhouette" && (
            <div className={`w-64 h-64 flex items-center justify-center ${!state.answered ? "brightness-0" : ""}`}>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${state.pokemon.id}.png`}
                alt="Pokemon"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {mode === "cry" && (
            <div className="text-center">
              <audio 
                controls 
                src={`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${state.pokemon.id}.ogg`}
                className="mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">Écoutez le cri et devinez !</p>
            </div>
          )}

          {mode === "stats" && stats && (
            <div className="w-full max-w-md">
              <div className="space-y-3">
                {stats.map((s: any) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-32 text-sm capitalize">{s.name}</div>
                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-4 bg-blue-500"
                        style={{ width: `${Math.min(100, (s.value / 255) * 100)}%` }}
                      />
                    </div>
                    <div className="w-12 text-right text-sm font-bold">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {state.options.map(option => {
            let className = "btn w-full py-4 text-lg";
            if (state.answered) {
              if (option === state.pokemon.name) {
                className += " !bg-green-500 !text-white";
              } else if (option === state.pokemon.name) {
                className += " !bg-red-500 !text-white";
              }
            }
            
            return (
              <button
                key={option}
                className={className}
                onClick={() => checkAnswer(option)}
                disabled={state.answered}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Résultat */}
        {state.answered && (
          <div className={`p-4 rounded-lg mb-4 ${state.correct ? "bg-green-100" : "bg-red-100"}`}>
            <p className="text-center text-lg font-bold">
              {state.correct ? "✅ Correct !" : `❌ Raté ! C'était ${state.pokemon.name}`}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {state.answered && (
            <button className="btn btn-primary flex-1" onClick={nextQuestion}>
              Question Suivante →
            </button>
          )}
          <button className="btn" onClick={() => setState(null)}>
            Quitter
          </button>
        </div>
      </div>
    </div>
  );
}
