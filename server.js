const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/images', express.static('images'));

// Koneksi ke MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kain_tenun'
});

db.connect(err => {
    if (err) {
        console.error('Koneksi gagal:', err);
    } else {
        console.log('Terhubung ke database MySQL');
    }
});

// Pastikan folder images ada
if (!fs.existsSync(path.join(__dirname, 'images'))) {
    fs.mkdirSync(path.join(__dirname, 'images'));
}

// Konfigurasi multer untuk menyimpan file gambar
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'images')); // Simpan di folder images/
    },
    filename: (req, file, cb) => {
        const originalName = file.originalname.replace(/\s+/g, '_'); // Hindari spasi
        cb(null, originalName); // Simpan dengan nama asli di dalam folder images/
    }
});
const upload = multer({ storage });

// API untuk mengambil data dari MySQL
app.get('/produk', (req, res) => {
    db.query('SELECT * FROM produk', (err, results) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(results);
        }
    });
});

// API untuk menambahkan data ke MySQL dengan upload gambar
app.post('/produk', upload.single('gambar'), (req, res) => {
    const { nama, deskripsi, harga_asli, harga_diskon } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'Gambar harus diunggah!' });
    }
    if (!nama || !deskripsi || !harga_asli || !harga_diskon) {
        return res.status(400).json({ error: 'Semua field harus diisi!' });
    }
    const gambar = `images/${req.file.filename}`;


    const query = 'INSERT INTO produk (nama, deskripsi, harga_asli, harga_diskon, gambar) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nama, deskripsi, harga_asli, harga_diskon, gambar], (err, results) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send({ error: 'Gagal menambahkan produk' });
        } else {
            res.status(201).send({ message: 'Produk berhasil ditambahkan', id: results.insertId });
        }
    });
});

// API untuk memperbarui data produk
app.put('/produk/:id', (req, res) => {
    const { id } = req.params;
    const { nama, deskripsi, harga_asli, harga_diskon } = req.body;
    const query = 'UPDATE produk SET nama = ?, deskripsi = ?, harga_asli = ?, harga_diskon = ? WHERE id = ?';
    db.query(query, [nama, deskripsi, harga_asli, harga_diskon, id], (err, results) => {
        if (err) {
            console.error('Error updating data:', err);
            res.status(500).send({ error: 'Gagal memperbarui produk' });
        } else {
            res.status(200).send({ message: 'Produk berhasil diperbarui' });
        }
    });
});

// API untuk menghapus data produk
app.delete('/produk/:id', (req, res) => {
    const { id } = req.params;

    // Ambil path gambar dari database
    db.query('SELECT gambar FROM produk WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Gagal ambil data gambar:', err);
            return res.status(500).json({ error: 'Gagal menghapus produk' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Produk tidak ditemukan' });
        }

        const gambarPath = results[0].gambar;
        const fullImagePath = path.join(__dirname, gambarPath);

        // Hapus file gambar dari folder images/
        fs.unlink(fullImagePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Gagal hapus file gambar:', err);
                // lanjut ke hapus data meskipun file tidak ada
            }

            // Hapus data produk dari database
            db.query('DELETE FROM produk WHERE id = ?', [id], (err, results) => {
                if (err) {
                    console.error('Gagal hapus produk dari database:', err);
                    return res.status(500).json({ error: 'Gagal menghapus produk' });
                }

                res.status(200).json({ message: 'Produk dan gambar berhasil dihapus' });
            });
        });
    });
});


app.get('/produk/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM produk WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching produk:', err);
            res.status(500).send({ error: 'Gagal mengambil data produk' });
        } else if (results.length === 0) {
            res.status(404).send({ error: 'Produk tidak ditemukan' });
        } else {
            res.send(results[0]);
        }
    });
});

app.post('/checkout', (req, res) => {
    const { nama, alamat, no_telp, produk, total } = req.body;

    const query = 'INSERT INTO checkout (nama, alamat, no_telp, produk, total) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nama, alamat, no_telp, JSON.stringify(produk), total], (err, results) => {
        if (err) {
            console.error('Checkout error:', err);
            res.status(500).send({ error: 'Gagal menyimpan data checkout' });
        } else {
            res.status(201).send({ message: 'Checkout berhasil' });
        }
    });
});

app.get('/checkout', (req, res) => {
    db.query("SELECT * FROM checkout ORDER BY waktu DESC", (err, results) => {
        if (err) {
            console.error("Error saat ambil checkout:", err);
            res.status(500).json({ error: 'Gagal mengambil data checkout' });
        } else {
            res.json(results);
        }
    });
});


// Jalankan server
app.listen(PORT, () => {
    console.log('Server berjalan di port  ${PORT}');
});
