from PIL import Image, ImageOps, ImageDraw, ImageFont
from pathlib import Path
import math, os

workspace = Path(r"C:\Users\hakam\OneDrive\Desktop\Claude\Sessions\steinheim\steinheim-eg")
outdir = workspace / "tmp_image_audit"
outdir.mkdir(exist_ok=True)

try:
    font = ImageFont.truetype("arial.ttf", 14)
    small = ImageFont.truetype("arial.ttf", 11)
except Exception:
    font = ImageFont.load_default()
    small = ImageFont.load_default()

def make_sheet(files, out, title, thumb=(210, 170), cols=5, max_files=80):
    files = list(files)[:max_files]
    if not files:
        return
    pad = 14
    label_h = 54
    title_h = 48
    rows = math.ceil(len(files)/cols)
    w = cols*(thumb[0]+pad)+pad
    h = title_h + rows*(thumb[1]+label_h+pad)+pad
    sheet = Image.new("RGB", (w,h), "white")
    draw = ImageDraw.Draw(sheet)
    draw.text((pad, 14), f"{title} ({len(files)} shown)", fill=(20,20,20), font=font)
    for i, f in enumerate(files):
        x = pad + (i%cols)*(thumb[0]+pad)
        y = title_h + (i//cols)*(thumb[1]+label_h+pad)
        try:
            im = Image.open(f).convert("RGBA")
            bg = Image.new("RGBA", im.size, (250,250,248,255))
            if im.mode == "RGBA":
                bg.alpha_composite(im)
                im = bg.convert("RGB")
            else:
                im = im.convert("RGB")
            im.thumbnail(thumb, Image.LANCZOS)
            box = Image.new("RGB", thumb, (245,245,243))
            bx = x + (thumb[0]-im.width)//2
            by = y + (thumb[1]-im.height)//2
            sheet.paste(box, (x,y))
            sheet.paste(im, (bx,by))
            draw.rectangle((x,y,x+thumb[0],y+thumb[1]), outline=(220,220,215))
        except Exception as e:
            draw.rectangle((x,y,x+thumb[0],y+thumb[1]), fill=(245,230,230), outline=(220,120,120))
            draw.text((x+5,y+5), "ERR", fill=(140,0,0), font=font)
        rel = str(f)
        parts = f.parts
        if "products" in parts:
            rel = "/".join(parts[parts.index("products")+1:])
        elif "STEINHEIM" in parts:
            rel = "/".join(parts[parts.index("STEINHEIM")+1:])
        elif "images" in parts:
            rel = "/".join(parts[parts.index("images")+1:])
        lines = []
        cur = ""
        for word in rel.replace("\\", "/").split("/"):
            if len(cur)+len(word)+1 > 30:
                lines.append(cur)
                cur = word
            else:
                cur = word if not cur else cur + "/" + word
        if cur: lines.append(cur)
        for j,line in enumerate(lines[:4]):
            draw.text((x, y+thumb[1]+5+j*12), line[:36], fill=(70,70,70), font=small)
    sheet.save(out, quality=92)

public = workspace / "public" / "images"
current_product_files = sorted((public/"products").rglob("*.png"))
for series in ["joy","up","art","quatro"]:
    make_sheet(sorted((public/"products"/series).rglob("*.png")), outdir/f"current-products-{series}.jpg", f"CURRENT SITE PRODUCT IMAGES — {series.upper()}", cols=5, max_files=70)

current_site_files = []
for sub in ["collections/home", "lifestyle", "steinheim/final", "finishes", "steinheim/finish-planets"]:
    p = public / sub
    if p.exists():
        current_site_files += sorted([x for x in p.rglob("*") if x.suffix.lower() in [".png",".jpg",".jpeg",".webp"]])
make_sheet(current_site_files, outdir/"current-site-nonproduct.jpg", "CURRENT SITE NON-PRODUCT / LIFESTYLE / FINISH IMAGES", cols=5, max_files=100)

karim_root = Path(r"C:\Users\hakam\Downloads\STEINHEIM-20260624T193304Z-3-001\STEINHEIM")
karim_2026 = karim_root / "2026"
for collection in ["JOY COLLECTION", "UP COLLECTION", "ART COLLECTION", "QUATRO COLLECTION"]:
    p = karim_2026 / collection
    if p.exists():
        files = sorted([x for x in p.rglob("*") if x.suffix.lower() in [".png",".jpg",".jpeg",".webp"]])
        make_sheet(files, outdir/f"karim-2026-{collection.split()[0].lower()}.jpg", f"KARIM 2026 PRODUCT ASSETS — {collection}", cols=5, max_files=90)

design = karim_root / "Design 2026"
if design.exists():
    design_files = sorted([x for x in design.rglob("*") if x.suffix.lower() in [".png",".jpg",".jpeg",".webp"]])
    make_sheet(design_files, outdir/"karim-design-2026.jpg", "KARIM DESIGN 2026 LIFESTYLE / DESIGN ASSETS", cols=5, max_files=100)

print("created", outdir)
for f in sorted(outdir.glob("*.jpg")):
    print(f.name, f.stat().st_size)
