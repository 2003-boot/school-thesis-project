import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

if (!process.env.GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is not set in the environment variables.');
  process.exit(1);
}


/**
 * Generate flashcards from text
 * @param {string} text - Document text
 * @param {number} count - Number of flashcards to generate
 * @returns {Promise<Array<{question: string, answer: string, difficulty: string}>>}
 */
export const generateFlashcards = async (text, count = 10) => {
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
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    
    // Parse the response
    const flashcards = [];
    const cards = generatedText.split('---').filter(c => c.trim());
    
    for (const card of cards) {
      const lines = card.trim().split('\n');
      let question = '', answer = '', difficulty = 'medium';
      
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
    
    return flashcards.slice(0, count);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate flashcards');
  }
};

/**
 * Generate quiz questions
 * @param {string} text - Document text
 * @param {number} numQuestions - Number of questions
 * @returns {Promise<Array<{question: string, options: Array, correctAnswer: string, explanation: string, difficulty: string}>>}
 */
export const generateQuiz = async (text, numQuestions = 5) => {
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
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    
    const questions = [];
    const questionBlocks = generatedText.split('---').filter(q => q.trim());
    
    for (const block of questionBlocks) {
      const lines = block.trim().split('\n');
      let question = '', options = [], correctAnswer = '', explanation = '', difficulty = 'medium';
      
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
        questions.push({ question, options, correctAnswer, explanation, difficulty });
      }
    }
    
    return questions.slice(0, numQuestions);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate quiz');
  }
};

/**
 * Generate document summary
 * @param {string} text - Document text
 * @returns {Promise<string>}
 */
export const generateSummary = async (text) => {
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
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate summary');
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
4. However, when the question is outside the course or only weakly related to it, you must end your answer with a gentle refocusing sentence in French, such as:
"Toutefois, je pense qu'il serait mieux de se concentrer sur le cours, tu ne penses pas ?"

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
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to process chat request');
  }
};

/**
 * Explain a specific concept
 * @param {string} concept - Concept to explain
 * @param {string} context - Relevant context
 * @returns {Promise<string>}
 */
export const explainConcept = async (concept, context) => {
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
${context.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    const generatedText = response.text;
    return generatedText;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to explain concept');
  }
};