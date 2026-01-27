# AI-Powered Pokémon Personality Quiz

## 🎯 Overview

The Pokémon Personality Quiz is an AI-powered feature that matches users with Pokémon based on their personality traits. It uses **Mistral AI** to analyze quiz responses and provide personalized recommendations.

## ✨ Features

- **15 Personal Questions**: Mix of multiple-choice, slider, and text inputs
- **AI Analysis**: Uses Mistral AI to analyze personality and match with Pokémon
- **Structured Output**: JSON Schema ensures reliable, consistent results
- **Detailed Results**: 
  - Primary match with confidence score
  - Up to 2 alternative matches
  - Inferred personality traits
  - Detailed reasoning for each match
- **Privacy-First**: Answers are not stored permanently

## 🔧 Setup Instructions

### 1. Get a Mistral API Key

1. Go to [https://console.mistral.ai/](https://console.mistral.ai/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Mistral API key:
   ```
   MISTRAL_API_KEY=your_actual_api_key_here
   ```

3. **Important**: Never commit `.env.local` to version control!

### 3. Start the Development Server

```bash
npm run dev
```

Navigate to [http://localhost:3000/quiz](http://localhost:3000/quiz)

## 📁 File Structure

```
├── app/
│   ├── quiz/
│   │   └── page.tsx              # Quiz UI (intro, questions, results)
│   └── api/
│       └── quiz/
│           └── analyze/
│               └── route.ts      # API route for quiz analysis
├── lib/
│   ├── quiz.ts                   # Question definitions and types
│   └── mistral.ts                # Mistral AI client and integration
└── .env.local.example            # Template for environment variables
```

## 🔍 How It Works

### 1. User Flow

```
Intro Screen → Answer Questions → AI Analysis → Results Display
```

### 2. Question Types

- **Multiple Choice**: Select from predefined options
- **Slider**: Rate on a scale (1-5)
- **Text Input**: Open-ended responses (optional, 2 questions)

### 3. AI Analysis Process

1. **User submits answers** → Client sends to `/api/quiz/analyze`
2. **API loads Pokémon candidates** → First 151 Pokémon from cache
3. **Formats context for AI**:
   - System prompt with strict rules
   - User answers formatted as text
   - Pokémon list with IDs, names, types, and tags
4. **Calls Mistral API**:
   - Model: `mistral-small-latest`
   - Temperature: `0.3` (low for consistency)
   - JSON mode enabled
5. **Validates response** → Ensures proper structure
6. **Returns result** → Client displays match

### 4. JSON Schema

The AI must return JSON matching this structure:

```json
{
  "primary": {
    "id": 25,
    "name": "pikachu",
    "confidence": 0.85,
    "reasons": [
      "Your energetic and friendly nature matches Pikachu",
      "You prefer quick, dynamic environments"
    ]
  },
  "alternatives": [
    {
      "id": 133,
      "name": "eevee",
      "confidence": 0.70,
      "reasons": ["Your adaptability is reflected in Eevee"]
    }
  ],
  "traits_inferred": [
    "energetic",
    "curious",
    "friendly",
    "spontaneous"
  ]
}
```

## 🎨 Question Design

Questions are designed to be:
- **Non-sensitive**: No health, political, or personal data
- **Personality-focused**: Measure traits, preferences, values
- **Diverse**: Cover multiple dimensions of personality

### Question Categories

1. **Social Energy**: Introversion vs Extroversion
2. **Environment**: Preferred habitats and settings
3. **Conflict Style**: Approach to challenges
4. **Planning**: Organization vs Spontaneity
5. **Motivation**: Core drivers and goals
6. **Pace**: Activity level and tempo
7. **Values**: Core principles and beliefs
8. **Leadership**: Team dynamics and roles
9. **Adaptability**: Response to change
10. **Element Affinity**: Symbolic preferences
11. **Emotional Expression**: Communication style
12. **Problem Solving**: Cognitive approach
13. **Time Preference**: Energy patterns
14. **Personal Traits** (text input)
15. **Ideal Day** (text input)

## 🔒 Privacy & Safety

### Data Handling
- ✅ Answers sent to API only for analysis
- ✅ No permanent storage by default
- ✅ No sensitive data requested
- ❌ Answers not logged to database
- ❌ No tracking or analytics on responses

### AI Safety Rules
The system prompt includes strict rules:
- Only select from provided Pokémon list
- Do not invent Pokémon IDs
- Do not request sensitive information
- Output must follow JSON schema
- Confidence scores must be realistic (0-1)

## 🧪 Testing

### Manual Testing Checklist

1. **Quiz Flow**:
   - [ ] Intro screen displays correctly
   - [ ] All 15 questions render properly
   - [ ] Each question type works (radio, slider, text)
   - [ ] Validation prevents submission with incomplete answers
   - [ ] Loading state shows during analysis
   - [ ] Results display correctly

2. **API Testing**:
   - [ ] API key is configured
   - [ ] Endpoint returns valid JSON
   - [ ] Error handling works for invalid inputs
   - [ ] Pokémon candidates load correctly

3. **AI Quality**:
   - [ ] Results match personality inputs
   - [ ] Confidence scores are reasonable
   - [ ] Reasons are specific and relevant
   - [ ] Traits inferred make sense
   - [ ] Only valid Pokémon IDs returned

### Example Test Cases

```typescript
// Test 1: Energetic, social personality
const answers = {
  social_energy: "En sortant avec des amis...",
  pace: 5,
  motivation: "Relever des défis excitants",
  // ... etc
};
// Expected: Active Pokémon like Pikachu, Charizard

// Test 2: Calm, thoughtful personality
const answers = {
  social_energy: "En passant du temps seul(e)...",
  pace: 2,
  motivation: "Trouver l'équilibre et l'harmonie",
  // ... etc
};
// Expected: Calm Pokémon like Snorlax, Lapras
```

## 🚀 API Usage

### Endpoint

```
POST /api/quiz/analyze
```

### Request Body

```json
{
  "answers": {
    "social_energy": "En passant du temps seul(e) dans un endroit calme",
    "environment": "Les forêts denses et mystérieuses",
    "planning": 4,
    // ... other answers
  }
}
```

### Response

```json
{
  "success": true,
  "result": {
    "primary": { /* ... */ },
    "alternatives": [ /* ... */ ],
    "traits_inferred": [ /* ... */ ]
  }
}
```

### Error Response

```json
{
  "error": "Incomplete answers: please answer all required questions"
}
```

## 💡 Customization

### Adding Questions

Edit `lib/quiz.ts`:

```typescript
export const quizQuestions: QuizQuestion[] = [
  // ... existing questions
  {
    id: "new_question",
    type: "multiple-choice",
    question: "Your new question?",
    options: ["Option 1", "Option 2", "Option 3"]
  }
];
```

### Changing Pokémon Candidates

Edit `app/api/quiz/analyze/route.ts`:

- Modify `loadPokemonCandidates()` to load different Pokémon
- Update the range (currently 1-151)
- Or provide a custom list in `getDefaultCandidates()`

### Adjusting AI Behavior

Edit `lib/mistral.ts`:

```typescript
const response = await this.chatCompletion(messages, {
  model: "mistral-small-latest",  // Change model
  temperature: 0.3,                // Adjust creativity (0-1)
  maxTokens: 2000,                 // Adjust response length
});
```

## 🐛 Troubleshooting

### Common Issues

**Error: "AI service not configured"**
- Check that `MISTRAL_API_KEY` is set in `.env.local`
- Restart the dev server after adding the key

**Error: "Failed to parse AI response as valid JSON"**
- The AI returned invalid JSON
- Check Mistral API status
- Try lowering the temperature for more consistent output

**Slow response times**
- Mistral API can take 3-10 seconds
- This is normal for LLM inference
- Consider adding a progress indicator

**Results don't match personality**
- Review the AI prompt in `lib/mistral.ts`
- Ensure Pokémon candidates have good tags
- Lower temperature for more deterministic results

**API rate limits**
- Mistral has rate limits based on your plan
- Consider caching results
- Implement rate limiting on your endpoint

## 📊 Cost Estimation

### Mistral API Pricing (as of 2024)

- **Model**: `mistral-small-latest`
- **Typical request**: ~1,500 input tokens + ~500 output tokens
- **Cost per quiz**: ~$0.002-0.005 USD

**Example monthly costs:**
- 100 quizzes/month: ~$0.50
- 1,000 quizzes/month: ~$5.00
- 10,000 quizzes/month: ~$50.00

### Optimization Tips

1. **Reduce candidate list**: Use fewer Pokémon (50 instead of 151)
2. **Shorten questions**: Less context = fewer tokens
3. **Cache results**: Store common personality patterns
4. **Batch requests**: Process multiple quizzes together (advanced)

## 📚 Resources

- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Mistral Console](https://console.mistral.ai/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [JSON Schema Validation](https://json-schema.org/)

## 🤝 Contributing

To improve the quiz:

1. **Better Questions**: Add more nuanced personality questions
2. **Pokémon Tags**: Improve personality tags for better matching
3. **Prompt Engineering**: Refine the AI prompt for better results
4. **UI/UX**: Enhance the quiz interface and results display

## 📝 License

This feature is part of the Pokedex AI v2 project.
