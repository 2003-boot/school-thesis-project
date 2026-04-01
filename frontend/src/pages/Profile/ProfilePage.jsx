import React, { useState, useEffect } from "react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Spinner from "../../components/common/Spinner";
import authService from "../../services/authService";
import gamificationService from "../../services/gamificationService";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Star, Trophy, Zap, TrendingUp } from "lucide-react";

// ── Composant barre de niveau ─────────────────────────────────────────────
const LevelBar = ({ levelInfo, xp }) => {
  if (!levelInfo) return null;
  const { current, next, progress } = levelInfo;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: current.color + '20', border: `2px solid ${current.color}` }}
          >
            {current.level <= 2 ? '🌱' : current.level <= 4 ? '📖' : current.level <= 6 ? '⚡' : '👑'}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niveau {current.level}</div>
            <div className="text-xl font-bold text-slate-900">{current.title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{xp}</div>
          <div className="text-xs text-slate-500 font-medium">points XP</div>
        </div>
      </div>

      {next && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Progression vers <span className="font-semibold text-slate-700">{next.title}</span></span>
            <span>{progress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: current.color }}
            />
          </div>
          <div className="text-xs text-slate-400 text-right">{next.minXP - xp} XP restants</div>
        </div>
      )}
      {!next && (
        <div className="text-center py-2">
          <span className="text-sm font-semibold text-amber-600">🏆 Niveau maximum atteint !</span>
        </div>
      )}
    </div>
  );
};

// ── Composant badge ───────────────────────────────────────────────────────
const BadgeCard = ({ badge }) => (
  <div className={`relative p-4 rounded-2xl border-2 text-center transition-all ${
    badge.unlocked
      ? 'border-amber-200 bg-amber-50'
      : 'border-slate-100 bg-slate-50 opacity-50'
  }`}>
    <div className="text-3xl mb-2">{badge.icon}</div>
    <div className={`text-xs font-bold mb-1 ${badge.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>
      {badge.label}
    </div>
    <div className="text-xs text-slate-500 leading-tight">{badge.desc}</div>
    {badge.unlocked && badge.unlockedAt && (
      <div className="text-[10px] text-amber-600 font-medium mt-2">
        {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </div>
    )}
    {!badge.unlocked && (
      <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
        <span className="text-2xl">🔒</span>
      </div>
    )}
  </div>
);

// ── Historique XP ─────────────────────────────────────────────────────────
const XPHistory = ({ history }) => (
  <div className="space-y-2">
    {history.length === 0 ? (
      <p className="text-sm text-slate-400 text-center py-4">Aucun historique XP</p>
    ) : (
      history.map((entry, i) => (
        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-sm text-slate-700">{entry.reason}</span>
          <span className="text-sm font-bold text-emerald-600">+{entry.amount} XP</span>
        </div>
      ))
    )}
  </div>
);

// ── Page principale ───────────────────────────────────────────────────────
const ProfilePage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading]                         = useState(true);
  const [passwordLoading, setPasswordLoading]         = useState(false);
  const [activeTab, setActiveTab]                     = useState('niveau');

  const [username, setUsername]                       = useState('');
  const [email, setEmail]                             = useState('');
  const [currentPassword, setCurrentPassword]         = useState('');
  const [newPassword, setNewPassword]                 = useState('');
  const [confirmNewPassword, setConfirmNewPassword]   = useState('');
  const [gamification, setGamification]               = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [{ data }, gam] = await Promise.all([
          authService.getProfile(),
          gamificationService.getProfile(),
        ]);
        setUsername(data.username);
        setEmail(data.email);
        setGamification(gam);

        // Notifier les nouveaux badges
        if (gam?.newBadges?.length > 0) {
          gam.newBadges.forEach(badge => {
            toast.success(`🏅 Badge débloqué : ${badge.label} ${badge.icon}`, { duration: 4000 });
          });
        }
      } catch (error) {
        toast.error('Échec de la récupération du profil.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6) { toast.error('Minimum 6 caractères.'); return; }
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Mot de passe changé avec succès !');
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.message || 'Échec du changement.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const unlockedBadges = gamification?.badges?.filter(b => b.unlocked).length || 0;
  const totalBadges    = gamification?.badges?.length || 0;

  const TABS = [
    { id: 'niveau',   label: 'Niveau & XP',  icon: TrendingUp },
    { id: 'badges',   label: `Badges (${unlockedBadges}/${totalBadges})`, icon: Trophy },
    { id: 'compte',   label: 'Compte',        icon: User },
  ];

  return (
    <div>
      <PageHeader title="Profil" />

      {/* Header utilisateur */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{username}</h2>
          <p className="text-sm text-slate-500">{email}</p>
        </div>
        {gamification && (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{gamification.xp}</div>
              <div className="text-xs text-slate-500">XP Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">{unlockedBadges}</div>
              <div className="text-xs text-slate-500">Badges</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{gamification.stats?.completedQuizzes || 0}</div>
              <div className="text-xs text-slate-500">Quiz</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-2xl border border-slate-200 p-1.5 mb-6">
        {TABS.map(tab => (
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

      {/* Tab : Niveau & XP */}
      {activeTab === 'niveau' && gamification && (
        <div className="space-y-6">
          <LevelBar levelInfo={gamification.level} xp={gamification.xp} />

          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Quiz complétés',  value: gamification.stats?.completedQuizzes || 0,  icon: '🎯' },
              { label: 'Score parfait',   value: gamification.stats?.perfectQuizzes || 0,    icon: '💯' },
              { label: 'Cartes maîtrisées', value: gamification.stats?.masteredCards || 0,   icon: '🧠' },
              { label: 'Streak actuel',   value: `${gamification.stats?.streak || 0}j`,      icon: '🔥' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Historique XP */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-slate-800">Historique XP récent</h3>
            </div>
            <XPHistory history={gamification.xpHistory || []} />
          </div>
        </div>
      )}

      {/* Tab : Badges */}
      {activeTab === 'badges' && gamification && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Badges débloqués en premier */}
            {[
              ...gamification.badges.filter(b => b.unlocked),
              ...gamification.badges.filter(b => !b.unlocked),
            ].map((badge, i) => (
              <BadgeCard key={i} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Tab : Compte */}
      {activeTab === 'compte' && (
        <div className="space-y-6">
          {/* Infos utilisateur */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Informations utilisateur</h3>
            <div className="space-y-4">
              {[
                { label: "Nom d'utilisateur", value: username, icon: User },
                { label: "Adresse e-mail",    value: email,    icon: Mail },
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <field.icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="w-full h-10 pl-9 pr-3 flex items-center border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-900">
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Changement mot de passe */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Changer le mot de passe</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: 'Mot de passe actuel',         value: currentPassword, setValue: setCurrentPassword, show: showCurrentPassword, setShow: setShowCurrentPassword },
                { label: 'Nouveau mot de passe',        value: newPassword,     setValue: setNewPassword,     show: showNewPassword,     setShow: setShowNewPassword     },
                { label: 'Confirmer le nouveau mot de passe', value: confirmNewPassword, setValue: setConfirmNewPassword, show: showConfirmPassword, setShow: setShowConfirmPassword },
              ].map((field, i) => (
                <div key={i}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={field.show ? 'text' : 'password'}
                      value={field.value}
                      onChange={e => field.setValue(e.target.value)}
                      required
                      className="w-full h-10 pl-9 pr-10 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="button" onClick={() => field.setShow(!field.show)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      {field.show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Changement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;