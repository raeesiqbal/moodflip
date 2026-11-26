"""Extract independent SEO expectations from the replacement section of Joy's DOCX.

Usage: python playwright/tests/seo/extract-fixture.py SOURCE.docx
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"


def extract_rows(path):
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
        rel_root = ET.fromstring(archive.read("word/_rels/document.xml.rels"))
    destinations = {item.get("Id"): item.get("Target") for item in rel_root}
    rows = []
    page = 1
    for paragraph in root.iter(W + "p"):
        text = "".join(node.text or "" for node in paragraph.iter(W + "t")).strip()
        style_node = paragraph.find(W + "pPr/" + W + "pStyle")
        style = style_node.get(W + "val") if style_node is not None else "Normal"
        links = [destinations.get(link.get(R)) for link in paragraph.iter(W + "hyperlink")]
        if text:
            rows.append({"text": text, "style": style, "links": links, "page": page})
        page += sum(1 for _ in paragraph.iter(W + "lastRenderedPageBreak"))
    return rows


def main(source):
    rows = extract_rows(source)
    index_start = next(i for i, row in enumerate(rows) if row["text"] == "Proposed mood guide index")
    sources_start = next(i for i, row in enumerate(rows) if row["text"] == "Sources and evidence limits")
    starts = [i for i, row in enumerate(rows[:index_start]) if re.fullmatch(r"\d{2}  .+", row["text"])]
    articles = []
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else index_start
        block = rows[start:end]
        assert block[1]["text"].startswith("URL: ")
        assert block[2]["text"].startswith("HTML title: ")
        assert block[3]["text"].startswith("Meta description: ")
        lift = next(i for i, row in enumerate(block) if row["text"] == "Lift My Mood")
        related = next(row for row in block if row["text"].startswith("Related guides: "))
        further = next((row for row in block if row["text"].startswith("Further reading: ")), None)
        url = block[1]["text"].removeprefix("URL: ")
        body = []
        for row in block[5:lift]:
            kind = {"Heading2": "h1", "Heading3": "h2", "ListBullet": "li"}.get(row["style"], "p")
            body.append({"kind": kind, "text": row["text"]})
        assert body[0]["kind"] == "h1"
        assert len(related["links"]) == 3
        assert block[-1]["text"].startswith("MoodFlip offers general self-help prompts.")
        articles.append({
            "number": position + 1,
            "page": block[0]["page"],
            "url": url,
            "slug": url.rsplit("/", 1)[-1],
            "title": block[2]["text"].removeprefix("HTML title: "),
            "description": block[3]["text"].removeprefix("Meta description: "),
            "body": body,
            "liftLabel": block[lift]["text"],
            "relatedLabels": related["text"].removeprefix("Related guides: ").split(" · "),
            "relatedUrls": related["links"],
            "furtherLabel": further["text"].removeprefix("Further reading: ") if further else None,
            "furtherUrl": further["links"][0] if further else None,
            "disclaimer": block[-1]["text"],
        })
    assert len(articles) == 31

    index_rows = rows[index_start + 2 : sources_start]
    assert index_rows[0]["text"].startswith("Title: ")
    assert index_rows[1]["text"].startswith("Meta description: ")
    categories = []
    for row in index_rows[2:]:
        if row["style"] == "Heading3":
            categories.append({"heading": row["text"], "description": "", "labels": [], "urls": []})
        elif categories and not categories[-1]["description"]:
            categories[-1]["description"] = row["text"]
        elif categories and " · " in row["text"]:
            categories[-1]["labels"] = row["text"].split(" · ")
            categories[-1]["urls"] = row["links"]
    assert len(categories) == 5
    assert sum(len(category["urls"]) for category in categories) == 31
    fixture = {
        "source": Path(source).name,
        "articles": articles,
        "index": {
            "url": "https://moodflip.coach/moods",
            "page": rows[index_start]["page"],
            "title": index_rows[0]["text"].removeprefix("Title: "),
            "description": index_rows[1]["text"].removeprefix("Meta description: "),
            "heading": index_rows[2]["text"],
            "intro": index_rows[3]["text"],
            "categories": categories,
            "disclaimer": index_rows[-1]["text"],
        },
    }
    output = Path(__file__).with_name("fixtures") / "expected-seo-content.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(articles)} articles and {len(categories)} categories to {output}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
