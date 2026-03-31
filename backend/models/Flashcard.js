import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    cards: [
      {
        question:   { type: String, required: true },
        answer:     { type: String, required: true },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
        isStarred:  { type: Boolean, default: false },

        // ── Champs SRS (algorithme SM-2) ──────────────────────────────
        reviewCount:  { type: Number, default: 0 },
        lastReviewed: { type: Date, default: null },
        nextReview:   { type: Date, default: null },   // prochaine révision planifiée
        interval:     { type: Number, default: 1 },    // nb de jours avant prochaine révision
        easeFactor:   { type: Number, default: 2.5 },  // facteur de facilité (≥ 1.3)
        repetitions:  { type: Number, default: 0 },    // nb de révisions réussies consécutives
      },
    ],
  },
  { timestamps: true }
);

flashcardSchema.index({ userId: 1, documentId: 1 });

const Flashcard = mongoose.model("Flashcard", flashcardSchema);
export default Flashcard;