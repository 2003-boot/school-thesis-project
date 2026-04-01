import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import progressService from '../../services/progressService';
import toast from 'react-hot-toast';
import {
  FileText, BookOpen, BrainCircuit, TrendingUp, Clock,
  Flame, Trophy, Star, Zap, CheckCircle2, Target,
} from 'lucide-react';

// ── Mini bar chart (score history) ───────────────────────────────────────
const ScoreChart = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-sm text-slate-400">
      Pas encore de quiz complété
    </div>
  );
  const max = 100;
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((entry, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-slate-500 font-medium">{entry.score}%</span>
          <div className="w-full relative rounded-t-md overflow-hidden bg-slate-100" style={{ height: '80px' }}>
            <div
              className={`absolute bottom-0 w-full rounded-t-md transition-all duration-700 ${
                entry.score >= 80 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' :
                entry.score >= 60 ? 'bg-gradient-to-t from-amber-500 to-amber-400' :
                                    'bg-gradient-to-t from-rose-500 to-rose-400'
              }`}
              style={{ height: `${(entry.score / max) * 80}px` }}
            />
          </div>
          <span className="text-xs text-slate-400 truncate w-full text-center" title={entry.title}>
            {entry.title.substring(0, 6)}…
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Barre de difficulté ──────────────────────────────────────────────────
const DifficultyBar = ({ label, data, color }) => {
  if (!data || data.rate === null) return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-14">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full" />
      <span className="text-xs text-slate-400 w-8">—</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-slate-600 w-14">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${data.rate}%`, transition: 'width 0.8s ease' }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{data.rate}%</span>
    </div>
  );
};

// ── Streak display ───────────────────────────────────────────────────────
const StreakBadge = ({ streak }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
    streak >= 7  ? 'bg-orange-50 border-orange-200' :
    streak >= 3  ? 'bg-amber-50  border-amber-200'  :
    streak >= 1  ? 'bg-yellow-50 border-yellow-200' :
                   'bg-slate-50  border-slate-200'
  }`}>
    <Flame className={`w-5 h-5 ${
      streak >= 7 ? 'text-orange-500' :
      streak >= 3 ? 'text-amber-500'  :
      streak >= 1 ? 'text-yellow-500' :
                    'text-slate-400'
    }`} strokeWidth={2} />
    <div>
      <div className="text-lg font-bold text-slate-900 leading-none">{streak}</div>
      <div className="text-xs text-slate-500">jour{streak > 1 ? 's' : ''} de suite</div>
    </div>
  </div>
);

// ── Page principale ──────────────────────────────────────────────────────
const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await progressService.getDashboardData();
        setDashboardData(data.data);
      } catch (error) {
        toast.error('Échec de la récupération des données du tableau de bord.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <Spinner />;

  if (!dashboardData?.overview) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-600 text-sm">Aucune donnée disponible.</p>
      </div>
    </div>
  );

  const { overview, scoreHistory, difficultyBreakdown, recentActivity } = dashboardData;

  const topStats = [
    { label: 'Cours',       value: overview.totalDocuments,    icon: FileText,    gradient: 'from-blue-400 to-cyan-500',     shadow: 'shadow-blue-200'   },
    { label: 'Flashcards',  value: overview.totalFlashcards,   icon: BookOpen,    gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-200' },
    { label: 'Quiz',        value: overview.totalQuizzes,      icon: BrainCircuit,gradient: 'from-emerald-400 to-teal-500',  shadow: 'shadow-emerald-200'},
    { label: 'Score moyen', value: `${overview.averageScore}%`,icon: Target,      gradient: 'from-amber-400 to-orange-500',  shadow: 'shadow-amber-200'  },
  ];

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-1">Dashboard</h1>
            <p className="text-slate-500 text-sm">Suis tes progrès d'apprentissage</p>
          </div>
          <StreakBadge streak={overview.streak} />
        </div>

        {/* Top stats — 4 cartes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topStats.map((stat, i) => (
            <div key={i} className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg p-5 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md ${stat.shadow} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Ligne 2 : score history + difficulty breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Graphique scores */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-600" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-slate-800">Évolution des scores</h3>
              <span className="ml-auto text-xs text-slate-400">7 derniers quiz</span>
            </div>
            <ScoreChart data={scoreHistory} />
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> ≥ 80%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> ≥ 60%</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" /> &lt; 60%</span>
            </div>
          </div>

          {/* Breakdown difficultés + KPIs */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-slate-600" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-slate-800">Performance par difficulté</h3>
            </div>
            <div className="space-y-3">
              <DifficultyBar label="Facile"  data={difficultyBreakdown?.easy}   color="bg-emerald-400" />
              <DifficultyBar label="Moyen"   data={difficultyBreakdown?.medium} color="bg-amber-400"   />
              <DifficultyBar label="Difficile" data={difficultyBreakdown?.hard} color="bg-rose-400"    />
            </div>

            <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Meilleur score', value: `${overview.bestScore}%`, icon: Trophy, color: 'text-amber-500' },
                { label: 'Cartes révisées',     value: overview.srsLearned,      icon: CheckCircle2, color: 'text-emerald-500' },
                { label: 'Favoris',        value: overview.starredFlashcards, icon: Star, color: 'text-yellow-500' },
              ].map((kpi, i) => (
                <div key={i} className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <kpi.icon className={`w-4 h-4 ${kpi.color} mx-auto mb-1`} strokeWidth={2} />
                  <div className="text-lg font-bold text-slate-900">{kpi.value}</div>
                  <div className="text-xs text-slate-500 leading-tight">{kpi.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ligne 3 : progression flashcards */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-slate-600" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-slate-800">Progression des flashcards</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Révisées',
                value: overview.reviewedFlashcards,
                total: overview.totalFlashcards,
                color: 'bg-blue-500',
                bg: 'bg-blue-100',
              },
              {
                label: 'Révisées (SRS)',
                value: overview.srsLearned,
                total: overview.totalFlashcards,
                color: 'bg-emerald-500',
                bg: 'bg-emerald-100',
              },
              {
                label: 'Favorites',
                value: overview.starredFlashcards,
                total: overview.totalFlashcards,
                color: 'bg-amber-500',
                bg: 'bg-amber-100',
              },
            ].map((item, i) => {
              const pct = overview.totalFlashcards > 0
                ? Math.round((item.value / overview.totalFlashcards) * 100)
                : 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-500">{item.value} / {item.total}</span>
                  </div>
                  <div className={`h-3 ${item.bg} rounded-full overflow-hidden`}>
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-600">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-slate-600" strokeWidth={2} />
            <h3 className="text-sm font-semibold text-slate-800">Activité récente</h3>
          </div>

          {(recentActivity?.documents?.length > 0 || recentActivity?.quizzes?.length > 0) ? (
            <div className="space-y-2">
              {[
                ...(recentActivity.documents || []).map(doc => ({
                  id: doc._id, label: 'Cours', title: doc.title,
                  timestamp: doc.lastAccessed, link: `/documents/${doc._id}`,
                  icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50',
                })),
                ...(recentActivity.quizzes || []).map(q => ({
                  id: q._id, label: 'Quiz', title: q.title,
                  timestamp: q.completedAt, link: `/quizzes/${q._id}/results`,
                  icon: BrainCircuit, iconColor: 'text-emerald-500', bg: 'bg-emerald-50',
                  score: q.completedAt ? q.score : null,
                })),
              ]
                .filter(a => a.timestamp)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 6)
                .map((activity, i) => (
                  <div key={activity.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-200/60 hover:bg-white hover:shadow-md transition-all duration-200">
                    <div className={`w-8 h-8 rounded-lg ${activity.bg} flex items-center justify-center shrink-0`}>
                      <activity.icon className={`w-4 h-4 ${activity.iconColor}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase">{activity.label}</span>
                        {activity.score !== null && activity.score !== undefined && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                            activity.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            activity.score >= 60 ? 'bg-amber-100 text-amber-700'    :
                                                   'bg-rose-100 text-rose-700'
                          }`}>{activity.score}%</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{activity.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-400">
                        {new Date(activity.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      <Link to={activity.link} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Voir →
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-3">
                <Clock className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600">Pas encore d'activité.</p>
              <p className="text-xs text-slate-500 mt-1">Commence à apprendre pour voir tes progrès ici.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;