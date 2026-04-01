import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const handleGeminiError = (error, fallbackMessage) => {
  console.error('Gemini API error:', error);

  const errorMessage =
    error?.message ||
    error?.error?.message ||
    '';

  if (
    error?.status === 429 ||
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.toLowerCase().includes('quota')
  ) {
    throw new Error("⚠️ Limite IA atteinte. Réessaie dans quelques minutes.");
  }

  throw new Error(fallbackMessage);
};

/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
  if (!text || text.trim().length < 50) {
    throw new Error("Le document est trop court pour générer des flashcards.");
  }

  const prompt = `Tu es un assistant pédagogique francophone.

Génère exactement ${count} flashcards éducatives en français à partir du texte suivant.

Consignes :
- Le contenu des questions et réponses doit être uniquement en français
- Les questions doivent être claires, précises et utiles pour réviser
- Les réponses doivent être concises, correctes et pédagogiques
- La difficulté doit être l'une des valeurs suivantes uniquement : easy, medium, hard
- Respecte strictement le format ci-dessous

Format de chaque flashcard :
Q: [Question en français]
A: [Réponse en français]
D: [easy, medium, ou hard]

Sépare chaque flashcard avec :
---

Texte :
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text || '';

    const flashcards = [];
    const cards = generatedText.split('---').filter((c) => c.trim());

    for (const card of cards) {
      const lines = card.trim().split('\n');
      let question = '';
      let answer = '';
      let difficulty = 'medium';

      for (const line of lines) {
        if (line.startsWith('Q:')) {
          question = line.substring(2).trim();
        } else if (line.startsWith('A:')) {
          answer = line.substring(2).trim();
        } else if (line.startsWith('D:')) {
          const diff = line.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && answer) {
        flashcards.push({ question, answer, difficulty });
      }
    }

    if (!flashcards.length) {
      throw new Error("Aucune flashcard valide n'a pu être générée.");
    }

    return flashcards.slice(0, count);
  } catch (error) {
    handleGeminiError(error, "❌ Erreur lors de la génération des flashcards.");
  }
};

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
  if (!text || text.trim().length < 50) {
    throw new Error("Le document est trop court pour générer un quiz.");
  }

  const prompt = `Tu es un assistant pédagogique francophone.

Génère exactement ${numQuestions} questions de quiz à choix multiples en français à partir du texte suivant.

Consignes :
- La question, les 4 options, la bonne réponse et l'explication doivent être uniquement en français
- Les questions doivent être pertinentes par rapport au texte
- Il doit y avoir exactement 4 options par question
- Une seule option doit être correcte
- L'explication doit être courte et pédagogique
- La difficulté doit être l'une des valeurs suivantes uniquement : easy, medium, hard
- Respecte strictement le format ci-dessous

Format :
Q: [Question en français]
O1: [Option 1 en français]
O2: [Option 2 en français]
O3: [Option 3 en français]
O4: [Option 4 en français]
C: [Bonne option - exactement telle qu’écrite ci-dessus]
E: [Brève explication en français]
D: [easy, medium, ou hard]

Sépare chaque question avec :
---

Texte :
${text.substring(0, 15000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text || '';

    const questions = [];
    const questionBlocks = generatedText.split('---').filter((q) => q.trim());

    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');
      let question = '';
      let options = [];
      let correctAnswer = '';
      let explanation = '';
      let difficulty = 'medium';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('Q:')) {
          question = trimmed.substring(2).trim();
        } else if (trimmed.match(/^O\d:/)) {
          options.push(trimmed.substring(3).trim());
        } else if (trimmed.startsWith('C:')) {
          correctAnswer = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('E:')) {
          explanation = trimmed.substring(2).trim();
        } else if (trimmed.startsWith('D:')) {
          const diff = trimmed.substring(2).trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diff)) {
            difficulty = diff;
          }
        }
      }

      if (question && options.length === 4 && correctAnswer) {
        questions.push({
          question,
          options,
          correctAnswer,
          explanation,
          difficulty
        });
      }
    }

    if (!questions.length) {
      throw new Error("Aucune question valide n'a pu être générée.");
    }

    return questions.slice(0, numQuestions);
  } catch (error) {
    handleGeminiError(error, "❌ Erreur lors de la génération du quiz.");
  }
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
  if (!text || text.trim().length < 50) {
    throw new Error("Le document est trop court pour générer un résumé.");
  }

  const prompt = `Tu es un assistant pédagogique francophone.

Fais un résumé clair, structuré et concis du texte suivant en français.
Mets en avant :
- les concepts clés
- les idées principales
- les points importants à retenir

Consignes :
- Réponds uniquement en français
- Utilise un ton pédagogique et simple à comprendre
- Si le document est technique, vulgarise sans déformer le sens
- Organise la réponse en petits paragraphes ou en points si nécessaire

Texte :
${text.substring(0, 20000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text || '';

    if (!generatedText.trim()) {
      throw new Error("Le résumé généré est vide.");
    }

    return generatedText;
  } catch (error) {
    handleGeminiError(error, "❌ Erreur lors de la génération du résumé.");
  }
};

/**
 * Chat with document context
 * @param {Object} params
 * @param {string} params.question - User question
 * @param {Array<Object>} params.chunks - Relevant document chunks
 * @param {boolean} params.hasRelevantContext - Whether context was found
 * @param {string} params.documentTitle - Title of the document
 * @param {Array<{role: string, content: string}>} params.chatHistory - Recent chat history
 * @returns {Promise<string>}
 */
export const chatWithContext = async ({
  question,
  chunks = [],
  hasRelevantContext = false,
  documentTitle = '',
  chatHistory = []
}) => {
  if (!question || !question.trim()) {
    throw new Error("La question ne peut pas être vide.");
  }

  const context = chunks.length
    ? chunks.map((c, i) => `[Chunk ${i + 1}]\n${c.content}`).join('\n\n')
    : 'No relevant course context found.';

  const conversation = chatHistory.length
    ? chatHistory
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n')
    : 'No previous conversation.';

  const prompt = `
You are an educational AI assistant integrated into a learning application.

The user is currently studying a course document titled:
"${documentTitle}"

Your mission:
1. Prioritize the document context when it helps answer the user's question.
2. If the context is incomplete or missing, you may still answer using your general knowledge.
3. If the question is clearly outside the course/document context, you should still answer helpfully.
4. However, when the question is outside the course or only weakly related to it, you must end your answer with a gentle refocusing sentence in French.

Important rules:
- Do NOT say bluntly that the context does not contain the answer.
- If the context partially helps, combine it with your general knowledge.
- If the question is about the course, do not add the refocusing sentence.
- Answer in the same language as the user's question.
- Keep the tone natural, warm, helpful, and educational.
- Be concise, unless the question requires a fuller explanation.

Recent conversation:
${conversation}

Document context available: ${hasRelevantContext ? 'YES' : 'NO'}

Context:
${context}

User question:
${question}

Answer:
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text || '';

    if (!generatedText.trim()) {
      throw new Error("La réponse générée est vide.");
    }

    return generatedText;
  } catch (error) {
    handleGeminiError(error, "❌ Erreur lors du traitement de la requête IA.");
  }
};

/**
 * Explain a specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
  if (!concept || !concept.trim()) {
    throw new Error("Le concept à expliquer ne peut pas être vide.");
  }

  const prompt = `Tu es un assistant pédagogique francophone.

Explique en français le concept suivant : "${concept}"

Base-toi d'abord sur le contexte fourni ci-dessous.
Si le contexte est insuffisant, tu peux compléter avec des connaissances générales utiles, tout en restant cohérent avec le sujet.

Consignes :
- Réponds uniquement en français
- Donne une explication claire, pédagogique et facile à comprendre
- Utilise des exemples simples si c'est pertinent
- Va à l'essentiel, tout en restant utile
- Si le concept est ambigu, donne l'interprétation la plus probable selon le contexte

Contexte :
${(context || '').substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const generatedText = response.text || '';

    if (!generatedText.trim()) {
      throw new Error("L'explication générée est vide.");
    }

    return generatedText;
  } catch (error) {
    handleGeminiError(error, "❌ Erreur lors de l’explication du concept.");
  }
};


/**
 * Socratic chat — IA qui guide par des questions
 * @param {Object} params
 * @param {string} params.userMessage - Message de l'utilisateur
 * @param {Array} params.chunks - Chunks pertinents du document
 * @param {string} params.documentTitle - Titre du document
 * @param {Array} params.chatHistory - Historique récent
 * @param {string} params.socratePhase - 'explore' | 'deepen' | 'conclude'
 * @returns {Promise<string>}
 */
export const socraticChat = async ({
  userMessage,
  chunks = [],
  documentTitle = '',
  chatHistory = [],
  socratePhase = 'explore'
}) => {
  if (!userMessage?.trim()) {
    throw new Error("Le message ne peut pas être vide.");
  }

  const context = chunks.length
    ? chunks.map((c, i) => `[Extrait ${i + 1}]\n${c.content}`).join('\n\n')
    : 'Pas de contexte spécifique trouvé.';

  const conversation = chatHistory.length
    ? chatHistory.map(m => `${m.role === 'user' ? 'Étudiant' : 'Socrate'}: ${m.content}`).join('\n')
    : 'Début de la conversation.';

  const phaseInstructions = {
    explore: `
- C'est le début : explore ce que l'étudiant sait déjà.
- Pose UNE seule question ouverte pour comprendre son niveau de départ.
- Commence souvent par "Qu'est-ce que tu comprends par..." ou "Comment tu expliquerais...".`,
    deepen: `
- L'étudiant a commencé à répondre : creuse plus loin.
- Rebondis sur CE QU'IL VIENT DE DIRE avec une question qui l'amène à préciser, corriger, ou approfondir.
- Utilise des formulations comme "Intéressant, mais que se passe-t-il si...", "Pourquoi penses-tu que...", "Qu'est-ce qui te fait dire ça ?".`,
    conclude: `
- L'étudiant a montré une bonne compréhension.
- Pose une question de synthèse ou d'application pratique.
- Formulations : "Alors comment tu appliquerais ça à...", "Si tu devais expliquer ça à quelqu'un, tu dirais quoi ?".`
  };

  const prompt = `Tu es Socrate, un mentor pédagogique bienveillant. Tu n'expliques JAMAIS directement.
Tu guides l'étudiant à découvrir lui-même les réponses en posant des questions ciblées.

RÈGLES ABSOLUES :
- Tu poses MAXIMUM une question par réponse (jamais deux questions dans le même message)
- Tu ne donnes JAMAIS la réponse directement, même si l'étudiant la demande
- Si l'étudiant est bloqué, donne un petit indice PUIS pose une question
- Si l'étudiant donne une mauvaise réponse, ne la valide pas — questionne-la doucement
- Si l'étudiant donne une bonne réponse, félicite brièvement puis approfondis
- Reste toujours lié au document "${documentTitle}"
- Réponds dans la même langue que l'étudiant

Phase actuelle :${phaseInstructions[socratePhase]}

Contexte du document :
${context}

Historique de la conversation :
${conversation}

Message de l'étudiant :
${userMessage}

Ta réponse (1 seule question, maximum 3 lignes) :`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text || '';
    if (!text.trim()) throw new Error("Réponse vide de Gemini.");
    return text;
  } catch (error) {
    handleGeminiError(error, "❌ Erreur en mode Socrate.");
  }
};

/**
 * Génère une mind map structurée depuis un document
 * @param {string} text - Texte extrait du document
 * @param {string} documentTitle - Titre du document
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export const generateMindMap = async (text, documentTitle = 'Document') => {
  if (!text || text.trim().length < 50) {
    throw new Error("Le document est trop court pour générer une mind map.");
  }

  const prompt = `Tu es un assistant pédagogique expert en synthèse visuelle.

Analyse le texte suivant et génère une mind map structurée en JSON.

RÈGLES STRICTES :
- Le nœud central (id: "root") représente le thème principal du document
- Maximum 5 branches principales (enfants directs du root)
- Chaque branche peut avoir 2 à 4 sous-nœuds maximum
- Les labels doivent être COURTS : maximum 4 mots par nœud
- Réponds UNIQUEMENT avec le JSON valide, sans aucun texte avant ou après, sans backticks

FORMAT JSON ATTENDU :
{
  "nodes": [
    { "id": "root", "label": "Thème central", "level": 0 },
    { "id": "n1", "label": "Branche 1", "level": 1 },
    { "id": "n1-1", "label": "Sous-concept", "level": 2 },
    { "id": "n1-2", "label": "Autre détail", "level": 2 }
  ],
  "edges": [
    { "source": "root", "target": "n1" },
    { "source": "n1", "target": "n1-1" },
    { "source": "n1", "target": "n1-2" }
  ]
}

Titre du document : "${documentTitle}"

Texte :
${text.substring(0, 18000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const raw = (response.text || '').trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(raw);

    if (!parsed.nodes || !parsed.edges || !Array.isArray(parsed.nodes)) {
      throw new Error("Structure JSON invalide retournée par Gemini.");
    }

    // Sanity check : s'assurer que root existe
    const hasRoot = parsed.nodes.some(n => n.id === 'root');
    if (!hasRoot) throw new Error("Nœud root manquant dans la mind map.");

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("❌ Gemini a retourné un JSON invalide pour la mind map.");
    }
    handleGeminiError(error, "❌ Erreur lors de la génération de la mind map.");
  }
};

/**
 * Analyse les lacunes d'un étudiant à partir de ses erreurs de quiz
 * @param {Array} wrongQuestions - Questions ratées [{question, correctAnswer, explanation, difficulty}]
 * @param {string} documentTitle - Titre du document
 * @returns {Promise<{weaknesses: Array, recommendations: Array, globalAdvice: string}>}
 */
export const analyzeWeaknesses = async (wrongQuestions, documentTitle = '') => {
  if (!wrongQuestions || wrongQuestions.length === 0) {
    throw new Error("Aucune question incorrecte à analyser.");
  }

  const questionsText = wrongQuestions.map((q, i) =>
    `Question ${i + 1}: ${q.question}\nBonne réponse: ${q.correctAnswer}\nExplication: ${q.explanation || 'N/A'}\nDifficulté: ${q.difficulty || 'medium'}`
  ).join('\n\n');

  const prompt = `Tu es un assistant pédagogique expert en analyse des difficultés d'apprentissage.

Un étudiant a raté les questions suivantes dans un quiz sur le document "${documentTitle}".

Analyse ses lacunes et génère une réponse JSON structurée.

RÈGLES :
- Identifie les thèmes/concepts où l'étudiant est faible
- Donne des recommandations concrètes et actionnables
- Sois bienveillant et encourageant
- Réponds UNIQUEMENT en JSON valide, sans backticks ni texte autour

FORMAT JSON ATTENDU :
{
  "weaknesses": [
    { "theme": "Nom du concept faible", "description": "Pourquoi c'est difficile", "severity": "high|medium|low" }
  ],
  "recommendations": [
    { "action": "Que faire concrètement", "priority": "high|medium|low" }
  ],
  "globalAdvice": "Conseil général motivant en 2-3 phrases"
}

Questions ratées :
${questionsText}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const raw = (response.text || '').trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(raw);
    if (!parsed.weaknesses || !parsed.recommendations) {
      throw new Error("Structure JSON invalide.");
    }
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("❌ Gemini a retourné un JSON invalide pour l'analyse.");
    }
    handleGeminiError(error, "❌ Erreur lors de l'analyse des lacunes.");
  }
};