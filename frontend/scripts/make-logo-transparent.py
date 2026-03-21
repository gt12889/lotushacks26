"""Remove white/light background from logo PNG, make it transparent.

The app favicon is public/icon.svg (blue tile + fish emoji). These paths are
optional raster exports if you still need PNGs for something else.
"""
from PIL import Image
import os

src = os.path.join(os.path.dirname(__file__), "..", "src", "logo.png")
out = os.path.join(os.path.dirname(__file__), "..", "public", "icon.png")
out_favicon = os.path.join(os.path.dirname(__file__), "..", "public", "favicon.png")
out_apple = os.path.join(os.path.dirname(__file__), "..", "public", "apple-icon.png")

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

# Threshold: pixels brighter than this become transparent (removes white/light grey bg)
# 235 = keep light teal/cyan of logo, remove white/off-white
THRESHOLD = 235

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        # If pixel is very light (near white), make it transparent
        if r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
            pixels[x, y] = (r, g, b, 0)
        # Also fade semi-transparent for anti-aliased edges (slight light tint)
        elif r >= 220 and g >= 220 and b >= 220:
            # Blend towards transparent for soft edges
            blend = max(0, 1 - (r + g + b) / (3 * 255))
            pixels[x, y] = (r, g, b, int(a * blend))

img.save(out)
img.save(out_favicon)
img.save(out_apple)
# Also update source
img.save(src)
print("Saved transparent logo to public/ and src/logo.png")
