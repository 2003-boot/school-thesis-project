import React from 'react'
import { Link } from 'react-router-dom'
import { Play, BarChart2, Trash2, Award, Timer } from 'lucide-react'
import moment from 'moment'

const QuizCard = ({ quiz, onDelete, onExam }) => {
  return (
    <div className="group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between">
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(quiz); }}
        className="cursor-pointer absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" strokeWidth={2} />
      </button>

      <div className="space-y-4">
        {/* Score badge */}
        <div className="inline-flex items-center gap-1.5 py-1 rounded-lg text-xs font-semibold">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
            <Award className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
            <span className="text-blue-700">Score: {quiz?.score}</span>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-900 mb-1 line-clamp-2" title={quiz.title}>
            {quiz.title || `Quiz - ${moment(quiz.createdAt).format("D MMM, YYYY")}`}
          </h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            créé le {moment(quiz.createdAt).format("D MMM, YYYY")}
          </p>
        </div>

        {/* Nombre de questions */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-sm font-semibold text-slate-700">
              {quiz.questions.length} {quiz.questions.length === 1 ? "Question" : "Questions"}
            </span>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="mt-2 pt-4 border-t border-slate-100 space-y-2">
        {quiz?.userAnswers?.length > 0 ? (
          <Link to={`/quizzes/${quiz._id}/results`}>
            <button className="group/btn w-full inline-flex items-center justify-center gap-2 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer">
              <BarChart2 className="w-4 h-4" strokeWidth={2.5} />
              Voir les résultats
            </button>
          </Link>
        ) : (
          <Link to={`/quizzes/${quiz._id}`}>
            <button className="cursor-pointer group/btn relative w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 active:scale-95 overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Play className="w-4 h-4" strokeWidth={2.5} />
                Démarrer le quiz
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
            </button>
          </Link>
        )}

        {/* Bouton Mode Examen — toujours visible, proprement en dessous */}
        {onExam && (
          <button
            onClick={(e) => { e.stopPropagation(); onExam(); }}
            className="w-full h-9 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-orange-200 active:scale-95"
          >
            <Timer className="w-3.5 h-3.5" />
            Mode Examen
          </button>
        )}
      </div>
    </div>
  )
}

export default QuizCard