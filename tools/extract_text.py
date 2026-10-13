import re, json, html
from html.parser import HTMLParser
import os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
VI=re.compile(r'[À-ỹà-ỹ]')
def lits(src):
    out=[]
    for m in re.finditer(r'"((?:[^"\\\n]|\\.)*)"|\'((?:[^\'\\\n]|\\.)*)\'',src):
        t=m.group(1) if m.group(1) is not None else m.group(2)
        out.append(t)
    return out
def keep_js(t):
    if '<' in t or '>' in t and len(t)<3: return False
    t2=re.sub(r'<[^>]+>','',t)
    if not VI.search(t) and not re.search(r'[A-Za-z]+ [A-Za-z]+',t): return False
    if not VI.search(t): return False
    if re.search(r'^(assets/|#|\.|http)',t) or 'function' in t or 'px' in t and not VI.search(t): return False
    return len(t.strip())>=3
class P(HTMLParser):
    def __init__(s):
        super().__init__(); s.skip=0; s.stack=[]; s.items=[]; s.scripts=[]; s.cur=None
    def handle_starttag(s,tag,a):
        a=dict(a)
        if tag in('script','style'): s.skip+=1; s.cur=tag
        for k in('placeholder','aria-label','title','alt'):
            if a.get(k) and VI.search(a[k]): s.items.append((k+' của <'+tag+'>',a[k]))
        s.stack.append((tag,a.get('id') or a.get('class') or ''))
    def handle_endtag(s,tag):
        if tag in('script','style'): s.skip-=1
        if s.stack: s.stack.pop()
    def handle_data(s,d):
        if s.skip:
            if s.cur=='script': s.scripts.append(d)
            return
        t=re.sub(r'\s+',' ',d).strip()
        if t and (VI.search(t) or len(t)>3):
            tag,idc=s.stack[-1] if s.stack else ('','')
            s.items.append(('<'+tag+'>'+(' #'+idc if idc else ''),t))
def page(name):
    p=P(); p.feed(open(R+name,encoding='utf8').read())
    seen=set(); out=[]
    for w,t in p.items:
        if t in seen: continue
        seen.add(t); out.append((w,t))
    js=[]
    for sc in p.scripts:
        for t in lits(sc):
            t=html.unescape(t.replace('\\"','"').replace("\\'","'"))
            if keep_js(t) and t not in seen: seen.add(t); js.append(('chữ trong chương trình',t))
    return out,js
def objlists(path,start_pat,keys):
    s=open(R+path,encoding='utf8').read()
    res={}
    for k in keys:
        pass
    return s
def common():
    s=open(R+'assets/common.js',encoding='utf8').read()
    a=s.index('var W20 = {'); b=s.index('\n};',a)+3
    c=s.index('W20.sep = {'); d=s.index('\n};',c)+3
    return s[a:b],s[c:d]
def arr(block,key):
    m=re.search(r'\n  '+key+r': \[(.*?)\n  \]',block,re.S)
    if not m: return []
    body=m.group(1)
    rows=[]
    for line in body.split('\n'):
        line=line.strip().rstrip(',')
        if not line: continue
        if line.startswith('['):
            parts=[bytes(x,'utf8').decode('utf8') for x in re.findall(r'"((?:[^"\\]|\\.)*)"',line)]
            rows.append([p.replace('\\"','"') for p in parts])
        else:
            m2=re.match(r'^"((?:[^"\\]|\\.)*)"$',line)
            if m2: rows.append([m2.group(1).replace('\\"','"')])
    return rows
if __name__=='__main__':
    a,b=common()
    for k in['wishes','roles','perks','notes','coupons','pulls']: print(k,len(arr(a,k)))
    for k in['wishes','roles','traits','pledges','orders']: print('sep',k,len(arr(b,k)))
    for n in('index.html','sep.html'):
        o,j=page(n); print(n,len(o),len(j))
        for x in o+j: print('  ',x[0],'|',x[1][:90])
