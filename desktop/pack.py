#!/usr/bin/env python3
"""Assemble Pisanie.app and wrap it in a .dmg (ISO 9660 / Rock Ridge / Joliet)."""
from __future__ import annotations

import os
import shutil
import stat
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")
DESKTOP = ROOT / "desktop"
WWW = DESKTOP / "www"
ART = ROOT / "artifacts"
DMGROOT = Path("/tmp/macpack/dmgroot")
APP = DMGROOT / "Pisanie.app"
ELECTRON_ZIP = Path("/tmp/macpack/electron-darwin-x64.zip")
ELECTRON_UNPACK = Path("/tmp/macpack/electron-x64")
OUT = ART / "Pisanie-macOS12.dmg"

ISO_CHARS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_")


def run(cmd: list[str], **kw):
    print("+", " ".join(cmd))
    subprocess.check_call(cmd, **kw)


def iso_name(name: str, used: set[str]) -> str:
    stem, ext = os.path.splitext(name)
    stem = "".join(ch if ch in ISO_CHARS else "_" for ch in stem.upper())[:8] or "FILE"
    ext = "".join(ch if ch in ISO_CHARS else "_" for ch in ext.upper()[1:])[:3]
    base = f"{stem}.{ext}" if ext else stem
    candidate = base
    i = 1
    while candidate in used:
        suffix = str(i)
        candidate = f"{stem[: 8 - len(suffix)]}{suffix}" + (f".{ext}" if ext else "")
        i += 1
    used.add(candidate)
    return candidate


def add_tree(iso, disk: Path, iso_dir: str, joliet_dir: str, rr_names: dict[str, set]):
    used = rr_names.setdefault(iso_dir, set())
    for entry in sorted(disk.iterdir(), key=lambda p: p.name.lower()):
        name = entry.name
        if name in {".DS_Store", "__MACOSX"}:
            continue
        iso_leaf = iso_name(name, used)
        iso_path = f"{iso_dir}/{iso_leaf}".replace("//", "/")
        joliet_path = f"{joliet_dir}/{name}".replace("//", "/")
        if entry.is_dir() and not entry.is_symlink():
            iso.add_directory(iso_path, rr_name=name, joliet_path=joliet_path)
            add_tree(iso, entry, iso_path, joliet_path, rr_names)
        elif entry.is_symlink():
            continue
        else:
            mode = entry.stat().st_mode
            file_mode = 0o0100755 if (mode & stat.S_IXUSR) else 0o0100644
            iso.add_file(
                str(entry),
                iso_path + ";1" if not iso_path.endswith(";1") else iso_path,
                rr_name=name,
                joliet_path=joliet_path,
                file_mode=file_mode,
            )


def patch_plist(plist_path: Path) -> None:
    import re

    text = plist_path.read_text(encoding="utf-8")

    def set_string(key: str, value: str) -> None:
        nonlocal text
        text, n = re.subn(
            rf"(<key>{re.escape(key)}</key>\s*<string>)[^<]*",
            rf"\g<1>{value}",
            text,
            count=1,
        )
        if n == 0:
            print("warning: missing", key)

    set_string("CFBundleDisplayName", "Писание")
    set_string("CFBundleName", "Писание")
    set_string("CFBundleIdentifier", "app.pisanie.bible")
    set_string("CFBundleShortVersionString", "1.0.0")
    set_string("CFBundleVersion", "1.0.0")
    set_string("LSMinimumSystemVersion", "12.0")
    set_string("LSApplicationCategoryType", "public.app-category.reference")
    plist_path.write_text(text, encoding="utf-8")
    print("patched", plist_path)


def build_www() -> None:
    css_src = next((ROOT / ".vercel/output/static/assets").glob("styles-*.css"))
    shutil.copy2(css_src, WWW / "app.css")
    bible_src = ROOT / "public" / "bible"
    bible_dst = WWW / "bible"
    if bible_dst.exists():
        shutil.rmtree(bible_dst)
    shutil.copytree(bible_src, bible_dst)
    shutil.copy2(ROOT / "public" / "favicon.svg", WWW / "favicon.svg")
    env = os.environ.copy()
    env["NODE_PATH"] = str(ROOT / "node_modules")
    for entry, outfile in (("renderer.tsx", "app.js"), ("stage-entry.tsx", "stage.js")):
        run(
            [
                "npx",
                "--yes",
                "esbuild",
                str(DESKTOP / entry),
                "--bundle",
                f"--outfile={WWW / outfile}",
                "--format=esm",
                "--platform=browser",
                "--jsx=automatic",
                "--alias:@=/workspace/src",
                "--minify",
            ],
            env=env,
            cwd=str(ROOT),
        )


def assemble_app() -> None:
    if APP.exists():
        shutil.rmtree(DMGROOT)
    DMGROOT.mkdir(parents=True)
    if ELECTRON_UNPACK.exists():
        shutil.rmtree(ELECTRON_UNPACK)
    ELECTRON_UNPACK.mkdir(parents=True)
    run(["unzip", "-q", str(ELECTRON_ZIP), "-d", str(ELECTRON_UNPACK)])
    src_app = ELECTRON_UNPACK / "Electron.app"
    shutil.copytree(src_app, APP, symlinks=True)
    icon = DESKTOP / "icon.icns"
    dest_icon = APP / "Contents" / "Resources" / "electron.icns"
    shutil.copy2(icon, dest_icon)
    patch_plist(APP / "Contents" / "Info.plist")
    resources_app = APP / "Contents" / "Resources" / "app"
    if resources_app.exists():
        shutil.rmtree(resources_app)
    resources_app.mkdir()
    shutil.copy2(DESKTOP / "package.json", resources_app / "package.json")
    shutil.copy2(DESKTOP / "main.cjs", resources_app / "main.cjs")
    shutil.copy2(DESKTOP / "preload.cjs", resources_app / "preload.cjs")
    shutil.copytree(WWW, resources_app / "www")
    # keep Electron LICENSE
    shutil.copy2(DESKTOP / "README-INSTALL.txt", DMGROOT / "Прочтите меня.txt")
    # Applications shortcut as a text hint — ISO symlink to /Applications
    (DMGROOT / "Applications").symlink_to("/Applications")
    # ensure executables stay executable
    macos = APP / "Contents" / "MacOS"
    for exe in macos.rglob("*"):
        if exe.is_file():
            exe.chmod(exe.stat().st_mode | 0o111)
    helpers = APP / "Contents" / "Frameworks"
    if helpers.exists():
        for exe in helpers.rglob("*"):
            if exe.is_file() and (exe.stat().st_mode & 0o111):
                exe.chmod(exe.stat().st_mode | 0o111)


def make_dmg() -> None:
    ART.mkdir(parents=True, exist_ok=True)
    if OUT.exists():
        OUT.unlink()
    geniso = Path("/tmp/macpack/geniso/usr/bin/genisoimage")
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = "/tmp/macpack/libs/usr/lib/x86_64-linux-gnu:" + env.get("LD_LIBRARY_PATH", "")
    env["MAGIC"] = "/tmp/macpack/libs/usr/share/misc/magic.mgc"
    cmd = [
        str(geniso),
        "-r",
        "-J",
        "-joliet-long",
        "-V",
        "Pisanie",
        "-volset",
        "Pisanie",
        "-o",
        str(OUT),
        str(DMGROOT),
    ]
    try:
        run(cmd[:4] + ["-hfs"] + cmd[4:], env=env)
    except subprocess.CalledProcessError:
        print("HFS hybrid failed, writing ISO 9660 + Rock Ridge")
        if OUT.exists():
            OUT.unlink()
        run(cmd, env=env)
    print("dmg", OUT, "bytes", OUT.stat().st_size)


def main() -> None:
    run([sys.executable, str(DESKTOP / "make-icon.py")])
    build_www()
    assemble_app()
    make_dmg()
    print("OK", OUT)


if __name__ == "__main__":
    main()
