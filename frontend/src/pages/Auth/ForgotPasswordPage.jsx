import React, { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { Mail, ArrowRight } from "lucide-react";
import logo from "/logo.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success("Email de réinitialisation envoyé.");
    } catch (err) {
      const message = err.error || err.message || "Impossible d’envoyer l’email.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 via-white to-slate-50 px-6">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-30" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-10 shadow-xl shadow-slate-200/50 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="flex justify-center">
              <img src={logo} alt="app logo" height={110} width={110} />
            </div>
            <h1 className="mb-2 text-2xl font-medium text-slate-900">
              Mot de passe oublié
            </h1>
            <p className="text-sm text-slate-500">
              Entre ton email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 pl-12 pr-4 text-sm font-medium text-slate-900 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-center text-xs font-medium text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  "Envoi..."
                ) : (
                  <>
                    Envoyer le lien
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200/60 pt-6 text-center">
            <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;