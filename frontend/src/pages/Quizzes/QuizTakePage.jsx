import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, Timer, AlertTriangle } from 'lucide-react';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

const QuizTakePage = () => {
  const { quizId }   = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  // Mode examen passé via navigate state
  const examMode  = location.state?.examMode  ?? false;
  const timeLimit = location.state?.timeLimit ?? null;  // secondes par question

  const [quiz, setQuiz]                           = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers]     = useState({});
  const [submitting, setSubmitting]               = useState(false);

  // Timer
  const [timeLeft, setTimeLeft]                   = useState(timeLimit);
  const [questionTimings, setQuestionTimings]     = useState([]);  // [{questionIndex, timeSpent}]
  const questionStartRef                          = useRef(Date.now());
  const timerRef                                  = useRef(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        setQuiz(response.data);
      } catch (error) {
        toast.error('Impossible de charger le quiz.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // ── Timer ─────────────────────────────────────────────────────────────
  const recordTiming = useCallback(() => {
    const spent = Math.round((Date.now() - questionStartRef.current) / 1000);
    setQuestionTimings(prev => {
      const existing = prev.findIndex(t => t.questionIndex === currentQuestionIndex);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing].timeSpent = spent;
        return updated;
      }
      return [...prev, { questionIndex: currentQuestionIndex, timeSpent: spent }];
    });
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!examMode || !timeLimit) return;
    setTimeLeft(timeLimit);
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestionIndex, examMode, timeLimit]);

  // Soumettre auto quand timer = 0
  useEffect(() => {
    if (examMode && timeLimit && timeLeft === 0 && quiz) {
      handleSubmitQuiz(true);
    }
  }, [timeLeft]);

  const goToQuestion = (index) => {
    if (!quiz) return;
    recordTiming();
    clearInterval(timerRef.current);
    questionStartRef.current = Date.now();
    setCurrentQuestionIndex(index);
  };

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = async (autoSubmit = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    recordTiming();

    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => {
        const question    = quiz.questions.find(q => q._id === questionId);
        const questionIdx = quiz.questions.findIndex(q => q._id === questionId);
        const optionIndex = selectedAnswers[questionId];
        return { questionIndex: questionIdx, selectedAnswer: question.options[optionIndex] };
      });

      await quizService.submitQuiz(quizId, formattedAnswers, questionTimings);
      if (autoSubmit) toast('⏰ Temps écoulé ! Quiz soumis automatiquement.', { icon: '⏰' });
      else toast.success('Quiz soumis avec succès !');
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la soumission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;
  if (!quiz || quiz.questions.length === 0) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-slate-600">Quiz introuvable.</p></div>;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount   = Object.keys(selectedAnswers).length;
  const isUrgent        = examMode && timeLimit && timeLeft !== null && timeLeft <= 10;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header avec timer */}
      <div className="flex items-center justify-between mb-2">
        <PageHeader title={quiz.title || 'Quiz'} />
        {examMode && timeLimit && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono text-lg font-bold transition-all ${
            isUrgent
              ? 'border-red-300 bg-red-50 text-red-600 animate-pulse'
              : 'border-orange-200 bg-orange-50 text-orange-700'
          }`}>
            {isUrgent
              ? <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
              : <Timer className="w-5 h-5" strokeWidth={2} />
            }
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {examMode && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700 font-medium">
          <Timer className="w-3.5 h-3.5" />
          Mode examen activé{timeLimit ? ` — ${timeLimit}s par question` : ' — sans limite de temps'}
        </div>
      )}

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} / {quiz.questions.length}
          </span>
          <span className="text-sm font-medium text-slate-500">{answeredCount} répondu(es)</span>
        </div>
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
              examMode ? 'bg-gradient-to-r from-orange-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
        {/* Timer bar */}
        {examMode && timeLimit && (
          <div className="relative h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
                isUrgent ? 'bg-red-500' : 'bg-orange-400'
              }`}
              style={{ width: `${(timeLeft / timeLimit) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Question */}
      <div className={`bg-white/80 backdrop-blur-xl border-2 rounded-2xl shadow-xl p-6 mb-8 transition-colors ${
        examMode ? 'border-orange-200' : 'border-slate-200'
      }`}>
        <div className={`inline-flex items-center gap-2 px-4 py-2 border rounded-xl mb-6 ${
          examMode
            ? 'bg-orange-50 border-orange-200 text-orange-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${examMode ? 'bg-orange-500' : 'bg-blue-500'}`} />
          <span className="text-sm font-semibold">Question {currentQuestionIndex + 1}</span>
          {currentQuestion.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentQuestion.difficulty === 'easy'   ? 'bg-green-100 text-green-700' :
              currentQuestion.difficulty === 'hard'   ? 'bg-red-100 text-red-700'    :
                                                        'bg-amber-100 text-amber-700'
            }`}>
              {currentQuestion.difficulty}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            return (
              <label
                key={index}
                className={`group relative flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? examMode
                      ? 'border-orange-400 bg-orange-50 shadow-lg shadow-orange-500/10'
                      : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-md'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 transition-all ${
                  isSelected
                    ? examMode ? 'border-orange-400 bg-orange-500' : 'border-blue-500 bg-blue-600'
                    : 'border-slate-300 bg-white group-hover:border-blue-400'
                }`}>
                  {isSelected && <div className="w-full h-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>}
                </div>
                <span className={`ml-4 text-sm font-medium ${isSelected ? examMode ? 'text-orange-900' : 'text-blue-900' : 'text-slate-700'}`}>
                  {option}
                </span>
                {isSelected && <CheckCircle2 className={`ml-auto w-5 h-5 ${examMode ? 'text-orange-500' : 'text-blue-500'}`} strokeWidth={2.5} />}
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0 || submitting} variant="secondary">
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          Précédent
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={() => handleSubmitQuiz(false)}
            disabled={submitting}
            className={`px-8 h-12 text-white font-semibold text-sm rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              examMode
                ? 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 shadow-orange-200'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
            }`}
          >
            {submitting
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Soumission...</>
              : <><CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />Soumettre</>
            }
          </button>
        ) : (
          <Button onClick={handleNextQuestion} disabled={submitting}>
            Suivant
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}
      </div>

      {/* Dots de navigation */}
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        {quiz.questions.map((_, index) => {
          const isAnswered = selectedAnswers.hasOwnProperty(quiz.questions[index]._id);
          const isCurrent  = index === currentQuestionIndex;
          return (
            <button
              key={index}
              onClick={() => goToQuestion(index)}
              disabled={submitting}
              className={`w-8 h-8 rounded-lg font-semibold text-xs transition-all duration-200 ${
                isCurrent
                  ? examMode
                    ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-lg scale-110'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-110'
                  : isAnswered
                  ? examMode ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizTakePage;