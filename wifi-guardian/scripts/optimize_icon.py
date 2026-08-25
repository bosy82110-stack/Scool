from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/wifi-guardian-icon.png')
target = Path('/home/ubuntu/wifi-guardian/assets/images/icon.png')
image = Image.open(source).convert('RGB').resize((512, 512), Image.Resampling.LANCZOS)
for name in ('icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png'):
    image.save(target.parent / name, format='PNG', optimize=True, compress_level=9)
