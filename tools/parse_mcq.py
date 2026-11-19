"""Parse CIPS MCQ text (pdftotext -layout) into JSON question records."""
import re, json, sys

DOMAINS = {
    'A': 'Physics, Equipment & Safety',
    'B': 'Chronic Pain & Pharmacology',
    'C': 'Spine Procedures',
    'D': 'Peripheral & Autonomic Nerves',
    'E': 'Musculoskeletal',
}

NOISE = [
    re.compile(r'^\s*CIPS (MCQ Bank 1000|Practice MCQ Bank)'),
    re.compile(r'^\s*\d+(\s*/\s*\d+)?\s*$'),
    re.compile(r'^\s*PAGE\s*$'),
    re.compile(r'^\s*\d+ down\. Keep going\.'),
]


def clean_lines(text):
    out = []
    for l in text.replace('\f', '\n').splitlines():
        if any(p.match(l) for p in NOISE):
            continue
        out.append(l.rstrip())
    return out


def join(a, b):
    b = b.strip()
    if not b:
        return a
    if not a:
        return b
    if a.endswith('-') and not a.endswith(' -') and re.match(r'[a-z]', b):
        # hyphen wrap: keep hyphen for compound words (e.g. "in-plane")
        return a + b
    return a + ' ' + b


def section_letter(line):
    m = re.match(r'^\s*Section ([A-E])\b', line)
    return m.group(1) if m else None


def parse_block(lines, start_no, count, source, part_label, domain_by_no=None):
    """lines: list for one part (question region + answer region)."""
    # split at answer key
    idx = next(i for i, l in enumerate(lines) if re.match(r'^\s*Answer Key', l))
    qlines, alines = lines[:idx], lines[idx:]
    qs = {}
    cur = None
    field = None
    sec = None
    expected = start_no
    for l in qlines:
        s = section_letter(l)
        if s and re.match(r'^\s*Section [A-E]\s*[-–]', l):
            sec = s
            field = None
            continue
        m = re.match(r'^\s*(\d+)\.\s*(\S.*)$', l)
        if m and int(m.group(1)) == expected:
            n = expected
            cur = {'n': n, 'sec': sec, 'q': m.group(2).strip(), 'opts': {}}
            qs[n] = cur
            field = 'q'
            expected += 1
            continue
        if cur is None:
            continue
        m = re.match(r'^\s*([A-D])\.\s*(.*)$', l)
        if m and (field in ('q',) and m.group(1) == 'A' or field in 'ABCD' and field and ord(m.group(1)) == ord(field) + 1):
            field = m.group(1)
            cur['opts'][field] = m.group(2).strip()
            continue
        if not l.strip():
            continue
        if field == 'q':
            cur['q'] = join(cur['q'], l)
        elif field in ('A', 'B', 'C', 'D'):
            # stop appending if we drifted into intro text of something else
            cur['opts'][field] = join(cur['opts'][field], l)
    # answers
    ans = {}
    cur = None
    expected = start_no
    for l in alines:
        if re.match(r'^\s*Section [A-E]', l):
            continue
        m = re.match(r'^\s*(\d+)\.\s*([A-D])\b\s*(.*)$', l)
        if m and int(m.group(1)) == expected:
            cur = {'ans': m.group(2), 'expl': m.group(3).strip(), 'kw': [], 'ref': ''}
            ans[expected] = cur
            expected += 1
            continue
        if cur is None:
            continue
        m = re.match(r'^\s*Keywords:\s*(.*?)\s*\|\s*Ref:\s*(.*)$', l)
        if m:
            cur['kw'] = [k.strip() for k in re.split(r'[;,]', m.group(1)) if k.strip()]
            cur['ref'] = m.group(2).strip()
            cur['done'] = True
            continue
        if cur.get('done') or not l.strip():
            continue
        cur['expl'] = join(cur['expl'], l)
    out = []
    for n in range(start_no, start_no + count):
        q = qs.get(n)
        a = ans.get(n)
        if not q or not a or len(q['opts']) != 4:
            print('PROBLEM', source, n, bool(q), bool(a), q and len(q['opts']), file=sys.stderr)
            continue
        sec = q['sec'] or (domain_by_no(n) if domain_by_no else None)
        out.append({
            'id': f'{source}-{n}',
            'n': n,
            'set': part_label,
            'src': source,
            'dom': sec,
            'q': q['q'],
            'o': [q['opts'][k] for k in 'ABCD'],
            'a': 'ABCD'.index(a['ans']),
            'x': a['expl'],
            'kw': a['kw'],
            'ref': a['ref'],
        })
    return out


def bank1000(path):
    lines = clean_lines(open(path).read())
    starts = [i for i, l in enumerate(lines) if re.match(r'^\s*Part (\d+) - Questions (\d+)-(\d+)', l)]
    res = []
    for k, i in enumerate(starts):
        m = re.match(r'^\s*Part (\d+) - Questions (\d+)-(\d+)', lines[i])
        p, a, b = map(int, m.groups())
        end = starts[k + 1] if k + 1 < len(starts) else len(lines)
        res += parse_block(lines[i + 1:end], a, b - a + 1, 'B', f'Bank Part {p}')
    return res


def practice(path):
    pages = open(path).read().split('\f')
    # pages 42-61 = vol1 ; 62-84 = vol2 (1-based)
    v1 = clean_lines('\n'.join(pages[41:61]))
    v2 = clean_lines('\n'.join(pages[61:84]))
    # drop intro text before first Section
    def body(ls):
        i = next(i for i, l in enumerate(ls) if re.match(r'^\s*Section A', l))
        return ls[i:]
    return parse_block(body(v1), 1, 60, 'P', 'Practice Vol 1') + parse_block(body(v2), 61, 60, 'P', 'Practice Vol 2')


if __name__ == '__main__':
    bank = bank1000(sys.argv[1])
    prac = practice(sys.argv[2])
    for q in prac:
        q['x'] = re.sub(r'\s*\d+ down\. Keep going\.\s*$', '', q['x'])
        if not q['ref']:
            refs = re.findall(r'\(([^()]*(?:ch\.|Ch |RAPM|guide|et al)[^()]*)\)', q['x'])
            q['ref'] = '; '.join(refs)
    allq = bank + prac
    from collections import Counter
    print(len(bank), len(prac), Counter(q['dom'] for q in allq), file=sys.stderr)
    json.dump({'domains': DOMAINS, 'questions': allq}, open(sys.argv[3], 'w'), ensure_ascii=False, separators=(',', ':'))
