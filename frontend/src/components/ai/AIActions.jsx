import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Sparkles, BookOpen, Lightbulb, Network, X, Download } from "lucide-react";
import aiService from "../../services/aiService";
import toast from "react-hot-toast";
import MarkdownRenderer from "../common/MarkdownRenderer";
import Modal from "../common/Modal";
import MindMap from "./MindMap";

const AIActions = () => {
  const { id: documentId } = useParams();
  const [loadingAction, setLoadingAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [concept, setConcept] = useState("");

  // Mind map state
  const [mindMapData, setMindMapData] = useState(null);
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapTitle, setMindMapTitle] = useState("");

  const handleGenerateSummary = async () => {
    setLoadingAction("summary");
    try {
      const { summary } = await aiService.generateSummary(documentId);
      setModalTitle("Résumé généré");
      setModalContent(summary);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Échec de la génération du résumé.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExplainConcept = async (e) => {
    e.preventDefault();
    if (!concept.trim()) {
      toast.error("Veuillez entrer un concept à expliquer.");
      return;
    }
    setLoadingAction("explain");
    try {
      const { explanation } = await aiService.explainConcept(documentId, concept);
      setModalTitle(`Explication de "${concept}"`);
      setModalContent(explanation);
      setIsModalOpen(true);
      setConcept("");
    } catch (error) {
      toast.error("Échec de l'explication du concept.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateMindMap = async () => {
    setLoadingAction("mindmap");
    try {
      const result = await aiService.generateMindMap(documentId);
      setMindMapData(result.mindMap);
      setMindMapTitle(result.title);
      setShowMindMap(true);
      toast.success("Mind map générée !");
    } catch (error) {
      toast.error(error.message || "Échec de la génération de la mind map.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Export SVG
  const handleExportSVG = () => {
    const svg = document.querySelector('.mindmap-container svg');
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${mindMapTitle || 'document'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Assistant IA</h3>
              <p className="text-xs text-slate-500">Alimenté par Gemini</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* Résumé */}
          <div className="group p-5 bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" strokeWidth={2} />
                  </div>
                  <h4 className="font-semibold text-slate-900">Générer un résumé</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Obtiens un résumé concis et structuré du document.
                </p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingAction === "summary"}
                className="shrink-0 h-10 px-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loadingAction === "summary"
                  ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Génération...</span>
                  : "Résumer"}
              </button>
            </div>
          </div>

          {/* Mind Map */}
          <div className="group p-5 bg-gradient-to-br from-purple-50/50 to-white rounded-xl border border-purple-200/60 hover:border-purple-300/60 hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                    <Network className="w-4 h-4 text-purple-600" strokeWidth={2} />
                  </div>
                  <h4 className="font-semibold text-slate-900">Générer une mind map</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Visualise les concepts clés du document sous forme de carte mentale interactive.
                </p>
              </div>
              <button
                onClick={handleGenerateMindMap}
                disabled={loadingAction === "mindmap"}
                className="shrink-0 h-10 px-5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {loadingAction === "mindmap"
                  ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Génération...</span>
                  : "Générer"}
              </button>
            </div>
          </div>

          {/* Expliquer un concept */}
          <div className="group p-5 bg-gradient-to-br from-slate-50/50 to-white rounded-xl border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md transition-all duration-200">
            <form onSubmit={handleExplainConcept}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-600" strokeWidth={2} />
                </div>
                <h4 className="font-semibold text-slate-900">Expliquer un concept</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Entre un sujet ou concept du document pour obtenir une explication détaillée.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="ex : 'La cryptographie asymétrique'"
                  className="flex-1 h-11 px-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-lg"
                  disabled={loadingAction === "explain"}
                />
                <button
                  type="submit"
                  disabled={loadingAction === "explain" || !concept.trim()}
                  className="shrink-0 h-11 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loadingAction === "explain"
                    ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />...</span>
                    : "Expliquer"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Mind Map plein écran */}
      {showMindMap && mindMapData && (
        <div className="mt-6 bg-white/80 backdrop-blur-xl border border-purple-200/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-600" strokeWidth={2} />
              <span className="font-semibold text-slate-900 text-sm">Mind map — {mindMapTitle}</span>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                {mindMapData.nodes.length} concepts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSVG}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter SVG
              </button>
              <button
                onClick={() => { setShowMindMap(false); setMindMapData(null); }}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 mindmap-container">
            <MindMap data={mindMapData} />
          </div>
        </div>
      )}

      {/* Modal résumé / concept */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <div className="max-h-[60vh] overflow-y-auto prose prose-sm max-w-none prose-slate">
          <MarkdownRenderer content={modalContent} />
        </div>
      </Modal>
    </>
  );
};

export default AIActions;