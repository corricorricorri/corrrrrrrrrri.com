#!/usr/bin/env python3
# CAD Library builder. Drop cover photos into the books/ and films/ folders next to this script, then run:
#     python3 build_library.py            builds the catalog once
#     python3 build_library.py --watch    rebuilds by itself whenever you add or change photos
#     python3 build_library.py --list     shows every item and its number
#     python3 build_library.py --remove "Ruth"    takes an item off the page (its photo moves to the removed/ folder)
#     To hide an item without removing it, set its status to hidden in library.csv.
# Name photos like  Title - Author.jpg  (the author part is optional).
# Details (year, publisher, description, loan status...) can be added any time in library.csv.
import csv, io, json, os, re, shutil, subprocess, sys, time, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))

def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

SITE = os.path.expanduser(arg("--site", "~/Desktop/clean-repo/UPDATE/site"))
INTERVAL = float(arg("--interval", "2"))
PAGE = os.path.join(SITE, "library.html")
OUT = os.path.join(SITE, "images", "library")
CSV_FILE = os.path.join(HERE, "library.csv")
FOLDERS = {"books": "Book", "films": "Film"}
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff", ".gif")
COLS = ["no", "type", "title", "by", "year", "publisher", "format", "subject", "status", "runtime", "description", "file"]
ALIAS = {"author": "by", "creator": "by", "director": "by", "artist": "by", "desc": "description",
         "notes": "description", "note": "description", "kind": "type", "photo": "file", "image": "file"}
MAXPX = 900


class Problem(Exception):
    pass


def fail(msg):
    raise Problem(msg)


def fold(text):
    t = unicodedata.normalize("NFD", text or "")
    return "".join(c for c in t if not unicodedata.combining(c)).lower().strip()


def norm(path):
    return path.replace("\\", "/").strip().lower()


def read_csv():
    if not os.path.exists(CSV_FILE):
        return list(COLS), []
    raw = open(CSV_FILE, "rb").read()
    text = None
    for enc in ("utf-8-sig", "cp1252"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    lines = text.splitlines()
    if not lines or not lines[0].strip():
        return list(COLS), []
    delim = max(",;\t", key=lines[0].count)
    reader = csv.DictReader(io.StringIO(text), delimiter=delim)
    names = []
    for h in reader.fieldnames or []:
        k = ALIAS.get((h or "").strip().lower(), (h or "").strip().lower())
        names.append(k)
    rows = []
    for n, r in enumerate(reader, start=2):
        d = {}
        for h, k in zip(reader.fieldnames, names):
            d[k] = (r.get(h) or "").strip()
        if any(d.values()):
            d["_row"] = n
            rows.append(d)
    extra = [k for k in names if k and k not in COLS]
    return COLS + extra, rows


def scan_images():
    found = []
    for folder in FOLDERS:
        base = os.path.join(HERE, folder)
        if os.path.isdir(base):
            for f in os.listdir(base):
                if not f.startswith(".") and f.lower().endswith(EXTS):
                    found.append(folder + "/" + f)
    return sorted(found, key=lambda s: s.lower())


def guess(path):
    stem = os.path.splitext(os.path.basename(path))[0]
    stem = re.sub(r"\s*\(\d+\)$", "", stem).replace("_", " ")
    stem = re.sub(r"\s+", " ", stem).strip()
    if " - " in stem:
        title, by = stem.rsplit(" - ", 1)
        return title.strip(), by.strip()
    return stem, ""


def web_image(src, dst):
    # Makes a web-sized JPEG. Uses the Mac's built-in sips, falls back to Pillow, then to a plain copy.
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if shutil.which("sips"):
        r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", str(MAXPX), src, "--out", dst],
                           capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(dst):
            return True
    try:
        from PIL import Image, ImageOps
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im.thumbnail((MAXPX, MAXPX))
        im.save(dst, "JPEG", quality=82)
        return True
    except Exception:
        pass
    if src.lower().endswith((".jpg", ".jpeg")):
        shutil.copy(src, dst)
        return True
    return False


def build(quiet=False, allow_empty=False):
    def say(msg):
        if not quiet:
            print(msg)

    for folder in FOLDERS:
        os.makedirs(os.path.join(HERE, folder), exist_ok=True)
    if not os.path.exists(PAGE):
        fail("library.html not found at " + PAGE + ". Use --site to point at your site folder.")
    fields, rows = read_csv()
    if "file" not in fields:
        fields.append("file")

    known = {}
    for d in rows:
        for f in [x for x in d.get("file", "").split("|") if x.strip()]:
            known[norm(f)] = d
    images = scan_images()
    added = []
    for rel in images:
        if norm(rel) not in known:
            title, by = guess(rel)
            d = {"no": "", "type": FOLDERS[rel.split("/")[0]], "title": title, "by": by, "status": "available",
                 "file": rel, "_row": 0}
            rows.append(d)
            known[norm(rel)] = d
            added.append(rel)

    if not rows and not allow_empty:
        say("Nothing to build yet. Drop cover photos into these folders, then run this again:")
        say("   " + os.path.join(HERE, "books"))
        say("   " + os.path.join(HERE, "films"))
        return

    def pad(no):
        return "%03d" % int(no) if no.isdigit() else no

    used = [pad(d["no"]) for d in rows if d.get("no")]
    if len(used) != len(set(used)):
        dup = sorted(set(u for u in used if used.count(u) > 1))[0]
        fail("Number " + dup + " is used twice in library.csv. Each item needs its own number.")
    top = max([int(u) for u in used if u.isdigit()] + [0])
    for d in rows:
        if d.get("no"):
            d["no"] = pad(d["no"])
        else:
            top += 1
            d["no"] = "%03d" % top
        if not d.get("title"):
            fail("library.csv: the item numbered " + d["no"] + " has no title.")

    items, missing, skipped, hidden = [], [], [], []
    for d in rows:
        t = re.sub(r"[^a-z]", "", d.get("type", "").lower())
        if t in ("book", "books"):
            typ = "Book"
        elif t in ("film", "films", "movie", "movies", "dvd", "bluray", "video"):
            typ = "Film"
        elif t == "":
            typ = "Film" if d.get("runtime") else "Book"
        else:
            fail("library.csv, item " + d["no"] + ": type must be Book or Film (found '" + d["type"] + "').")
        s = d.get("status", "").lower()
        if s.startswith(("hid", "remov", "withdr", "retir")):
            hidden.append(d["title"])
            continue
        status = "on loan" if s.startswith(("on", "out", "loan", "borrow", "unavail")) else "available"
        year = re.sub(r"\D", "", d.get("year", ""))[:4]
        it = {"no": d["no"], "type": typ, "title": d["title"], "by": d.get("by", ""),
              "publisher": d.get("publisher", ""), "format": d.get("format", ""),
              "subject": d.get("subject", ""), "status": status, "desc": d.get("description", "")}
        if len(year) == 4:
            it["year"] = int(year)
        if typ == "Film" and d.get("runtime"):
            it["runtime"] = d["runtime"]
        paths = []
        for k, f in enumerate([x.strip() for x in d.get("file", "").split("|") if x.strip()]):
            src = os.path.join(HERE, f)
            if not os.path.exists(src):
                missing.append(d["title"])
                continue
            name = d["no"] + ("" if k == 0 else "-" + str(k + 1)) + ".jpg"
            dst = os.path.join(OUT, name)
            if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
                if not web_image(src, dst):
                    skipped.append(f)
                    continue
            paths.append("images/library/" + name)
        if len(paths) == 1:
            it["image"] = paths[0]
        elif paths:
            it["images"] = paths
        items.append(it)
    items.sort(key=lambda i: i["no"])

    def js(o):
        s = json.dumps(o, ensure_ascii=False)
        return s.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")

    page = open(PAGE, encoding="utf-8").read()
    pat = re.compile(r"/\* CATALOG:START \*/.*?/\* CATALOG:END \*/", re.S)
    if not pat.search(page):
        fail("library.html has no catalog markers. Copy the newest library.html into your site folder first.")
    block = "/* CATALOG:START */\nvar ITEMS = [\n" + ",\n".join("  " + js(i) for i in items) + "\n];\n/* CATALOG:END */"
    newpage = pat.sub(lambda m: block, page)
    if newpage != page:
        shutil.copy(PAGE, os.path.join(HERE, "library.previous.html"))
        open(PAGE, "w", encoding="utf-8").write(newpage)

    write_csv(fields, rows)

    nb = sum(1 for i in items if i["type"] == "Book")
    say("Catalog built: " + str(len(items)) + " items (" + str(nb) + " books, " + str(len(items) - nb) + " films)")
    if added:
        names = [os.path.splitext(os.path.basename(a))[0] for a in added]
        more = "" if len(names) <= 6 else " ... and " + str(len(names) - 6) + " more"
        say("New this time (" + str(len(names)) + "): " + ", ".join(names[:6]) + more)
    nopic = [i["no"] + " " + i["title"] for i in items if "image" not in i and "images" not in i]
    if nopic:
        say("No photo yet (shows an outlined placeholder): " + "; ".join(nopic))
    if missing:
        for t in sorted(set(missing)):
            say('Photo missing for "' + t + '". If you removed it on purpose, run:  python3 build_library.py --remove "' + t + '"')
    if hidden:
        say("Hidden (not shown on the page): " + ", ".join(hidden))
    if skipped:
        say("Could not convert (try saving as JPG first): " + ", ".join(skipped))


def write_csv(fields, rows):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(fields)
    for d in sorted(rows, key=lambda r: r["no"]):
        w.writerow([d.get(k, "") for k in fields])
    data = ("\ufeff" + buf.getvalue()).encode("utf-8")
    if not os.path.exists(CSV_FILE) or open(CSV_FILE, "rb").read() != data:
        open(CSV_FILE, "wb").write(data)


def list_items():
    build(quiet=True)
    fields, rows = read_csv()
    if not rows:
        print("Nothing in the catalog yet.")
    for d in sorted(rows, key=lambda r: r["no"]):
        extra = " [" + d["status"] + "]" if d.get("status", "").lower() not in ("", "available") else ""
        print(d["no"] + "  " + d.get("type", "") + "  " + d["title"] + (" - " + d["by"] if d.get("by") else "") + extra)


def remove(text):
    q = fold(text)
    if not q:
        fail('Say which item to remove, for example:  --remove "Ruth"')
    build(quiet=True)
    fields, rows = read_csv()
    hits = [d for d in rows if fold(d.get("title")) == q]
    if len(hits) != 1:
        hits = [d for d in rows if q in fold(d.get("title", "") + " " + d.get("by", ""))]
    if not hits:
        fail('No item matches "' + text + '". Run with --list to see everything.')
    if len(hits) > 1:
        names = "\n".join("   " + d["no"] + "  " + d["title"] + (" - " + d["by"] if d.get("by") else "") for d in hits)
        fail('More than one item matches "' + text + '". Be more specific:\n' + names)
    d = hits[0]
    moved = []
    for f in [x.strip() for x in d.get("file", "").split("|") if x.strip()]:
        src = os.path.join(HERE, f)
        if os.path.exists(src):
            os.makedirs(os.path.join(HERE, "removed"), exist_ok=True)
            base, ext = os.path.splitext(os.path.basename(f))
            dst, k = os.path.join(HERE, "removed", base + ext), 1
            while os.path.exists(dst):
                k += 1
                dst = os.path.join(HERE, "removed", base + " " + str(k) + ext)
            shutil.move(src, dst)
            moved.append(dst)
    if os.path.isdir(OUT):
        for fn in os.listdir(OUT):
            if re.match(r"^" + re.escape(d["no"]) + r"(-\d+)?\.jpg$", fn):
                os.remove(os.path.join(OUT, fn))
    rows.remove(d)
    write_csv(fields, rows)
    build(quiet=True, allow_empty=True)
    print('Removed "' + d["title"] + '" (number ' + d["no"] + ") from the catalog and the page.")
    if moved:
        print("Its photo is in " + os.path.join(HERE, "removed") + " if you change your mind.")


def signature():
    sig = []
    for rel in scan_images():
        p = os.path.join(HERE, rel)
        sig.append((rel, os.path.getmtime(p), os.path.getsize(p)))
    if os.path.exists(CSV_FILE):
        sig.append(("csv", os.path.getmtime(CSV_FILE), os.path.getsize(CSV_FILE)))
    return sig


if __name__ == "__main__":
    if "--list" in sys.argv or "--remove" in sys.argv:
        try:
            if "--list" in sys.argv:
                list_items()
            else:
                i = sys.argv.index("--remove")
                remove(sys.argv[i + 1] if i + 1 < len(sys.argv) else "")
        except Problem as e:
            sys.exit("\nProblem: " + str(e) + "\n")
    elif "--watch" in sys.argv:
        print("Watching books/ and films/ and library.csv. Press Ctrl+C to stop.")
        last = None
        while True:
            try:
                sig = signature()
                if sig != last:
                    try:
                        build()
                    except Problem as e:
                        print("\nProblem: " + str(e) + "\n")
                    last = signature()
                    print("(" + time.strftime("%H:%M:%S") + ") up to date. Refresh your browser.\n")
                time.sleep(INTERVAL)
            except KeyboardInterrupt:
                print("\nStopped.")
                break
    else:
        try:
            build()
        except Problem as e:
            sys.exit("\nProblem: " + str(e) + "\n")
