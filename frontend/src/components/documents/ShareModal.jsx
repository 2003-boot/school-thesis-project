import React, { useState, useEffect } from 'react';
import { Link2, Copy, Trash2, CheckCircle2, Users, Eye } from 'lucide-react';
import shareService from '../../services/shareService';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';

const ShareModal = ({ isOpen, onClose, document }) => {
  const [shareUrl, setShareUrl]   = useState(null);
  const [shares, setShares]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [creating, setCreating]   = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    if (isOpen && document?._id) fetchShares();
  }, [isOpen, document]);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const data = await shareService.getDocumentShares(document._id);
      setShares(data);
      const active = data.find(s => s.isActive);
      if (active) setShareUrl(`${window.location.origin}/shared/${active.token}`);
    } catch { toast.error('Erreur chargement des partages.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const data = await shareService.createShare(document._id);
      setShareUrl(data.shareUrl);
      await fetchShares();
      toast.success('Lien de partage créé !');
    } catch (error) {
      toast.error(error.message || 'Erreur création du lien.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (token) => {
    try {
      await shareService.revokeShare(token);
      setShareUrl(null);
      await fetchShares();
      toast.success('Lien révoqué.');
    } catch { toast.error('Erreur révocation.'); }
  };

  const activeShare = shares.find(s => s.isActive);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Partager le document">
      <div className="space-y-5">
        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">{document?.title}</p>
            <p className="text-xs text-blue-700">
              Les personnes ayant ce lien pourront consulter le document, ses flashcards et ses quiz en lecture seule.
            </p>
          </div>
        </div>

        {/* Lien actif */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : activeShare ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Lien actif</p>
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <Link2 className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-xs text-slate-600 truncate">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {copied
                  ? <><CheckCircle2 className="w-3.5 h-3.5" />Copié</>
                  : <><Copy className="w-3.5 h-3.5" />Copier</>
                }
              </button>
            </div>

            {/* Stats + révocation */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{activeShare.accessCount} accès</span>
              </div>
              <button
                onClick={() => handleRevoke(activeShare.token)}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                Révoquer le lien
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Link2 className="w-6 h-6 text-slate-400" strokeWidth={2} />
            </div>
            <p className="text-sm text-slate-600 mb-1">Aucun lien de partage actif</p>
            <p className="text-xs text-slate-400">Génère un lien pour partager ce document.</p>
          </div>
        )}

        {/* Bouton créer */}
        {!activeShare && (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création...</>
              : <><Link2 className="w-4 h-4" strokeWidth={2} />Créer un lien de partage</>
            }
          </button>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;