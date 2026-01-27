# 🧠 Guide d'Installation de l'IA Locale (Ollama)

Ce guide explique comment installer et configurer **Ollama** pour utiliser des modèles d'IA localement et **gratuitement** dans le Pokédex AI.

## 🎯 Pourquoi Ollama ?

- **100% GRATUIT** - Aucun coût d'API, aucune limite d'utilisation
- **Privé** - Vos données restent sur votre machine
- **Rapide** - Pas de latence réseau, exécution locale
- **Hors ligne** - Fonctionne sans connexion internet (après installation)
- **Modèles puissants** - Mistral, Llama 3, et plus

## 📥 Installation

### Windows

1. **Télécharger Ollama**
   - Visite: https://ollama.ai/download
   - Clique sur "Download for Windows"
   - Lance l'installateur `.exe`

2. **Vérifier l'installation**
   - Ouvre PowerShell ou Terminal
   - Exécute:
   ```powershell
   ollama --version
   ```
   - Résultat attendu: `ollama version X.X.X`

### macOS

**Option 1: Installateur**
1. Visite: https://ollama.ai/download
2. Télécharge le `.dmg` pour Mac
3. Ouvre le fichier et déplace Ollama vers Applications

**Option 2: Homebrew**
```bash
brew install ollama
```

**Vérification:**
```bash
ollama --version
```

### Linux

```bash
# Installation automatique
curl -fsSL https://ollama.ai/install.sh | sh

# Vérification
ollama --version
```

## 🤖 Télécharger un Modèle

Une fois Ollama installé, télécharge un modèle d'IA:

### Recommandé: Mistral (7B)
- **Taille**: ~4.1 GB
- **Mémoire requise**: 8 GB RAM
- **Performances**: Rapide, excellent français
- **Idéal pour**: Quiz personnalité, suggestions Pokémon

```bash
ollama pull mistral
```

### Alternative: Llama 3 (8B)
- **Taille**: ~4.7 GB
- **Mémoire requise**: 8 GB RAM
- **Performances**: Meilleur raisonnement
- **Idéal pour**: Analyses complexes

```bash
ollama pull llama3
```

### Modèles plus petits (si RAM limitée)

```bash
# Mistral Nemo (3B) - Plus léger
ollama pull mistral-nemo

# Gemma 2B - Très léger
ollama pull gemma:2b
```

### Lister les modèles installés

```bash
ollama list
```

Résultat attendu:
```
NAME                ID              SIZE      MODIFIED
mistral:latest      abc123def456    4.1 GB    2 minutes ago
```

## ✅ Vérifier qu'Ollama Fonctionne

### 1. Vérifier le service

```bash
# Tester l'API
curl http://localhost:11434/api/tags

# Résultat attendu: JSON avec liste des modèles
```

Exemple de réponse:
```json
{
  "models": [
    {
      "name": "mistral:latest",
      "modified_at": "2024-01-27T10:30:00Z",
      "size": 4109865216
    }
  ]
}
```

### 2. Test interactif

```bash
ollama run mistral
```

Tu peux alors discuter avec le modèle directement dans le terminal:
```
>>> Bonjour, qui es-tu ?
Je suis Mistral, un modèle d'intelligence artificielle...

>>> /bye  (pour quitter)
```

### 3. Test via le Pokédex AI

1. Configure `.env.local`:
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral
```

2. Redémarre le serveur:
```bash
npm run dev
```

3. Visite: http://localhost:3000/api/ai/health

Résultat attendu:
```json
{
  "success": true,
  "provider": "ollama",
  "status": {
    "provider": "ollama",
    "status": "online",
    "message_fr": "Ollama est lancé et prêt",
    "model": "mistral",
    "response_time_ms": 45
  }
}
```

4. Vérifie l'indicateur dans la navbar:
   - Barre de navigation en haut
   - Cherche "IA: En ligne" (pastille verte)

## 🔧 Configuration Avancée

### Changer le modèle

Dans `.env.local`:
```env
# Utiliser Llama 3 au lieu de Mistral
OLLAMA_MODEL=llama3

# Ou un modèle spécifique avec tag
OLLAMA_MODEL=mistral:7b-instruct-v0.2
```

### Utiliser un serveur distant

Si Ollama tourne sur une autre machine:
```env
OLLAMA_BASE_URL=http://192.168.1.100:11434
```

### Mémoire GPU (optionnel)

Pour accélérer avec GPU NVIDIA:
```bash
# Ollama détecte automatiquement le GPU
# Aucune config supplémentaire requise

# Vérifier l'utilisation GPU
nvidia-smi  # Si GPU utilisé, tu verras ollama dans la liste
```

## 🐛 Dépannage

### Problème: "Ollama n'est pas lancé"

**Solution 1: Démarrer Ollama manuellement**
```bash
# Windows
ollama serve

# Mac/Linux
ollama serve
```

**Solution 2: Vérifier le service**
- **Windows**: Cherche "Ollama" dans les applications en cours
- **Mac**: Cherche l'icône Ollama dans la barre de menu
- **Linux**: 
  ```bash
  systemctl status ollama
  sudo systemctl start ollama
  ```

### Problème: "Model not found"

```bash
# Télécharger le modèle
ollama pull mistral

# Vérifier qu'il est installé
ollama list
```

### Problème: Connexion refusée (port 11434)

```bash
# Vérifier qu'Ollama écoute sur le bon port
netstat -an | grep 11434  # Linux/Mac
netstat -an | findstr 11434  # Windows

# Redémarrer Ollama
ollama serve
```

### Problème: Trop lent / RAM insuffisante

**Solutions:**
1. Utilise un modèle plus petit:
   ```bash
   ollama pull gemma:2b
   ```
   Dans `.env.local`:
   ```env
   OLLAMA_MODEL=gemma:2b
   ```

2. Ferme les applications inutiles

3. Vérifie la mémoire disponible:
   ```bash
   # Linux/Mac
   free -h
   
   # Windows (PowerShell)
   Get-WmiObject Win32_OperatingSystem | Select-Object FreePhysicalMemory
   ```

### Problème: Réponses en anglais au lieu du français

Le prompt est déjà en français dans le code. Si tu veux forcer:

Dans `app/api/quiz/analyze/route.ts`, le system prompt commence par:
```typescript
const systemPrompt = `Tu es un analyste de personnalité Pokémon expert...`
```

Assure-toi que le modèle est bien Mistral (meilleur support français):
```env
OLLAMA_MODEL=mistral
```

## 📊 Comparaison Ollama vs Mistral API

| Critère | Ollama (Local) | Mistral API (Cloud) |
|---------|----------------|---------------------|
| **Coût** | 0€ (gratuit) | ~0.15€/100 quiz |
| **Vitesse** | 2-5s (local) | 1-3s (réseau) |
| **Limite** | Illimité | 5 quiz/min |
| **Connexion** | Fonctionne hors ligne | Internet requis |
| **Setup** | Installer Ollama | Juste API key |
| **RAM** | 8GB recommandé | Aucune |
| **Confidentialité** | 100% privé | Données sur serveur |

## 🎯 Commandes Utiles

```bash
# Lister les modèles installés
ollama list

# Télécharger un modèle
ollama pull <model-name>

# Supprimer un modèle (libérer espace)
ollama rm mistral

# Voir les infos d'un modèle
ollama show mistral

# Test interactif
ollama run mistral

# Arrêter Ollama
# Windows: Fermer l'app
# Linux: sudo systemctl stop ollama
```

## 📚 Ressources

- **Site officiel**: https://ollama.ai
- **Documentation**: https://github.com/ollama/ollama/blob/main/docs/README.md
- **Modèles disponibles**: https://ollama.ai/library
- **Discord Ollama**: https://discord.gg/ollama

## ✅ Checklist Finale

- [ ] Ollama installé (`ollama --version` fonctionne)
- [ ] Modèle téléchargé (`ollama list` montre mistral)
- [ ] Service actif (`curl http://localhost:11434/api/tags` retourne JSON)
- [ ] `.env.local` configuré avec `LLM_PROVIDER=ollama`
- [ ] Serveur dev redémarré (`npm run dev`)
- [ ] Health check OK (http://localhost:3000/api/ai/health)
- [ ] Indicateur vert dans la navbar
- [ ] Quiz fonctionne (teste avec un quiz personnalité)

Félicitations ! 🎉 Ton Pokédex utilise maintenant l'IA locale gratuite !
