import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Target, BookOpen } from 'lucide-react';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);
      } catch (error) {
        toast.error('Impossible de récupérer les résultats du quiz.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId]);

  const quiz = results?.data?.quiz;
  const detailedResults = results?.data?.results ?? [];

  const documentLink = quiz?.document?._id ? `/documents/${quiz.document._id}` : '/documents';

  const score = useMemo(() => {
    if (typeof quiz?.score === 'number') return quiz.score;
    if (!detailedResults.length) return 0;

    const correctCount = detailedResults.filter((r) => r.isCorrect).length;
    return Math.round((correctCount / detailedResults.length) * 100);
  }, [quiz, detailedResults]);

  const totalQuestions = detailedResults.length;
  const correctAnswers = detailedResults.filter((r) => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  const getScoreColor = (value) => {
    if (value >= 80) return 'from-emerald-500 to-teal-500';
    if (value >= 60) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const getScoreMessage = (value) => {
    if (value >= 90) return 'Exceptionnel !';
    if (value >= 80) return 'Excellent travail !';
    if (value >= 70) return 'Bon travail !';
    if (value >= 60) return 'Pas mal !';
    return "Continue à t'entraîner !";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!results || !results.data || !quiz) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Résultats du quiz introuvables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          to={documentLink}
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-blue-600"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
            strokeWidth={2}
          />
          Retour au document
        </Link>
      </div>

      <PageHeader title={`Résultats du ${quiz.title || 'quiz'}`} />

      <div className="mb-8 rounded-2xl border-2 border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        <div className="space-y-6 text-center">
          <div className="inline-flex h-15 w-15 items-center justify-center rounded-2xl bg-linear-to-br from-blue-100 to-blue-200 shadow-lg shadow-blue-500/25">
            <Trophy className="h-7 w-7 text-blue-600" strokeWidth={2} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
              Ton score
            </p>
            <div
              className={`mb-2 inline-block bg-linear-to-r ${getScoreColor(score)} bg-clip-text text-5xl font-bold text-transparent`}
            >
              {score}%
            </div>
            <p className="text-lg font-medium text-slate-700">{getScoreMessage(score)}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
              <Target className="h-4 w-4 text-slate-600" strokeWidth={2} />
              <span className="text-sm font-semibold text-slate-700">
                {totalQuestions} questions
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" strokeWidth={2} />
              <span className="text-sm font-semibold text-blue-700">
                {correctAnswers} correcte{correctAnswers > 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2">
              <XCircle className="h-4 w-4 text-rose-600" strokeWidth={2} />
              <span className="text-sm font-semibold text-rose-700">
                {incorrectAnswers} incorrecte{incorrectAnswers > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mb-2 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-slate-600" strokeWidth={2} />
          <h3 className="text-lg font-semibold text-slate-900">Revue détaillée</h3>
        </div>

        {detailedResults.map((result, index) => {
          const userAnswerIndex = result.options.findIndex((opt) => opt === result.selectedAnswer);

          const correctAnswerIndex =
            typeof result.correctAnswer === 'string' && result.correctAnswer.startsWith('O')
              ? parseInt(result.correctAnswer.substring(1), 10) - 1
              : result.options.findIndex((opt) => opt === result.correctAnswer);

          const isCorrect = result.isCorrect;
          console.log({
            question: result.question,
            selectedAnswer: result.selectedAnswer,
            correctAnswer: result.correctAnswer,
            isCorrect: result.isCorrect,
            options: result.options
          });

          return (
            <div
              key={index}
              className="rounded-2xl border-2 border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1">
                    <span className="text-xs font-semibold text-slate-600">
                      Question {index + 1}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold leading-relaxed text-slate-900">
                    {result.question}
                  </h4>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    isCorrect
                      ? 'border-2 border-emerald-200 bg-emerald-50'
                      : 'border-2 border-rose-200 bg-rose-50'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600" strokeWidth={2.5} />
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-3">
                {result.options.map((option, optIndex) => {
                  const isCorrectOption = optIndex === correctAnswerIndex;
                  const isUserAnswer = optIndex === userAnswerIndex;
                  const isWrongAnswer = isUserAnswer && !isCorrect;

                  return (
                    <div
                      key={optIndex}
                      className={`relative rounded-lg border-2 px-4 py-3 transition-all duration-200 ${
                        isCorrectOption
                          ? 'border-emerald-300 bg-emerald-50 shadow-lg shadow-emerald-500/10'
                          : isWrongAnswer
                          ? 'border-rose-300 bg-rose-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-sm font-medium ${
                            isCorrectOption
                              ? 'text-emerald-900'
                              : isWrongAnswer
                              ? 'text-rose-900'
                              : 'text-slate-700'
                          }`}
                        >
                          {option}
                        </span>

                        <div className="flex items-center gap-2">
                          {isCorrectOption && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                              Bonne réponse
                            </span>
                          )}

                          {isWrongAnswer && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
                              <XCircle className="h-3 w-3" strokeWidth={2.5} />
                              Ta réponse
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {result.explanation && (
                <div className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-slate-100/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                      <BookOpen className="h-4 w-4 text-slate-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Explication
                      </p>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to={documentLink}
          className="group relative flex h-12 items-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-blue-500 to-blue-600 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 active:scale-95"
        >
          <ArrowLeft
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
            strokeWidth={2.5}
          />
          Retour au document
          <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full" />
        </Link>
      </div>
    </div>
  );
};

export default QuizResultPage;