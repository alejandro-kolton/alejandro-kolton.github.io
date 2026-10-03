#!/usr/bin/env python3
"""Genera la lista de publicaciones a partir de arXiv.

Busca todos los papers con autor "Kolton" y se queda con los que tienen un
autor A./Alejandro ... Kolton (cubre "A. B. Kolton", "Alejandro B. Kolton",
"Alejandro Benedykt Kolton", "Alejandro Kolton", etc.).

Reescribe solo lo que está entre <!-- PUBS:START --> y <!-- PUBS:END --> en
publications.html y es/publications.html; el resto de la página se edita a mano.

Uso:  python3 scripts/update_pubs.py
"""
import html
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {"en": ROOT / "publications.html", "es": ROOT / "es" / "publications.html"}
API = "https://export.arxiv.org/api/query"
NS = {"a": "http://www.w3.org/2005/Atom", "x": "http://arxiv.org/schemas/atom"}
PAGE_SIZE = 100

LABELS = {
    "en": {"count": "{n} papers on arXiv, newest first.", "preprint": "preprint"},
    "es": {"count": "{n} trabajos en arXiv, del más reciente al más antiguo.", "preprint": "preprint"},
}


def is_me(name):
    parts = name.replace(".", ". ").split()
    return len(parts) >= 2 and parts[-1] == "Kolton" and parts[0].startswith("A")


def fetch_all():
    entries, start = [], 0
    while True:
        query = urllib.parse.urlencode({
            "search_query": "au:Kolton",
            "sortBy": "submittedDate",
            "sortOrder": "descending",
            "start": start,
            "max_results": PAGE_SIZE,
        })
        for attempt in range(4):
            try:
                with urllib.request.urlopen(f"{API}?{query}", timeout=60) as r:
                    root = ET.fromstring(r.read())
                break
            except Exception as e:  # arXiv a veces falla; reintentar
                print(f"arXiv falló ({e}), reintentando...", file=sys.stderr)
                time.sleep(10 * (attempt + 1))
        else:
            sys.exit("No se pudo consultar arXiv; no se modifica nada.")
        batch = root.findall("a:entry", NS)
        entries += batch
        if len(batch) < PAGE_SIZE:
            return entries
        start += PAGE_SIZE
        time.sleep(3)  # pedido de arXiv: no más de 1 consulta cada 3 s


def text(entry, tag):
    el = entry.find(tag, NS)
    return " ".join(el.text.split()) if el is not None and el.text else ""


def parse(entry):
    authors = [text(a, "a:name") for a in entry.findall("a:author", NS)]
    if not any(is_me(a) for a in authors):
        return None
    arxiv_id = re.sub(r"v\d+$", "", text(entry, "a:id").split("/abs/")[-1])
    arxiv_year = text(entry, "a:published")[:4]
    journal = text(entry, "x:journal_ref")
    return {
        "id": arxiv_id,
        "year": journal_year(journal, arxiv_year),
        "title": text(entry, "a:title"),
        "authors": authors,
        "journal": journal,
        "doi": text(entry, "x:doi"),
    }


def journal_year(journal, arxiv_year):
    """Año de publicación en la revista; si no se puede leer, el de arXiv."""
    years = re.findall(r"\((\d{4})\)", journal) or re.findall(r"\b(?:19|20)\d{2}\b", journal)
    for y in reversed(years):
        # descarta números que no son años (volúmenes, páginas); acepta años
        # anteriores a arXiv por las actas que se suben después de publicadas
        if int(arxiv_year) - 5 <= int(y) <= int(arxiv_year) + 3:
            return y
    return arxiv_year


def render_authors(authors):
    out = []
    for a in authors:
        a = html.escape(a)
        out.append(f"<strong>{a}</strong>" if is_me(html.unescape(a)) else a)
    return ", ".join(out)


def render(papers, lang):
    lab = LABELS[lang]
    by_year = defaultdict(list)
    for p in papers:
        by_year[p["year"]].append(p)

    lines = [f'<p class="muted">{lab["count"].format(n=len(papers))}</p>']
    for year in sorted(by_year, reverse=True):
        lines.append(f'<h2 id="y{year}">{year}</h2>')
        lines.append('<ul class="pubs">')
        for p in by_year[year]:
            meta = [render_authors(p["authors"])]
            if p["journal"]:
                meta.append(f'<em>{html.escape(p["journal"])}</em>')
            else:
                meta.append(f'<span class="tag">{lab["preprint"]}</span>')
            links = [f'<a href="https://arxiv.org/abs/{p["id"]}">arXiv:{p["id"]}</a>']
            if p["doi"]:
                doi = p["doi"].split()[0]
                links.append(f'<a href="https://doi.org/{html.escape(doi)}">DOI</a>')
            lines.append(
                f'  <li><a href="https://arxiv.org/abs/{p["id"]}">{html.escape(p["title"])}</a><br>\n'
                f'    <span class="muted">{" — ".join(meta)}</span><br>\n'
                f'    <span class="pub-links">{" · ".join(links)}</span></li>'
            )
        lines.append("</ul>")
    return "\n".join(lines)


def main():
    papers = [p for p in (parse(e) for e in fetch_all()) if p]
    if not papers:
        sys.exit("arXiv no devolvió ningún paper; no se modifica nada.")
    for lang, path in PAGES.items():
        page = path.read_text(encoding="utf-8")
        new = re.sub(
            r"(<!-- PUBS:START -->).*?(<!-- PUBS:END -->)",
            lambda m: f"{m.group(1)}\n{render(papers, lang)}\n{m.group(2)}",
            page,
            flags=re.S,
        )
        if new != page:
            path.write_text(new, encoding="utf-8")
            print(f"Actualizado {path.relative_to(ROOT)}")
    print(f"{len(papers)} papers.")


if __name__ == "__main__":
    main()
