import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles, Brain, BrainCircuit } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';

const PHASE_LABELS = {
  explore:  { label: 'Exploration',   color: 'bg-blue-100 text-blue-700' },
  deepen:   { label: 'Approfondissement', color: 'bg-amber-100 text-amber-700' },
  conclude: { label: 'Synthèse',      color: 'bg-green-100 text-green-700' },
};

const ChatInterface = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [socrateMode, setSocrateMode] = useState(false);
  const [socratePhase, setSocratePhase] = useState('explore');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setInitialLoading(true);
        const response = await aiService.getChatHistory(documentId);
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setHistory(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      let responseData;

      if (socrateMode) {
        // ← Mode Socrate : appel dédié
        responseData = await aiService.socrateChat(documentId, userMessage.content);
        setSocratePhase(responseData.data.socratePhase);
        const assistantMessage = {
          role: 'assistant',
          content: responseData.data.answer,
          timestamp: new Date(),
          isSocrate: true,
        };
        setHistory(prev => [...prev, assistantMessage]);
      } else {
        // Mode normal
        const response = await aiService.chat(documentId, userMessage.content);
        const assistantMessage = {
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
        };
        setHistory(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSocrateMode = () => {
    setSocrateMode(prev => !prev);
    setSocratePhase('explore');
    // Message d'annonce dans le chat
    if (!socrateMode) {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: '🏛️ **Mode Socrate activé !**\n\nJe ne vais plus te donner les réponses directement. À la place, je vais te guider avec des questions pour que tu découvres les réponses par toi-même.\n\nPar où veux-tu commencer ?',
        timestamp: new Date(),
        isSocrate: true,
        isSystemMessage: true,
      }]);
    } else {
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: '💬 Mode normal réactivé. Pose-moi tes questions !',
        timestamp: new Date(),
      }]);
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    const isSocrate = msg.isSocrate;

    return (
      <div key={index} className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
        {!isUser && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
            isSocrate
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
              : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-200'
          }`}>
            {isSocrate
              ? <BrainCircuit className="w-4 h-4 text-white" strokeWidth={2} />
              : <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
            }
          </div>
        )}

        <div className={`max-w-lg p-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
            : isSocrate
              ? 'bg-amber-50 border border-amber-200 text-slate-800 rounded-bl-md'
              : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-md'
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-slate">
              <MarkdownRenderer content={msg.content} />
            </div>
          )}
        </div>

        {isUser && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-semibold text-sm shrink-0 shadow-sm">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl items-center justify-center shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-blue-600" strokeWidth={2} />
        </div>
        <Spinner />
        <p className="text-sm text-slate-500 mt-3 font-medium">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden">

      {/* Header avec toggle mode Socrate */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 bg-white/90">
        <div className="flex items-center gap-2">
          {socrateMode ? (
            <>
              <BrainCircuit className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">Mode Socrate</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_LABELS[socratePhase].color}`}>
                {PHASE_LABELS[socratePhase].label}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-slate-700">Assistant IA</span>
            </>
          )}
        </div>

        <button
          onClick={toggleSocrateMode}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
            socrateMode
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          {socrateMode ? 'Désactiver Socrate' : 'Mode Socrate'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-50/50">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-blue-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">Entame une conversation</h3>
              <p className="text-sm text-slate-500">Pose une question ou active le Mode Socrate pour réviser !</p>
            </div>
          </div>
        ) : (
          history.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
        {loading && (
          <div className="flex items-center gap-3 my-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
              socrateMode
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                : 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-200'
            }`}>
              {socrateMode
                ? <BrainCircuit className="w-4 h-4 text-white" strokeWidth={2} />
                : <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
              }
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200/60">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className={`p-5 border-t bg-white/80 transition-colors duration-300 ${
        socrateMode ? 'border-amber-200/60' : 'border-slate-200/60'
      }`}>
        {socrateMode && (
          <p className="text-xs text-amber-600 mb-2 font-medium">
            🏛️ Socrate t'écoute — réponds à sa question de ton mieux, même si tu n'es pas sûr(e) !
          </p>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={socrateMode ? "Réponds à la question..." : "Pose ta question..."}
            className={`flex-1 h-12 px-4 border-2 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg ${
              socrateMode
                ? 'border-amber-200 focus:border-amber-400 focus:shadow-amber-500/10'
                : 'border-slate-200 focus:border-blue-500 focus:shadow-blue-500/10'
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className={`shrink-0 w-12 h-12 text-white rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center ${
              socrateMode
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-200'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
            }`}
          >
            <Send className="w-5 h-5" strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;