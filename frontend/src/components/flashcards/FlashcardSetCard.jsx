import React from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Sparkles, TrendingUp } from "lucide-react";
import moment from "moment";
import "moment/dist/locale/fr";

moment.locale("fr");

const FlashcardSetCard = ({ flashcardSet }) => {

  const navigate = useNavigate();

  const handleStudyNow = () => {
    navigate(`/documents/${flashcardSet.documentId._id}/flashcards`);
  };

  const reviewedCount = flashcardSet.cards.filter(card => card.lastReviewed).length;
  const totalCards = flashcardSet.cards.length;
  const progressPercentage = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;


  return  <div
      className="group relative bg-white/80 backdrop-blur-xl border-2 border-blue-200 hover:border-blue-300 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
      onClick={handleStudyNow}
    >
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2 mb-1" title={flashcardSet?.documentId?.title}>
              {flashcardSet?.documentId?.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              créé {moment(flashcardSet.createdAt).locale('fr').fromNow()}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-sm font-semibold text-slate-700">
              {totalCards} {totalCards === 1 ? 'Card' : 'Cards'}
            </span>
          </div>
          {reviewedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-blue-700">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalCards > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                progression
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {reviewedCount}/{totalCards} revu
              </span>
            </div>
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Study Button */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleStudyNow();
          }}
          className="cursor-pointer group/btn relative w-full h-11 bg-linear-to-r from-blue-50 to-blue-100 hover:from-blue-600 hover:to-blue-600 text-blue-700 hover:text-white font-semibold text-sm rounded-xl transition-all duration-200 active:scale-95 overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            étudier maintenant
          </span>
          <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
        </button>
      </div>
    </div>
};

export default FlashcardSetCard;
