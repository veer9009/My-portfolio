from pathlib import Path
import re
from urllib.request import Request, urlopen

root = Path(__file__).resolve().parent.parent / 'vendor'
url = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400..800&display=swap'
ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
css = urlopen(Request(url, headers={'User-Agent': ua})).read().decode()
blocks = re.findall(r'/\* latin \*/\s*(@font-face\s*\{.*?\})', css, re.S)
if not blocks:
    blocks = re.findall(r'@font-face\s*\{.*?\}', css, re.S)
output = []
for i, block in enumerate(blocks):
    remote = re.search(r'url\((https://[^)]+)\)', block).group(1)
    extension = remote.rsplit('.', 1)[1]
    filename = f'font-{i}.{extension}'
    (root / filename).write_bytes(urlopen(remote).read())
    output.append(block.replace(remote, filename))
(root / 'fonts.css').write_text('\n\n'.join(output), encoding='utf-8')
for name in ['manrope', 'dmmono']:
    license_url = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{name}/OFL.txt'
    (root / f'{name}-LICENSE.txt').write_bytes(urlopen(license_url).read())
print(f'Hosted {len(blocks)} font files locally with licenses.')
