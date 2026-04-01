import { jsPDF } from 'jspdf';

const DIFFICULTY_COLORS = {
  easy:   { r: 16,  g: 185, b: 129 }, // emerald
  medium: { r: 245, g: 158, b: 11  }, // amber
  hard:   { r: 239, g: 68,  b: 68  }, // red
};

const DIFFICULTY_LABELS = {
  easy:   'Facile',
  medium: 'Moyen',
  hard:   'Difficile',
};

/**
 * Génère et télécharge un PDF de flashcards
 * @param {Object} flashcardSet - Le lot de flashcards
 * @param {string} documentTitle - Titre du document associé
 */
export const exportFlashcardsPDF = (flashcardSet, documentTitle = 'Flashcards') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W      = 210;
  const PAGE_H      = 297;
  const MARGIN      = 16;
  const CONTENT_W   = PAGE_W - MARGIN * 2;
  const CARD_H      = 52;
  const CARD_GAP    = 6;
  const HEADER_H    = 42;

  // ── Couleurs ──────────────────────────────────────────────────────────
  const PRIMARY   = { r: 59,  g: 130, b: 246 }; // blue-500
  const LIGHT_BG  = { r: 248, g: 250, b: 252 }; // slate-50
  const BORDER    = { r: 226, g: 232, b: 240 }; // slate-200
  const TEXT_DARK = { r: 15,  g: 23,  b: 42  }; // slate-900
  const TEXT_MID  = { r: 100, g: 116, b: 139 }; // slate-500

  const setFill   = (c) => doc.setFillColor(c.r, c.g, c.b);
  const setStroke = (c) => doc.setDrawColor(c.r, c.g, c.b);
  const setColor  = (c) => doc.setTextColor(c.r, c.g, c.b);

  let currentPage = 1;
  let y           = 0;

  // ── Dessiner l'en-tête ────────────────────────────────────────────────
  const drawHeader = () => {
    // Bande bleue en haut
    setFill(PRIMARY);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');

    // Titre du document
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    setColor({ r: 255, g: 255, b: 255 });
    doc.text(documentTitle, MARGIN, 18);

    // Sous-titre
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setColor({ r: 186, g: 230, b: 253 }); // blue-200
    doc.text(`${flashcardSet.cards.length} flashcard${flashcardSet.cards.length > 1 ? 's' : ''}`, MARGIN, 27);

    // Date de génération
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Généré le ${dateStr}`, MARGIN, 34);

    // Numéro de page
    setColor({ r: 186, g: 230, b: 253 });
    doc.text(`Page ${currentPage}`, PAGE_W - MARGIN, 27, { align: 'right' });

    y = HEADER_H + 10;
  };

  // ── Dessiner une carte ────────────────────────────────────────────────
  const drawCard = (card, index) => {
    const diffColor = DIFFICULTY_COLORS[card.difficulty] || DIFFICULTY_COLORS.medium;
    const diffLabel = DIFFICULTY_LABELS[card.difficulty] || 'Moyen';

    // Fond de la carte
    setFill(LIGHT_BG);
    setStroke(BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, CONTENT_W, CARD_H, 3, 3, 'FD');

    // Barre colorée gauche (indicateur de difficulté)
    setFill(diffColor);
    doc.roundedRect(MARGIN, y, 3, CARD_H, 1, 1, 'F');

    // Numéro de carte
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(TEXT_MID);
    doc.text(`#${index + 1}`, MARGIN + 8, y + 7);

    // Badge difficulté
    setFill(diffColor);
    const badgeW = 18;
    doc.roundedRect(PAGE_W - MARGIN - badgeW - 2, y + 3, badgeW, 6, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor({ r: 255, g: 255, b: 255 });
    doc.text(diffLabel.toUpperCase(), PAGE_W - MARGIN - badgeW / 2 - 2, y + 7.2, { align: 'center' });

    // Séparateur horizontal
    setStroke(BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN + 6, y + 12, MARGIN + CONTENT_W - 4, y + 12);

    // Label "Question"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor(PRIMARY);
    doc.text('QUESTION', MARGIN + 8, y + 18);

    // Texte de la question (avec wrapping)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(TEXT_DARK);
    const questionLines = doc.splitTextToSize(card.question, CONTENT_W - 16);
    const questionText  = questionLines.slice(0, 2).join('\n'); // max 2 lignes
    doc.text(questionText, MARGIN + 8, y + 24);

    // Séparateur tirets
    doc.setLineDashPattern([1, 1], 0);
    setStroke({ r: 203, g: 213, b: 225 }); // slate-300
    doc.line(MARGIN + 6, y + 32, MARGIN + CONTENT_W - 4, y + 32);
    doc.setLineDashPattern([], 0);

    // Label "Réponse"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setColor({ r: 16, g: 185, b: 129 }); // emerald
    doc.text('RÉPONSE', MARGIN + 8, y + 38);

    // Texte de la réponse
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(TEXT_DARK);
    const answerLines = doc.splitTextToSize(card.answer, CONTENT_W - 16);
    const answerText  = answerLines.slice(0, 2).join('\n');
    doc.text(answerText, MARGIN + 8, y + 44);

    y += CARD_H + CARD_GAP;
  };

  // ── Nouvelle page ─────────────────────────────────────────────────────
  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    drawHeader();
  };

  // ── Pied de page ──────────────────────────────────────────────────────
  const drawFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      setStroke(BORDER);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(TEXT_MID);
      doc.text('Généré par Ton Assistant IA', MARGIN, PAGE_H - 7);
      doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' });
    }
  };

  // ── Génération ────────────────────────────────────────────────────────
  drawHeader();

  flashcardSet.cards.forEach((card, index) => {
    // Nouvelle page si plus assez de place
    if (y + CARD_H > PAGE_H - 20) addNewPage();
    drawCard(card, index);
  });

  drawFooter();

  // ── Téléchargement ────────────────────────────────────────────────────
  const fileName = `flashcards-${documentTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
  doc.save(fileName);
};