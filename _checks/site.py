"""Check the static Pages entry points and media assets without network access."""

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from struct import unpack_from
from urllib.parse import urlsplit


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.targets = set()
        self.references = []
        self.artwork_buttons = Counter()
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == "button" and "data-art" in attrs:
            self.artwork_buttons[attrs["data-art"]] += 1
        if "id" in attrs:
            target = attrs["id"]
            assert target not in self.targets, f"Duplicate id: {target}"
            self.targets.add(target)
        self.references.extend(attrs[key] for key in ("href", "src") if key in attrs)


def chunks(path):
    assert 0 < path.stat().st_size <= 10 * 1024 * 1024, f"Artwork exceeds the desktop media limit: {path.name}"
    data = path.read_bytes()
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", path
    assert unpack_from("<I", data, 4)[0] + 8 == len(data), path
    offset = 12
    while offset < len(data):
        tag = data[offset : offset + 4]
        size = unpack_from("<I", data, offset + 4)[0]
        end = offset + 8 + size
        assert end <= len(data), path
        yield tag, data[offset + 8 : end]
        offset = end + (size % 2)
    assert offset == len(data), path


root = Path(__file__).resolve().parents[1]
pages = {name: Page(root / name) for name in ("index.html", "install.html")}
release_prefix = "https://github.com/litianbaowork/shimmer-downloads/releases/download/"
packages = []
for name, page in pages.items():
    for href in page.references:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        file = url.path or name
        assert (root / file).is_file(), f"Missing file: {name} -> {href}"
        if url.fragment and file in pages:
            assert url.fragment in pages[file].targets, f"Missing anchor: {name} -> {href}"
    assets = Counter(href for href in page.references if href.startswith(release_prefix))
    assert len(assets) == 3 and set(assets.values()) == {2}, (name, assets)
    packages.append(set(assets))

assert packages[0] == packages[1], "Homepage and guide point to different releases."
assert len({link.rsplit("/", 1)[0] for link in packages[0]}) == 1
assert {link.rsplit(".", 1)[-1] for link in packages[0]} == {"dmg", "exe", "txt"}
readme = (root / "README.md").read_text(encoding="utf-8")
assert all(link in readme for link in packages[0]), "README downloads are out of date."
gallery = ("rain", "anime", "koi")
assert pages["index.html"].artwork_buttons == {name: 2 for name in gallery}, "Artwork picker mismatch"
for name in gallery:
    directory = root / "assets/art"
    for suffix in ("", "-small", "-back"):
        tags = [tag for tag, _ in chunks(directory / f"{name}{suffix}.webp")]
        assert tags and b"ANIM" not in tags, f"Expected a still image: {name}{suffix}"
    foreground = dict(chunks(directory / f"{name}-front.webp"))
    assert b"ALPH" in foreground or b"VP8L" in foreground, f"Missing alpha: {name}"
    loops = ["-motion", "-back-motion"]
    if name == "anime":
        loops.append("-front-motion")
    for suffix in loops:
        file = directory / f"{name}{suffix}.webp"
        animation = list(chunks(file))
        header = next((payload for tag, payload in animation if tag == b"ANIM"), b"")
        assert header[4:6] == bytes(2), f"Animation must loop: {file.name}"
        assert sum(tag == b"ANMF" for tag, _ in animation) > 1, f"Static loop: {file.name}"
        if suffix == "-front-motion":
            flags = next(payload[0] for tag, payload in animation if tag == b"VP8X")
            assert flags & 0x10, f"Expected a transparent animated foreground: {file.name}"
print("Verified bilingual routes, release parity, and still, loop and animated parallax assets for three artworks.")
