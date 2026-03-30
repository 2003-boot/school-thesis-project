import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";
import toast from "react-hot-toast";
import { MailCheck, RefreshCcw, ArrowRight } from "lucide-react";
import logo from "/logo.png";

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.verifyEmail(email, code);
      toast.success("Adresse email vérifiée avec succès !");
      navigate("/login");
    } catch (err) {
      const message = err.error || err.message || "Impossible de vérifier l’adresse email.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setResending(true);

    try {
      await authService.resendVerificationCode(email);
      toast.success("Nouveau code envoyé avec succès.");
    } catch (err) {
      const message = err.error || err.message || "Impossible de renvoyer le code.";
      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <MailCheck className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="mb-2 text-2xl font-medium text-slate-900">
              Vérifie ton adresse email
            </h1>
            <p className="text-sm text-slate-500">
              Entre le code de vérification reçu par email.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Code de vérification
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 text-center text-lg font-semibold tracking-[0.3em] text-slate-900 transition-all duration-200 focus:border-blue-500 focus:bg-white focus:outline-none"
                placeholder="123456"
                maxLength={6}
              />
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
                  "Vérification..."
                ) : (
                  <>
                    Vérifier mon email
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            {resending ? "Envoi..." : "Renvoyer le code"}
          </button>

          <div className="mt-6 border-t border-slate-200/60 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Déjà vérifié ?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                Connecte-toi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;