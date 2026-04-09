import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, Zap, CheckCircle2 } from 'lucide-react';
import flashcardService from '../../services/flashcardService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard';
import Flashcard from '../../components/flashcards/Flashcard';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const SRS_RATINGS = [
  { quality: 1, label: "À revoir",  sublabel: "< 1 jour",    color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
  { quality: 2, label: "Difficile", sublabel: "~2 jours",    color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
  { quality: 3, label: "Bien",      sublabel: "~1 semaine",  color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
  { quality: 4, label: "Facile",    sublabel: "~2 semaines", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
];

const FlashcardsListPage = () => {
  const [flashcardSets, setFlashcardSets]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [previewSet, setPreviewSet]         = useState(null);
  const [previewIndex, setPreviewIndex]     = useState(0);

  // SRS session
  const [srsMode, setSrsMode]               = useState(false);
  const [srsSet, setSrsSet]                 = useState(null);
  const [dueCards, setDueCards]             = useState([]);
  const [srsCardIndex, setSrsCardIndex]     = useState(0);
  const [srsFlipped, setSrsFlipped]         = useState(false);
  const [srsSessionDone, setSrsSessionDone] = useState(false);
  const [srsStats, setSrsStats]             = useState({ reviewed: 0, easy: 0, good: 0, hard: 0, again: 0 });

  useEffect(() => {
    fetchFlashcardSets();
  }, []);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getAllFlashcardSets();
      setFlashcardSets(response.data);
    } catch (error) {
      toast.error('Impossible de récupérer les lots de flashcards.');
    } finally {
      setLoading(false);
    }
  };

  // ── Démarrer session SRS ──────────────────────────────────────────────
  const handleRevise = (set, due) => {
    setSrsSet(set);
    setDueCards(due);
    setSrsCardIndex(0);
    setSrsFlipped(false);
    setSrsSessionDone(false);
    setSrsStats({ reviewed: 0, easy: 0, good: 0, hard: 0, again: 0 });
    setSrsMode(true);
  };

  const handleSrsRating = async (quality) => {
    const currentCard = dueCards[srsCardIndex];
    if (!currentCard) return;
    const labelMap = { 1: "again", 2: "hard", 3: "good", 4: "easy" };
    setSrsStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      [labelMap[quality]]: prev[labelMap[quality]] + 1,
    }));
    try {
      await flashcardService.srsReview(currentCard._id, quality);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
    const nextIndex = srsCardIndex + 1;
    if (nextIndex >= dueCards.length) setSrsSessionDone(true);
    else { setSrsCardIndex(nextIndex); setSrsFlipped(false); }
  };

  const handleToggleStarPreview = async (cardId) => {
    try {
      await flashcardService.toggleStar(cardId);
      const updatedSets = flashcardSets.map(set => ({
        ...set,
        cards: set.cards.map(c => c._id === cardId ? { ...c, isStarred: !c.isStarred } : c)
      }));
      setFlashcardSets(updatedSets);
      if (previewSet) {
        const updatedPreview = updatedSets.find(s => s._id === previewSet._id);
        setPreviewSet(updatedPreview);
        const starred = updatedPreview?.cards.find(c => c._id === cardId)?.isStarred;
        toast.success(starred ? "Flashcard ajoutée aux favoris ⭐" : "Flashcard retirée des favoris");
      }
    } catch { toast.error("Impossible de mettre à jour le favori."); }
  };

  // ── Render session SRS ────────────────────────────────────────────────
  const renderSrsSession = () => {
    if (srsSessionDone) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">Session terminée ! 🎉</h3>
            <p className="text-sm text-slate-500">{srsStats.reviewed} carte(s) révisée(s)</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { label: "Facile",    value: srsStats.easy,  color: "bg-green-50 text-green-700 border-green-200" },
              { label: "Bien",      value: srsStats.good,  color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Difficile", value: srsStats.hard,  color: "bg-orange-50 text-orange-700 border-orange-200" },
              { label: "À revoir",  value: srsStats.again, color: "bg-red-50 text-red-700 border-red-200" },
            ].map(stat => (
              <div key={stat.label} className={`border rounded-xl px-4 py-2 text-center ${stat.color}`}>
                <div className="text-lg font-bold">{stat.value}</div>
                <div className="text-xs font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setSrsMode(false); setSrsSet(null); fetchFlashcardSets(); }}
            className="h-11 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Retour aux lots
          </button>
        </div>
      );
    }

    const currentCard = dueCards[srsCardIndex];
    const progress = Math.round((srsCardIndex / dueCards.length) * 100);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSrsMode(false); setSrsSet(null); }}
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            Quitter la session
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">{srsCardIndex + 1} / {dueCards.length}</span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="w-full max-w-2xl">
            <div
              className="relative w-full h-72 cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={() => setSrsFlipped(f => !f)}
            >
              <div
                className="relative w-full h-full transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: srsFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                <div
                  className="absolute inset-0 bg-white/80 backdrop-blur-xl border-2 border-slate-200/60 rounded-2xl shadow-xl p-8 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-slate-100 text-[10px] text-slate-600 rounded px-3 py-1 uppercase font-medium">
                      {currentCard?.difficulty}
                    </span>
                    {!currentCard?.nextReview && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] rounded px-3 py-1 uppercase font-medium">
                        Nouvelle
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <p className="text-lg font-semibold text-slate-900 text-center leading-relaxed">
                      {currentCard?.question}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                    <Zap className="w-3.5 h-3.5" strokeWidth={2} />
                    <span>Clique pour révéler la réponse</span>
                  </div>
                </div>

                <div
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 flex flex-col justify-between"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="flex-1 flex items-center justify-center px-4">
                    <p className="text-base text-white text-center leading-relaxed font-medium">
                      {currentCard?.answer}
                    </p>
                  </div>
                  <p className="text-center text-white/60 text-xs">Comment tu l'as trouvé ?</p>
                </div>
              </div>
            </div>
          </div>

          {srsFlipped && (
            <div className="grid grid-cols-4 gap-3 w-full max-w-2xl">
              {SRS_RATINGS.map(({ quality, label, sublabel, color }) => (
                <button
                  key={quality}
                  onClick={() => handleSrsRating(quality)}
                  className={`border-2 rounded-xl py-3 px-2 text-center transition-all duration-200 active:scale-95 ${color}`}
                >
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{sublabel}</div>
                </button>
              ))}
            </div>
          )}

          {!srsFlipped && (
            <p className="text-xs text-slate-400 text-center">
              Réfléchis à la réponse, puis retourne la carte
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <Spinner />;
    if (flashcardSets.length === 0) return (
      <EmptyState
        title="Aucun lot de flashcards trouvé"
        description="Tu n'as pas encore généré de flashcards. Va dans un document pour créer ton premier lot."
      />
    );
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {flashcardSets.map((set) => (
          <FlashcardSetCard
            key={set._id}
            flashcardSet={set}
            onPreview={(s) => { setPreviewSet(s); setPreviewIndex(0); }}
            onRevise={handleRevise}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {srsMode ? (
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          {renderSrsSession()}
        </div>
      ) : (
        <>
          <PageHeader title="Tous les lots de flashcards" />
          {renderContent()}
        </>
      )}

      <Modal
        isOpen={!!previewSet}
        onClose={() => setPreviewSet(null)}
        title={`Aperçu — ${previewSet?.cards?.length || 0} cartes`}
      >
        {previewSet && (
          <div className="space-y-4">
            <Flashcard
              flashcard={previewSet.cards[previewIndex]}
              onToggleStar={handleToggleStarPreview}
            />
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                disabled={previewIndex === 0}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                Précédent
              </button>
              <span className="text-sm text-slate-500 font-medium">
                {previewIndex + 1} / {previewSet.cards.length}
              </span>
              <button
                onClick={() => setPreviewIndex(i => Math.min(previewSet.cards.length - 1, i + 1))}
                disabled={previewIndex === previewSet.cards.length - 1}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-100 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Suivant
                <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FlashcardsListPage;