#!/usr/bin/env python3
"""Import ONLY official Austrian SRDP PDFs by exact descriptor (no Aufgabentyp filter).

Source https://aufgabenpool.at/amn/index.php?id=AM; official public descriptor AJAX.
Runs on a GitHub Actions runner (uses Chrome-like TLS to access official portal).
No synthetic tasks. For original PDFs we verify PDF magic; fail closed on bad links.
"""
from __future__ import annotations

import hashlib
import json
import random
import re
import sys
import time
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from curl_cffi import requests

ROOT = Path("public/maths/sa-01")
DEST = ROOT / "official-pdfs"
BASE = "https://aufgabenpool.at/amn/"
TARGETS = {
    "4.1": ("Grenzwerte & Stetigkeit", 10),
    "4.2": ("Differenzen- & Differentialquotient", 15),
    "4.3": ("Ableitungsregeln", 10),
    "4.4": ("Tangenten, Extrema & Wendepunkte", 15),
    "4.5": ("Funktion, Ableitung & Stammfunktion", 15),
    "4.6": ("Stammfunktionen", 10),
    "4.8": ("Integralrechnung – Flächen und Anwendungen", 15),
    "B_T_4.1": ("Sättigung, Abklingen & Unstetigkeit", 10),
    "B_T2_4.2": ("HTL 2: Winkel-, Logarithmus- & Quotientenregel", 10),
    "B_T2_4.4": ("HTL 2: Differentialrechnung in Anwendungen", 10),
    "B_T2_4.5": ("HTL 2: Integralrechnung in Anwendungen", 10),
}
EXCLUDE_TITLE = re.compile(
    r"\b(?:verkehrszeichen|stoppschild)\b", re.IGNORECASE
)
session = requests.Session(impersonate="chrome")
headers = {
    "Referer": BASE + "index.php?id=AM",
    "X-Requested-With": "XMLHttpRequest",
}


def retry(method: str, url: str, *, data=None, timeout=40, max_tries=3):
    for attempt in range(max_tries):
        try:
            resp = session.request(
                method, url, data=data, timeout=timeout,
                headers=headers if method == "POST" else {"Referer": headers["Referer"]},
            )
            if resp.status_code == 200:
                return resp
            print("WARN", method, resp.status_code, url, "attempt", attempt+1, flush=True)
        except Exception as ex:
            print("WARN", method, str(ex)[:150], "attempt", attempt+1, flush=True)
        time.sleep(0.4 + attempt*0.8)
    return None


def autocomplete(code):
    html = retry("POST", BASE+"php/search.php", data={
        "query": code, "searchCase": "desk", "gate": "AM",
        "sstufe": "0", "isExam": "0", "hasBf": "0",
    })
    if html is None:
        raise RuntimeError("Official descriptor search API unavailable for "+code)
    soup = BeautifulSoup(html.text, "html.parser")
    options = []
    for el in soup.select("[id*='hh']"):
        value = str(el.get("id", ""))
        m = re.match(r"^([0-9]+)hh(.+)$", value)
        if m:
            options.append((m.group(1),m.group(2).strip(),el.get_text(" ",strip=True)))
    for number,label,full in options:
        if label == code:
            return number,full
    print("Autocomplete choices for", code, options[:20],flush=True)
    return None, None


def official_rows(descriptor_id, chapter):
    params = {
        "getData": "1", "start": "0", "limit": "250",
        "desk_send": descriptor_id, "lp_send": "-1",
        "aname_send": "-1", "coll_send": "-1",
        "gate": "AM", "sstufe": "0", "isExam": "0",
        "hasBf": "0", "spalte": "sortByDate",
        "asc": "0", "screenWidth": "1280",
    }
    resp = retry("POST",BASE+"php/results.php",data=params,timeout=70)
    if resp is None:
        raise RuntimeError("Official results API unavailable for "+chapter)
    soup = BeautifulSoup(resp.text,"html.parser")
    rows = []
    seen = set()
    for check in soup.select('input[name="itemSel"][data-value]'):
        pieces = check["data-value"].split(";")
        if len(pieces)<5: continue
        collection, title, subpart, parent_id, file_id = pieces[:5]
        if not re.fullmatch(r"(?:A|B)_\d+|1_\d+",parent_id):continue
        number = parent_id+" "+subpart if subpart else parent_id
        if number in seen:continue
        modal_id = check.get("id","").replace("addTocart_","detailAufgabe")
        modal = soup.find(id=modal_id)
        if not modal:continue
        links = [
            a for a in modal.select('a[href$=".pdf"]')
            if "Deutsch" in a.get_text(" ",strip=True)
        ]
        if not links:
            links = [a for a in modal.select('a[href$=".pdf"]') if "SLO" not in a.get("href","")]
        if not links:continue
        href = links[0].get("href","")
        if not re.match(r"^(teila|teilb1|Typ-1|Typ-2)/[0-9]+/",href,re.I):
            continue
        title_text = modal.select_one(".modal-title")
        text = title_text.get_text(" ",strip=True) if title_text else title
        title_clean = re.sub(r"\s+[a-z]\)$","",text)
        title_clean = title_clean.rstrip("* ").strip()
        if EXCLUDE_TITLE.search(title_clean): continue
        pdf = urljoin(BASE,href)
        if not pdf.lower().split("?")[0].endswith(".pdf"):continue
        seen.add(number)
        rows.append({
            "number":number,
            "parent":parent_id,
            "title":title_clean,
            "part":subpart,
            "source":pdf,
            "collection":collection,
            "file_id":file_id,
        })
    return rows


def safe_filename(row):
    # Same parent PDF is reused for several sub-questions; avoid duplicate blobs.
    return row["parent"]+"_"+hashlib.sha256(row["source"].encode("utf-8")).hexdigest()[:12]+".pdf"


def fetch_pdf(row):
    DEST.mkdir(parents=True,exist_ok=True)
    name=safe_filename(row)
    file=DEST/name
    if file.exists() and file.stat().st_size > 1000:
        if file.open("rb").read(4)==b"%PDF":
            return name
    resp = retry("GET",row["source"],timeout=60,max_tries=3)
    if resp is None or resp.content[:4]!=b"%PDF" or len(resp.content)<800:
        print("BAD_PDF",row["number"],row["source"],flush=True)
        return None
    if len(resp.content)>20_000_000:
        print("TOO_LARGE_PDF",row["source"],len(resp.content),flush=True)
        return None
    file.write_bytes(resp.content)
    return name


def main():
    page=retry("GET",BASE+"index.php?id=AM")
    if page is None: raise RuntimeError("Official website homepage unavailable")
    soup=BeautifulSoup(page.text,"html.parser")
    gate=soup.find(id="GateKeeper")
    if not gate or gate.get("data-value")!="AM":
        raise RuntimeError("Wrong portal: AM-only gate not present")
    output=[]
    report={}
    cached={}
    for chapter,(title,target) in TARGETS.items():
        descriptor_id,official_label=autocomplete(chapter)
        if descriptor_id is None:
            report[chapter]={"available":0,"selected":0,"note":"No exact descriptor in official pool"}
            continue
        rows=official_rows(descriptor_id,chapter)
        if not rows and re.search(r"\([1-9]\d*\)",official_label or ""):
            raise RuntimeError("No records for supposedly nonempty descriptor "+chapter)
        unique=[]
        # Prefer distinct PDFs so practice does not repeat four subparts of one document.
        used=set()
        for row in rows:
            if row["source"] not in used:
                unique.append(row);used.add(row["source"])
        remaining=[row for row in rows if row not in unique]
        rand=random.Random("Studyverse-SA-2026-11-26:"+chapter)
        rand.shuffle(unique)
        rand.shuffle(remaining)
        candidates=unique+remaining
        selected=[]
        for row in candidates:
            if len(selected)>=target:break
            name=cached.get(row["source"])
            if name is None:
                name=fetch_pdf(row)
                if name:cached[row["source"]]=name
            if not name:continue
            subpart=row["part"]
            q={
                "id":"pool-official-"+re.sub(r"[^a-z0-9-]","-",chapter.lower())+"-"+re.sub(r"[^a-z0-9-]","-",row["number"].lower()),
                "number":row["number"], "title":row["title"],
                "part":subpart, "descriptor":chapter,
                "primary":chapter,"category":title,
                "source":"official-pdfs/"+name,
                "originalSource":row["source"],
                "kind":"pdf", "origin":"official",
                "sourceLabel":"Amtliche SRDP/BRP-Aufgabe · Aufgabenpool.at",
                "prompt":"Originalaufgabe "+row["number"]+" – "+row["title"]+
                    ". Bearbeite den gekennzeichneten Aufgabenteil "+subpart+
                    " direkt aus dem eingebetteten Original-PDF.",
                "guide":"Lies die Originalangabe samt Abbildung. Rechne auf Papier oder laut Unterrichtsvorgabe mit GeoGebra.",
                "solution":"Die amtliche Lösungserwartung steht im Original-PDF.",
                "credit":"Original: Aufgabenpool.at / Bundesministerium für Bildung (Lizenzhinweise im PDF beachten).",
                "collection":False,
            }
            selected.append(q); output.append(q)
        report[chapter]={"available_subtasks":len(rows),"available_distinct_pdfs":len(unique),
                        "selected":len(selected),"descriptor_id":descriptor_id,
                        "sample":[q["number"] for q in selected[:4]]}
        print("CHAPTER",chapter,json.dumps(report[chapter],ensure_ascii=False),flush=True)
        if len(selected)<min(10,len(rows)):
            raise RuntimeError("Too few verified originals for "+chapter+
                               "; expected at least "+str(min(10,len(rows))))
    if not output:raise RuntimeError("No official PDF exercises downloaded")
    if len({q["id"] for q in output})!=len(output):raise RuntimeError("Duplicate task IDs")
    if any(q["origin"]!="official" or not (ROOT/q["source"]).is_file() for q in output):
        raise RuntimeError("Non-official or missing source in generated catalog")
    allowed=set(TARGETS)
    if any(q["primary"] not in allowed for q in output):
        raise RuntimeError("Excluded descriptor detected")

    bank = (
        "/* Import of verified original PDF tasks from the Austrian BMB Aufgabenpool.\n"
        " * Rebuild with scripts/maths/import_official_aufgabenpool.py (no fabricated tasks).\n"
        " * No Aufgabentyp filter; exact descriptors in the AM task database.\n"
        " */\n(function(){'use strict';\n"
        "const chapters="+json.dumps({k:v[0] for k,v in TARGETS.items()},ensure_ascii=False)+";\n"
        "const tasks="+json.dumps(output,ensure_ascii=False,separators=(",",":"))+";\n"
        "window.MATHS_EXAM_SCOPE=Object.freeze({chapters,excluded:['4.7','B_T2_4.3'],date:'2026-11-26'});\n"
        "window.MATHS_POOL_BANK=Object.freeze(tasks.map(Object.freeze));\n"
        "})();\n"
    )
    (ROOT/"sa1-scope-bank.js").write_text(bank,encoding="utf-8")
    (ROOT/"official-pdfs"/"import-report.json").write_text(
        json.dumps({"source":BASE+"index.php?id=AM","selection":"distinct original PDFs, stable seeded sample, exact AM descriptor",
                    "descriptor_counts":report,"total":len(output)},
                   ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("SUCCESS",len(output),"official original-PDF task records,",
          len(list(DEST.glob("*.pdf"))),"distinct verified PDF files",flush=True)


if __name__=="__main__":
    try:main()
    except Exception as ex:
        print("IMPORT FAILED:",ex, file=sys.stderr,flush=True)
        raise
