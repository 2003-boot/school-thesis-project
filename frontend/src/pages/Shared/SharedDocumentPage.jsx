import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, BookOpen, BrainCircuit, AlertCircle, Eye } from 'lucide-react';
import shareService from '../../services/shareService';
import Spinner from '../../components/common/Spinner';
import moment from 'moment';
import 'moment/dist/locale/fr';

moment.locale('fr');

const SharedDocumentPage = () => {
  const { token }               = useParams();
  const [content, setContent]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('flashcards');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await shareService.getSharedContent(token);
        setContent(data);
      } catch (err) {
        setError(err.message || 'Lien invalide ou expiré.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-rose-500" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Lien invalide</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-10 px-5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );

  const { document, flashcardSets, quizzes, sharedAt } = content;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">{document.title}</h1>
              <p className="text-xs text-slate-500">
                Partagé {moment(sharedAt).fromNow()} · <Eye className="w-3 h-3 inline" strokeWidth={2} /> {content.accessCount} vues
              </p>
            </div>
          </div>
          <Link
            to="/register"
            className="hidden sm:flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {flashcardSets.reduce((sum, s) => sum + s.cards.length, 0)}
              </div>
              <div className="text-xs text-slate-500">Flashcards</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-emerald-600" strokeWidth={2} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{quizzes.length}</div>
              <div className="text-xs text-slate-500">Quiz disponibles</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl border border-slate-200 p-1.5">
          {[
            { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
            { id: 'quizzes',   label: 'Quiz',       icon: BrainCircuit },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu Flashcards */}
        {activeTab === 'flashcards' && (
          <div className="space-y-4">
            {flashcardSets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={2} />
                <p className="text-sm text-slate-500">Aucune flashcard disponible</p>
              </div>
            ) : (
              flashcardSets.map((set, si) => (
                <div key={si} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Lot {si + 1}</span>
                    <span className="text-xs text-slate-400">{set.cards.length} cartes</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {set.cards.map((card, ci) => (
                      <div key={ci} className="px-5 py-4 flex items-start gap-4">
                        <div className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                          card.difficulty === 'easy'   ? 'bg-emerald-400' :
                          card.difficulty === 'hard'   ? 'bg-rose-400'    : 'bg-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 mb-1">{card.question}</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{card.answer}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contenu Quiz */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={2} />
                <p className="text-sm text-slate-500">Aucun quiz disponible</p>
              </div>
            ) : (
              quizzes.map((quiz, qi) => (
                <div key={qi} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-700">{quiz.title}</p>
                    <p className="text-xs text-slate-400">{quiz.totalQuestions} questions</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {quiz.questions.map((q, qi2) => (
                      <div key={qi2} className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900 mb-3">
                          {qi2 + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              <span className="text-xs text-slate-700">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CTA inscription */}
        <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200 rounded-2xl p-6 text-center">
          <h3 className="text-base font-semibold text-slate-900 mb-1">Envie de créer tes propres cours ?</h3>
          <p className="text-sm text-slate-600 mb-4">
            Crée un compte gratuit pour générer des flashcards, quiz et mind maps depuis tes documents PDF.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 h-10 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedDocumentPage;