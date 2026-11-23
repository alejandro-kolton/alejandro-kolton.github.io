#!/usr/bin/env python3
"""Genera la lista de publicaciones a partir de arXiv.

Busca todos los papers con autor "Kolton" y se queda con los que tienen un
autor A./Alejandro ... Kolton (cubre "A. B. Kolton", "Alejandro B. Kolton",
"Alejandro Benedykt Kolton", "Alejandro Kolton", etc.).

Muchos trabajos tienen en arXiv el DOI pero no la referencia de la revista, o
ninguno de los dos (no siempre se actualiza arXiv al publicar). Para esos se
consulta Crossref: con el DOI se obtiene revista/volumen/página/año, y sin DOI se
busca un artículo publicado con exactamente el mismo título y un autor Kolton.

Reescribe solo lo que está entre <!-- PUBS:START --> y <!-- PUBS:END --> en
publications.html y es/publications.html; el resto de la página se edita a mano.

Uso:  python3 scripts/update_pubs.py
"""
import html
import json
import unicodedata
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
CROSSREF = "https://api.crossref.org/works"
UA = {"User-Agent": "personal-website-publication-list/1.0 (https://github.com/alejandro-kolton/alejandro-kolton.github.io)"}

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
    return {
        "id": arxiv_id,
        "arxiv_year": text(entry, "a:published")[:4],
        "title": text(entry, "a:title"),
        "authors": authors,
        "journal": text(entry, "x:journal_ref"),
        "doi": text(entry, "x:doi"),
    }


def get_json(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
        except Exception:
            pass
        time.sleep(3 * (attempt + 1))
    return None


def norm_title(t):
    t = unicodedata.normalize("NFKD", html.unescape(re.sub(r"<[^>]+>", "", t)))
    return re.sub(r"[^a-z0-9]", "", t.lower())


def crossref_ref(m):
    """Arma 'Phys. Rev. B 107, 094508 (2023)' a partir de un registro de Crossref."""
    journal = (m.get("short-container-title") or m.get("container-title") or [""])[0]
    if not journal or m.get("type") not in ("journal-article", "proceedings-article"):
        return "", ""
    date = m.get("published-print") or m.get("published-online") or m.get("published") or {}
    year = str((date.get("date-parts") or [[None]])[0][0] or "")
    ref = journal
    if m.get("volume"):
        ref += f' {m["volume"]}'
    page = m.get("article-number") or m.get("page")
    if page:
        ref += f", {page}" if m.get("volume") else f" {page}"
    if year:
        ref += f" ({year})"
    return ref, year


def complete_from_crossref(p):
    """Completa revista y DOI de un paper que en arXiv figura sin journal_ref."""
    if p["doi"]:
        data = get_json(f'{CROSSREF}/{urllib.parse.quote(p["doi"].split()[0])}')
        if data:
            p["journal"], _ = crossref_ref(data["message"])
        return
    query = urllib.parse.urlencode({
        "query.bibliographic": p["title"],
        "query.author": "Kolton",
        "filter": "type:journal-article",
        "rows": 5,
    })
    data = get_json(f"{CROSSREF}?{query}")
    for m in (data or {}).get("message", {}).get("items", []):
        same_title = any(norm_title(t) == norm_title(p["title"]) for t in m.get("title", []))
        kolton = any(a.get("family") == "Kolton" for a in m.get("author", []))
        if same_title and kolton:
            ref, _ = crossref_ref(m)
            if ref:
                p["journal"], p["doi"] = ref, m["DOI"]
            return


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
    for p in papers:
        if not p["journal"]:
            complete_from_crossref(p)
            if p["journal"]:
                print(f'Crossref: {p["id"]} -> {p["journal"]}')
            time.sleep(1)
        p["year"] = journal_year(p["journal"], p["arxiv_year"])
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
