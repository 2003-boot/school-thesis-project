import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Timer, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import quizService from '../../services/quizService';
import aiService from '../../services/aiService';
import Spinner from '../common/Spinner';
import Button from '../common/Button';
import Modal from '../common/Modal';
import QuizCard from './QuizCard';
import EmptyState from '../common/EmptyState';

const TIME_OPTIONS = [
  { label: 'Sans limite', value: null },
  { label: '30 sec / question', value: 30 },
  { label: '1 min / question', value: 60 },
  { label: '2 min / question', value: 120 },
];

const QuizManager = ({ documentId }) => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [generating, setGenerating]           = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numQuestions, setNumQuestions]       = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen]     = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [selectedQuiz, setSelectedQuiz]       = useState(null);

  // Mode examen
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examQuiz, setExamQuiz]               = useState(null);
  const [timeLimit, setTimeLimit]             = useState(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getQuizzesForDocument(documentId);
      setQuizzes(data.data);
    } catch (error) {
      toast.error('Impossible de charger les quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) fetchQuizzes();
  }, [documentId]);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await aiService.generateQuiz(documentId, { numQuestions });
      toast.success('Quiz généré avec succès !');
      setIsGenerateModalOpen(false);
      fetchQuizzes();
    } catch (error) {
      toast.error(error.message || 'Échec de la génération du quiz.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteRequest  = (quiz) => { setSelectedQuiz(quiz); setIsDeleteModalOpen(true); };
  const handleConfirmDelete  = async () => {
    if (!selectedQuiz) return;
    setDeleting(true);
    try {
      await quizService.deleteQuiz(selectedQuiz._id);
      toast.success(`Quiz supprimé.`);
      setIsDeleteModalOpen(false);
      setSelectedQuiz(null);
      setQuizzes(quizzes.filter(q => q._id !== selectedQuiz._id));
    } catch (error) {
      toast.error(error.message || 'Échec de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenExamModal  = (quiz) => { setExamQuiz(quiz); setTimeLimit(null); setIsExamModalOpen(true); };
  const handleStartExam      = () => {
    setIsExamModalOpen(false);
    navigate(`/quizzes/${examQuiz._id}/take`, { state: { examMode: true, timeLimit } });
  };

  const renderQuizContent = () => {
    if (loading) return <Spinner />;
    if (quizzes.length === 0) return (
      <EmptyState
        title="Pas encore de quiz"
        description="Génère un quiz à partir de ton document pour tester tes connaissances."
      />
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {quizzes.map((quiz) => (
          <div key={quiz._id} className="relative group">
            <QuizCard quiz={quiz} onDelete={handleDeleteRequest} />
            {/* Bouton Mode Examen par-dessus la card */}
            <button
              onClick={() => handleOpenExamModal(quiz)}
              className="absolute bottom-3 left-3 right-3 h-9 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-xs font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200 hover:from-orange-500 hover:to-amber-600 active:scale-95"
            >
              <Timer className="w-3.5 h-3.5" />
              Mode Examen
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex justify-end gap-2 mb-4">
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Plus size={16} />
          Générer un quiz
        </Button>
      </div>

      {renderQuizContent()}

      {/* Modal — Générer quiz */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Générer un nouveau quiz">
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">Nombre de questions</label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              required
              className="w-full h-9 px-3 border border-neutral-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsGenerateModalOpen(false)} disabled={generating}>Annuler</Button>
            <Button type="submit" disabled={generating}>{generating ? 'Génération...' : 'Générer'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal — Mode Examen */}
      <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title="Configurer le mode examen">
        <div className="space-y-5">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">Mode examen</span>
            </div>
            <p className="text-xs text-orange-700">
              En mode examen, un timer s'affiche pour chaque question. Le quiz se soumet automatiquement si le temps est écoulé.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">Limite de temps</label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setTimeLimit(opt.value)}
                  className={`h-10 rounded-xl border-2 text-sm font-medium transition-all ${
                    timeLimit === opt.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsExamModalOpen(false)}>Annuler</Button>
            <button
              onClick={handleStartExam}
              className="h-10 px-5 bg-gradient-to-r from-orange-400 to-amber-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-200 hover:from-orange-500 hover:to-amber-600 active:scale-95 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Démarrer l'examen
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal — Supprimer */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Supprimer le quiz">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">
            Supprimer <span className="font-semibold">{selectedQuiz?.title}</span> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>Annuler</Button>
            <Button onClick={handleConfirmDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600">
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizManager;