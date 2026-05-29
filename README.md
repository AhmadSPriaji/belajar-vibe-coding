
# ElysiaJS + Drizzle + MySQL Backend Setup

Backend API yang dibangun menggunakan **Bun runtime**, **ElysiaJS**, **Drizzle ORM**, dan database **MySQL / MariaDB**.

## Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: MySQL / MariaDB

## Persiapan & Instalasi

### 1. Kloning & Install Dependensi
Pastikan Anda memiliki Bun terinstal, lalu jalankan:
```bash
bun install
```

### 2. Konfigurasi Lingkungan (`.env`)
Buat atau edit file `.env` di root direktori proyek Anda:
```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/belajar_vibe"
PORT=3000
```
Sesuaikan kredensial username, password, host, port, dan nama database Anda.

### 3. Setup Database & Migrasi
Pastikan database sudah dibuat di server MySQL/MariaDB Anda. Kemudian sinkronisasikan skema Drizzle ke database menggunakan perintah berikut:
```bash
bun run db:push
```

Untuk melihat database via GUI interaktif Drizzle Studio, jalankan:
```bash
bun run db:studio
```

## Menjalankan Server Pengembangan
Untuk menjalankan server dengan fitur auto-reload (watch mode):
```bash
bun run dev
```
Server akan aktif di `http://localhost:3000`.

## Dokumentasi API Endpoint

| Method | Endpoint | Deskripsi | Request Body |
|--------|----------|-----------|--------------|
| `GET`  | `/`      | Welcome Message | - |
| `GET`  | `/health`| Health check API status | - |
| `GET`  | `/users` | Mengambil seluruh data user | - |
| `POST` | `/users` | Menambahkan user baru | `{ "name": "string", "email": "string" }` |
