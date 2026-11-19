"""Parse study guide, reading plan and oral cases from pdftotext -layout output."""
import re, json, sys, itertools
from collections import Counter

guide_txt, oral_txt, mcq_txt, out = sys.argv[1:5]
pages = open(guide_txt).read().split('\f')

# ---------- vocabulary for glyph repair ----------
clean_corpus = open(mcq_txt).read() + '\n'.join(pages[:86]) + '\n'.join(pages[100:])
VOCAB = set(w.lower() for w in re.findall(r"[A-Za-z]+", clean_corpus))
SUS = {'H': ['ti'], '6': ['ti'], '5': ['ti'], '8': ['ti'], 'Q': ['tti'], '@': ['tti'],
       '>': ['ft'], 'D': ['tt'], 'M': ['tt'], 'B': ['ti', 'ft']}


def fix_token(tok):
    if tok.lower() in VOCAB or not re.search(r'[a-z]', tok):
        return tok
    pos = [i for i, c in enumerate(tok) if c in SUS]
    if not pos or len(pos) > 4:
        return tok
    opts = [[tok[i]] + SUS[tok[i]] for i in pos]
    for combo in itertools.product(*opts):
        s = list(tok)
        for i, r in zip(pos, combo):
            s[i] = r
        cand = ''.join(s)
        if cand != tok and cand.lower() in VOCAB:
            return cand
    # fallback: suspicious glyph glued between lowercase letters
    return re.sub(r'(?<=[a-z])([5689@>HQDMB])(?=[a-z]|$)', lambda m: SUS[m.group(1)][0], tok)


def fix_glyphs(text):
    import unicodedata
    text = unicodedata.normalize('NFKC', text)
    return re.sub(r"[A-Za-z0-9@>]+", lambda m: fix_token(m.group(0)), text)


NOISE = re.compile(r'^\s*(CIPS (Study Guide|Mock Oral Exam Cases|Reading Plan|Practice)\b.*|\d+(\s*/\s*\d+)?|PAGE)\s*$')


def lines_of(pgs):
    return [l.rstrip() for l in '\n'.join(pgs).splitlines() if not NOISE.match(l)]


def join(a, b):
    b = b.strip()
    if not a:
        return b
    if not b:
        return a
    return a + ' ' + b


def blocks_from(lines):
    """Turn layout lines into blocks: p / ul / ol."""
    blocks = []
    cur = None
    for l in lines:
        s = l.strip()
        if not s:
            cur = None
            continue
        m = re.match(r'^[•\-]\s*(.*)$', s)
        n = re.match(r'^(\d+)\.(\S.*)$', s)
        if m:
            if not blocks or blocks[-1]['t'] != 'ul' or cur is None and blocks[-1]['t'] != 'ul':
                blocks.append({'t': 'ul', 'items': []})
            blocks[-1]['items'].append(m.group(1))
            cur = ('ul',)
        elif n and len(n.group(1)) <= 2:
            if not blocks or blocks[-1]['t'] != 'ol':
                blocks.append({'t': 'ol', 'items': []})
            blocks[-1]['items'].append(n.group(2))
            cur = ('ol',)
        elif cur and cur[0] in ('ul', 'ol'):
            blocks[-1]['items'][-1] = join(blocks[-1]['items'][-1], s)
        elif cur and cur[0] == 'p':
            blocks[-1]['text'] = join(blocks[-1]['text'], s)
        else:
            blocks.append({'t': 'p', 'text': s})
            cur = ('p',)
    return blocks


# ---------- study guide ----------
toc = [l for l in '\n'.join(pages[1:3]).splitlines() if '....' in l]
heads = []
for l in toc:
    name = re.sub(r'\s*\.{3,}.*$', '', l).rstrip()
    indent = len(name) - len(name.lstrip())
    heads.append((name.strip(), 1 if indent < 2 else 2))
heads = [h for h in heads if h[0] != 'Contents']
body = lines_of(pages[4:29])
H1 = {h for h, lv in heads if lv == 1}
H2 = {h for h, lv in heads if lv == 2}
sections = []
cur_h1 = cur_h2 = None
buf = []


def flush():
    global buf
    if cur_h1 is None:
        buf = []
        return
    target = cur_h2 if cur_h2 is not None else cur_h1
    target.setdefault('lines', []).extend(buf)
    buf = []


for l in body:
    s = l.strip()
    if s in H1:
        flush()
        cur_h1 = {'title': s, 'subs': []}
        sections.append(cur_h1)
        cur_h2 = None
        continue
    if s in H2 and cur_h1 is not None:
        flush()
        cur_h2 = {'title': s}
        cur_h1['subs'].append(cur_h2)
        continue
    buf.append(l)
flush()

FIELDS = ['Target / indication', 'Position and transducer', 'Key sonoanatomy', 'Technique',
          'Typical injectate', 'Pearls and pitfalls']
FKEY = ['target', 'position', 'sonoanatomy', 'technique', 'injectate', 'pearls']
procedures = []
for sec in sections:
    sec['intro'] = blocks_from(sec.pop('lines', []))
    for sub in sec['subs']:
        ls = sub.pop('lines', [])
        txt = '\n'.join(ls)
        if 'Target / indication:' in txt:
            f = {}
            key = None
            for l in ls:
                s = l.strip()
                m = re.match(r'^(%s):\s*(.*)$' % '|'.join(re.escape(x) for x in FIELDS), s)
                if m:
                    key = FKEY[FIELDS.index(m.group(1))]
                    f[key] = m.group(2)
                elif key and s:
                    f[key] = join(f[key], s)
            sub['fields'] = f
            sub['region'] = sec['title']
            procedures.append(sub)
        else:
            sub['blocks'] = blocks_from(ls)

# ---------- reading plan weeks ----------
plan_lines = lines_of(pages[31:41])
weeks = []
w = None
key = None
for l in plan_lines:
    s = l.strip()
    m = re.match(r'^Week (\d+) - (.*)$', s)
    if m:
        w = {'n': int(m.group(1)), 'title': m.group(2), 'read': '', 'scan': '', 'test': ''}
        weeks.append(w)
        key = None
        continue
    if s.startswith('Master Map'):
        w = None
    if w is None:
        continue
    m = re.match(r'^(Read|Scan|Test):\s*(.*)$', s)
    if m:
        key = m.group(1).lower()
        w[key] = m.group(2)
    elif key and s:
        w[key] = join(w[key], s)

# ---------- oral cases ----------
def parse_cases(pgs, fix):
    ls = lines_of(pgs)
    if fix:
        ls = [fix_glyphs(l) for l in ls]
    cases = []
    c = None
    mode = None
    q = None
    title_cont = False
    for l in ls:
        s = l.strip()
        m = re.match(r'^Case (\d+) - (.*)$', s)
        if m:
            c = {'n': int(m.group(1)), 'title': m.group(2), 'vignette': '', 'qs': []}
            cases.append(c)
            mode = 'title'
            continue
        if c is None:
            continue
        if s.startswith('CANDIDATE CASE STUDY'):
            mode = 'vig'
            continue
        if mode == 'title' and s:
            c['title'] = join(c['title'], s)
            continue
        if s.startswith('Examiner Guide and Model Answers'):
            mode = 'qa'
            continue
        if s in ('Twelve cases. One standard.',) or s.startswith('CIPS Mock Oral'):
            mode = None
            continue
        if mode == 'vig' and s:
            c['vignette'] = join(c['vignette'], s)
        elif mode == 'qa':
            m = re.match(r'^Q(\d+)\.\s*(.*)$', s)
            if m:
                q = {'q': m.group(2), 'a': '', '_qdone': s.endswith('?') or s.endswith('.')}
                c['qs'].append(q)
            elif q is not None and s:
                if not q['_qdone']:
                    q['q'] = join(q['q'], s)
                    q['_qdone'] = s.endswith('?') or s.endswith('.')
                else:
                    q['a'] = join(q['a'], s)
    for c in cases:
        for q in c['qs']:
            q.pop('_qdone', None)
    return cases


cases = parse_cases(pages[86:100], True) + parse_cases(pages[101:118], False)

json.dump({'sections': sections, 'procedures': procedures, 'weeks': weeks, 'cases': cases},
          open(out, 'w'), ensure_ascii=False, indent=1)
print('sections', [(s['title'], len(s['subs'])) for s in sections], file=sys.stderr)
print('procedures', len(procedures), 'weeks', len(weeks), 'cases', [(c['n'], len(c['qs'])) for c in cases], file=sys.stderr)
left = Counter(t for c in cases[:6] for t in re.findall(r'\b\w*[a-z][5689@>HQDMB]\w*', json.dumps(c)) if t.lower() not in VOCAB)
print('unfixed', left.most_common(30), file=sys.stderr)
