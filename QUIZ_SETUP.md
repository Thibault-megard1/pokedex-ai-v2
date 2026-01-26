# 🚀 Quick Setup Guide - AI Pokémon Quiz

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your Mistral API Key

1. Visit [https://console.mistral.ai/](https://console.mistral.ai/)
2. Sign up or log in
3. Go to "API Keys" section
4. Click "Create new key"
5. Copy your API key (starts with `sk-...`)

## Step 3: Configure Environment

Create `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` and add your key:

```
MISTRAL_API_KEY=sk-your-actual-api-key-here
```

## Step 4: Start the Development Server

```bash
npm run dev
```

## Step 5: Test the Quiz

1. Open [http://localhost:3000/quiz](http://localhost:3000/quiz)
2. Click "Commencer le quiz"
3. Answer the 15 personality questions
4. Submit and wait for AI analysis (5-10 seconds)
5. View your Pokémon match!

## ✅ Verification Checklist

- [ ] `.env.local` file created with valid `MISTRAL_API_KEY`
- [ ] Dev server running without errors
- [ ] Quiz page loads at `/quiz`
- [ ] All 15 questions display correctly
- [ ] Submit button is enabled after answering required questions
- [ ] Loading spinner appears during analysis
- [ ] Results show primary Pokémon match with sprite
- [ ] Confidence score and reasons display
- [ ] Personality traits are listed
- [ ] "Refaire le quiz" button works

## 🐛 Troubleshooting

### "AI service not configured" error
- Check that `MISTRAL_API_KEY` is in `.env.local`
- Restart dev server: `npm run dev`

### Quiz page shows blank screen
- Check browser console for errors
- Verify all imports in `page.tsx`

### API returns error
- Verify API key is valid
- Check Mistral account has credits
- Review API logs in terminal

### Slow loading
- Mistral API takes 3-10 seconds (normal)
- Check network connection
- Verify no rate limits hit

## 📖 Full Documentation

See [QUIZ_DOCUMENTATION.md](./QUIZ_DOCUMENTATION.md) for:
- Detailed architecture
- Customization options
- API reference
- Troubleshooting guide
- Cost estimation

## 🎯 Expected Behavior

**Normal Flow:**
1. Intro screen (instant)
2. Questions page (instant)
3. Submit → Loading (5-10 seconds)
4. Results display with:
   - Primary Pokémon (ID, name, sprite, types)
   - Confidence: 60-95%
   - 2-5 reasons
   - 3-8 personality traits
   - 0-2 alternative matches

**Cost per Quiz:**
~$0.002-0.005 USD (very cheap!)

---

**Need Help?** Check the full docs or open an issue on GitHub.
