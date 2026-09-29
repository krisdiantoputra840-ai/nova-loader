# NOVA Loader — Standalone Backend API

API Media Downloader universal berkinerja tinggi menggunakan **FastAPI**, **yt-dlp**, **spotdl**, dan **FFmpeg**.

## 🌟 Platform yang Didukung
* **SoundCloud** (`soundcloud.com`, `on.soundcloud.com`, single tracks & sets)
* **YouTube & YouTube Music** (Single videos, audio, & full playlists)
* **TikTok** (MP4 universal H.264 dengan atau tanpa watermark)
* **Instagram** (Reels, Videos)
* **Spotify** (Single tracks & Playlists/Albums dengan metadata ID3 & cover art)

---

## 🚀 Cara Menjalankan Secara Standalone

### 1. Di Windows (Paling Mudah)
Cukup klik ganda file:
```
start_backend.bat
```
Atau via terminal:
```powershell
cd backend
python -m pip install -r requirements.txt
python main.py
```

### 2. Di Linux / macOS
```bash
cd backend
pip install -r requirements.txt
python3 main.py
```

Backend akan langsung aktif di:
* **API Base**: `http://127.0.0.1:8080`
* **Dokumentasi Interaktif (Swagger UI)**: `http://127.0.0.1:8080/docs`

---

## 🐳 Deploy Standalone Menggunakan Docker
Backend ini memiliki Dockerfile sendiri sehingga bisa dideploy di **Render.com**, **Railway**, **Fly.io**, atau **VPS**:

```bash
cd backend
docker build -t nova-backend .
docker run -p 8080:8080 nova-backend
```

---

## 📡 API Endpoints

### 1. `GET /api/health`
Mengecek status backend dan ketersediaan FFmpeg.

### 2. `POST /api/info`
Mengambil metadata media (judul, kreator, platform, durasi, thumbnail).
```json
{
  "url": "https://soundcloud.com/artist/track-name"
}
```

### 3. `POST /api/download`
Mendownload media dan mengirimkan filenya secara streaming ke client.
```json
{
  "url": "https://soundcloud.com/artist/track-name",
  "media_type": "audio",
  "quality": "320kbps",
  "format": "MP3"
}
```
