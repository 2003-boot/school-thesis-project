import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import flashcardService from '../../services/flashcardService';
import PageHeader from '../../components/common/PageHeader';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import FlashcardSetCard from '../../components/flashcards/FlashcardSetCard';
import Flashcard from '../../components/flashcards/Flashcard';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const FlashcardsListPage = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [previewSet, setPreviewSet]       = useState(null);
  const [previewIndex, setPreviewIndex]   = useState(0);

  useEffect(() => {
    const fetchFlashcardSets = async () => {
      try {
        const response = await flashcardService.getAllFlashcardSets();
        setFlashcardSets(response.data);
      } catch (error) {
        toast.error('Impossible de récupérer les lots de flashcards.');
      } finally {
        setLoading(false);
      }
    };
    fetchFlashcardSets();
  }, []);

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
    } catch {
      toast.error("Impossible de mettre à jour le favori.");
    }
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
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Tous les lots de flashcards" />
      {renderContent()}

      {/* Modale Aperçu */}
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