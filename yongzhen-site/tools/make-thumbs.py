# 產生首頁與卡片用的縮圖（640px 寬）：python3 tools/make-thumbs.py
from PIL import Image
import os
SRC = ['banner/20260904123025.jpg','banner/20260703203821.jpg','side/20200923225250.jpg',
       'courses/content_5/201807092242491212.jpg','courses/content_2/202606300244464452.jpg','courses/content_26/201803152154393618.jpg']
os.makedirs('public/img/t', exist_ok=True)
for s in SRC:
    im = Image.open('public/img/' + s).convert('RGB'); w = 640
    im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    out = 'public/img/t/' + os.path.basename(s).rsplit('.', 1)[0] + '-640.jpg'
    im.save(out, quality=78, optimize=True, progressive=True); print(out, im.size, os.path.getsize(out)//1024, 'KB')
