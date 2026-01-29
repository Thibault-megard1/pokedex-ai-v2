"use client";

import { useState } from "react";
import { quizQuestions, type QuizAnswers, type QuizResult } from "@/lib/quiz";
import TypeBadge from "@/components/TypeBadge";
import type { BadgeKey } from "@/lib/typeBadgesSprite";

type QuizStep = "intro" | "questions" | "loading" | "results";

export default function QuizPage() {
  const [step, setStep] = useState<QuizStep>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pokemonData, setPokemonData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get current question
  const currentQuestion = quizQuestions[currentQuestionIndex];

  // Start the quiz
  const startQuiz = () => {
    setStep("questions");
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResult(null);
    setPokemonData(null);
    setError(null);
  };

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
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
    return quizQuestions.every(q => answers[q.id] !== undefined && answers[q.id] !== "");
  };

  // Submit the quiz
  const submitQuiz = async () => {
    if (!isComplete()) {
      setError("Veuillez répondre à toutes les questions");
      return;
    }

    setStep("loading");
    setError(null);

    try {
      // Call API to analyze quiz
      const response = await fetch("/api/quiz/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_fr || errorData.error || "Failed to analyze quiz");
      }

      const data = await response.json();
      const quizResult = data.result;

      setResult(quizResult);

      // Fetch full Pokemon data
      const pokemonResponse = await fetch(`/api/pokemon/${quizResult.primary.name}`);
      if (pokemonResponse.ok) {
        const pokemonData = await pokemonResponse.json();
        setPokemonData(pokemonData);
      }

      setStep("results");
    } catch (err: any) {
      console.error("Quiz submission error:", err);
      setError(err.message || "Une erreur s'est produite lors de l'analyse");
      setStep("questions");
    }
  };

  // Render functions for each step
  const renderIntro = () => (
    <div className="card p-8 max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">🔮 Quel Pokémon êtes-vous ?</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
        Répondez à 15 questions personnelles et découvrez quel Pokémon correspond le mieux à votre personnalité !
      </p>
      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          ✨ <strong>Algorithme intelligent</strong> - Notre système analyse vos réponses en profondeur 
          pour trouver le Pokémon qui vous correspond vraiment, en fonction des types, statistiques et personnalité.
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
        className="btn btn-primary text-xl px-8 py-4 hover:scale-105 transition-transform"
      >
        Commencer le quiz 🚀
      </button>
    </div>
  );

  const renderQuestions = () => (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Quiz de Personnalité Pokémon</h2>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            Question {currentQuestionIndex + 1} / {quizQuestions.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {Object.keys(answers).length} / {quizQuestions.length} réponses complétées
        </p>
      </div>

      {error && (
        <div className="card p-4 mb-6 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Current Question */}
      <div className="card p-8 mb-6 animate-fade-in">
        <div className="flex items-start gap-4 mb-6">
          <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
            {currentQuestionIndex + 1}
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-4">{currentQuestion.question}</h3>

            {/* Multiple Choice */}
            {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                      answers[currentQuestion.id] === option
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-md scale-[1.02]"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="flex-1 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Slider */}
            {currentQuestion.type === "slider" && (
              <div className="space-y-4">
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  value={answers[currentQuestion.id] || 3}
                  onChange={(e) => updateAnswer(currentQuestion.id, parseInt(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-700 dark:to-purple-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                  <span>{currentQuestion.min}</span>
                  <span className="font-bold text-2xl text-blue-600 dark:text-blue-400 px-6 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {answers[currentQuestion.id] || 3}
                  </span>
                  <span>{currentQuestion.max}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="btn px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            ← Précédent
          </button>
          
          {currentQuestionIndex < quizQuestions.length - 1 ? (
            <button
              onClick={goToNextQuestion}
              disabled={!answers[currentQuestion.id]}
              className="btn btn-primary flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={!isComplete()}
              className="btn btn-primary flex-1 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              Découvrir mon Pokémon ! ✨
            </button>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="card p-6">
        <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-300">Navigation rapide</h4>
        <div className="flex flex-wrap gap-2">
          {quizQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-10 h-10 rounded-full font-semibold transition-all ${
                answers[q.id]
                  ? "bg-green-500 text-white shadow-md"
                  : idx === currentQuestionIndex
                  ? "bg-blue-500 text-white shadow-md scale-110"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              } hover:scale-110`}
              title={`Question ${idx + 1}${answers[q.id] ? " (répondue)" : ""}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="card p-12 max-w-2xl mx-auto text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 dark:border-blue-400 mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold mb-2">Analyse en cours...</h2>
      <p className="text-gray-600 dark:text-gray-300">
        Notre algorithme analyse votre personnalité pour trouver votre Pokémon parfait
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
              className="w-48 h-48 pixelated animate-bounce"
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
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Correspondance</div>
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
                <div key={i} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
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
              className="btn btn-primary flex-1 py-3 hover:scale-105 transition-transform"
            >
              🔄 Refaire le quiz
            </button>
            {pokemonData && (
              <a
                href={`/pokemon/${primary.name}`}
                className="btn flex-1 py-3 text-center hover:scale-105 transition-transform"
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
