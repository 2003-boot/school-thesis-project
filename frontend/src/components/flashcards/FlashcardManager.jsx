import React, { useState, useEffect } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, ArrowLeft,
  Sparkles, Brain, Clock, Zap, CheckCircle2, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import moment from "moment";
import "moment/dist/locale/fr";

import flashcardService from "../../services/flashcardService";
import aiService from "../../services/aiService";
import Spinner from "../common/Spinner";
import Modal from "../common/Modal";
import Flashcard from "./Flashcard";

moment.locale("fr");

const SRS_RATINGS = [
  { quality: 1, label: "À revoir",  sublabel: "< 1 jour",    color: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" },
  { quality: 2, label: "Difficile", sublabel: "~2 jours",    color: "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100" },
  { quality: 3, label: "Bien",      sublabel: "~1 semaine",  color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
  { quality: 4, label: "Facile",    sublabel: "~2 semaines", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
];

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets]         = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [generating, setGenerating]               = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [setToDelete, setSetToDelete]             = useState(null);

  // Aperçu (lecture seule)
  const [previewSet, setPreviewSet]               = useState(null);
  const [previewIndex, setPreviewIndex]           = useState(0);

  // SRS
  const [srsMode, setSrsMode]                     = useState(false);
  const [selectedSet, setSelectedSet]             = useState(null);
  const [dueCards, setDueCards]                   = useState([]);
  const [srsCardIndex, setSrsCardIndex]           = useState(0);
  const [srsFlipped, setSrsFlipped]               = useState(false);
  const [srsLoadingId, setSrsLoadingId]           = useState(null);
  const [srsSessionDone, setSrsSessionDone]       = useState(false);
  const [srsStats, setSrsStats]                   = useState({ reviewed: 0, easy: 0, good: 0, hard: 0, again: 0 });

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const response = await flashcardService.getFlashcardsForDocument(documentId);
      setFlashcardSets(response.data);
    } catch (error) {
      toast.error("Échec de la récupération des lots de flashcards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchFlashcardSets();
  }, [documentId]);

  // ── SRS ───────────────────────────────────────────────────────────────
  const handleStartSRS = async (set) => {
    setSrsLoadingId(set._id);
    try {
      const response = await flashcardService.getDueCards(set._id);
      const due = response.data.dueCards;
      if (due.length === 0) {
        toast.success("🎉 Aucune carte à réviser pour aujourd'hui !");
        return;
      }
      setSelectedSet(set);
      setDueCards(due);
      setSrsCardIndex(0);
      setSrsFlipped(false);
      setSrsSessionDone(false);
      setSrsStats({ reviewed: 0, easy: 0, good: 0, hard: 0, again: 0 });
      setSrsMode(true);
    } catch (error) {
      toast.error("Impossible de charger les cartes à réviser.");
    } finally {
      setSrsLoadingId(null);
    }
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

  // ── Génération ────────────────────────────────────────────────────────
  const handleGenerateFlashcards = async () => {
    setGenerating(true);
    try {
      await aiService.generateFlashcards(documentId);
      toast.success("Flashcards générées avec succès !");
      await fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Échec de la génération.");
    } finally {
      setGenerating(false);
    }
  };

  // ── Aperçu (toggle star uniquement, pas de review SRS) ───────────────
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

  // ── Suppression ───────────────────────────────────────────────────────
  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();
    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;
    setDeleting(true);
    try {
      await flashcardService.deleteFlashcardSet(setToDelete._id);
      toast.success("Lot supprimé avec succès !");
      setIsDeleteModalOpen(false);
      setSetToDelete(null);
      await fetchFlashcardSets();
    } catch (error) {
      toast.error(error.message || "Échec de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render : session SRS ──────────────────────────────────────────────
  const renderSrsSession = () => {
    if (srsSessionDone) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">Session terminée ! 🎉</h3>
            <p className="text-sm text-slate-500">{srsStats.reviewed} carte(s) révisée(s) aujourd'hui</p>
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
            onClick={() => { setSrsMode(false); setSelectedSet(null); fetchFlashcardSets(); }}
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
            onClick={() => { setSrsMode(false); setSelectedSet(null); }}
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

  // ── Render : liste des lots ───────────────────────────────────────────
  const renderSetList = () => {
    if (loading) return <div className="flex items-center justify-center py-20"><Spinner /></div>;

    if (flashcardSets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200">
            <Brain className="h-8 w-8 text-blue-600" strokeWidth={2} />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-slate-900">Pas encore de flashcards</h3>
          <p className="mb-8 max-w-sm text-center text-sm text-slate-500">
            Génère des flashcards à partir de ton document pour commencer à apprendre.
          </p>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {generating
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Génération...</>
              : <><Sparkles className="h-4 w-4" strokeWidth={2} />Générer des flashcards</>
            }
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Tes lots de flashcards</h3>
            <p className="mt-1 text-sm text-slate-500">
              {flashcardSets.length} {flashcardSets.length === 1 ? "lot disponible" : "lots disponibles"}
            </p>
          </div>
          <button
            onClick={handleGenerateFlashcards}
            disabled={generating}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {generating
              ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Génération...</>
              : <><Plus className="h-4 w-4" strokeWidth={2.5} />Nouveau lot</>
            }
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flashcardSets.map((set) => {
            const now = new Date();
            const dueCount = set.cards.filter(c => !c.nextReview || new Date(c.nextReview) <= now).length;

            return (
              <div key={set._id} className="group relative rounded-2xl border-2 border-slate-200 bg-white/80 p-6 backdrop-blur-xl transition-all duration-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10">
                <button
                  onClick={(e) => handleDeleteRequest(e, set)}
                  className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>

                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100">
                    <Brain className="h-6 w-6 text-blue-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold text-slate-900">Lot de flashcards</h4>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Créé le {moment(set.createdAt).format("D MMM YYYY")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                      <span className="text-sm font-semibold text-blue-700">{set.cards.length} cartes</span>
                    </div>
                    {dueCount > 0 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-600" />
                        <span className="text-sm font-semibold text-orange-700">{dueCount} à réviser</span>
                      </div>
                    )}
                  </div>

                  {/* Boutons — Aperçu + Réviser */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setPreviewSet(set); setPreviewIndex(0); }}
                      className="flex-1 h-9 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                      Aperçu
                    </button>
                    <button
                      onClick={() => handleStartSRS(set)}
                      disabled={srsLoadingId === set._id}
                      className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                        dueCount > 0
                          ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md shadow-orange-200 hover:from-orange-500 hover:to-amber-600"
                          : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 hover:from-blue-600 hover:to-blue-700"
                      }`}
                    >
                      {srsLoadingId === set._id ? "..." : dueCount > 0 ? `Réviser (${dueCount})` : "Réviser"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
        {srsMode ? renderSrsSession() : renderSetList()}
      </div>

      {/* Modale Aperçu — lecture seule */}
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

      {/* Modale Suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Supprimer le lot de flashcards ?"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">Es-tu sûr de vouloir supprimer ce lot ? Cette action est irréversible.</p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="h-11 rounded-xl bg-slate-100 px-5 text-sm font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="h-11 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:from-rose-600 hover:to-red-600 disabled:opacity-50 transition-all active:scale-95"
            >
              {deleting
                ? <span className="flex items-center gap-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Suppression...</span>
                : "Supprimer"
              }
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FlashcardManager;