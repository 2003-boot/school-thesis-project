import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, TrendingUp, Eye, Clock } from "lucide-react";
import moment from "moment";
import "moment/dist/locale/fr";
import flashcardService from "../../services/flashcardService";
import toast from "react-hot-toast";

moment.locale("fr");

const FlashcardSetCard = ({ flashcardSet, onPreview }) => {
  const navigate = useNavigate();
  const [srsLoadingId, setSrsLoadingId] = useState(null);

  const totalCards       = flashcardSet.cards.length;
  const reviewedCount    = flashcardSet.cards.filter(c => c.lastReviewed).length;
  const progressPct      = totalCards > 0 ? Math.round((reviewedCount / totalCards) * 100) : 0;
  const now              = new Date();
  const dueCount         = flashcardSet.cards.filter(c => !c.nextReview || new Date(c.nextReview) <= now).length;

  const handleStartSRS = async (e) => {
    e.stopPropagation();
    setSrsLoadingId(flashcardSet._id);
    try {
      const response = await flashcardService.getDueCards(flashcardSet._id);
      const due = response.data.dueCards;
      if (due.length === 0) {
        toast.success("🎉 Aucune carte à réviser pour aujourd'hui !");
        return;
      }
      // Rediriger vers le document avec onglet Flashcards ouvert en mode SRS
      navigate(`/documents/${flashcardSet.documentId._id}`, {
        state: { openTab: 'Flashcards', startSRS: flashcardSet._id }
      });
    } catch {
      toast.error("Impossible de charger les cartes à réviser.");
    } finally {
      setSrsLoadingId(null);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) onPreview(flashcardSet);
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-xl border-2 border-blue-200 hover:border-blue-300 rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Icon + Titre */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
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
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-sm font-semibold text-slate-700">
              {totalCards} {totalCards === 1 ? 'carte' : 'cartes'}
            </span>
          </div>
          {reviewedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-blue-700">{progressPct}%</span>
            </div>
          )}
          {dueCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="w-3 h-3 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700">{dueCount} à réviser</span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        {totalCards > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">progression</span>
              <span className="text-xs font-semibold text-slate-700">{reviewedCount}/{totalCards} revu</span>
            </div>
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Boutons Aperçu + Réviser */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
        <button
          onClick={handlePreview}
          className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={2} />
          Aperçu
        </button>
        <button
          onClick={handleStartSRS}
          disabled={srsLoadingId === flashcardSet._id}
          className={`flex-1 h-10 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 ${
            dueCount > 0
              ? "bg-gradient-to-r from-orange-400 to-amber-500 shadow-md shadow-orange-200 hover:from-orange-500 hover:to-amber-600"
              : "bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-200 hover:from-blue-600 hover:to-blue-700"
          }`}
        >
          {srsLoadingId === flashcardSet._id
            ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : dueCount > 0 ? `Réviser (${dueCount})` : "Réviser"
          }
        </button>
      </div>
    </div>
  );
};

export default FlashcardSetCard;