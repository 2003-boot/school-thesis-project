import Quiz from '../models/Quiz.js';

// @desc    Get all quizzes for a document
// @route   GET /api/quizzes/:documentId
// @access  Private
export const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      userId: req.user._id,
      documentId: req.params.documentId
    })
      .populate('documentId', 'title fileName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single quiz by ID
// @route   GET /api/quizzes/quiz/:id
// @access  Private
export const getQuizById = async (req, res, next) => {
 try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuiz = async (req, res, next) => {
  try {
    const { answers, questionTimings } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide answers array',
        statusCode: 400
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        statusCode: 404
      });
    }

    // Permettre la re-soumission (mode examen rejoué)
    quiz.userAnswers = [];
    quiz.score = 0;
    quiz.completedAt = null;

    let correctCount = 0;
    const userAnswers = [];

    answers.forEach((answer) => {
      const { questionIndex, selectedAnswer } = answer;

      if (
        typeof questionIndex === 'number' &&
        questionIndex >= 0 &&
        questionIndex < quiz.questions.length
      ) {
        const question = quiz.questions[questionIndex];

        let correctAnswerText = question.correctAnswer;

        if (
          typeof question.correctAnswer === 'string' &&
          /^O\d+$/.test(question.correctAnswer)
        ) {
          const correctIndex = parseInt(question.correctAnswer.substring(1), 10) - 1;
          correctAnswerText = question.options[correctIndex] || '';
        }

        const normalizedSelectedAnswer = (selectedAnswer || '').trim();
        const normalizedCorrectAnswer  = (correctAnswerText || '').trim();
        const isCorrect = normalizedSelectedAnswer === normalizedCorrectAnswer;

        if (isCorrect) correctCount++;

        userAnswers.push({
          questionIndex,
          selectedAnswer,
          isCorrect,
          answeredAt: new Date()
        });
      }
    });

    const score = quiz.totalQuestions > 0
      ? Math.round((correctCount / quiz.totalQuestions) * 100)
      : 0;

    quiz.userAnswers  = userAnswers;
    quiz.score        = score;
    quiz.completedAt  = new Date();

    if (Array.isArray(questionTimings) && questionTimings.length > 0) {
      quiz.questionTimings = questionTimings;
    }

    await quiz.save();

    const totalTime = (questionTimings || []).reduce((sum, t) => sum + (t.timeSpent || 0), 0);
    const avgTime   = questionTimings?.length > 0
      ? Math.round(totalTime / questionTimings.length)
      : null;

    res.status(200).json({
      success: true,
      data: {
        quizId: quiz._id,
        score,
        correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage: score,
        userAnswers,
        avgTimePerQuestion: avgTime,
      },
      message: 'Quiz submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Get quiz results
// @route   GET /api/quizzes/:id/results
// @access  Private
export const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('documentId', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        statusCode: 404
      });
    }

    if (!quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: 'Quiz not completed yet',
        statusCode: 400
      });
    }

    // Build detailed results
    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);
      
      return {
        questionIndex: index,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: userAnswer?.selectedAnswer || null,
        isCorrect: userAnswer?.isCorrect || false,
        explanation: question.explanation
      };
    });

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          document: quiz.documentId,
          score: quiz.score,
          totalQuestions: quiz.totalQuestions,
          completedAt: quiz.completedAt,
          timeLimitPerQuestion: quiz.timeLimitPerQuestion,
          questionTimings: quiz.questionTimings,
          avgTimePerQuestion: quiz.questionTimings?.length > 0
            ? Math.round(
                quiz.questionTimings.reduce((s, t) => s + t.timeSpent, 0) / quiz.questionTimings.length
              )
            : null,
        },
        results: detailedResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found',
        statusCode: 404
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};