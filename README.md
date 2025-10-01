# Kuis Online dengan GitHub Storage

## Setup Awal

1. **Buat Repository GitHub**
   - Buat repository baru di GitHub
   - Buat folder `data` di root repository

2. **Dapatkan GitHub Token**
   - Buka GitHub Settings → Developer settings → Personal access tokens
   - Generate new token dengan permissions: `repo` dan `workflow`
   - Simpan token dengan aman

3. **Konfigurasi GitHub Storage**
   - Edit file `github-storage.js`
   - Ganti nilai berikut:
     - `YOUR_GITHUB_USERNAME` → username GitHub Anda
     - `YOUR_REPO_NAME` → nama repository Anda  
     - `YOUR_GITHUB_TOKEN` → token yang sudah dibuat

4. **Upload ke GitHub Pages**
   - Upload semua file ke repository
   - Aktifkan GitHub Pages di repository settings
   - Pilih branch `main` sebagai source

## Struktur Data

Aplikasi akan menyimpan 3 file utama di folder `data`:
- `config.json` - Soal, durasi, dan pengaturan
- `accounts.json` - Data akun pengguna
- `answers.json` - Jawaban peserta

## Keamanan

- GitHub token disimpan di client-side (tidak aman untuk production)
- Untuk production, gunakan backend proxy atau GitHub Apps
