import { memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Trash2, BookOpen, BrainCircuit, Clock } from "lucide-react";
import moment from "moment";
import "moment/dist/locale/fr";

moment.locale("fr");

const formatFileSize = (bytes) => {
  if (bytes === undefined || bytes === null) return null;

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const StatBadge = ({ icon: Icon, value, label, className = "", iconClassName = "", textClassName = "" }) => {
  if (value === undefined || value === null) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ${className}`}
    >
      <Icon className={`h-4 w-4 ${iconClassName}`} strokeWidth={2} />
      <span className={`text-xs font-semibold ${textClassName}`}>
        {value} {label}
      </span>
    </div>
  );
};

const DocumentCard = ({ document, onDelete }) => {
  const navigate = useNavigate();

  const fileSizeLabel = useMemo(() => formatFileSize(document.fileSize), [document.fileSize]);

  const createdAtLabel = useMemo(() => {
    if (!document.createdAt) return "";
    return moment(document.createdAt).locale("fr").fromNow();
  }, [document.createdAt]);

  const handleNavigate = useCallback(() => {
    navigate(`/documents/${document._id}`);
  }, [navigate, document._id]);

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      onDelete(document);
    },
    [onDelete, document]
  );

  return (
    <article
      onClick={handleNavigate}
      className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/0 via-transparent to-cyan-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md transition-transform duration-300 group-hover:scale-105">
            <FileText className="h-7 w-7 text-white" strokeWidth={2} />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Supprimer le document"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <h3
          className="mb-2 line-clamp-2 min-h-[3rem] text-base font-semibold leading-6 text-slate-900"
          title={document.title}
        >
          {document.title}
        </h3>

        {fileSizeLabel && (
          <p className="mb-4 text-sm font-medium text-slate-500">
            {fileSizeLabel}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <StatBadge
            icon={BookOpen}
            value={document.flashcardCount}
            label="Flashcards"
            className="bg-purple-50"
            iconClassName="text-purple-600"
            textClassName="text-purple-700"
          />

          <StatBadge
            icon={BrainCircuit}
            value={document.quizCount}
            label="Quizzes"
            className="bg-emerald-50"
            iconClassName="text-emerald-600"
            textClassName="text-emerald-700"
          />
        </div>
      </div>

      <footer className="relative mt-5 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Ajouté {createdAtLabel}</span>
        </div>
      </footer>
    </article>
  );
};

export default memo(DocumentCard);