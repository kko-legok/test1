# Kuis Online Profesional dengan Firestore

Aplikasi kuis online berbasis web dengan Firebase Firestore sebagai backend.

## Fitur Utama
- ✅ Manajemen soal dan akun
- ✅ Kuis dengan timer
- ✅ Export data ke Excel
- ✅ Branding kustom
- ✅ Autentikasi multi-role

## Setup
1. Clone repository ini
2. Buka `index.html` di browser
3. Login dengan akun default: admin/admin123

## Konfigurasi Firebase
Edit variabel `YOUR_FIREBASE_CONFIG_JSON` di file `index.html` dengan konfigurasi Firebase project Anda.

## Struktur Data
- Soal disimpan di: `artifacts/{appId}/public/data/quiz_config`
- Jawaban di: `artifacts/{appId}/public/data/quiz_answers`
- Akun di: `artifacts/{appId}/public/data/user_accounts`
