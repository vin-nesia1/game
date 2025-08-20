# 🎮 Setup Game Points App - Panduan Lengkap

## 📋 Daftar File

1. **index.html** - File HTML lengkap dengan CSS dan JavaScript terintegrasi
2. **Code.gs** - Google Apps Script untuk backend
3. **README.md** - Instruksi setup ini

## 🚀 Langkah Setup

### 1. Setup Google Apps Script (Backend)

1. **Buka Google Apps Script**
   - Kunjungi [script.google.com](https://script.google.com)
   - Login dengan Google Account Anda

2. **Buat Project Baru**
   - Klik "New Project"
   - Ganti nama project menjadi "GamePoints API"

3. **Paste Kode Backend**
   - Hapus kode default di `Code.gs`
   - Copy paste seluruh kode dari file `Code.gs`
   - Klik Save (Ctrl+S)

4. **Deploy sebagai Web App**
   - Klik "Deploy" > "New Deployment"
   - Pilih type: "Web app"
   - Description: "GamePoints API v1"
   - Execute as: "Me"
   - Who has access: "Anyone" 
   - Klik "Deploy"
   - **COPY URL yang diberikan** (contoh: `https://script.google.com/macros/s/AKfycbz.../exec`)

5. **Test API (Opsional)**
   - Buka URL di browser, harusnya muncul "Game Points API is running!"
   - Jalankan function `initialize()` untuk setup data test

### 2. Setup Frontend

1. **Update Konfigurasi**
   - Buka file `index.html`
   - Cari baris: `APPS_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'`
   - Ganti dengan URL yang Anda copy dari langkah 1.4
   - Ubah `DEMO_MODE: true` menjadi `DEMO_MODE: false`

2. **Upload ke Hosting**
   - Bisa menggunakan hosting gratis seperti:
     - Netlify (drag & drop index.html)
     - Vercel
     - GitHub Pages
     - Firebase Hosting
   - Atau jalankan local dengan file server

### 3. Struktur Google Sheets

Setelah API pertama kali dipanggil, akan otomatis dibuat Google Sheet dengan nama "GamePointsDB" berisi:

#### Sheet "Users"
| Email | UserID | Points | Created | LastUpdate |
|-------|---------|---------|----------|-------------|
| user@example.com | user_123_abc | 1500 | 2024/01/01 | 2024/01/01 |

#### Sheet "Withdraws"
| Email | UserID | Amount | Method | Account | Status | RequestDate | ProcessDate |
|-------|---------|---------|---------|----------|---------|-------------|-------------|
| user@example.com | user_123_abc | 1000 | dana | 081234567890 | pending | 2024/01/01 | |

## ⚙️ Konfigurasi Lanjutan

### Mengubah Rate Poin
Edit di file HTML bagian "About" dan fungsi game:

```javascript
// Speed Click: ubah pembagi di endClickGame()
const points = Math.floor(gameState.clicks / 10); // 1 poin per 10 klik

// Guess Number: ubah di submitGuess()
updateUserPoints(50); // 50 poin jika benar

// Memory Game: ubah di handleMemoryClick()
gameState.score += 20; // 20 poin per level
updateUserPoints(20);
```

### Mengubah Minimum Withdraw
Edit di file HTML:

```javascript
// Form validation
if (amount < 1000) { // Ubah 1000
    showToast('Minimum withdraw 1000 poin', 'error');
    return;
}
```

Dan di Google Apps Script:

```javascript
if (amount < 1000) { // Ubah 1000
    return createResponse(false, 'Minimum withdraw is 1000 points');
}
```

## 🛠️ Admin Panel (Opsional)

Untuk mengelola withdraw requests, Anda bisa:

1. **Menggunakan Google Sheets langsung**
   - Buka sheet "Withdraws"
   - Ubah status dari "pending" ke "completed" atau "rejected"
   - Jika "rejected", poin akan otomatis dikembalikan

2. **Menggunakan Apps Script Functions**
   ```javascript
   // Update withdraw status
   updateWithdrawStatus('user@example.com', '2024-01-01', 'completed');
   
   // Get all withdraws
   const withdraws = getAllWithdraws();
   console.log(withdraws);
   ```

## 🎯 Fitur Utama

### Frontend
- ✅ Responsive design (mobile & desktop)
- ✅ Login dengan email (tanpa password)
- ✅ 3 jenis game (Speed Click, Guess Number, Memory)
- ✅ Sistem poin otomatis
- ✅ Withdraw request
- ✅ Leaderboard top 5
- ✅ History withdraw
- ✅ Toast notifications

### Backend (Google Apps Script)
- ✅ CRUD users (create, read, update)
- ✅ Points management
- ✅ Withdraw requests handling
- ✅ Leaderboard API
- ✅ Automatic data validation
- ✅ Error handling

### Database (Google Sheets)
- ✅ Users table
- ✅ Withdraws table
- ✅ Automatic backup
- ✅ Easy admin access

## 🔧 Troubleshooting

### "API Error" atau "Server Error"
1. Pastikan Apps Script URL sudah benar
2. Cek apakah deployment masih aktif
3. Pastikan akses "Anyone" di deployment settings

### Game tidak update poin
1. Pastikan sudah login
2. Cek console browser untuk error
3. Pastikan DEMO_MODE = false

### Leaderboard kosong
1. Pastikan ada users dengan poin > 0
2. Jalankan function `initialize()` di Apps Script untuk data test

### Withdraw tidak masuk
1. Cek sheet "Withdraws" di Google Sheets
2. Pastikan saldo mencukupi
3. Cek minimum withdraw (default 1000 poin)

## 📱 Testing

1. **Buka aplikasi di browser**
2. **Login dengan email apapun**
3. **Mainkan semua game dan earn poin**
4. **Test withdraw dengan poin >= 1000**
5. **Cek leaderboard**
6. **Test responsive di mobile**

## 🔐 Keamanan

⚠️ **Penting**: Aplikasi ini menggunakan email tanpa password untuk kemudahan demo. Untuk production:

1. Tambahkan sistem autentikasi proper (OAuth, JWT)
2. Validasi input yang lebih ketat
3. Rate limiting untuk prevent spam
4. HTTPS wajib untuk production

## 📞 Support

Jika ada masalah dengan setup:

1. Cek Google Apps Script logs: `Executions` tab
2. Cek browser console untuk JavaScript errors
3. Pastikan semua dependencies sudah setup dengan benar

## ✨ Customization Ideas

- Tambah game baru
- Sistem achievement/badges
- Referral program
- Daily login bonus
- Multi-currency support
- Push notifications
- Social sharing

---

**Happy Gaming! 🎮**
