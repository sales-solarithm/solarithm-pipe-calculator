"""
Solarithm - Pipe Requirement Summary PDF generator
Requires:  pip install reportlab pillow numpy
Usage:     python make_pipe_summary.py
Edit the CONFIG block below for a new project; everything else is layout.
"""
import math, io
import numpy as np
from PIL import Image

# ===================== CONFIG =====================
LOGO_PATH   = "Solaritham_Logo__JPG__Design___Engineering_jpg.jpeg"
OUTPUT_PATH = "Shresth_Parisar_E_Block_Solarithm.pdf"
PROJECT     = "Shresth Parisar (E Block)"
DATE_TEXT   = "05 Oct 2026"
PIPE_LENGTH = "20 ft"
SIZES       = ["40 x 40", "60 x 40", "80 x 40"]
ROWS = [  # (category, 40x40, 60x40, 80x40)
    ("Purlin", 0, 43, 0), ("Rafter", 10, 31, 0), ("Leg", 12, 0, 28),
    ("Supports", 15, 0, 0), ("Walkway", 25, 0, 0), ("Bypass", 6, 0, 15), ("Stairs", 6, 0, 0),
]
NOTE_TEXT   = "PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION."
FOOTER_LEFT = "Solarithm Design & Engineering"
FOOTER_CITY = "|  Surat, India"
# ==================================================

def prepare_logo(path):
    """Crop whitespace around the logo and force a pure-white background."""
    im = Image.open(path).convert("RGB")
    a = np.array(im)
    ys, xs = np.where((a < 235).any(axis=2))
    im = im.crop((xs.min()-10, ys.min()-10, xs.max()+10, ys.max()+10))
    a = np.array(im).astype(int); a[(a >= 240).all(axis=2)] = 255
    out = Image.fromarray(a.astype("uint8"))
    buf = io.BytesIO(); out.save(buf, "PNG"); buf.seek(0)
    return buf, out.size
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, white, Color
from reportlab.lib.utils import ImageReader

GREEN=HexColor('#063D25'); MID=HexColor('#1F6B3F'); GOLD=HexColor('#C9961A'); LGOLD=HexColor('#F3E3B0')
CREAM=HexColor('#FAF6EA'); INK=HexColor('#1B2A22'); MUTE=HexColor('#9AA39D'); LINE=HexColor('#E6DFC8'); RED=HexColor('#9B1C1C')
W,H=A4
Y=lambda t:H-t
c=canvas.Canvas(OUTPUT_PATH,pagesize=A4)
c.setTitle('Pipe Requirement Summary - '+PROJECT); c.setAuthor(FOOTER_LEFT)

def alpha(a): pass
def ca(col,a): return Color(col.red,col.green,col.blue,a)
def shadow(x,ytop,w,h,r=8):
    for i in range(4):
        c.setFillColor(Color(0,0,0,.035)); c.roundRect(x-i+1,Y(ytop+h)-1-i,w+2*i-0,h+i,r+i,fill=1,stroke=0)

# ---------- HEADER ----------
HH=205
c.setFillColor(GREEN); c.rect(0,Y(HH),W,HH,fill=1,stroke=0)
# sun rays motif
c.saveState(); p=c.beginPath(); p.rect(0,Y(HH),W,HH); c.clipPath(p,stroke=0,fill=0)
cx,cy=W-70,Y(40)
c.setStrokeColor(ca(GOLD,.12)); c.setLineWidth(1.2)
for k in range(0,360,12):
    a=math.radians(k); c.line(cx+60*math.cos(a),cy+60*math.sin(a),cx+330*math.cos(a),cy+330*math.sin(a))
c.setFillColor(ca(GOLD,.16)); c.circle(cx,cy,56,fill=1,stroke=0)
c.setFillColor(ca(GOLD,.09)); c.circle(cx,cy,86,fill=1,stroke=0)
# diagonal gold bands
c.setFillColor(GOLD); p=c.beginPath(); p.moveTo(0,Y(HH-26)); p.lineTo(W,Y(HH-58)); p.lineTo(W,Y(HH-46)); p.lineTo(0,Y(HH-14)); p.close(); c.drawPath(p,fill=1,stroke=0)
c.setFillColor(ca(GOLD,.45)); p=c.beginPath(); p.moveTo(0,Y(HH-10)); p.lineTo(W,Y(HH-40)); p.lineTo(W,Y(HH-36)); p.lineTo(0,Y(HH-6)); p.close(); c.drawPath(p,fill=1,stroke=0)
c.restoreState()
c.setFillColor(GOLD); c.rect(0,Y(HH)-4,W,4,fill=1,stroke=0)

# logo card
_buf,(_w,_h)=prepare_logo(LOGO_PATH); logo=ImageReader(_buf); lw=214; lh=lw*_h/_w
pw,ph=lw+30,lh+26
shadow(36,34,pw,ph,10)
c.setFillColor(white); c.roundRect(36,Y(34+ph),pw,ph,10,fill=1,stroke=0)
c.drawImage(logo,36+15,Y(34+13+lh),lw,lh)

# title block
c.setFillColor(GOLD); c.setFont('Helvetica-Bold',9); c.drawRightString(W-40,Y(52),'S O L A R I T H M   D E S I G N   &   E N G I N E E R I N G')
c.setFillColor(white); c.setFont('Helvetica-Bold',27); c.drawRightString(W-40,Y(86),'PIPE REQUIREMENT')
c.setFillColor(GOLD); c.setFont('Helvetica-Bold',27); c.drawRightString(W-40,Y(116),'SUMMARY')
c.setStrokeColor(GOLD); c.setLineWidth(1.5); c.line(W-130,Y(128),W-40,Y(128))
c.setFillColor(HexColor('#CFE3D6')); c.setFont('Helvetica',9.5); c.drawRightString(W-40,Y(144),'Structure pipe quantity estimate')

# ---------- INFO STRIP ----------
sx,st,sw,sh=40,HH-8+0,W-80,50
st=HH+10
shadow(sx,st,sw,sh,8)
c.setFillColor(white); c.roundRect(sx,Y(st+sh),sw,sh,8,fill=1,stroke=0)
cols=[('PROJECT',PROJECT,0),('DATE',DATE_TEXT,.52),('STANDARD PIPE LENGTH',PIPE_LENGTH,.76)]
for i,(lab,val,f) in enumerate(cols):
    x=sx+18+sw*f
    c.setFillColor(GOLD); c.setFont('Helvetica-Bold',7.5); c.drawString(x,Y(st+20),lab)
    c.setFillColor(GREEN); c.setFont('Helvetica-Bold',12); c.drawString(x,Y(st+37),val)
    if i: c.setStrokeColor(LINE); c.setLineWidth(.8); c.line(x-14,Y(st+10),x-14,Y(st+sh-10))
c.setFillColor(GOLD); c.roundRect(sx,Y(st+sh),4,sh,2,fill=1,stroke=0)

# ---------- DATA ----------
rows=ROWS
tot=[sum(r[i] for r in rows) for i in (1,2,3)]
grand=sum(tot)
buf=lambda n:(math.ceil(n*1.10),math.ceil(n*1.15))

# ---------- SUMMARY CARDS ----------
ct=st+sh+20; chh=92; gap=10; cwid=(W-80-3*gap)/4
sizes=SIZES
accent=[GREEN,MID,GOLD]
for i in range(4):
    x=40+i*(cwid+gap)
    last=(i==3)
    shadow(x,ct,cwid,chh,8)
    c.setFillColor(GREEN if last else white); c.roundRect(x,Y(ct+chh),cwid,chh,8,fill=1,stroke=0)
    if not last:
        c.setFillColor(accent[i]); c.roundRect(x,Y(ct+6),cwid,6,3,fill=1,stroke=0); c.rect(x,Y(ct+6),cwid,3,fill=1,stroke=0)
    n=grand if last else tot[i]; lo,hi=buf(n)
    c.setFillColor(GOLD if last else MUTE); c.setFont('Helvetica-Bold',8)
    c.drawString(x+14,Y(ct+26),'TOTAL PIPES' if last else f'{sizes[i]} PIPES')
    c.setFillColor(white if last else GREEN); c.setFont('Helvetica-Bold',32); c.drawString(x+14,Y(ct+58),str(n))
    c.setFillColor(HexColor('#CFE3D6') if last else MUTE); c.setFont('Helvetica',7.5)
    c.drawString(x+14+c.stringWidth(str(n),'Helvetica-Bold',32)+5,Y(ct+58),'pcs')
    c.setStrokeColor(GOLD if last else LINE); c.setLineWidth(.6); c.line(x+14,Y(ct+68),x+cwid-14,Y(ct+68))
    c.setFillColor(HexColor('#CFE3D6') if last else MUTE); c.setFont('Helvetica',7.2)
    c.drawString(x+14,Y(ct+79),'With 10-15% extra:')
    c.setFillColor(GOLD if last else GREEN); c.setFont('Helvetica-Bold',8)
    c.drawRightString(x+cwid-14,Y(ct+79),f'{lo}-{hi}')

# ---------- TABLE ----------
tt=ct+chh+22
c.setFillColor(GOLD); c.rect(40,Y(tt+11),4,16,fill=1,stroke=0)
c.setFillColor(GREEN); c.setFont('Helvetica-Bold',11.5); c.drawString(52,Y(tt+9),'CATEGORY-WISE BREAKDOWN')
c.setFillColor(MUTE); c.setFont('Helvetica',8); c.drawRightString(W-40,Y(tt+9),'Quantities in number of pipes')
ty=tt+22; tw=W-80; x0=40
cw=[tw*.27,tw*.165,tw*.165,tw*.165,tw*.235]
hh,rh,gh=32,29,38
tbh=hh+rh*len(rows)+gh
shadow(x0,ty,tw,tbh,8)
c.setFillColor(white); c.roundRect(x0,Y(ty+tbh),tw,tbh,8,fill=1,stroke=0)
# header
c.saveState(); p=c.beginPath(); p.roundRect(x0,Y(ty+tbh),tw,tbh,8); c.clipPath(p,stroke=0,fill=0)
c.setFillColor(GREEN); c.rect(x0,Y(ty+hh),tw,hh,fill=1,stroke=0)
x=x0
heads=['CATEGORY']+sizes+['ROW TOTAL']
for i,h in enumerate(heads):
    c.setFillColor(GOLD); c.setFont('Helvetica-Bold',9.5)
    if i==0: c.drawString(x+18,Y(ty+hh/2+3.5),h)
    else: c.drawCentredString(x+cw[i]/2,Y(ty+hh/2+3.5),h)
    x+=cw[i]
maxrow=max(sum(r[1:]) for r in rows)
yy=ty+hh
for k,r in enumerate(rows):
    if k%2: c.setFillColor(CREAM); c.rect(x0,Y(yy+rh),tw,rh,fill=1,stroke=0)
    c.setFillColor(GOLD); c.rect(x0,Y(yy+rh),3,rh,fill=1,stroke=0)
    c.setFillColor(GREEN); c.setFont('Helvetica-Bold',10); c.drawString(x0+18,Y(yy+rh/2+3.5),r[0])
    x=x0+cw[0]
    for j in (1,2,3):
        v=r[j]
        if v: c.setFillColor(INK); c.setFont('Helvetica-Bold',10.5); c.drawCentredString(x+cw[j]/2,Y(yy+rh/2+3.7),str(v))
        else: c.setFillColor(HexColor('#C5CBC7')); c.setFont('Helvetica',10.5); c.drawCentredString(x+cw[j]/2,Y(yy+rh/2+3.7),'-')
        x+=cw[j]
    rt=sum(r[1:]); bw=58*rt/maxrow
    c.setFillColor(LINE); c.roundRect(x+12,Y(yy+rh/2+3),58,6,3,fill=1,stroke=0)
    c.setFillColor(GOLD); c.roundRect(x+12,Y(yy+rh/2+3),max(bw,3),6,3,fill=1,stroke=0)
    c.setFillColor(GREEN); c.setFont('Helvetica-Bold',10.5); c.drawRightString(x+cw[4]-18,Y(yy+rh/2+3.7),str(rt))
    yy+=rh
    c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(x0,Y(yy),x0+tw,Y(yy))
# vertical separators
c.setStrokeColor(LINE); c.setLineWidth(.5)
x=x0
for i in range(4):
    x+=cw[i]; c.line(x,Y(ty+hh),x,Y(ty+hh+rh*len(rows)))
# grand total
c.setFillColor(GOLD); c.rect(x0,Y(yy+gh),tw,gh,fill=1,stroke=0)
x=x0; vals=['GRAND TOTAL']+tot+[grand]
for i,v in enumerate(vals):
    c.setFillColor(white); 
    if i==0: c.setFont('Helvetica-Bold',12); c.drawString(x+18,Y(yy+gh/2+4.2),v)
    else:
        c.setFont('Helvetica-Bold',14 if i<4 else 15); 
        if i==4: c.setFillColor(GREEN)
        c.drawCentredString(x+cw[i]/2,Y(yy+gh/2+5),str(v)) if i<4 else c.drawRightString(x+cw[i]-18,Y(yy+gh/2+5),str(v))
    x+=cw[i]
c.restoreState()

# ---------- NOTE ----------
nt=ty+tbh+18; nh=52
c.setFillColor(HexColor('#FDF1F1')); c.roundRect(40,Y(nt+nh),tw,nh,8,fill=1,stroke=0)
c.setFillColor(RED); c.roundRect(40,Y(nt+nh),5,nh,2.5,fill=1,stroke=0)
c.circle(70,Y(nt+nh/2),13,fill=1,stroke=0)
c.setFillColor(white); c.setFont('Helvetica-Bold',17); c.drawCentredString(70,Y(nt+nh/2+6),'!')
c.setFillColor(RED); c.setFont('Helvetica-Bold',8); c.drawString(96,Y(nt+19),'IMPORTANT NOTE')
c.setFont('Helvetica-Bold',10); c.drawString(96,Y(nt+35),NOTE_TEXT)
c.setFillColor(MUTE); c.setFont('Helvetica-Oblique',8.5)
c.drawCentredString(W/2,Y(nt+nh+17),f'Calculation based on standard pipe length of {PIPE_LENGTH}.')

# ---------- FOOTER ----------
c.setFillColor(GREEN); c.rect(0,0,W,40,fill=1,stroke=0)
c.setFillColor(GOLD); c.rect(0,40,W,3,fill=1,stroke=0)
c.setFillColor(white); c.setFont('Helvetica-Bold',8.5); c.drawString(40,15,FOOTER_LEFT)
c.setFillColor(GOLD); c.drawString(40+c.stringWidth(FOOTER_LEFT,'Helvetica-Bold',8.5)+8,15,FOOTER_CITY)
c.setFillColor(HexColor('#CFE3D6')); c.setFont('Helvetica',8); c.drawRightString(W-40,15,f'Pipe Requirement Summary  |  {PROJECT}')
c.save()
