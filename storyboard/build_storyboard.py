from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
import textwrap
import json

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / 'website Narration (Sep 2026) (1).docx'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with ZipFile(SOURCE) as archive:
    doc = ET.fromstring(archive.read('word/document.xml'))
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', NS)).strip()
              for p in doc.findall('./w:body/w:p', NS)]
sections = []
subheading = ''
headings = {'Automated Business Manager', 'Device Sharing', 'Engagement', 'Urgency', 'Gamification', 'Recognition'}
for paragraph in paragraphs:
    if not paragraph:
        continue
    if paragraph in {'Automation', 'Efficiency', 'Management'}:
        sections.append({'name': paragraph, 'scenes': []})
        subheading = ''
    elif paragraph in headings:
        subheading = paragraph
    else:
        paragraph = paragraph.replace('orthey', 'or they').replace('andno', 'and no')
        sections[-1]['scenes'].append({'text': paragraph, 'topic': subheading})

def make_svg(rows):
    width = 360 + max(len(row['scenes']) for row in rows) * 1056
    height = 120 + len(rows) * 850
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
             '<rect width="100%" height="100%" fill="#1c1c1c"/>']
    def text(x, y, content, size=28, fill='white', anchor='middle', weight=600):
        parts.append(f'<text x="{x}" y="{y}" fill="{fill}" font-family="Inter, Arial, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{escape(content)}</text>')
    for row_index, row in enumerate(rows):
        y = 80 + row_index * 850
        parts.append(f'<g id="{row["name"]}">')
        parts.append(f'<rect x="40" y="{y}" width="230" height="36" fill="#10b98a"/>')
        text(155, y + 25, row['name'], 20)
        for i, scene in enumerate(row['scenes']):
            x = 310 + i * 1056
            parts.append(f'<g id="{row["name"]}-scene-{i + 1}">')
            parts.append(f'<rect x="{x}" y="{y}" width="960" height="32" fill="#14223b"/>')
            text(x + 480, y + 23, str(i + 1), 20)
            text(x, y + 77, scene['topic'] or row['name'], 24, '#888888', 'start', 400)
            parts.append(f'<rect x="{x}" y="{y + 100}" width="960" height="540" fill="#000000"/>')
            parts.append(f'<rect x="{x}" y="{y + 690}" width="960" height="126" fill="#000000"/>')
            lines = textwrap.wrap(scene['text'], width=57, break_long_words=False)
            assert len(lines) <= 3, scene['text']
            first_baseline = y + 753 - (len(lines) - 1) * 18 + 10
            for line_index, line in enumerate(lines):
                text(x + 480, first_baseline + line_index * 36, line)
            parts.append('</g>')
        parts.append('</g>')
    parts.append('</svg>')
    return '\n'.join(parts)

ROOT.mkdir(exist_ok=True)
for rows, filename in [(sections, 'Website storyboard.svg')] + [([row], row['name'] + '.svg') for row in sections]:
    output = ROOT / filename
    output.write_text(make_svg(rows), encoding='utf-8')
    ET.parse(output)
(ROOT / 'narration.json').write_text(json.dumps(sections, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({row['name']: len(row['scenes']) for row in sections}))
