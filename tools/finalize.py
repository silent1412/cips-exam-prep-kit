"""Clean guide.json into site data: tables, draw groups, sources, oral topic map."""
import json, re, sys, shutil

src_guide, src_mcq, outdir = sys.argv[1:4]
g = json.load(open(src_guide))

# --- fix layout tables ---
for sec in g['sections']:
    for sub in sec['subs']:
        bl = sub.get('blocks')
        if not bl:
            continue
        if sub['title'] == 'Exam Structure and Scoring':
            keep = [b for b in bl if not (b['t'] == 'p' and re.match(r'^(Part\s{3,}|1 - Theoretical|2A - Practical|2B - Modified)', b['text']))]
            table = {'t': 'table', 'head': ['Part', 'Format', 'Duration', 'Weight'], 'rows': [
                ['1 - Theoretical', '100 four-option multiple-choice questions covering general ultrasound knowledge, chronic pain, spine, peripheral/autonomic nerves and musculoskeletal topics', '2 hours', '20%'],
                ['2A - Practical', 'Four ultrasound-guided procedures on a fresh cadaver, one from each region (spine, MSK joint, MSK soft tissue, peripheral nerve), before two examiners', '15 min each, 60 min total', '60%'],
                ['2B - Modified Oral', 'One extended clinical vignette: 5 minutes to review, then diagnosis and procedure questions (up to 10), plus a physical and ultrasound examination of a live model', 'Up to 30 min', '20%'],
            ]}
            keep.insert(1, table)
            sub['blocks'] = keep
        if sub['title'] == 'Part 2A Practical Rating Criteria':
            items = []
            keep = []
            for b in bl:
                if b['t'] == 'p' and b['text'].startswith('#'):
                    continue
                m = re.match(r'^(\d)\s{3,}(.*)$', b.get('text', ''))
                if m:
                    items.append(m.group(2))
                    if not any(x.get('t') == 'ol' and x.get('_ck') for x in keep):
                        keep.append({'t': 'ol', 'items': items, '_ck': True})
                    continue
                keep.append(b)
            for b in keep:
                b.pop('_ck', None)
            sub['blocks'] = keep

# --- draw groups and sources ---
DRAW = {
    'spine': ['Cervical Medial Branch Block', 'Cervical Selective Nerve Root Block', 'Thoracic Medial Branch / Facet Joint Block', 'Lumbar Medial Branch / Facet Joint Block', 'Caudal Epidural Injection'],
    'nerve': ['Cervical Sympathetic Trunk (Stellate Ganglion) Block', 'Suprascapular Nerve Block', 'Ilioinguinal / Iliohypogastric Nerve Block', 'Median Nerve at the Wrist', 'Ulnar Nerve at the Cubital Canal'],
    'joint': ['Acromioclavicular Joint Injection', 'Glenohumeral Joint Injection', 'Hip Joint Injection', 'Knee Joint Injection', 'Tibiotalar Joint Injection'],
    'soft': ['Biceps Tendon (Peritendinous) Injection', 'Subdeltoid Bursa Injection', 'Epicondylosis: Tendon Sheath Injection / Fenestration', 'Piriformis Injection', 'Trochanteric Bursa Complex Injection'],
}
SOURCES = {
    'Cervical Medial Branch Block': ('NAR 6; PEN 13', 'JAN 15; WAL 26-27; RAPM II'),
    'Cervical Selective Nerve Root Block': ('NAR 8; PEN 12', 'WAL 29; RAPM II'),
    'Thoracic Medial Branch / Facet Joint Block': ('WAL 91', 'KAR 7, 11; NAR 9; RAPM II'),
    'Lumbar Medial Branch / Facet Joint Block': ('NAR 10; PEN 14', 'WAL 105-106; KOR; RAPM II'),
    'Caudal Epidural Injection': ('NAR 13; PEN 17', 'BIG 38; WAL 110; RAPM II'),
    'Cervical Sympathetic Trunk (Stellate Ganglion) Block': ('PEN 3; NAR 24', 'BIG 44-45; JAN 12; WAL 25; RAPM I'),
    'Suprascapular Nerve Block': ('PEN 4', 'JAN 17; BIG 18; WAL 42'),
    'Ilioinguinal / Iliohypogastric Nerve Block': ('PEN 6; BIG 34', 'WAL 100-101; KOR; RAPM I'),
    'Median Nerve at the Wrist': ('WAL 66, 68', 'JAC 5; PEN 21'),
    'Ulnar Nerve at the Cubital Canal': ('WAL 54-55', 'JAC 4; BIG 21'),
    'Acromioclavicular Joint Injection': ('WAL 36', 'JAC 3; PEN 19'),
    'Glenohumeral Joint Injection': ('WAL 35; NAR 26', 'JAC 3; PEN 19; RAPM III'),
    'Hip Joint Injection': ('NAR 28; PEN 22', 'WAL 115; JAC 6; RAPM IV'),
    'Knee Joint Injection': ('NAR 29; PEN 23', 'WAL 136; JAC 7; RAPM V'),
    'Tibiotalar Joint Injection': ('WAL 154', 'JAC 8; PEN 24; RAPM VI'),
    'Biceps Tendon (Peritendinous) Injection': ('WAL 46', 'JAC 3; PEN 19; RAPM III'),
    'Subdeltoid Bursa Injection': ('WAL 48', 'JAC 3; PEN 19; RAPM III'),
    'Epicondylosis: Tendon Sheath Injection / Fenestration': ('WAL 56-57', 'JAC 4; PEN 20'),
    'Piriformis Injection': ('PEN 8; WAL 126', 'RAPM I'),
    'Trochanteric Bursa Complex Injection': ('WAL 124-125', 'JAC 6; PEN 22; RAPM IV'),
    'Lumbar Selective Nerve Root Block': ('NAR 11; WAL 108', 'KOR; RAPM II'),
    'Subarachnoid (Intrathecal) Injection': ('NAR 12; KAR 8', 'WAL 109; BIG 50'),
    'Sacroiliac Joint Injection': ('NAR 14; PEN 15', 'PEN 16 (radiofrequency); WAL 133'),
    'Greater Occipital Nerve Block': ('PEN 2; NAR 23, 31', 'JAN 11; WAL 4'),
    'Intercostal Nerve Block': ('PEN 5; WAL 92', 'RAPM I; BIG 36-37 (paravertebral)'),
    'Saphenous Nerve Above the Knee': ('BIG 25; WAL 148', 'JAC 7'),
    'Tibial Nerve at the Tarsal Canal': ('WAL 157, 164-165', 'JAC 8; PEN 24'),
    'Pudendal Nerve Block': ('PEN 9; BIG 49', 'WAL 132; RAPM I'),
    'Lateral Femoral Cutaneous Nerve Block': ('PEN 10; BIG 24', 'WAL 117; RAPM I'),
    'Elbow Joint Injection': ('WAL 51; PEN 20', 'JAC 4'),
    'First Metacarpophalangeal Joint Injection': ('WAL 79', 'JAC 5; PEN 21'),
    'Distal Iliotibial Band Peritendon Injection': ('JAC 7', 'WAL knee section; PEN 23'),
    'Subtalar Joint Injection': ('WAL 155', 'JAC 8; PEN 24'),
    'First Metatarsophalangeal Joint Injection': ('WAL 172', 'JAC 8; PEN 24'),
}
REG = {'Spine Procedures': 'spine', 'Peripheral and Autonomic Nerve Procedures': 'nerve', 'Musculoskeletal Procedures': 'msk'}
titles = {p['title'] for p in g['procedures']}
for grp, names in DRAW.items():
    for n in names:
        assert n in titles, n
assert set(SOURCES) == titles, titles ^ set(SOURCES)
procs = []
for i, p in enumerate(g['procedures']):
    draw = next((k for k, v in DRAW.items() if p['title'] in v), None)
    procs.append({'id': 'p%02d' % (i + 1), 'title': p['title'], 'region': REG[p['region']], 'draw': draw,
                  'primary': SOURCES[p['title']][0], 'support': SOURCES[p['title']][1], **p['fields']})
g['procedures'] = procs
# drop procedure subs from sections (rendered from procedures list)
for sec in g['sections']:
    sec['subs'] = [s for s in sec['subs'] if 'fields' not in s]

g['oralTopics'] = [
    ['Shoulder pain', 7, False, 'JAC 3; PEN 19; NAR 26; RAPM III'],
    ['Elbow pain (epicondylosis)', 8, False, 'JAC 4; PEN 20; WAL 56-57'],
    ['Wrist pain / carpal tunnel', 2, False, 'JAC 5; WAL 66, 68; PEN 21'],
    ['Meralgia paresthetica', 1, False, 'PEN 10; BIG 24; RAPM I'],
    ['Cervical facet pain', 3, False, 'NAR 6; PEN 13; JAN 15'],
    ['Cervical radicular pain', 4, True, 'NAR 8; PEN 12'],
    ['Thoracic pain', 11, True, 'KAR 7, 11; WAL 88, 91; NAR 9'],
    ['Lumbar facet pain', 3, True, 'NAR 10; PEN 14'],
    ['Lumbosacral radicular pain', 4, False, 'NAR 11; WAL 108; KOR'],
    ['Sacroiliac joint pain', 11, False, 'NAR 14; PEN 15-16'],
    ['Hip pain', 5, False, 'JAC 6; PEN 22; RAPM IV'],
    ['Knee pain', 6, False, 'JAC 7; PEN 23; RAPM V'],
    ['Ankle and foot pain', 8, True, 'JAC 8; PEN 24; RAPM VI'],
    ['Occipital neuralgia / headache', 9, False, 'PEN 2; NAR 23, 31; JAN 11'],
    ['CRPS / sympathetic pain', 10, False, 'PEN 3; NAR 24; BIG 44-45'],
    ['Piriformis / buttock pain', 12, False, 'PEN 8; WAL 126; RAPM I'],
]
g['books'] = {
    'NAR': 'Narouze, Atlas of Ultrasound-Guided Procedures in Interventional Pain Management, 2nd ed. 2018',
    'PEN': 'Peng et al., Ultrasound for Interventional Pain Management: An Illustrated Procedural Guide, 2020',
    'WAL': 'Waldman, Comprehensive Atlas of Ultrasound-Guided Pain Management Injection Techniques, 2nd ed. 2019',
    'JAC': 'Jacobson, Fundamentals of Musculoskeletal Ultrasound, 3rd ed. 2018',
    'BIG': 'Bigeleisen, Gofeld, Orebaugh, Ultrasound-Guided Regional Anesthesia and Pain Medicine, 2nd ed. 2015',
    'KAR': 'Karmakar et al., Atlas of Sonoanatomy for Regional Anesthesia and Pain Medicine, 2018',
    'JAN': 'Jankovic & Peng, Regional Nerve Blocks in Anesthesia and Pain Therapy, 4th ed. 2015',
    'RAPM': 'Peng, Narouze et al., Ultrasound-Guided Interventional Procedures in Pain Medicine review series, Parts I-VI, RAPM 2009-2016',
    'FIPP': 'Stogicza, Mansano, Trescot et al., Interventional Pain: A Step-by-Step Guide for the FIPP Exam, 2020',
    'KOR': 'Korbe et al., Ultrasound-guided interventional procedures for chronic pain management, Pain Management 2015',
}
json.dump(g, open(outdir + '/guide.json', 'w'), ensure_ascii=False, separators=(',', ':'))
shutil.copy(src_mcq, outdir + '/mcq.json')
print('ok', len(procs), [s['title'] for s in g['sections']])
