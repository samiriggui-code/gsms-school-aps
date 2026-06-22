"""Extract exact pdf-lib fill coordinates from CNAPS template underscores."""
import json
import os
import sys

import fitz

PDF = os.path.join(os.path.dirname(__file__), "..", "lib", "cnaps", "assets", "cnaps-form-template.pdf")

# (page_index, key, prefer widest underscore on page near y if multiple)
TARGETS = [
    (1, "nom", None),
    (2, "address", None),
    (3, "schoolName", 270),
    (3, "schoolLine2", 214),
    (3, "schoolCnapsAuth", 175),
    (3, "schoolAddress", 96),
    (4, "schoolPostalCode", 838),
    (4, "schoolCity", 838),
    (5, "formationLabel", 628),
    (5, "formationLine2", 544),
]


def pdflib_y(page, rect):
    return round(page.rect.height - rect.y1 + 7, 1)


def underscore_zones(page):
    zones = []
    for w in page.get_text("words"):
        if not w[4] or set(w[4]) - set("_:"):
            continue
        if len(w[4].replace(":", "")) < 5:
            continue
        rect = fitz.Rect(w[0], w[1], w[2], w[3])
        zones.append(
            {
                "text": w[4],
                "x0": round(rect.x0, 1),
                "x1": round(rect.x1, 1),
                "y_pdflib": pdflib_y(page, rect),
                "width": round(rect.width, 1),
            }
        )
    return zones


def pick_zone(zones, near_y=None, min_x=None):
    if near_y is not None:
        zones = sorted(zones, key=lambda z: abs(z["y_pdflib"] - near_y))
    if min_x is not None:
        zones = [z for z in zones if z["x0"] >= min_x] or zones
    return zones[0] if zones else None


def main():
    doc = fitz.open(PDF)
    out = {}
    for page_idx, key, near_y in TARGETS:
        page = doc[page_idx]
        zones = underscore_zones(page)
        if key == "schoolPostalCode":
            zone = pick_zone([z for z in zones if z["x0"] < 120], near_y=838)
        elif key == "schoolCity":
            zone = pick_zone([z for z in zones if z["x0"] > 200], near_y=838)
        else:
            zone = pick_zone(zones, near_y=near_y)
        if not zone:
            print(f"MISSING {key} page {page_idx}", file=sys.stderr)
            continue
        out[key] = {
            "page": page_idx,
            "x": round(zone["x0"] + 2, 1),
            "y": zone["y_pdflib"],
            "maxWidth": round(zone["width"] - 4, 1),
        }

    # checkboxes from vector squares
    for pno in [1, 2, 3, 5]:
        page = doc[pno]
        boxes = []
        for d in page.get_drawings():
            r = d.get("rect")
            if not r or r.width < 8 or r.width > 12:
                continue
            boxes.append(
                {
                    "page": pno,
                    "x": round(r.x0, 1),
                    "y": round(page.rect.height - r.y1, 1),
                }
            )
        out[f"_checkboxes_p{pno}"] = boxes

    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
