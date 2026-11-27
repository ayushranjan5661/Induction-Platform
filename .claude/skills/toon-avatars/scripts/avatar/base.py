"""Loads the master avatar template and slices it into reusable parts.

The template (assets/base-avatar.svg) is the fully-rigged original character.
Every generated character is assembled from these slices plus variant parts.
"""
import os, re
_HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.normpath(os.path.join(_HERE, '..', '..', 'assets', 'base-avatar.svg'))
S = open(TEMPLATE, encoding='utf-8').read()
S = re.sub(r'<metadata>.*?</metadata>', '', S, flags=re.S).replace(' xmlns:c2pa="http://c2pa.org/manifest"', '')

def _cut(a, b, src=S):
    i = src.index(a); j = src.index(b, i); return src[i:j]

P = {}
P['top'] = S[:S.index('<!-- Background -->')]
P['bg'] = _cut('<!-- Background -->', '<!-- Shoes')
P['shoes'] = _cut('<!-- Shoes', '<!-- Jeans')
P['legs'] = _cut('<!-- Jeans', '<!-- Fly')
P['fly'] = _cut('<!-- Fly', '<path d="M200 352 Q256 364')
P['hemshadow'] = _cut('<path d="M200 352 Q256 364', '<!-- Upper body')
P['hood'] = _cut('  <!-- Outer hood', '  <!-- Inner grey hoodie')
P['inner'] = _cut('  <!-- Inner grey hoodie', '  <!-- Neck')
P['neck'] = _cut('  <!-- Neck', '  <!-- Inner hood collar')
P['collar'] = _cut('  <!-- Inner hood collar', '  <!-- Shoulder silhouettes')
P['shoulders'] = _cut('  <!-- Shoulder silhouettes', '  <!-- Jacket panels')
P['panels'] = _cut('  <!-- Jacket panels', '  <!-- Left arm')
P['arms'] = _cut('  <!-- Left arm', '  <!-- Head (tilts)')
_H = S[S.index('  <!-- Head (tilts)'):]
P['ears'] = _cut('    <ellipse class="o" fill="url(#skinF)" cx="191"', '    <path class="o" fill="url(#skinF)" d="M192 122', _H)
P['face'] = _cut('    <path class="o" fill="url(#skinF)" d="M192 122', '    <ellipse fill="url(#blush)"', _H)
P['blush'] = _cut('    <ellipse fill="url(#blush)"', '    <g clip-path="url(#faceClip)">', _H)
P['smO'] = _cut('    <g class="smO">', '    <!-- Hair -->', _H)
P['h1_back'] = re.search(r'    <path class="o" fill="url\(#hairB\)"[^\n]*\n', _H).group(0)
P['h1_front'] = _cut('    <path class="o tuft"', '  </g>\n</g>', _H)
P['zipper'] = _cut('  <path d="M238.6 244', '  <!-- White cords', P['panels'])
