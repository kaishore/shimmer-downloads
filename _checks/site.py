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
        if "srcset" in attrs:
            self.references.extend(candidate.split()[0] for candidate in attrs["srcset"].split(","))


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


def verify_loop(path, transparent=False):
    animation = list(chunks(path))
    header = next((payload for tag, payload in animation if tag == b"ANIM"), b"")
    assert header[4:6] == bytes(2), f"Animation must loop: {path}"
    durations = [int.from_bytes(frame[12:15], "little") for tag, frame in animation if tag == b"ANMF"]
    assert len(durations) > 1 and min(durations) > 0, f"Expected timed animation frames: {path}"
    if transparent:
        flags = next(payload[0] for tag, payload in animation if tag == b"VP8X")
        assert flags & 0x10, f"Expected a transparent animated foreground: {path}"
    return durations


def boxes(data):
    offset = 0
    while offset < len(data):
        size, tag = unpack_from(">I4s", data, offset)
        assert 8 <= size <= len(data) - offset, f"Invalid media box: {tag}"
        yield tag, data[offset + 8 : offset + size]
        offset += size


def verify_sequence(path, fallback_ms, transparent):
    data = path.read_bytes()
    top = dict(boxes(data))
    assert b"avis" in top[b"ftyp"] and b"mdat" in top, f"Expected an AVIF sequence: {path}"
    tracks = set()
    for kind, track in boxes(top[b"moov"]):
        if kind != b"trak":
            continue
        media = dict(boxes(dict(boxes(track))[b"mdia"]))
        tracks.add(media[b"hdlr"][8:12])
        clock = media[b"mdhd"]
        scale = unpack_from(">I", clock, 20 if clock[0] == 1 else 12)[0]
        sample_table = dict(boxes(dict(boxes(media[b"minf"]))[b"stbl"]))
        table = sample_table[b"stts"]
        timecodes = []
        for offset in range(8, len(table), 8):
            count, duration = unpack_from(">II", table, offset)
            assert count <= len(fallback_ms), path
            timecodes.extend([1000 * duration] * count)
        assert timecodes == [t * scale for t in fallback_ms], f"Playback timing differs: {path}"
    assert tracks.intersection({b"pict", b"vide"}), path
    assert (b"auxv" in tracks) == transparent, f"Animated alpha track mismatch: {path}"


art = root / "assets/art"
probe = root / "assets/sequence-check.avif"
verify_sequence(probe, [80, 80], transparent=True)
assert b"meta" not in dict(boxes(probe.read_bytes())), "The sequence probe must not contain a still poster."
transfer_files = {directory: {probe} for directory in (art, art / "compact")}
for name in gallery:
    for suffix in ("", "-small"):
        tags = [tag for tag, _ in chunks(art / f"{name}{suffix}.webp")]
        assert tags and b"ANIM" not in tags, f"Expected a still image: {name}{suffix}"
    desktop_timing = {}
    for directory in (art, art / "compact"):
        poster = directory / f"{name}.webp"
        assert b"ANIM" not in dict(chunks(poster)), f"Expected a still poster: {poster}"
        transfer_files[directory].update((poster, art / f"{name}-small.webp",
                                          directory / f"{name}-back.webp", directory / f"{name}-front.webp"))
        back = dict(chunks(directory / f"{name}-back.webp"))
        front = dict(chunks(directory / f"{name}-front.webp"))
        assert b"ANIM" not in back and b"ANIM" not in front, f"Expected still preview planes: {name}"
        assert b"ALPH" in front or b"VP8L" in front, f"Missing alpha: {name}"
        # Rain and Koi share their native-size loop across the two display sizes.
        loop_dir = directory if name == "anime" else art
        loops = {"motion": loop_dir / f"{name}-motion.webp", "back": directory / f"{name}-back-motion.webp"}
        if name == "anime":
            loops["front"] = directory / f"{name}-front-motion.webp"
        timings = {kind: verify_loop(path, kind == "front") for kind, path in loops.items()}
        for kind, path in loops.items():
            sequence = path.with_suffix(".avif")
            verify_sequence(sequence, timings[kind], kind == "front")
            transfer_files[directory].add(sequence)
        if "front" in timings:
            assert timings["back"] == timings["front"], f"Parallax planes out of sync: {directory}/{name}"
        if directory == art:
            desktop_timing = timings
        else:
            assert timings == desktop_timing, f"Compact version changed playback timing: {name}"
        depth_bytes = loops["back"].stat().st_size + loops.get("front", directory / f"{name}-front.webp").stat().st_size
        assert depth_bytes <= (5_000_000 if directory == art else 3_500_000), f"Parallax transfer too large: {directory}/{name}"
for directory, files in transfer_files.items():
    total = sum(file.stat().st_size for file in files)
    limit = 3_500_000 if directory == art else 2_600_000
    assert total <= limit, f"Combined nine-effect transfer exceeds {limit} bytes: {directory}"
    print(f"All nine effects with previews and thumbnails ({directory.name}): {total:,} bytes")
print("Verified bilingual routes, downloads, motion timing, alpha tracks, and WebP alternatives.")
