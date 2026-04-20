"""
nexaflow_pdf_template.py
========================
NexaFlow SA — Charte graphique · Bibliothèque ReportLab
--------------------------------------------------------
Importer ce module pour appliquer l'identité visuelle NexaFlow
à tous les PDFs générés dans la simulation DRH.

Usage rapide
------------
from nexaflow_pdf_template import NexaFlowPDF

doc = NexaFlowPDF(
    filename="mon_rapport.pdf",
    title="Audit RH — Avril 2026",
    subtitle="People Report · M1",
    author="Bruno Mineo, DRH",
)
doc.build_story([
    doc.h1("Synthèse exécutive"),
    doc.body("Contenu du rapport..."),
    doc.kpi_row([("87", "Effectif total"), ("€6,49M", "Masse salariale"), ("18 %", "Turnover")]),
])
"""

import io
import os
from datetime import datetime
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.flowables import Flowable

# ── Charte chromatique ────────────────────────────────────────────────────────
C_MIDNIGHT   = colors.HexColor("#0B1020")   # Midnight Circuit — fond principal
C_GRAPHITE   = colors.HexColor("#1E293B")   # Graphite Grid — fonds de cartes
C_TEAL       = colors.HexColor("#16D5C0")   # Electric Teal — accent principal
C_SILVER     = colors.HexColor("#D9E1EA")   # Silver Mist — respiration
C_PURE       = colors.HexColor("#F7FAFC")   # Pure Signal — fond document
C_BLUE       = colors.HexColor("#3B82F6")   # Blue Relay — liens / données
C_VIOLET     = colors.HexColor("#7C3AED")   # Soft Violet Pulse — IA / analytics
C_SUCCESS    = colors.HexColor("#12B981")   # Success Flow
C_WARNING    = colors.HexColor("#F59E0B")   # Warning Node
C_CRITICAL   = colors.HexColor("#EF4444")   # Critical Trace
C_TEXT_DARK  = colors.HexColor("#1E293B")   # Texte principal sur fond clair
C_TEXT_MUTED = colors.HexColor("#64748B")   # Texte secondaire

# ── Typo (fallback system fonts) ─────────────────────────────────────────────
# Space Grotesk et Inter ne sont pas embarquées dans ReportLab de base.
# On utilise Helvetica (proche) pour les titres et Times pour le corps,
# mais on prévoit des hooks pour enregistrer les vraies polices si disponibles.
FONT_TITLE  = "Helvetica-Bold"    # → Space Grotesk Bold
FONT_SEMI   = "Helvetica-Bold"    # → Space Grotesk SemiBold
FONT_BODY   = "Helvetica"         # → Inter Regular
FONT_MEDIUM = "Helvetica-Bold"    # → Inter Medium/SemiBold (KPIs)

PAGE_W, PAGE_H = A4
MARGIN_L = MARGIN_R = 20 * mm
MARGIN_T = 28 * mm
MARGIN_B = 22 * mm


# ── Flowable : logo NexaFlow (SVG inline via canvas) ─────────────────────────
class NexaFlowLogo(Flowable):
    """Dessine le monogramme NF (Electric Teal) sur fond Midnight Circuit."""

    def __init__(self, width=52, height=22):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height

        # Fond sombre arrondi
        c.setFillColor(C_MIDNIGHT)
        c.roundRect(0, 0, w, h, 3, fill=1, stroke=0)

        # Trait teal : N
        c.setStrokeColor(C_TEAL)
        c.setLineWidth(2.2)
        c.setLineCap(1)  # round caps
        p = c.beginPath()
        p.moveTo(5, 4); p.lineTo(5, h - 4)          # barre gauche N
        p.moveTo(5, h - 4); p.lineTo(14, 4)          # diagonale N
        p.moveTo(14, 4); p.lineTo(14, h - 4)          # barre droite N
        c.drawPath(p, stroke=1, fill=0)

        # Point de connexion
        c.setFillColor(C_TEAL)
        c.circle(14, 4, 1.4, fill=1, stroke=0)

        # Trait teal : F
        p2 = c.beginPath()
        p2.moveTo(19, 4); p2.lineTo(19, h - 4)       # barre verticale F
        p2.moveTo(19, h - 4); p2.lineTo(w - 5, h - 4) # barre haute F
        p2.moveTo(19, h / 2); p2.lineTo(w - 8, h / 2) # barre milieu F
        c.drawPath(p2, stroke=1, fill=0)

        # Label "NexaFlow" en blanc, petit
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 5.5)
        # (pas de label dans la version icône — version logotype séparée)


# ── Helpers de styles ─────────────────────────────────────────────────────────
def _build_styles():
    base = getSampleStyleSheet()
    styles = {}

    styles["h1"] = ParagraphStyle(
        "NF_H1",
        fontName=FONT_TITLE,
        fontSize=18,
        leading=22,
        textColor=C_MIDNIGHT,
        spaceBefore=6,
        spaceAfter=4,
    )
    styles["h2"] = ParagraphStyle(
        "NF_H2",
        fontName=FONT_SEMI,
        fontSize=13,
        leading=17,
        textColor=C_MIDNIGHT,
        spaceBefore=10,
        spaceAfter=3,
    )
    styles["h3"] = ParagraphStyle(
        "NF_H3",
        fontName=FONT_SEMI,
        fontSize=11,
        leading=14,
        textColor=C_GRAPHITE,
        spaceBefore=7,
        spaceAfter=2,
    )
    styles["body"] = ParagraphStyle(
        "NF_Body",
        fontName=FONT_BODY,
        fontSize=9.5,
        leading=14,
        textColor=C_TEXT_DARK,
        spaceAfter=5,
    )
    styles["muted"] = ParagraphStyle(
        "NF_Muted",
        fontName=FONT_BODY,
        fontSize=8.5,
        leading=12,
        textColor=C_TEXT_MUTED,
        spaceAfter=3,
    )
    styles["kpi_value"] = ParagraphStyle(
        "NF_KPI_Value",
        fontName=FONT_MEDIUM,
        fontSize=22,
        leading=26,
        textColor=C_TEAL,
        alignment=TA_CENTER,
    )
    styles["kpi_label"] = ParagraphStyle(
        "NF_KPI_Label",
        fontName=FONT_BODY,
        fontSize=8,
        leading=11,
        textColor=C_TEXT_MUTED,
        alignment=TA_CENTER,
    )
    styles["label"] = ParagraphStyle(
        "NF_Label",
        fontName=FONT_MEDIUM,
        fontSize=7.5,
        leading=10,
        textColor=C_TEAL,
        spaceAfter=1,
    )
    styles["caption"] = ParagraphStyle(
        "NF_Caption",
        fontName=FONT_BODY,
        fontSize=7.5,
        leading=10,
        textColor=C_TEXT_MUTED,
        alignment=TA_CENTER,
    )
    return styles


# ── Header / Footer callbacks ─────────────────────────────────────────────────
def _make_header_footer(title: str, subtitle: str, confidential: bool):
    """Renvoie les callbacks onFirstPage / onLaterPages pour BaseDocTemplate."""

    def _draw_header(canvas, doc):
        canvas.saveState()
        w = PAGE_W

        # Barre de fond sombre en haut
        canvas.setFillColor(C_MIDNIGHT)
        canvas.rect(0, PAGE_H - 18 * mm, w, 18 * mm, fill=1, stroke=0)

        # Ligne teal sous le header
        canvas.setFillColor(C_TEAL)
        canvas.rect(0, PAGE_H - 18 * mm - 1.5, w, 1.5, fill=1, stroke=0)

        # Logo NF (dessiné manuellement)
        canvas.setStrokeColor(C_TEAL)
        canvas.setLineWidth(2.0)
        canvas.setLineCap(1)
        lx, ly = 14 * mm, PAGE_H - 12 * mm
        # N
        p = canvas.beginPath()
        p.moveTo(lx, ly - 5); p.lineTo(lx, ly + 5)
        p.moveTo(lx, ly + 5); p.lineTo(lx + 7, ly - 5)
        p.moveTo(lx + 7, ly - 5); p.lineTo(lx + 7, ly + 5)
        canvas.drawPath(p, stroke=1, fill=0)
        canvas.setFillColor(C_TEAL)
        canvas.circle(lx + 7, ly - 5, 1.2, fill=1, stroke=0)
        # F
        p2 = canvas.beginPath()
        p2.moveTo(lx + 11, ly - 5); p2.lineTo(lx + 11, ly + 5)
        p2.moveTo(lx + 11, ly + 5); p2.lineTo(lx + 21, ly + 5)
        p2.moveTo(lx + 11, ly); p2.lineTo(lx + 18, ly)
        canvas.drawPath(p2, stroke=1, fill=0)

        # "NexaFlow" logotype
        canvas.setFillColor(colors.white)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(lx + 26, PAGE_H - 13.5 * mm, "NexaFlow")

        # Séparateur vertical
        canvas.setFillColor(C_TEAL)
        canvas.rect(lx + 74, PAGE_H - 14 * mm, 0.8, 9, fill=1, stroke=0)

        # Titre du document
        canvas.setFillColor(C_SILVER)
        canvas.setFont("Helvetica-Bold", 8)
        canvas.drawString(lx + 80, PAGE_H - 11.5 * mm, title)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(C_TEXT_MUTED)
        canvas.drawString(lx + 80, PAGE_H - 14.8 * mm, subtitle)

        # Tampon CONFIDENTIEL (optionnel)
        if confidential:
            canvas.setFillColor(C_WARNING)
            canvas.setFont("Helvetica-Bold", 6.5)
            canvas.drawRightString(w - 14 * mm, PAGE_H - 12 * mm, "CONFIDENTIEL")

        canvas.restoreState()

    def _draw_footer(canvas, doc):
        canvas.saveState()
        w = PAGE_W
        y_foot = 12 * mm

        # Ligne teal fine
        canvas.setFillColor(C_TEAL)
        canvas.rect(MARGIN_L, y_foot + 5, w - MARGIN_L - MARGIN_R, 0.8, fill=1, stroke=0)

        # Textes footer
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(C_TEXT_MUTED)
        today = datetime.today().strftime("%d %B %Y")
        canvas.drawString(MARGIN_L, y_foot, f"NexaFlow SA · Avenue Louise 54 · Bruxelles · {today}")
        canvas.drawRightString(w - MARGIN_R, y_foot, f"Page {doc.page}")

        canvas.restoreState()

    return _draw_header, _draw_footer


# ── Document principal ────────────────────────────────────────────────────────
class NexaFlowPDF:
    """
    Générateur de PDF NexaFlow.

    Paramètres
    ----------
    filename    : chemin de sortie du PDF
    title       : titre principal (H1 de couverture + header)
    subtitle    : sous-titre / référence
    author      : signataire (ex. "Bruno Mineo, DRH")
    confidential: affiche le tampon CONFIDENTIEL dans le header
    cover       : génère une page de couverture sombre
    """

    def __init__(
        self,
        filename: str,
        title: str = "Document RH",
        subtitle: str = "",
        author: str = "Bruno Mineo, DRH",
        confidential: bool = True,
        cover: bool = True,
    ):
        self.filename = filename
        self.title = title
        self.subtitle = subtitle
        self.author = author
        self.confidential = confidential
        self.cover = cover
        self.styles = _build_styles()
        self._story: list = []

    # ── Éléments de contenu ───────────────────────────────────────────────────
    def h1(self, text: str) -> Paragraph:
        return Paragraph(text, self.styles["h1"])

    def h2(self, text: str) -> Paragraph:
        return Paragraph(text, self.styles["h2"])

    def h3(self, text: str) -> Paragraph:
        return Paragraph(text, self.styles["h3"])

    def body(self, text: str) -> Paragraph:
        return Paragraph(text, self.styles["body"])

    def muted(self, text: str) -> Paragraph:
        return Paragraph(text, self.styles["muted"])

    def label(self, text: str) -> Paragraph:
        return Paragraph(text.upper(), self.styles["label"])

    def spacer(self, height_mm: float = 4) -> Spacer:
        return Spacer(1, height_mm * mm)

    def divider(self, color=C_SILVER, thickness: float = 0.8) -> HRFlowable:
        return HRFlowable(
            width="100%",
            thickness=thickness,
            color=color,
            spaceAfter=4,
            spaceBefore=4,
        )

    def teal_divider(self) -> HRFlowable:
        return self.divider(color=C_TEAL, thickness=1.5)

    def kpi_row(self, kpis: list[tuple[str, str]], color=None) -> Table:
        """
        Ligne de KPIs. kpis = [(valeur, label), ...]
        Ex : [("87", "Effectif"), ("18%", "Turnover")]
        """
        kpi_color = color or C_TEAL
        style_val = ParagraphStyle(
            "kv", fontName=FONT_MEDIUM, fontSize=20, leading=24,
            textColor=kpi_color, alignment=TA_CENTER,
        )
        style_lbl = ParagraphStyle(
            "kl", fontName=FONT_BODY, fontSize=8, leading=11,
            textColor=C_TEXT_MUTED, alignment=TA_CENTER,
        )
        cells = [[Paragraph(v, style_val) for v, _ in kpis],
                 [Paragraph(l, style_lbl) for _, l in kpis]]
        n = len(kpis)
        col_w = (PAGE_W - MARGIN_L - MARGIN_R) / n
        tbl = Table(cells, colWidths=[col_w] * n, rowHeights=[28, 14])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), C_PURE),
            ("BOX",        (0, 0), (-1, -1), 0.5, C_SILVER),
            ("INNERGRID",  (0, 0), (-1, -1), 0.5, C_SILVER),
            ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
            ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            # Filet teal en haut
            ("LINEABOVE",  (0, 0), (-1, 0), 2, C_TEAL),
        ]))
        return tbl

    def data_table(
        self,
        headers: list[str],
        rows: list[list],
        col_widths: Optional[list] = None,
        highlight_col: int = -1,
    ) -> Table:
        """Tableau de données avec en-tête sombre NexaFlow."""
        h_style = ParagraphStyle(
            "th", fontName=FONT_SEMI, fontSize=8, leading=11,
            textColor=colors.white, alignment=TA_CENTER,
        )
        c_style = ParagraphStyle(
            "td", fontName=FONT_BODY, fontSize=8.5, leading=12,
            textColor=C_TEXT_DARK,
        )
        header_row = [Paragraph(h, h_style) for h in headers]
        data_rows = [[Paragraph(str(cell), c_style) for cell in row] for row in rows]
        table_data = [header_row] + data_rows

        avail_w = PAGE_W - MARGIN_L - MARGIN_R
        if col_widths is None:
            col_widths = [avail_w / len(headers)] * len(headers)

        tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
        ts = TableStyle([
            # En-tête
            ("BACKGROUND",    (0, 0), (-1, 0), C_MIDNIGHT),
            ("LINEBELOW",     (0, 0), (-1, 0), 1.5, C_TEAL),
            # Corps
            ("BACKGROUND",    (0, 1), (-1, -1), C_PURE),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [C_PURE, colors.HexColor("#EFF3F8")]),
            ("GRID",          (0, 0), (-1, -1), 0.4, C_SILVER),
            ("ALIGN",         (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ])
        if highlight_col >= 0:
            ts.add("TEXTCOLOR", (highlight_col, 1), (highlight_col, -1), C_TEAL)
            ts.add("FONTNAME",  (highlight_col, 1), (highlight_col, -1), FONT_MEDIUM)
        tbl.setStyle(ts)
        return tbl

    def alert_box(self, text: str, level: str = "info") -> Table:
        """
        Encadré coloré. level: 'info' | 'success' | 'warning' | 'critical'
        """
        color_map = {
            "info":     (C_BLUE,    colors.HexColor("#EFF6FF")),
            "success":  (C_SUCCESS, colors.HexColor("#ECFDF5")),
            "warning":  (C_WARNING, colors.HexColor("#FFFBEB")),
            "critical": (C_CRITICAL,colors.HexColor("#FEF2F2")),
        }
        border_c, bg_c = color_map.get(level, color_map["info"])
        icon = {"info": "ℹ", "success": "✓", "warning": "⚠", "critical": "✕"}.get(level, "•")
        cell_style = ParagraphStyle(
            "alert", fontName=FONT_BODY, fontSize=8.5, leading=13, textColor=C_TEXT_DARK,
        )
        avail_w = PAGE_W - MARGIN_L - MARGIN_R
        tbl = Table(
            [[Paragraph(f"<b>{icon}</b>  {text}", cell_style)]],
            colWidths=[avail_w],
        )
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, -1), bg_c),
            ("LINEABOVE",    (0, 0), (-1, 0), 3, border_c),
            ("BOX",          (0, 0), (-1, -1), 0.5, border_c),
            ("TOPPADDING",   (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 8),
            ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ]))
        return tbl

    # ── Page de couverture ────────────────────────────────────────────────────
    def _cover_page(self) -> list:
        """Génère une page de couverture sombre NexaFlow."""
        from reportlab.platypus import PageBreak
        from reportlab.platypus.flowables import Flowable

        class CoverBackground(Flowable):
            def __init__(self, title, subtitle, author, today):
                super().__init__()
                self.width = PAGE_W
                self.height = PAGE_H
                self._title = title
                self._subtitle = subtitle
                self._author = author
                self._today = today

            def draw(self):
                c = self.canv
                w, h = PAGE_W, PAGE_H

                # Fond Midnight Circuit
                c.setFillColor(C_MIDNIGHT)
                c.rect(0, 0, w, h, fill=1, stroke=0)

                # Grille fine
                c.setStrokeColor(C_TEAL)
                c.setLineWidth(0.3)
                c.setStrokeAlpha(0.06)
                for x in range(0, int(w), 40):
                    c.line(x, 0, x, h)
                for y in range(0, int(h), 40):
                    c.line(0, y, w, y)
                c.setStrokeAlpha(1)

                # Glow teal — haut droit
                c.setFillColorRGB(0.086, 0.835, 0.753, alpha=0.12)
                c.circle(w * 0.78, h * 0.82, 180, fill=1, stroke=0)

                # Ligne teal gauche
                c.setFillColor(C_TEAL)
                c.rect(18 * mm, h * 0.18, 2.5, h * 0.64, fill=1, stroke=0)

                # Logo NF — grand format
                c.setStrokeColor(C_TEAL)
                c.setLineWidth(5)
                c.setLineCap(1)
                lx, ly = 25 * mm, h * 0.68
                scale = 3.5
                # N
                p = c.beginPath()
                p.moveTo(lx, ly - 12*scale/3)
                p.lineTo(lx, ly + 12*scale/3)
                p.moveTo(lx, ly + 12*scale/3)
                p.lineTo(lx + 9*scale/3, ly - 12*scale/3)
                p.moveTo(lx + 9*scale/3, ly - 12*scale/3)
                p.lineTo(lx + 9*scale/3, ly + 12*scale/3)
                c.drawPath(p, stroke=1, fill=0)
                c.setFillColor(C_TEAL)
                c.circle(lx + 9*scale/3, ly - 12*scale/3, 3.5, fill=1, stroke=0)
                # F
                p2 = c.beginPath()
                p2.moveTo(lx + 14*scale/3, ly - 12*scale/3)
                p2.lineTo(lx + 14*scale/3, ly + 12*scale/3)
                p2.moveTo(lx + 14*scale/3, ly + 12*scale/3)
                p2.lineTo(lx + 28*scale/3, ly + 12*scale/3)
                p2.moveTo(lx + 14*scale/3, ly)
                p2.lineTo(lx + 24*scale/3, ly)
                c.drawPath(p2, stroke=1, fill=0)

                # NexaFlow logotype
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 28)
                c.drawString(25 * mm + 40, ly - 6, "NexaFlow")

                # Sous-marque
                c.setFillColor(C_TEAL)
                c.setFont("Helvetica", 10)
                c.drawString(25 * mm + 41, ly - 20, "Flow with confidence.")

                # Titre du document
                c.setFillColor(colors.white)
                c.setFont("Helvetica-Bold", 22)
                c.drawString(25 * mm, h * 0.48, self._title)

                if self._subtitle:
                    c.setFillColor(C_SILVER)
                    c.setFont("Helvetica", 12)
                    c.drawString(25 * mm, h * 0.44, self._subtitle)

                # Séparateur
                c.setFillColor(C_TEAL)
                c.rect(25 * mm, h * 0.41, 60 * mm, 1, fill=1, stroke=0)

                # Auteur + date
                c.setFillColor(C_TEXT_MUTED)
                c.setFont("Helvetica", 9)
                c.drawString(25 * mm, h * 0.37, self._author)
                c.drawString(25 * mm, h * 0.34, self._today)

                # Confidentialité
                c.setFillColor(C_GRAPHITE)
                c.roundRect(25 * mm, h * 0.09, 50 * mm, 7 * mm, 2, fill=1, stroke=0)
                c.setFillColor(C_WARNING)
                c.setFont("Helvetica-Bold", 8)
                c.drawCentredString(50 * mm, h * 0.105, "DOCUMENT CONFIDENTIEL")

                # Adresse
                c.setFillColor(C_TEXT_MUTED)
                c.setFont("Helvetica", 7)
                c.drawString(25 * mm, h * 0.06, "NexaFlow SA · Avenue Louise 54 · 1050 Bruxelles · www.nexaflow.io")

        today = datetime.today().strftime("%d %B %Y")
        return [
            CoverBackground(self.title, self.subtitle, self.author, today),
        ]

    # ── Build ─────────────────────────────────────────────────────────────────
    def build_story(self, story: list, output_path: Optional[str] = None):
        """
        Assemble et compile le PDF.

        story       : liste de Flowables (paragraphes, tables, etc.)
        output_path : chemin de sortie (remplace self.filename si fourni)
        """
        from reportlab.platypus import PageBreak

        out = output_path or self.filename

        draw_header, draw_footer = _make_header_footer(
            self.title, self.subtitle, self.confidential
        )

        def on_page(canvas, doc):
            draw_header(canvas, doc)
            draw_footer(canvas, doc)

        frame = Frame(
            MARGIN_L, MARGIN_B,
            PAGE_W - MARGIN_L - MARGIN_R,
            PAGE_H - MARGIN_T - MARGIN_B,
            leftPadding=0, rightPadding=0,
            topPadding=0, bottomPadding=0,
        )
        template = PageTemplate(id="main", frames=[frame], onPage=on_page)
        doc = BaseDocTemplate(
            out,
            pagesize=A4,
            pageTemplates=[template],
            title=self.title,
            author=self.author,
            creator="NexaFlow DRH · Bruno Mineo",
            subject=self.subtitle,
        )

        full_story = []
        if self.cover:
            full_story += self._cover_page()
            full_story.append(PageBreak())

        full_story += story
        doc.build(full_story)
        return out


# ── Démonstration / test ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(out_dir, "NexaFlow_Demo_PDF.pdf")

    pdf = NexaFlowPDF(
        filename=out_file,
        title="Audit RH Initial — M1",
        subtitle="People Report · Avril 2026 · NexaFlow SA",
        author="Bruno Mineo, DRH",
        confidential=True,
        cover=True,
    )

    story = [
        pdf.label("Synthèse exécutive"),
        pdf.teal_divider(),
        pdf.spacer(2),
        pdf.kpi_row([
            ("87",    "Effectif total"),
            ("€6,49M","Masse salariale / an"),
            ("18 %",  "Turnover estimé"),
            ("30 mois","Runway"),
        ]),
        pdf.spacer(5),
        pdf.h1("Diagnostic RH — Day 1"),
        pdf.body(
            "NexaFlow SA compte 87 employés répartis sur 4 départements. "
            "L'audit initial révèle l'absence de SIRH structuré, de framework de compétences "
            "et de politique salariale formalisée. Cinq cas urgents sont en cours de traitement."
        ),
        pdf.spacer(3),
        pdf.h2("Cas urgents ouverts"),
        pdf.data_table(
            headers=["Réf.", "Description", "Priorité", "Statut"],
            rows=[
                ["CAS-001", "Conflit Wouter vs Stijn (Engineering)", "HAUTE", "En cours"],
                ["CAS-002", "Rupture conventionnelle Jonas Goossens", "HAUTE", "À traiter"],
                ["CAS-003", "Plainte harcèlement — Sales (anonyme)", "CRITIQUE", "Urgent"],
                ["CAS-004", "Burn-out Camille Laurent — Product Design", "HAUTE", "Suivi médical"],
                ["CAS-005", "3 faux indépendants (risque ONSS)", "CRITIQUE", "Analyse légale"],
            ],
            col_widths=[22*mm, 82*mm, 26*mm, 26*mm],
            highlight_col=2,
        ),
        pdf.spacer(5),
        pdf.alert_box(
            "Les cas CAS-003 et CAS-005 nécessitent une intervention juridique immédiate "
            "avant toute régularisation ou communication interne.",
            level="critical",
        ),
        pdf.spacer(4),
        pdf.h2("Budget RH disponible"),
        pdf.body(
            "Masse salariale annuelle : <b>€ 6 492 500</b>. "
            "Budget hors salaires : <b>€ 140 000</b> (L&D €50K · Recrutement €35K · "
            "Team building €15K · Divers €40K). "
            "Consommé Q1 : €20 800 — Solde disponible : <b>€119 200</b>."
        ),
        pdf.spacer(3),
        pdf.alert_box(
            "Le burn rate global de NexaFlow SA est de €600K/mois avec un runway de ~30 mois. "
            "Toute décision RH à impact financier doit être validée par le CFO Marc Dujardin.",
            level="warning",
        ),
    ]

    result = pdf.build_story(story)
    print(f"✓ PDF généré : {result}")
