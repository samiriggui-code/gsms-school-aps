"""Calibrate CNAPS form field positions with PyMuPDF."""
import fitz
import json
import os

PDF = os.path.join(
    os.path.dirname(__file__),
    "..",
    "lib",
    "cnaps",
    "assets",
    "cnaps-form-template.pdf",
)

KEYWORDS = [
    "Madame",
    "Monsieur",
    "Nom",
    "Prénom",
    "Prenom",
    "naissance",
    "Adresse",
    "Courriel",
    "mail",
    "SIRET",
    "agrément",
    "agrement",
    "Formation",
    "Gardiennage",
    "télésurveillance",
    "telesurveillance",
    "CNI",
    "identité",
]


def main():
    doc = fitz.open(PDF)
    print("pages", doc.page_count)
    hits = []
    for pno in range(doc.page_count):
        page = doc[pno]
        for kw in KEYWORDS:
            for rect in page.search_for(kw):
                hits.append(
                    {
                        "page": pno,
                        "keyword": kw,
                        "x0": round(rect.x0, 1),
                        "y0": round(rect.y0, 1),
                        "x1": round(rect.x1, 1),
                        "y1": round(rect.y1, 1),
                        # pdf-lib y from bottom
                        "y_pdflib": round(page.rect.height - rect.y1, 1),
                    }
                )
    hits.sort(key=lambda h: (h["page"], -h["y_pdflib"], h["x0"]))
    for h in hits:
        print(
            f"p{h['page']:02d} y={h['y_pdflib']:6.1f} x={h['x0']:6.1f} "
            f"{h['keyword']!r} rect=({h['x0']},{h['y0']},{h['x1']},{h['y1']})"
        )

    # Drawings / widgets (checkboxes)
    print("\n--- widgets page 0-6 ---")
    for pno in range(min(7, doc.page_count)):
        page = doc[pno]
        widgets = list(page.widgets() or [])
        if widgets:
            print(f"page {pno}: {len(widgets)} widgets")
            for w in widgets[:20]:
                r = w.rect
                print(
                    f"  {w.field_name!r} type={w.field_type} "
                    f"x={r.x0:.1f} y_pdflib={page.rect.height - r.y1:.1f}"
                )


if __name__ == "__main__":
    main()
