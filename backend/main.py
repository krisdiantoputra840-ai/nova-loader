"""
NOVA Backend — Universal Media Downloader API

Platforms supported:
  - YouTube        → yt-dlp
  - YouTube Music  → yt-dlp  (music.youtube.com works natively)
  - TikTok         → yt-dlp
  - Instagram      → yt-dlp
  - Spotify        → spotdl  (finds on YT, downloads with Spotify metadata)
"""

import sys
import uuid
import json
import tempfile
import asyncio
import functools
import subprocess
import shutil
import re
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Windows: ProactorEventLoop for subprocess
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

app = FastAPI(title="NOVA API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Length"],
)

# ── Paths ─────────────────────────────────────────────────────────────────────

DOWNLOAD_DIR = Path(tempfile.gettempdir()) / "nova_downloads"
DOWNLOAD_DIR.mkdir(exist_ok=True)

YTDLP_CMD  = [sys.executable, "-m", "yt_dlp"]
SPOTDL_CMD = [sys.executable, "-m", "spotdl"]

# Locate FFmpeg (needed by yt-dlp for merging and by spotdl for conversion)
FFMPEG_PATH = shutil.which("ffmpeg") or shutil.which("ffmpeg.exe")
if not FFMPEG_PATH:
    for _c in [
        Path(r"C:\Program Files\ffmpeg\bin\ffmpeg.exe"),
        Path(r"C:\ffmpeg\bin\ffmpeg.exe"),
        # WinGet default location
        Path(r"C:\Users\omenp\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"),
    ]:
        if _c.exists():
            FFMPEG_PATH = str(_c)
            break

FFMPEG_DIR = str(Path(FFMPEG_PATH).parent) if FFMPEG_PATH else None

_pool = ThreadPoolExecutor(max_workers=4)


# ── Models ────────────────────────────────────────────────────────────────────

class InfoRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    media_type: str   # "video" | "audio"
    quality: str      # "1080p" / "720p" / "320kbps" / "192kbps" / "128kbps" / "no_watermark" / "watermark"
    format: str       # "MP4" | "MP3"
    no_watermark: Optional[bool] = None

class MediaInfoResponse(BaseModel):
    title: str
    channel: str
    platform: str
    thumbnail: Optional[str]
    duration: str
    url: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _detect_platform(url: str) -> str:
    u = url.lower()
    if "music.youtube.com" in u:               return "ytmusic"
    if "youtube.com" in u or "youtu.be" in u:  return "youtube"
    if "tiktok.com" in u:                      return "tiktok"
    if "instagram.com" in u:                   return "instagram"
    if "spotify.com" in u:                     return "spotify"
    return "unknown"

def _is_spotify(url: str) -> bool:
    return "spotify.com" in url.lower()

def _fmt_duration(seconds) -> str:
    if not seconds:
        return ""
    try:
        s = int(float(seconds))
        if s <= 0:
            return ""
        h, r = divmod(s, 3600)
        m, sec = divmod(r, 60)
        return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"
    except (ValueError, TypeError):
        return ""

def _quality_fmt(quality: str) -> str:
    """yt-dlp format string for video quality."""
    h = quality.replace("p", "")
    if FFMPEG_DIR:
        return (
            f"bestvideo[height<={h}][ext=mp4]+bestaudio[ext=m4a]"
            f"/bestvideo[height<={h}]+bestaudio"
            f"/best[height<={h}]"
        )
    return f"best[height<={h}][ext=mp4]/best[height<={h}]/best"

def _safe_filename(name: str) -> str:
    """Remove characters that are illegal in Windows filenames."""
    return re.sub(r'[\\/:*?"<>|]', "_", name)

# ── Subprocess helper ─────────────────────────────────────────────────────────

def _run_sync(cmd: list, timeout: int) -> tuple:
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    return r.stdout, r.stderr, r.returncode

async def _run(cmd: list, timeout: int = 60) -> tuple:
    loop = asyncio.get_event_loop()
    fn = functools.partial(_run_sync, cmd, timeout)
    return await loop.run_in_executor(_pool, fn)


# ── Spotify helpers (spotdl) ──────────────────────────────────────────────────

async def _spotify_info(url: str) -> dict:
    """
    Use `spotdl save` to get Spotify track metadata as JSON.
    Returns a dict with title, artist, thumbnail, duration_ms, etc.
    """
    save_file = DOWNLOAD_DIR / f"meta_{uuid.uuid4().hex}.spotdl"
    cmd = SPOTDL_CMD + ["save", url, "--save-file", str(save_file), "--log-level", "ERROR"]
    if FFMPEG_DIR:
        cmd += ["--ffmpeg", str(Path(FFMPEG_DIR) / "ffmpeg.exe")]

    try:
        stdout, stderr, code = await _run(cmd, timeout=60)
        if not save_file.exists():
            raise HTTPException(status_code=400, detail=f"Could not fetch Spotify info: {stderr[-300:]}")

        data = json.loads(save_file.read_text(encoding="utf-8"))
        # spotdl save returns a list of songs
        songs = data if isinstance(data, list) else [data]
        if not songs:
            raise HTTPException(status_code=400, detail="No tracks found for this Spotify URL.")
        return songs[0]
    finally:
        save_file.unlink(missing_ok=True)


async def _spotify_download(url: str, job_id: str, audio_fmt: str = "mp3") -> Path:
    """
    Use spotdl with multiple audio providers (youtube-music, youtube, soundcloud).
    If spotdl fails to match, fall back to yt-dlp search directly on YouTube.
    """
    fmt = audio_fmt.lower()  # "mp3" or "wav"
    out_dir = DOWNLOAD_DIR / job_id
    out_dir.mkdir(exist_ok=True)

    out_tpl = str(out_dir / "{title} - {artists}.{output-ext}")

    # Layer 1: spotdl with audio provider fallbacks (youtube-music, youtube, soundcloud)
    cmd = SPOTDL_CMD + [
        "download", url,
        "--output", out_tpl,
        "--format", fmt,
        "--audio", "youtube-music", "youtube", "soundcloud",
        "--log-level", "ERROR",
    ]
    if FFMPEG_DIR:
        cmd += ["--ffmpeg", str(Path(FFMPEG_DIR) / "ffmpeg.exe")]

    try:
        await _run(cmd, timeout=45)
    except Exception:
        pass

    # Check if spotdl produced a file
    files = list(out_dir.glob(f"*.{fmt}"))
    if not files:
        files = [f for f in out_dir.iterdir() if f.is_file()]

    if files:
        return files[0]

    # Layer 2: Automatic fast yt-dlp search fallback
    track_title = ""
    track_artist = ""
    try:
        meta = await get_info(InfoRequest(url=url))
        track_title = meta.title or ""
        track_artist = meta.channel or ""
    except Exception:
        pass

    clean_artist = "" if track_artist in ("Unknown Artist", "Unknown", "") else track_artist
    search_query = f"{track_title} {clean_artist} audio".strip()
    if not search_query or search_query == "audio":
        search_query = url

    clean_title = _safe_filename(track_title or 'track')
    clean_artist_str = _safe_filename(clean_artist or 'artist')
    fallback_out_tpl = str(out_dir / f"{clean_title} - {clean_artist_str}.%(ext)s")

    ytdlp_args = YTDLP_CMD + [
        "--no-playlist",
        "-x",
        "--audio-format", fmt,
        "--audio-quality", "0",
        "-o", fallback_out_tpl,
        f"ytsearch1:{search_query}",
    ]
    if FFMPEG_DIR:
        ytdlp_args += ["--ffmpeg-location", FFMPEG_DIR]

    try:
        await _run(ytdlp_args, timeout=90)
        files = list(out_dir.glob(f"*.{fmt}"))
        if not files:
            files = [f for f in out_dir.iterdir() if f.is_file()]
    except Exception as e:
        shutil.rmtree(out_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

    if not files:
        # Fallback search by title only
        if clean_artist:
            try:
                ytdlp_args[-1] = f"ytsearch1:{track_title} audio"
                await _run(ytdlp_args, timeout=60)
                files = list(out_dir.glob(f"*.{fmt}"))
                if not files:
                    files = [f for f in out_dir.iterdir() if f.is_file()]
            except Exception:
                pass

    if not files:
        shutil.rmtree(out_dir, ignore_errors=True)
        raise HTTPException(status_code=404, detail="Song could not be found on any audio provider.")

    return files[0]


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "python": sys.executable,
        "ffmpeg": FFMPEG_PATH or "NOT FOUND",
    }


@app.post("/api/info", response_model=MediaInfoResponse)
async def get_info(req: InfoRequest):
    platform = _detect_platform(req.url)

    # ── Spotify: parse track ID and get info via Spotify embed API + OpenGraph ──
    if platform == "spotify":
        # Extract track ID from URL
        track_id = None
        if "/track/" in req.url:
            track_id = req.url.split("/track/")[-1].split("?")[0].strip()

        if not track_id:
            raise HTTPException(status_code=400, detail="Invalid Spotify track URL. Only individual tracks are supported.")

        canonical_url = f"https://open.spotify.com/track/{track_id}"

        # Fetch metadata from Spotify's public embed API (no auth needed)
        import urllib.request as urlreq
        embed_url = f"https://open.spotify.com/oembed?url={canonical_url}"
        try:
            req_embed = urlreq.Request(embed_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urlreq.urlopen(req_embed, timeout=10) as r:
                embed = json.loads(r.read())
        except Exception:
            embed = {}

        title     = embed.get("title", "Unknown Track")
        thumbnail = embed.get("thumbnail_url")

        # Scrape Spotify page for high-res cover art and artist
        artist = "Unknown Artist"
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            page_req = urlreq.Request(canonical_url, headers=headers)
            with urlreq.urlopen(page_req, timeout=8) as r:
                html = r.read().decode(errors="replace")
            import re as _re

            # High-res cover art from og:image
            m_img = _re.search(r'<meta\s+(?:property|name)=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
            if not m_img:
                m_img = _re.search(r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:image["\']', html)
            if m_img:
                thumbnail = m_img.group(1)

            # Fallback title if needed
            if title == "Unknown Track":
                m_title = _re.search(r'<meta\s+(?:property|name)=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
                if not m_title:
                    m_title = _re.search(r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:title["\']', html)
                if m_title:
                    title = m_title.group(1)

            # Extract artist: prefer music:musician_description meta tag
            m_artist = _re.search(r'<meta\s+(?:property|name)=["\']music:musician_description["\']\s+content=["\']([^"\']+)["\']', html)
            if not m_artist:
                m_artist = _re.search(r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']music:musician_description["\']', html)
            if m_artist:
                artist = m_artist.group(1).strip()
            else:
                # og:description typically: "Listen to Track Name on Spotify. Artist · Song · Year"
                m = _re.search(r'<meta\s+(?:property|name)=["\']og:description["\']\s+content=["\']([^"\']+)["\']', html)
                if not m:
                    m = _re.search(r'content=["\']([^"\']+)["\']\s+(?:property|name)=["\']og:description["\']', html)
                if m:
                    desc = m.group(1)
                    parts = [p.strip() for p in desc.split("·")]
                    if len(parts) >= 1:
                        artist = parts[0].strip()
                        if "." in artist:
                            artist = artist.split(".")[-1].strip()

            # Extract duration
            duration = ""
            m_dur = _re.search(r'<meta\s+(?:property|name)=["\']music:duration["\']\s+content=["\'](\d+)["\']', html)
            if not m_dur:
                m_dur = _re.search(r'content=["\'](\d+)["\']\s+(?:property|name)=["\']music:duration["\']', html)
            if m_dur:
                sec = int(m_dur.group(1))
                if sec > 10000:
                    sec = sec // 1000
                duration = _fmt_duration(sec)
            else:
                m_json = _re.search(r'"duration(?:_ms)?":\s*(\d+)', html)
                if m_json:
                    sec = int(m_json.group(1))
                    if sec > 10000:
                        sec = sec // 1000
                    duration = _fmt_duration(sec)
        except Exception:
            pass

        return MediaInfoResponse(
            title=title,
            channel=artist,
            platform="spotify",
            thumbnail=thumbnail,
            duration=duration,
            url=req.url,
        )

    # ── YouTube / YT Music / TikTok / Instagram ───────────────────────────────
    args = YTDLP_CMD + ["--dump-json", "--no-playlist", "--skip-download", req.url]
    try:
        stdout, stderr, code = await _run(args, timeout=45)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timed out fetching media info.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if code != 0:
        raise HTTPException(status_code=400, detail=(stderr.strip() or "yt-dlp error")[-400:])

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Could not parse media info.")

    # Get thumbnail: direct or highest resolution from thumbnails array
    thumbnail = data.get("thumbnail")
    if not thumbnail and data.get("thumbnails"):
        thumbnails = data.get("thumbnails", [])
        if thumbnails and isinstance(thumbnails, list):
            thumbnail = thumbnails[-1].get("url")

    return MediaInfoResponse(
        title=data.get("title", "Unknown Title"),
        channel=(
            data.get("uploader")
            or data.get("channel")
            or data.get("creator")
            or data.get("artist")
            or "Unknown"
        ),
        platform=platform,
        thumbnail=thumbnail,
        duration=_fmt_duration(data.get("duration")),
        url=req.url,
    )


def _ensure_h264_mp4(file_path: Path) -> Path:
    """
    If the video file is encoded in HEVC/H.265/bytevc1, transcode it to standard H.264 MP4
    so it can be played anywhere without requiring HEVC extensions.
    """
    if not file_path or not file_path.exists():
        return file_path
    if file_path.suffix.lower() not in ('.mp4', '.mkv', '.webm'):
        return file_path

    ffprobe = str(Path(FFMPEG_PATH).parent / "ffprobe.exe") if FFMPEG_PATH else "ffprobe"
    is_hevc = False
    try:
        probe_cmd = [
            ffprobe,
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=codec_name",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path),
        ]
        r = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
        codec = r.stdout.strip().lower()
        if codec in ("hevc", "h265", "bytevc1", "hev1", "hvc1"):
            is_hevc = True
    except Exception:
        pass

    if is_hevc and FFMPEG_PATH:
        out_file = file_path.with_name(f"{file_path.stem}_compat.mp4")
        conv_cmd = [
            FFMPEG_PATH, "-y",
            "-i", str(file_path),
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            str(out_file),
        ]
        try:
            r = subprocess.run(conv_cmd, capture_output=True, timeout=300)
            if r.returncode == 0 and out_file.exists():
                file_path.unlink(missing_ok=True)
                return out_file
        except Exception:
            pass

    return file_path


@app.post("/api/download")
async def download_media(req: DownloadRequest):
    platform = _detect_platform(req.url)
    job_id = uuid.uuid4().hex

    # ── Spotify download ──────────────────────────────────────────────────────
    if platform == "spotify":
        audio_fmt = req.format.lower() if req.format else "mp3"  # "mp3" or "wav"
        output_file = await _spotify_download(req.url, job_id, audio_fmt)
        size = output_file.stat().st_size
        safe_name = _safe_filename(output_file.name).replace('"', "'")
        out_dir = output_file.parent
        ext = output_file.suffix.lstrip(".").lower()
        mime_map = {"mp3": "audio/mpeg", "wav": "audio/wav"}
        spotify_mime = mime_map.get(ext, "audio/mpeg")

        def stream_spotify():
            try:
                with open(output_file, "rb") as f:
                    while chunk := f.read(65536):
                        yield chunk
            finally:
                shutil.rmtree(out_dir, ignore_errors=True)

        return StreamingResponse(
            stream_spotify(),
            media_type=spotify_mime,
            headers={
                "Content-Disposition": f'attachment; filename="{safe_name}"',
                "Content-Length": str(size),
            },
        )

    # ── yt-dlp download (YouTube, YT Music, TikTok, Instagram) ───────────────
    out_tpl = str(DOWNLOAD_DIR / f"{job_id}_%(title)s.%(ext)s")
    args = YTDLP_CMD + ["--no-playlist", "-o", out_tpl]

    if FFMPEG_DIR:
        args += ["--ffmpeg-location", FFMPEG_DIR]

    if req.media_type == "audio":
        fmt_lower = req.format.lower()  # "mp3" or "wav"
        abr = req.quality.replace("kbps", "") if "kbps" in req.quality else "320"
        if fmt_lower == "wav":
            # WAV = lossless PCM — download best audio then convert
            args += [
                "-f", "bestaudio/best",
                "-x", "--audio-format", "wav",
            ]
        else:
            # MP3
            args += [
                "-f", f"bestaudio[abr<={abr}]/bestaudio/best",
                "-x", "--audio-format", "mp3", "--audio-quality", abr,
            ]
    elif platform == "tiktok":
        # Check whether user requested without watermark (default is True for TikTok)
        without_wm = True
        if req.no_watermark is False or req.quality == "watermark":
            without_wm = False

        if without_wm:
            # TikTok Without Watermark:
            # play_addr_h264: direct TikTok playback address with H.264 video codec and no watermark
            tiktok_fmt = (
                "play_addr_h264"
                "/bestvideo[format_note!*='watermarked'][vcodec!*='hevc'][vcodec!*='h265'][vcodec!*='bytevc1']+bestaudio"
                "/best[format_note!*='watermarked'][vcodec!*='hevc'][vcodec!*='h265'][vcodec!*='bytevc1']"
                "/bestvideo[format_note!*='watermarked']+bestaudio"
                "/best[format_note!*='watermarked']"
                "/best"
            )
        else:
            # TikTok With Watermark:
            tiktok_fmt = (
                "download_addr"
                "/bestvideo[format_note*='watermarked']+bestaudio"
                "/best[format_note*='watermarked']"
                "/download"
                "/best"
            )
        args += ["-f", tiktok_fmt, "--merge-output-format", "mp4"]
    else:
        args += ["-f", _quality_fmt(req.quality), "--merge-output-format", "mp4"]

    args.append(req.url)

    try:
        stdout, stderr, code = await _run(args, timeout=600)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Download timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if code != 0:
        raise HTTPException(status_code=400, detail=(stderr.strip() or "Download failed")[-600:])

    output_file = None
    for f in DOWNLOAD_DIR.glob(f"{job_id}_*"):
        output_file = f
        break

    if not output_file or not output_file.exists():
        raise HTTPException(status_code=500, detail="Output file not found.")

    # Ensure TikTok or any video is standard H.264 MP4 (transcode if HEVC was delivered)
    if req.media_type != "audio":
        output_file = _ensure_h264_mp4(output_file)

    ext  = output_file.suffix.lstrip(".").lower()
    mime_map = {"mp3": "audio/mpeg", "wav": "audio/wav", "mp4": "video/mp4", "webm": "video/webm"}
    mime = mime_map.get(ext, "application/octet-stream")
    size = output_file.stat().st_size
    clean_name = output_file.name[len(job_id) + 1:]
    safe_name  = clean_name.replace('"', "'")

    def stream_ytdlp():
        try:
            with open(output_file, "rb") as f:
                while chunk := f.read(65536):
                    yield chunk
        finally:
            try:
                output_file.unlink(missing_ok=True)
            except Exception:
                pass

    return StreamingResponse(
        stream_ytdlp(),
        media_type=mime,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "Content-Length": str(size),
        },
    )
