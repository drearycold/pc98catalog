#!/usr/bin/env python3
"""
PC-98 Game Catalog Index Builder
Extracts metadata from all 2,441 legacy HTML game pages in PC98/pc98/*.html
and genre index pages in PC98/*.html, converts Shift_JIS/CP932 to UTF-8,
and generates structured assets/data.js and assets/data.json.
"""

import os
import re
import glob
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PC98_DIR = os.path.join(BASE_DIR, "PC98")
PC98_GAMES_DIR = os.path.join(PC98_DIR, "pc98")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")

os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. Map genre index pages to main category and subcategory
GENRE_MAP = {
    # Adventure
    "AVG_a.html":  ("AVG", "あ行", "アドベンチャー・あ行"),
    "AVG_ka.html": ("AVG", "か行", "アドベンチャー・か行"),
    "AVG_sa.html": ("AVG", "さ行", "アドベンチャー・さ行"),
    "AVG_ta.html": ("AVG", "た行", "アドベンチャー・た行"),
    "AVG_na.html": ("AVG", "な行", "アドベンチャー・な行"),
    "AVG_ha.html": ("AVG", "は行", "アドベンチャー・は行"),
    "AVG_ma.html": ("AVG", "ま行", "アドベンチャー・ま行"),
    "AVG_ya.html": ("AVG", "や行", "アドベンチャー・や行"),
    "AVG_ra.html": ("AVG", "ら行", "アドベンチャー・ら行"),
    "AVG_wa.html": ("AVG", "わ行", "アドベンチャー・わ行"),
    "AVG_E.html":  ("AVG", "その他", "アドベンチャー・その他"),

    # RPG
    "RPG_1.html": ("RPG", "あ~た行", "ロールプレイング・あ~た行"),
    "RPG_2.html": ("RPG", "な~わ行", "ロールプレイング・な~わ行"),
    "RPG_3.html": ("RPG", "3D", "ロールプレイング・3D"),
    "RPG_A.html": ("RPG", "アクションRPG", "ロールプレイング・アクションRPG"),

    # Simulation
    "SLG_T.html": ("SLG", "戦術級", "シミュレーション・戦術級"),
    "SLG_S.html": ("SLG", "戦略級", "シミュレーション・戦略級"),
    "SLG_R.html": ("SLG", "リアルタイム", "シミュレーション・リアルタイム"),
    "SLG_B.html": ("SLG", "育成", "シミュレーション・育成"),
    "SLG_E.html": ("SLG", "その他", "シミュレーション・その他"),

    # Tabletop
    "TBL_M.html": ("TBL", "麻雀", "テーブル・麻雀"),
    "TBL_C.html": ("TBL", "カードゲーム", "テーブル・カードゲーム"),
    "TBL.html":   ("TBL", "その他", "テーブル・その他"),

    # Others
    "ACT.html":    ("ACT", "", "アクション"),
    "STG.html":    ("STG", "", "シューティング"),
    "SPT.html":    ("SPT", "", "スポーツ"),
    "PZL.html":    ("PZL", "", "パズル"),
    "RCG.html":    ("RCG", "", "レース"),
    "QUIZ.html":   ("QUIZ", "", "クイズ"),
    "SERIES.html": ("SERIES", "", "ディスクマガジン"),
    "DOUJIN.html": ("DOUJIN", "", "同人"),
    "ETC.html":    ("ETC", "", "その他"),
    "ERR.html":    ("ERR", "", "動作未確認"),
}

CATEGORY_NAMES = {
    "AVG":    {"name_ja": "アドベンチャー", "name_en": "Adventure", "badge": "#0ea5e9"},
    "RPG":    {"name_ja": "ロールプレイング", "name_en": "RPG", "badge": "#14b8a6"},
    "SLG":    {"name_ja": "シミュレーション", "name_en": "Simulation", "badge": "#6366f1"},
    "TBL":    {"name_ja": "テーブルゲーム", "name_en": "Tabletop", "badge": "#f43f5e"},
    "ACT":    {"name_ja": "アクション", "name_en": "Action", "badge": "#d946ef"},
    "STG":    {"name_ja": "シューティング", "name_en": "Shooting", "badge": "#ec4899"},
    "SPT":    {"name_ja": "スポーツ", "name_en": "Sports", "badge": "#84cc16"},
    "PZL":    {"name_ja": "パズル", "name_en": "Puzzle", "badge": "#eab308"},
    "RCG":    {"name_ja": "レース", "name_en": "Racing", "badge": "#f97316"},
    "QUIZ":   {"name_ja": "クイズ", "name_en": "Quiz", "badge": "#a855f7"},
    "SERIES": {"name_ja": "ディスクマガジン", "name_en": "Disk Magazine", "badge": "#06b6d4"},
    "DOUJIN": {"name_ja": "同人", "name_en": "Doujin", "badge": "#10b981"},
    "ETC":    {"name_ja": "その他", "name_en": "Etc", "badge": "#71717a"},
    "ERR":    {"name_ja": "動作未確認", "name_en": "Unconfirmed", "badge": "#ef4444"},
}


def build_genre_index():
    """Index which games are listed in which genre files."""
    game_genre_map = {}
    for filename, (cat, sub, full_name) in GENRE_MAP.items():
        filepath = os.path.join(PC98_DIR, filename)
        if not os.path.exists(filepath):
            continue
        with open(filepath, "rb") as f:
            content = f.read().decode("cp932", errors="replace")
        matches = re.findall(r'<A[^>]*HREF=[\"\'\']?pc98/(\d+\.html)[\"\'\']?', content, re.I)
        for m in matches:
            gid = m.replace(".html", "")
            if gid not in game_genre_map:
                game_genre_map[gid] = (cat, sub, full_name)
    return game_genre_map


def clean_html_links(html_text):
    """Adjust relative links inside reviews and notes to work from root index.html."""
    if not html_text:
        return ""

    def repl_a(m):
        tag = m.group(0)
        hm = re.search(r'href=([\"\']?)([^\"\'>\s]+)\1', tag, re.I)
        if hm:
            val = hm.group(2)
            if val.startswith("archive/"):
                val = "PC98/pc98/" + val
            elif val.startswith("../"):
                val = "PC98/" + val[3:]
            return f'<a href="{val}" target="_blank" rel="noopener noreferrer">'
        return tag

    text = re.sub(r'<a\s+[^>]+>', repl_a, html_text, flags=re.I)
    # Remove empty tags or multiple breaks
    text = re.sub(r'(?:<BR\s*/?>\s*){3,}', '<br><br>', text, flags=re.I)
    return text.strip()


def parse_games():
    game_genre_map = build_genre_index()
    game_files = sorted(glob.glob(os.path.join(PC98_GAMES_DIR, "*.html")))
    
    games = []
    publishers_set = set()
    years_set = set()

    for fpath in game_files:
        gid = os.path.basename(fpath).replace(".html", "")
        with open(fpath, "rb") as fp:
            raw = fp.read()
        try:
            content = raw.decode("cp932")
        except Exception:
            content = raw.decode("shift_jis", errors="replace")

        # Japanese Title
        jp_m = re.search(r'<SPAN class=\"?Jp\"?>(.*?)</SPAN>', content, re.I | re.S)
        title_m = re.search(r'<TITLE>(.*?)</TITLE>', content, re.I | re.S)
        if jp_m:
            title_jp = jp_m.group(1).strip()
        elif title_m:
            title_jp = title_m.group(1).strip()
        else:
            title_jp = gid

        # English / Romaji Title
        en_m = re.search(r'<SPAN class=\"?En\"?>(.*?)</SPAN>', content, re.I | re.S)
        title_en = en_m.group(1).strip() if en_m else ""

        # Screenshots
        imgs = re.findall(r'<IMG\s+SRC=[\"\'\']?([^>\"\']+\.jpe?g)', content, re.I)
        valid_imgs = []
        for img in imgs:
            img_name = os.path.basename(img)
            # Filter dummy placeholder images that don't exist on disk
            if img_name.lower() in ("d.jpg", "dummy.jpg"):
                continue
            valid_imgs.append(img_name)

        # List items
        raw_lis = re.findall(r'<li>(.*)', content, re.I)
        clean_lis = [re.sub(r'<[^>]+>', '', l).strip() for l in raw_lis]

        platform = clean_lis[0] if len(clean_lis) > 0 else "PC-9801"
        info_line = clean_lis[1] if len(clean_lis) > 1 else ""

        pub = ""
        year = ""
        media = ""
        genre_code = ""

        if info_line:
            parts = info_line.split("/", 1)
            pub = parts[0].strip()
            if len(parts) > 1:
                rest = parts[1].strip().split("・")
                if len(rest) > 0:
                    y_match = re.search(r'(\d{4})', rest[0])
                    year = y_match.group(1) if y_match else rest[0].strip()
                if len(rest) > 1:
                    genre_code = rest[1].strip()
                if len(rest) > 2:
                    media = "・".join(rest[2:]).strip()

        if pub:
            publishers_set.add(pub)
        if year and year.isdigit():
            years_set.add(year)

        # Determine genre and subgenre
        if gid in game_genre_map:
            cat, sub, full_cat = game_genre_map[gid]
        else:
            # Fallback determination based on genre code
            c = genre_code.upper()
            if "AVG" in c or "ADV" in c:
                cat, sub, full_cat = "AVG", "", "アドベンチャー"
            elif "RPG" in c:
                cat, sub, full_cat = "RPG", "", "ロールプレイング"
            elif "SLG" in c or "SIM" in c:
                cat, sub, full_cat = "SLG", "", "シミュレーション"
            elif "TBL" in c or "TAB" in c or "MJ" in c:
                cat, sub, full_cat = "TBL", "", "テーブル"
            elif "ACT" in c:
                cat, sub, full_cat = "ACT", "", "アクション"
            elif "STG" in c or "SHT" in c:
                cat, sub, full_cat = "STG", "", "シューティング"
            elif "SPT" in c or "SPO" in c:
                cat, sub, full_cat = "SPT", "", "スポーツ"
            elif "PZL" in c:
                cat, sub, full_cat = "PZL", "", "パズル"
            elif "RCG" in c or "RAC" in c:
                cat, sub, full_cat = "RCG", "", "レース"
            elif "QUIZ" in c or "QIZ" in c:
                cat, sub, full_cat = "QUIZ", "", "クイズ"
            else:
                cat, sub, full_cat = "ETC", "", "その他"

        # Reviews & Notes
        rev_tables = re.findall(r'<TD\s+class=\"?Review\"?[^>]*>(.*?)</TD>', content, re.I | re.S)
        rev_html = rev_tables[0].strip() if len(rev_tables) > 0 else ""
        note_html = rev_tables[1].strip() if len(rev_tables) > 1 else ""

        has_review = bool(re.sub(r'<[^>]+>|\s+', '', rev_html))
        has_note = bool(re.sub(r'<[^>]+>|\s+', '', note_html))

        item = {
            "id": gid,
            "jp": title_jp,
            "en": title_en,
            "cat": cat,
            "sub": sub,
            "pub": pub,
            "year": year,
            "media": media,
            "plat": platform,
            "imgs": valid_imgs,
        }

        if has_review:
            item["rev"] = clean_html_links(rev_html)
        if has_note:
            item["note"] = clean_html_links(note_html)

        games.append(item)

    print(f"Total games parsed: {len(games)}")
    print(f"Total publishers: {len(publishers_set)}")
    print(f"Year range: {min(years_set)} - {max(years_set)}")

    # Category stats
    cat_counts = {}
    for g in games:
        c = g["cat"]
        cat_counts[c] = cat_counts.get(c, 0) + 1

    # Publisher frequency ranking (for filter dropdown suggestions)
    pub_counts = {}
    for g in games:
        p = g["pub"]
        if p:
            pub_counts[p] = pub_counts.get(p, 0) + 1
    top_publishers = [p for p, _ in sorted(pub_counts.items(), key=lambda x: -x[1])]

    catalog_data = {
        "games": games,
        "categories": CATEGORY_NAMES,
        "cat_counts": cat_counts,
        "years": sorted(list(years_set)),
        "publishers": top_publishers,
        "total": len(games),
        "updated": "2026-09-28"
    }

    # Write data.json
    json_path = os.path.join(ASSETS_DIR, "data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(catalog_data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"Written: {json_path} ({os.path.getsize(json_path) / 1024:.1f} KB)")

    # Write data.js (enables direct file:/// access and universal environments)
    js_path = os.path.join(ASSETS_DIR, "data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("(function() {\n")
        f.write("  const data = ")
        json.dump(catalog_data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(";\n")
        f.write("  if (typeof window !== 'undefined') { window.PC98_DATA = data; }\n")
        f.write("  if (typeof globalThis !== 'undefined') { globalThis.PC98_DATA = data; }\n")
        f.write("  if (typeof module !== 'undefined' && module.exports) { module.exports = data; }\n")
        f.write("})();\n")
    print(f"Written: {js_path} ({os.path.getsize(js_path) / 1024:.1f} KB)")


if __name__ == "__main__":
    parse_games()
