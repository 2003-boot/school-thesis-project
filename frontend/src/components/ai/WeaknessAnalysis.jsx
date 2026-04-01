import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, TrendingUp, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const SEVERITY_CONFIG = {
  high:   { label: 'Critique',  bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  medium: { label: 'Modéré',   bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  low:    { label: 'Mineur',   bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
};

const PRIORITY_CONFIG = {
  high:   { label: '⚡ Priorité haute',   color: 'text-red-600'    },
  medium: { label: '→ Priorité moyenne', color: 'text-amber-600'  },
  low:    { label: '↓ Priorité basse',   color: 'text-slate-500'  },
};

const WeaknessAnalysis = ({ quizId, score }) => {
  const [analysis, setAnalysis]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(false);

  const handleAnalyze = async () => {
    if (analysis) { setExpanded(e => !e); return; }
    setLoading(true);
    try {
      const data = await aiService.analyzeWeaknesses(quizId);
      setAnalysis(data);
      setExpanded(true);
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-200/60 bg-white/80 shadow-md overflow-hidden mb-8">
      {/* Header — bouton trigger */}
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-md shadow-purple-200">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">Analyser mes lacunes</p>
            <p className="text-xs text-slate-500">Recommandations IA personnalisées</p>
          </div>
        </div>
        {loading ? (
          <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
        ) : analysis ? (
          expanded ? <ChevronUp className="w-5 h-5 text-purple-500" /> : <ChevronDown className="w-5 h-5 text-purple-500" />
        ) : (
          <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            Analyser
          </span>
        )}
      </button>

      {/* Contenu dépliable */}
      {expanded && analysis && (
        <div className="p-6 space-y-6 border-t border-purple-100">

          {/* Score parfait */}
          {analysis.perfectScore ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-base font-semibold text-slate-900 mb-2">Score parfait !</p>
              <p className="text-sm text-slate-600">{analysis.globalAdvice}</p>
            </div>
          ) : (
            <>
              {/* Conseil global */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" strokeWidth={2} />
                  <p className="text-sm text-purple-800 leading-relaxed">{analysis.globalAdvice}</p>
                </div>
              </div>

              {/* Lacunes identifiées */}
              {analysis.weaknesses?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-slate-600" strokeWidth={2} />
                    <h4 className="text-sm font-semibold text-slate-800">
                      Lacunes identifiées ({analysis.wrongCount}/{analysis.totalCount} questions ratées)
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.weaknesses.map((w, i) => {
                      const cfg = SEVERITY_CONFIG[w.severity] || SEVERITY_CONFIG.medium;
                      return (
                        <div key={i} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                            <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className={`text-sm font-semibold ${cfg.text} mb-1`}>{w.theme}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{w.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommandations */}
              {analysis.recommendations?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-slate-600" strokeWidth={2} />
                    <h4 className="text-sm font-semibold text-slate-800">Recommandations</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.recommendations.map((r, i) => {
                      const cfg = PRIORITY_CONFIG[r.priority] || PRIORITY_CONFIG.medium;
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-800 leading-relaxed">{r.action}</p>
                            <p className={`text-xs font-medium mt-1 ${cfg.color}`}>{cfg.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WeaknessAnalysis;