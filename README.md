# Belajar Vibe Coding - Backend API

Proyek ini adalah backend REST API sederhana yang dirancang sebagai bagian dari pembelajaran (Vibe Coding). Aplikasi ini menyediakan layanan autentikasi dasar untuk entitas pengguna (User), meliputi fitur registrasi, login, pengambilan data profil, serta logout dengan sistem validasi yang ketat.

## 🚀 Technology Stack & Libraries

- **Runtime & Test Runner**: [Bun](https://bun.sh/) - Runtime JavaScript yang sangat cepat dengan bundler bawaan, serta memiliki native test runner (`bun:test`).
- **Framework**: [ElysiaJS](https://elysiajs.com/) - Framework web yang sangat cepat untuk Bun, menawarkan validasi tipe *out-of-the-box* menggunakan TypeBox.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - ORM berbasis TypeScript yang ringan, type-safe, dan efisien.
- **Database Driver**: `mysql2` - Menghubungkan aplikasi Bun ke server MySQL/MariaDB.
- **Database**: MySQL / MariaDB.

## 📂 Arsitektur & Struktur Folder

Aplikasi ini menggunakan pola **Layered Architecture** sederhana untuk memisahkan tanggung jawab kode.

```text
.
├── src/
│   ├── db/
│   │   ├── index.ts        # Inisialisasi pool koneksi database via Drizzle ORM
│   │   └── schema.ts       # Definisi skema tabel database (Drizzle Schema)
│   ├── routes/
│   │   └── users-route.ts  # Definisi endpoint API, routing, dan validasi request (TypeBox)
│   ├── services/
│   │   └── users-service.ts# Logika bisnis (Business Logic) seperti hash password, kueri db
│   └── index.ts            # Entry point aplikasi, inisialisasi server ElysiaJS
├── tests/
│   └── users.test.ts       # Berisi skenario Unit Test komprehensif menggunakan bun test
├── package.json            # Daftar script perintah dan dependensi proyek
├── drizzle.config.ts       # Konfigurasi untuk utilitas Drizzle Kit (migrasi)
└── .env                    # Variabel environment (kredensial DB dan Port)
```

**Aturan Penamaan (Naming Conventions):**
- Nama file menggunakan format *kebab-case* (contoh: `users-route.ts`, `users-service.ts`).
- Fungsi dan variabel di dalam kode menggunakan *camelCase* standar.

## 🗄️ Schema Database

Aplikasi ini menggunakan 2 buah tabel utama yang saling berelasi:

1. **`users`**: Menyimpan data akun pengguna.
   - `id` (int, PK, auto-increment)
   - `name` (varchar 255, not null)
   - `email` (varchar 255, not null, unique)
   - `password` (varchar 255, not null, otomatis di-hash menggunakan algoritma `bcrypt` bawaan Bun)
   - `createdAt` (timestamp, default now)

2. **`sessions`**: Menyimpan sesi berupa token login (berupa UUID).
   - `id` (int, PK, auto-increment)
   - `token` (varchar 255, not null)
   - `userId` (int, not null, *Foreign Key* merujuk ke `users.id`)
   - `createdAt` (timestamp, default now)

## 🌐 Dokumentasi API

Seluruh API untuk modul users berada di bawah prefix `/api`.

| Method | Endpoint | Deskripsi | Headers | Request Body | Response (Success) |
|--------|----------|-----------|---------|--------------|--------------------|
| `GET`  | `/`      | Welcome Message | - | - | `{ "message": "Hello..." }` |
| `GET`  | `/health`| Mengecek status server | - | - | `{ "status": "ok" }` |
| `POST` | `/api/users` | Mendaftar akun user baru | - | `{ name, email, password }` | `{ "data": "OK" }` |
| `POST` | `/api/users/login` | Melakukan Login akun | - | `{ email, password }` | `{ "data": "<token_uuid>" }` |
| `GET`  | `/api/users/current`| Mengambil data profil | `Authorization: Bearer <token>` | - | `{ "data": { id, name, email, created_at } }` |
| `DELETE`| `/api/users/logout`| Melakukan Logout | `Authorization: Bearer <token>` | - | `{ "data": "OK" }` |

*Catatan Validasi: ElysiaJS akan secara otomatis memvalidasi body request dan header. Sistem menolak request secara langsung dengan memberikan respon HTTP status `422 Unprocessable Entity` jika tipe data, batasan panjang (*length*), atau format input (seperti format penulisan email) tidak terpenuhi.*

## 🛠️ Cara Setup Project

1. **Kloning Repositori**: Unduh atau *clone* kode sumber proyek ini ke mesin lokal Anda.
2. **Install Bun**: Pastikan Anda telah memasang Bun. Jika belum, instal dari [bun.sh](https://bun.sh/).
3. **Install Dependensi**: Buka terminal pada direktori root proyek lalu jalankan perintah berikut:
   ```bash
   bun install
   ```
4. **Siapkan Database**: Buat database MySQL/MariaDB baru di *local machine* Anda, contohnya dengan nama `belajar_vibe`.
5. **Konfigurasi Lingkungan (`.env`)**: Buat file bernama `.env` di folder root dan isi dengan *connection string* sesuai milik Anda:
   ```env
   DATABASE_URL="mysql://root:password@127.0.0.1:3306/belajar_vibe"
   PORT=3000
   ```
6. **Migrasi / Setup Database**: Sinkronisasikan secara langsung skema Drizzle ke dalam database MySQL Anda:
   ```bash
   bun run db:push
   ```
   *(Opsional)* Anda dapat melihat tabel beserta data di dalamnya secara visual melalui browser dengan menjalankan perintah `bun run db:studio`.

## ▶️ Cara Run Aplikasi

Jalankan server aplikasi di mode *development*. Mode ini sudah dilengkapi fitur *auto-reload* (watch) apabila terjadi perubahan pada kode sumber:
```bash
bun run dev
```
Aplikasi secara bawaan akan mulai berjalan dan bisa diakses di `http://localhost:3000`.

## 🧪 Cara Test Aplikasi

Proyek ini telah dilengkapi dengan Unit Test menggunakan *Native Test Runner* dari Bun. Berkas pengujian diletakkan pada folder `tests/`.

Untuk menjalankan keseluruhan pengujian yang memverifikasi puluhan skenario sukses maupun gagal pada API, jalankan perintah:
```bash
bun test
```
*Penting: Pastikan konfigurasi database di environment (file `.env`) Anda sudah berjalan dengan baik, karena pengujian (test runner) akan secara otomatis melakukan pembersihan data di tabel `sessions` dan `users` (`db.delete()`) setiap kali berpindah skenario tes untuk memastikan isolasi dan konsistensi.*
