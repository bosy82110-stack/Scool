from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/basmala-learning-android/assets/images')
for name in ['icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png']:
    path = root / name
    image = Image.open(path).convert('RGBA')
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (512, 512), (255, 255, 255, 0))
    offset = ((512 - image.width) // 2, (512 - image.height) // 2)
    canvas.alpha_composite(image, offset)
    canvas.save(path, format='PNG', optimize=True, compress_level=9)
