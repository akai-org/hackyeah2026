import sys, glob, av
from PIL import Image
frames_dir, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(f"{frames_dir}/*.jpeg") + glob.glob(f"{frames_dir}/*.jpg"))
c = av.open(out, mode="w", options={"movflags": "+faststart"})
s = c.add_stream("libx264", rate=30)
s.width, s.height, s.pix_fmt = 1920, 1080, "yuv420p"
s.options = {"crf": "16", "preset": "slow", "tune": "animation", "profile": "high"}
for f in files:
    img = Image.open(f).convert("RGB")
    for p in s.encode(av.VideoFrame.from_image(img)):
        c.mux(p)
for p in s.encode():
    c.mux(p)
c.close()
print("encoded", len(files), "frames ->", out)
