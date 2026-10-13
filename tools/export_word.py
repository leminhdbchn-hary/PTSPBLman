# Xuất toàn bộ câu chữ của web ra file Word có sẵn ô điền: python3 tools/export_word.py
import re, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_text as E
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

R = E.R
doc = Document()
sec = doc.sections[0]; sec.orientation = WD_ORIENT.LANDSCAPE; sec.page_width, sec.page_height = Cm(29.7), Cm(21)
for m in ('left_margin', 'right_margin'): setattr(sec, m, Cm(1.5))
sec.top_margin = sec.bottom_margin = Cm(1.5)
st = doc.styles['Normal']; st.font.name = 'Calibri'; st.font.size = Pt(11); st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Calibri')
MANIFEST = {}

def shade(cell, hexcol):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement('w:shd'); sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), hexcol); tcPr.append(sh)
def setw(cell, cm): cell.width = Cm(cm)
def para(text, bold=False, size=None, color=None, after=4):
    p = doc.add_paragraph(); r = p.add_run(text); r.bold = bold
    if size: r.font.size = Pt(size)
    if color: r.font.color.rgb = RGBColor.from_string(color)
    p.paragraph_format.space_after = Pt(after); return p
def repeat_header(row):
    trPr = row._tr.get_or_add_trPr(); h = OxmlElement('w:tblHeader'); h.set(qn('w:val'), 'true'); trPr.append(h)

def table(code, heads, rows, note=None, extra_new=3, wcur=None):
    """heads: tên các trường (1..3). rows: list of [field,...] hoặc (vị trí, [field])."""
    k = len(heads)
    cols = ['Mã'] + ['Hiện: ' + h for h in heads] + ['MỚI: ' + h for h in heads]
    t = doc.add_table(rows=1, cols=len(cols)); t.style = 'Table Grid'; t.autofit = False
    total = 26.4; cw = [2.6]; rest = total - 2.6
    if k == 1: cw += [rest / 2, rest / 2]
    else:
        wts = wcur or [1.0] * k; s = sum(wts)
        cw += [rest / 2 * w / s for w in wts] * 2
    for i, c in enumerate(cols):
        cell = t.rows[0].cells[i]; cell.text = ''; r = cell.paragraphs[0].add_run(c); r.bold = True; r.font.size = Pt(10)
        shade(cell, 'D9E8DF' if i <= k else 'FFE9A8'); setw(cell, cw[i])
    repeat_header(t.rows[0])
    n = 0
    def addrow(cid, vals, blank=False):
        row = t.add_row(); cells = row.cells
        cells[0].text = ''; r = cells[0].paragraphs[0].add_run(cid); r.font.size = Pt(8); r.font.color.rgb = RGBColor(0x66, 0x66, 0x66); setw(cells[0], cw[0])
        for j in range(k):
            c = cells[1 + j]; c.text = ''; setw(c, cw[1 + j])
            if not blank: c.paragraphs[0].add_run(vals[j])
            c2 = cells[1 + k + j]; c2.text = ''; setw(c2, cw[1 + k + j]); shade(c2, 'FFFBE6')
    for rw in rows:
        n += 1; cid = '%s-%02d' % (code, n); vals = rw
        MANIFEST[cid] = vals; addrow(cid, vals)
    for e in range(extra_new):
        addrow('%s-MOI%d' % (code, e + 1), [''] * k, True)
    for i, c in enumerate(t.columns): c.width = Cm(cw[i])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def table_pos(code, rows, extra_new=0):
    """rows: [(vị trí, nội dung)] — bảng Mã | Vị trí | Hiện tại | MỚI"""
    cols = ['Mã', 'Vị trí trên trang', 'Hiện tại', 'MỚI (điền vào đây)']; cw = [2.4, 4.6, 9.7, 9.7]
    t = doc.add_table(rows=1, cols=4); t.style = 'Table Grid'; t.autofit = False
    for i, c in enumerate(cols):
        cell = t.rows[0].cells[i]; cell.text = ''; r = cell.paragraphs[0].add_run(c); r.bold = True; r.font.size = Pt(10); shade(cell, 'FFE9A8' if i == 3 else 'D9E8DF'); setw(cell, cw[i])
    repeat_header(t.rows[0])
    for n, (pos, txt) in enumerate(rows, 1):
        cid = '%s-%02d' % (code, n); MANIFEST[cid] = [txt]
        cells = t.add_row().cells
        for j, v in enumerate([cid, pos, txt, '']):
            cells[j].text = ''; r = cells[j].paragraphs[0].add_run(v); setw(cells[j], cw[j])
            if j == 0: r.font.size = Pt(8); r.font.color.rgb = RGBColor(0x66, 0x66, 0x66)
            if j == 1: r.font.size = Pt(9); r.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
            if j == 3: shade(cells[j], 'FFFBE6')
    for i, c in enumerate(t.columns): c.width = Cm(cw[i])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)

def h1(t): doc.add_heading(t, level=1)
def h2(t, sub=None):
    doc.add_heading(t, level=2)
    if sub: para(sub, size=10, color='666666')

# ---------- dữ liệu ----------
ca, cb = E.common()
cfg = open(R + 'assets/config.js', encoding='utf8').read()
def cfg_list(name):
    m = re.search(name + r': \[(.*?)\n  \]', cfg, re.S); return re.findall(r'text: "((?:[^"\\]|\\.)*)"', m.group(1)) if m else []
prizes = re.findall(r'name: "((?:[^"\\]|\\.)*)"', cfg)
wallCE = cfg_list('wallChiEm'); wallSEP = cfg_list('wallSep')
frm = re.search(r'from: "([^"]*)"', cfg).group(1)

def clean(rows, p_ok=None):
    out = []
    for pos, t in rows:
        if re.match(r'(aria-label|alt|title) ', pos) or pos.startswith('<br') or pos.startswith('<option'): continue
        if pos.startswith('<title>'): pos = 'Tiêu đề tab trình duyệt'
        out.append((pos.replace('<', '‹').replace('>', '›'), t))
    return out
SKIP = {'chị em', 'chị', 'Chị ', 'Phần ', 'Một chị em', 'Thiệp 20/10', 'Chị em PTSPBL', 'Đã đọc ', ' dòng', 'Gửi ', ' thương mến', 'Chị '}
def jsclean(rows):
    return [(p, t) for p, t in rows if t not in SKIP and len(t.strip()) > 6]

# ---------- mở đầu ----------
t = doc.add_heading('Bộ câu chữ trang chúc 20/10 – Phòng PTSPBL', 0)
para('Phiếu điền sẵn: anh chỉ cần điền vào các ô vàng, rồi gửi lại file này cho mình.', bold=True, size=12)
for s in [
    'Cột xanh = câu hiện đang có trên web. Cột vàng = ô để anh điền câu mới.',
    'Ô vàng để TRỐNG = giữ nguyên câu cũ. Muốn bỏ hẳn câu nào thì ghi chữ  XÓA  vào ô vàng.',
    'Muốn thêm câu mới: điền vào các dòng cuối bảng có mã “…-MOI1, MOI2…” (cần thêm nữa, cứ chèn thêm dòng, mã ghi tiếp MOI4, MOI5…).',
    'Mã ở cột đầu (VD CE-WISH-03) là để mình đối chiếu, anh đừng sửa.',
    'Ký hiệu {x} trong câu chúc sẽ tự thành tên xưng hô (chị / cô / sếp...), {X} là bản viết hoa chữ đầu (Chị / Cô / Sếp). Hãy giữ nguyên ký hiệu này ở chỗ muốn xưng hô thay đổi theo từng người.',
    'Những ô “chữ trong chương trình” là mảnh câu ghép với số/tên (VD “Đã đọc ” + số + “ dòng”): giữ nguyên dấu cách ở đầu/cuối và vị trí các từ để câu ghép vẫn đúng.',
    'Biểu tượng cảm xúc (emoji) cứ viết bình thường trong ô vàng.',
]: doc.add_paragraph(s, style='List Bullet')
doc.add_page_break()

# ================= PHẦN 1: CHỊ EM =================
h1('PHẦN 1 · TRANG DÀNH CHO CHỊ EM (index.html)')
h2('1.1 Lời chúc trên thiệp', 'Mỗi người nhận 1 lời chúc cố định theo tên. Viết {x} chỗ cần xưng hô.')
table('CE-CHUC', ['Lời chúc'], [[w] for (w,) in E.arr(ca, 'wishes')])
h2('1.2 Chức danh hài hước trên thiệp')
table('CE-DANH', ['Chức danh'], [[r] for (r,) in E.arr(ca, 'roles')])
h2('1.3 Đặc quyền (hiện trên thiệp / bản cũ)', 'Cột 1 là biểu tượng, cột 2 là nội dung.')
table('CE-DQ', ['Biểu tượng', 'Nội dung'], E.arr(ca, 'perks'), wcur=[1, 4])
h2('1.4 Phần 1/7 · Release Notes (6 dòng khi chạm mở ra)', 'Cột: biểu tượng · tiêu đề · nội dung.')
table('CE-NOTE', ['Biểu tượng', 'Tiêu đề', 'Nội dung'], E.arr(ca, 'notes'), wcur=[1, 2, 5])
h2('1.5 Phần 2/7 · Máy rút lời chúc, 3 lời chúc nhanh')
table('CE-RUT', ['Lời chúc'], [[x] for (x,) in E.arr(ca, 'pulls')])
h2('1.6 Phần 3/7 · Thẻ cào, 6 phiếu ưu đãi', 'Cột: biểu tượng · ưu đãi · ghi chú nhỏ.')
table('CE-CAO', ['Biểu tượng', 'Ưu đãi', 'Ghi chú nhỏ'], E.arr(ca, 'coupons'), wcur=[1, 4, 2.5])
h2('1.7 Phần 5/7 · Quà ở vòng quay (6 món)', 'Số lượng từng món chỉnh ở trang admin, ở đây chỉ đổi tên món. Thẻ “nhờ anh em 1 việc” vẫn là thẻ nhờ việc dù đổi tên.')
table('CE-QUA', ['Tên món quà'], [[x] for x in prizes], extra_new=0)
h2('1.8 Phần 6/7 · Lời nhắn của anh em trên “Tường lời chúc”', 'Mỗi lời hiện ghi “Một đồng nghiệp nam”; anh có thể thay bằng lời thật.')
table('CE-TUONG', ['Lời nhắn'], [[x] for x in wallCE])
h2('1.9 Dòng ký tên cuối thiệp')
table('CE-KY', ['Dòng ký tên'], [[frm]], extra_new=0)
o, j = E.page('index.html')
h2('1.10 Chữ cố định trên trang (tiêu đề, nút, hướng dẫn)')
table_pos('CE-TRANG', clean(o))
h2('1.11 Thông báo / dòng chữ hiện ra khi thao tác', 'Đây là chữ nằm trong chương trình (thông báo, nút, kết quả). Một số là mảnh ghép với số/tên.')
table_pos('CE-TB', jsclean(j))
doc.add_page_break()

# ================= PHẦN 2: SẾP =================
h1('PHẦN 2 · TRANG DÀNH CHO CÁC SẾP (sep.html)')
h2('2.1 Lời chúc trên thiệp Sếp', '{x} = tên xưng hô (sếp/chị), {X} = viết hoa chữ đầu.')
table('SEP-CHUC', ['Lời chúc'], [[w] for (w,) in E.arr(cb, 'wishes')])
h2('2.2 Danh hiệu')
table('SEP-DANH', ['Danh hiệu'], [[r] for (r,) in E.arr(cb, 'roles')])
h2('2.3 Báo cáo năng lực (mỗi Sếp hiện 5 dòng trong số này)')
table('SEP-NL', ['Dòng năng lực'], [[x] for (x,) in E.arr(cb, 'traits')])
h2('2.4 Bản cam kết của anh em (6 mục)')
table('SEP-CK', ['Cam kết'], [[x] for (x,) in E.arr(cb, 'pledges')])
h2('2.5 Ý kiến chỉ đạo (bấm “Xin chỉ đạo” ra ngẫu nhiên)')
table('SEP-CD', ['Chỉ đạo'], [[x] for (x,) in E.arr(cb, 'orders')])
h2('2.6 Tường lời chúc của anh em')
table('SEP-TUONG', ['Lời nhắn'], [[x] for x in wallSEP])
o2, j2 = E.page('sep.html')
h2('2.7 Chữ cố định trên trang Sếp (tờ trình, tiêu đề, nút)')
table_pos('SEP-TRANG', clean(o2))
h2('2.8 Thông báo / dòng chữ hiện ra khi thao tác')
table_pos('SEP-TB', jsclean(j2))
doc.add_page_break()

# ================= PHẦN 3: DÙNG CHUNG =================
h1('PHẦN 3 · CHỮ DÙNG CHUNG CHO CẢ HAI TRANG (cắm hoa, vòng quay, thiệp)')
mod = open(R + 'assets/modules.js', encoding='utf8').read()
mlit = []
for tt in E.lits(mod):
    tt = tt.replace('\\"', '"')
    if E.VI.search(tt) and '<' not in tt and len(tt.strip()) > 6 and tt not in [x[1] for x in mlit]: mlit.append(('chữ trong chương trình', tt))
table_pos('CHUNG', mlit)

out = R + 'docs/PTSPBL_cau-chu-can-doi.docx'
doc.save(out); json.dump(MANIFEST, open(R + 'docs/manifest.json', 'w'), ensure_ascii=False, indent=1)
print(out, len(MANIFEST))
