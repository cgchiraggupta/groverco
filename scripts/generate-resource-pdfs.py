#!/usr/bin/env python3
"""Generate the downloadable PDF versions of the free guides.

Run from the repository root:
    python3 scripts/generate-resource-pdfs.py

The script reads the text from the public HTML guides so the PDFs stay in
sync with the web pages. Requires reportlab (install it in a small venv if
your system Python is externally managed).
"""

from __future__ import annotations

import html as html_lib
import re
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    HRFlowable,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
)
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "resources" / "downloads"
WHATSAPP_URL = "https://wa.me/918287980063"
WHATSAPP_DISPLAY = "+91 82879 80063"

INK = HexColor("#14201a")
BODY = HexColor("#2c3831")
MUTED = HexColor("#66736a")
GOLD = HexColor("#a9864a")
RULE = HexColor("#ded6c5")
PAPER = HexColor("#fbf9f4")

GUIDES = [
    {
        "source": ROOT / "resources" / "business-readiness.html",
        "output": OUT_DIR / "grover-co-business-readiness-checklist.pdf",
        "label": "BUSINESS GUIDE",
        "subject": "A practical business readiness checklist from Grover & Co.",
        "message": "I downloaded the Business Readiness Checklist",
    },
    {
        "source": ROOT / "resources" / "creator-readiness.html",
        "output": OUT_DIR / "grover-co-creator-collaboration-readiness-checklist.pdf",
        "label": "CREATOR GUIDE",
        "subject": "A creator collaboration readiness checklist from Grover & Co.",
        "message": "I downloaded the Creator Collaboration Readiness Checklist",
    },
]


def register_fonts() -> tuple[str, str, str, str]:
    candidates = [
        Path("/System/Library/Fonts/Supplemental/Georgia.ttf"),
        Path("/Library/Fonts/Georgia.ttf"),
    ]
    regular = next((path for path in candidates if path.exists()), None)
    if regular is None:
        return "Times-Roman", "Times-Bold", "Times-Italic", "Times-BoldItalic"
    folder = regular.parent
    mapping = {
        "GuideSerif": regular,
        "GuideSerif-Bold": folder / "Georgia Bold.ttf",
        "GuideSerif-Italic": folder / "Georgia Italic.ttf",
        "GuideSerif-BoldItalic": folder / "Georgia Bold Italic.ttf",
    }
    for name, path in mapping.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))
    pdfmetrics.registerFontFamily(
        "GuideSerif",
        normal="GuideSerif",
        bold="GuideSerif-Bold",
        italic="GuideSerif-Italic",
        boldItalic="GuideSerif-BoldItalic",
    )
    return "GuideSerif", "GuideSerif-Bold", "GuideSerif-Italic", "GuideSerif-BoldItalic"


def strip_tags(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", html_lib.unescape(value)).strip()


def text_markup(value: str) -> str:
    return escape(strip_tags(value))


def title_markup(value: str) -> str:
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"<em>(.*?)</em>", r"<i>\1</i>", value, flags=re.S)
    value = re.sub(r"<(?!i>|/i>)[^>]+>", "", value)
    return escape(html_lib.unescape(value)).replace("&lt;i&gt;", "<i>").replace("&lt;/i&gt;", "</i>")


def extract_guide(path: Path) -> dict:
    source = path.read_text(encoding="utf-8")
    main = re.search(r"<main[^>]*>(.*?)</main>", source, re.S).group(1)
    main = re.sub(r'<div class="guide-toolbar".*?</div>', "", main, flags=re.S)
    title = re.search(r"<h1>(.*?)</h1>", main, re.S).group(1)
    lead = re.search(r'<p class="guide-lead">(.*?)</p>', main, re.S).group(1)
    updated = re.search(r'<p class="guide-updated">(.*?)</p>', main, re.S).group(1)
    sections = []
    for block in re.findall(r'<section class="guide-section">(.*?)</section>', main, re.S):
        heading = re.search(r"<h2>(.*?)</h2>", block, re.S)
        if not heading:
            continue
        paragraphs = [strip_tags(p) for p in re.findall(r"<p>(.*?)</p>", block, re.S)]
        items = [strip_tags(li) for li in re.findall(r"<li>(.*?)</li>", block, re.S)]
        sections.append(
            {
                "heading": strip_tags(heading.group(1)),
                "paragraphs": paragraphs,
                "items": items,
            }
        )
    return {
        "title": title,
        "lead": strip_tags(lead),
        "sections": sections,
        "updated": strip_tags(updated),
    }


class ChecklistItem(Flowable):
    def __init__(self, text: str, style: ParagraphStyle, available_width: float):
        super().__init__()
        self.paragraph = Paragraph(text, style)
        self.available_width = available_width

    def wrap(self, width: float, height: float) -> tuple[float, float]:
        self.paragraph.wrap(width - 17, height)
        self.height = self.paragraph.height + 5
        return width, self.height

    def draw(self) -> None:
        self.canv.setStrokeColor(GOLD)
        self.canv.setLineWidth(0.8)
        self.canv.rect(0, self.height - 10.5, 7, 7, stroke=1, fill=0)
        self.paragraph.drawOn(self.canv, 17, 0)


def build_styles(fonts: tuple[str, str, str, str]) -> dict[str, ParagraphStyle]:
    regular, bold, italic, bold_italic = fonts
    return {
        "title": ParagraphStyle(
            "title",
            fontName=regular,
            fontSize=29,
            leading=33,
            textColor=INK,
            spaceAfter=12,
            alignment=TA_LEFT,
        ),
        "lead": ParagraphStyle(
            "lead",
            fontName=regular,
            fontSize=11.2,
            leading=18,
            textColor=BODY,
            spaceAfter=4,
        ),
        "heading": ParagraphStyle(
            "heading",
            fontName=bold,
            fontSize=14,
            leading=18,
            textColor=INK,
            spaceBefore=4,
            spaceAfter=7,
        ),
        "body": ParagraphStyle(
            "body",
            fontName=regular,
            fontSize=10.4,
            leading=16.4,
            textColor=BODY,
        ),
        "item": ParagraphStyle(
            "item",
            fontName=regular,
            fontSize=10.2,
            leading=15.8,
            textColor=BODY,
        ),
        "note": ParagraphStyle(
            "note",
            fontName=italic,
            fontSize=9,
            leading=14,
            textColor=MUTED,
        ),
        "cta_eyebrow": ParagraphStyle(
            "cta_eyebrow",
            fontName=bold,
            fontSize=8,
            leading=12,
            textColor=GOLD,
        ),
        "cta_title": ParagraphStyle(
            "cta_title",
            fontName=regular,
            fontSize=19,
            leading=24,
            textColor=INK,
            spaceBefore=3,
            spaceAfter=6,
        ),
        "cta_body": ParagraphStyle(
            "cta_body",
            fontName=regular,
            fontSize=10,
            leading=16,
            textColor=BODY,
        ),
        "cta_link": ParagraphStyle(
            "cta_link",
            fontName=bold,
            fontSize=10.5,
            leading=16,
            textColor=GOLD,
            spaceBefore=5,
        ),
    }


class GuideDoc(BaseDocTemplate):
    def __init__(self, filename: str, label: str, subject: str, fonts: tuple[str, str], **kwargs):
        super().__init__(
            filename,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=27 * mm,
            bottomMargin=22 * mm,
            title=subject,
            author="Grover & Co.",
            subject=subject,
            creator="Grover & Co.",
            **kwargs,
        )
        self.label = label
        self.serif, self.serif_bold = fonts
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            self.width,
            self.height,
            id="guide",
            leftPadding=0,
            rightPadding=0,
            topPadding=0,
            bottomPadding=0,
        )
        self.addPageTemplates(
            PageTemplate(id="guide", frames=[frame], onPage=self.decorate)
        )

    def decorate(self, canv: canvas.Canvas, doc) -> None:
        width, height = A4
        canv.saveState()
        canv.setFillColor(PAPER)
        canv.rect(0, 0, width, height, stroke=0, fill=1)
        # Masthead
        canv.setFillColor(INK)
        canv.setFont(self.serif_bold, 10)
        canv.drawString(20 * mm, height - 16 * mm, "GROVER & CO.")
        canv.setFillColor(MUTED)
        canv.setFont(self.serif, 7.2)
        canv.drawRightString(width - 20 * mm, height - 16 * mm, self.label)
        canv.setStrokeColor(GOLD)
        canv.setLineWidth(0.7)
        canv.line(20 * mm, height - 19.5 * mm, width - 20 * mm, height - 19.5 * mm)
        # Footer
        canv.setStrokeColor(RULE)
        canv.setLineWidth(0.5)
        canv.line(20 * mm, 16 * mm, width - 20 * mm, 16 * mm)
        canv.setFillColor(MUTED)
        canv.setFont(self.serif, 7.4)
        canv.drawString(20 * mm, 11.5 * mm, "groverco.in  ·  Practical guides for clearer next steps")
        canv.drawRightString(width - 20 * mm, 11.5 * mm, f"{doc.page}")
        canv.restoreState()


def cta_block(styles: dict[str, ParagraphStyle], message: str) -> list:
    link = (
        f"{WHATSAPP_URL}?text="
        + quote(
            f"Hi Nishant, I'm working through the Grover & Co. free guides. "
            f"{message} and I'd like to discuss a version made specifically for my business."
        )
    )
    box = [
        HRFlowable(width="100%", thickness=0.6, color=RULE, spaceBefore=18, spaceAfter=16),
        Paragraph("NEED SOMETHING MADE FOR YOUR BUSINESS?", styles["cta_eyebrow"]),
        Paragraph("A resource built around <i>your</i> needs.", styles["cta_title"]),
        Paragraph(
            "The free guides are general starting points. If you want a checklist, template or "
            "workbook created specifically for your company, message Nishant on WhatsApp.",
            styles["cta_body"],
        ),
        Paragraph(
            f'<link href="{WHATSAPP_URL}" color="#a9864a">WhatsApp {WHATSAPP_DISPLAY}</link>',
            styles["cta_link"],
        ),
    ]
    return box


def build(guide: dict, meta: dict, styles: dict[str, ParagraphStyle], fonts: tuple[str, str, str, str]) -> None:
    story = [
        Spacer(1, 2 * mm),
        Paragraph(title_markup(guide["title"]), styles["title"]),
        Paragraph(text_markup(guide["lead"]), styles["lead"]),
        Spacer(1, 8 * mm),
    ]
    for section in guide["sections"]:
        block = [
            HRFlowable(width="100%", thickness=0.5, color=RULE, spaceBefore=7, spaceAfter=10),
            Paragraph(text_markup(section["heading"]), styles["heading"]),
        ]
        for paragraph in section["paragraphs"]:
            block.append(Paragraph(text_markup(paragraph), styles["body"]))
            block.append(Spacer(1, 2 * mm))
        for item in section["items"]:
            block.append(ChecklistItem(text_markup(item), styles["item"], 170 * mm))
        story.append(KeepTogether(block))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph(text_markup(guide["updated"]), styles["note"]))
    story.extend(cta_block(styles, meta["message"]))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = GuideDoc(str(meta["output"]), meta["label"], meta["subject"], (fonts[0], fonts[1]))
    doc.build(story)


def main() -> None:
    fonts = register_fonts()
    styles = build_styles(fonts)
    for meta in GUIDES:
        guide = extract_guide(meta["source"])
        build(guide, meta, styles, fonts)
        print(f"wrote {meta['output'].relative_to(ROOT)}")


if __name__ == "__main__":
    main()
