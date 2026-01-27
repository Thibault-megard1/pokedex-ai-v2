"use client";

import { useState } from "react";
import { quizQuestions, type QuizAnswers, type QuizResult } from "@/lib/quiz";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type QuizStep = "intro" | "questions" | "loading" | "results";

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pokemonData, setPokemonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Start the quiz
  const startQuiz = () => {
    setStep("questions");
    setAnswers({});
    setResult(null);
    setPokemonData(null);
    setError(null);
  };

  // Update an answer
  const updateAnswer = (questionId: string, value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Check if all required questions are answered
  const isComplete = () => {
    const requiredQuestions = quizQuestions.filter(q => q.type !== "text");
    return requiredQuestions.every(q => answers[q.id] !== undefined && answers[q.id] !== "");
  };

  // Submit the quiz
  const submitQuiz = async () => {
    if (!isComplete()) {
      setError("Veuillez répondre à toutes les questions obligatoires");
      return;
    }

    setStep("loading");
    setError(null);

    try {
      // Call API to analyze quiz
      const response = await fetch("/api/quiz/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze quiz");
      }

      const data = await response.json();
      setResult(data.result);

      // Fetch full Pokémon data for the primary match
      const pokemonResponse = await fetch(`/api/pokemon/${data.result.primary.name}`);
      if (pokemonResponse.ok) {
        const pokemonInfo = await pokemonResponse.json();
        setPokemonData(pokemonInfo);
      }

      setStep("results");
    } catch (err) {
      console.error("Quiz submission error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setStep("questions");
    }
  };

  // Render functions for each step
  const renderIntro = () => (
    <div className="card p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">🔮 Quel Pokémon êtes-vous ?</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
        Répondez à quelques questions personnelles et découvrez quel Pokémon correspond le mieux à votre personnalité !
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          ✨ <strong>Propulsé par l'IA</strong> - Notre système utilise l'intelligence artificielle Mistral 
          pour analyser vos réponses et trouver le Pokémon qui vous correspond le mieux.
        </p>
      </div>
      <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          🔒 <strong>Confidentialité</strong> - Vos réponses ne sont pas stockées de manière permanente. 
          Elles sont uniquement utilisées pour générer votre résultat.
        </p>
      </div>
      <button
        onClick={startQuiz}
        className="btn btn-primary text-xl px-8 py-4"
      >
        Commencer le quiz
      </button>
    </div>
  );

  const renderQuestions = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📝 Questionnaire de personnalité</h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {Object.keys(answers).length} / {quizQuestions.length} réponses
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          {quizQuestions.map((question, index) => (
            <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{question.question}</p>
                  {question.type === "text" && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">(Optionnel)</p>
                  )}
                </div>
              </div>

              <div className="ml-11">
                {question.type === "multiple-choice" && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          answers[question.id] === option 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => updateAnswer(question.id, e.target.value)}
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "slider" && (
                  <div className="space-y-3">
                    <input
                      type="range"
                      min={question.min}
                      max={question.max}
                      value={answers[question.id] || 3}
                      onChange={(e) => updateAnswer(question.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>{question.min}</span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{answers[question.id] || 3}</span>
                      <span>{question.max}</span>
                    </div>
                  </div>
                )}

                {question.type === "text" && (
                  <input
                    type="text"
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => setStep("intro")}
            className="btn px-6 py-3"
          >
            ← Retour
          </button>
          <button
            onClick={submitQuiz}
            disabled={!isComplete()}
            className="btn btn-primary px-8 py-3 flex-1"
          >
            Découvrir mon Pokémon ! ✨
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="card p-12 max-w-2xl mx-auto text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 dark:border-blue-400 mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold mb-2">Analyse en cours...</h2>
      <p className="text-gray-600 dark:text-gray-300">
        L'IA analyse votre personnalité pour trouver votre Pokémon parfait
      </p>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    const { primary, alternatives, traits_inferred } = result;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Primary Match */}
        <div className="card p-8 text-center">
          <h2 className="text-3xl font-bold mb-2">🎉 Votre Pokémon est...</h2>
          
          {/* Sprite first */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <img 
              src={primary.sprite_url || pokemonData?.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${primary.id}.png`}
              alt={primary.name_fr || primary.name} 
              className="w-48 h-48 pixelated"
            />
            <h1 className="text-5xl font-bold capitalize">{primary.name_fr || primary.name} !</h1>
            
            {pokemonData && pokemonData.types && (
              <div className="flex gap-2">
                {pokemonData.types.map((type: string) => (
                  <TypeBadge key={type} kind={type as BadgeKey} width={80} />
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Confiance du match</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(primary.confidence * 100)}%
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left">
            <h3 className="font-bold text-lg mb-3">💡 Pourquoi ce Pokémon ?</h3>
            <ul className="space-y-2">
              {primary.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Personality Traits */}
        <div className="card p-6">
          <h3 className="font-bold text-xl mb-4">✨ Traits de personnalité détectés</h3>
          <div className="flex flex-wrap gap-2">
            {traits_inferred.map((trait, i) => (
              <span
                key={i}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-full font-medium"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Alternative Matches */}
        {alternatives.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-xl mb-4">🔀 Autres correspondances possibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alternatives.map((alt, i) => (
                <div key={i} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={alt.sprite_url || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${alt.id}.png`}
                      alt={alt.name_fr || alt.name}
                      className="w-16 h-16 pixelated"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg capitalize">{alt.name_fr || alt.name}</h4>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {Math.round(alt.confidence * 100)}% de correspondance
                      </span>
                    </div>
                  </div>
                  <ul className="text-sm space-y-1">
                    {alt.reasons.map((reason, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startQuiz}
              className="btn btn-primary flex-1 py-3"
            >
              🔄 Refaire le quiz
            </button>
            {pokemonData && (
              <a
                href={`/pokemon/${primary.name}`}
                className="btn flex-1 py-3 text-center"
              >
                📖 Voir la fiche détaillée
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-bg min-h-screen">
      <div className="page-content py-24 px-4">
        {step === "intro" && renderIntro()}
        {step === "questions" && renderQuestions()}
        {step === "loading" && renderLoading()}
        {step === "results" && renderResults()}
      </div>
    </div>
  );
}
