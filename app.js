// Gerekli modülleri dahil etme
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');

// Express uygulamasını başlatma
const app = express();
const port = process.env.PORT || 3000;

// 'public' klasöründeki statik dosyaları (HTML, CSS, JS) sunucu üzerinden erişime açma
app.use(express.static(path.join(__dirname, 'public')));

// Middleware: Gelen her isteği loglama
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] İstek geldi: ${req.method} ${req.originalUrl}`);
    next();
});

// Middleware: CORS'u etkinleştir
app.use(cors());
app.use(express.json());


// MySQL veritabanı bağlantı bilgileri
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'S.k39921163', // Lütfen kendi MySQL root şifrenizi buraya yazın
    database: 'proje_db'
});

// Veritabanı bağlantısını kontrol etme
connection.connect(err => {
    if (err) {
        console.error('Veritabanına bağlanırken bir hata oluştu:', err.stack);
        process.exit(1);
    }
    console.log('Veritabanına başarıyla bağlanıldı. Bağlantı ID:', connection.threadId);
});

// Ana sayfa için kök dizin yönlendirmesi
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ====================================================================
// | Tüm API Uç Noktaları (Endpoints)                                 |           |
// ====================================================================


// '/api/users' adresine gelen GET isteklerini yöneten API endpoint'i
app.get('/api/users', (req, res) => {
    console.log('GET isteği "/api/users" route\'una ulaştı. Veritabanı sorgusu başlatılıyor.');
    
    const sql = 'SELECT kullanici_ID, adSoyad, mail, rol FROM Kullanicilar';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Veritabanı sorgusu hatası:', err);
            res.status(500).json({ error: 'Veritabanı sorgusunda bir hata oluştu.', details: err.message });
            return;
        }
        console.log('Sorgu başarıyla tamamlandı. Gelen veri sayısı:', results.length);
        if (results.length === 0) {
            console.log('Sorgu tamamlandı, ancak tablo boş.');
        }
        res.json(results);
    });
});

// '/api/login' adresine gelen POST isteklerini yöneten API endpoint'i
app.post('/api/login', (req, res) => {
    console.log('POST isteği "/api/login" route\'una ulaştı.');
    
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    if (!email || !password) {
        return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
    }

    const sql = 'SELECT * FROM Kullanicilar WHERE mail = ?';
    connection.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Veritabanı sorgusu hatası:', err);
            return res.status(500).json({ error: 'Veritabanı sorgusunda bir hata oluştu.' });
        }

        if (results.length === 0) {
            console.log(`Giriş hatası: E-posta adresi (${email}) veritabanında bulunamadı.`);
            return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
        }

        const user = results[0];
        
        try {
            console.log(`Bcrypt karşılaştırması için:`);
            console.log(`- Girilen düz metin şifre: ${password}`);
            console.log(`- Veritabanındaki hash'lenmiş şifre: ${user.sifre}`);
            
            const match = await bcrypt.compare(password, user.sifre);
            
            if (match) {
                console.log(`Şifreler eşleşti. Kullanıcı girişi başarılı.`);
                const frontendRol = (user.rol === 'Aday') ? 'user' : 
                                    (user.rol === 'İşveren') ? 'employer' : 'guest';
                res.status(200).json({ 
                    message: 'Giriş başarılı!', 
                    user: { id: user.kullanici_ID, adSoyad: user.adSoyad, rol: frontendRol } 
                });
            } else {
                console.log(`Giriş hatası: Şifreler eşleşmedi.`);
                res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
            }
        } catch (bcryptErr) {
            console.error('Bcrypt şifre karşılaştırma hatası:', bcryptErr);
            res.status(500).json({ error: 'Sunucu hatası.' });
        }
    });
});

// Yeni '/api/register' adresine gelen POST isteklerini yöneten API endpoint'i
app.post('/api/register', async (req, res) => {
    console.log('POST isteği "/api/register" route\'una ulaştı.');
    
    const name = req.body.name ? req.body.name.trim() : '';
    const email = req.body.email ? req.body.email.trim() : '';
    const password = req.body.password ? req.body.password.trim() : '';
    const rol = 'Aday';

    if (!name || !email || !password) {
       return res.status(400).json({ error: 'Ad Soyad, E-posta ve şifre zorunludur.' });
    }

    const checkUserSql = 'SELECT * FROM Kullanicilar WHERE mail = ?';
    connection.query(checkUserSql, [email], async (err, results) => {
        if (err) {
            console.error('Veritabanı kontrol sorgusu hatası:', err);
            return res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
        }

        if (results.length > 0) {
            return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertUserSql = 'INSERT INTO Kullanicilar (adSoyad, mail, sifre, rol) VALUES (?, ?, ?, ?)';
            connection.query(insertUserSql, [name, email, hashedPassword, rol], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Kullanıcı ekleme sorgusu hatası:', insertErr);
                    return res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
                }

                console.log('Yeni kullanıcı başarıyla kaydedildi. ID:', insertResult.insertId);
                
                res.status(201).json({ 
                    message: 'Kayıt başarıyla tamamlandı.',
                    user: { id: insertResult.insertId, mail: email, adSoyad: name, rol: 'user' }
                });
            });
        } catch (hashErr) {
            console.error('Şifre hashleme hatası:', hashErr);
            res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
        }
    });
});

// Kullanıcı bilgilerini çekme endpoint'i
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT k.kullanici_ID, k.adSoyad, k.mail, k.adres, k.dg_date, k.tel, k.cinsiyet, k.askerlik_ID, k.medeniHal_ID, k.deneyim, k.ogrenimDurumuID, s.adi AS sehir, k.ehliyet_ID, d.adi AS dil, ds.seviye AS seviye
        FROM Kullanicilar k
        LEFT JOIN sehir s ON k.sehir_ID = s.sehir_ID
        LEFT JOIN kullanici_dil kd ON k.kullanici_ID = kd.kullanici_ID
        LEFT JOIN dil d ON kd.dil_ID = d.dil_ID
        LEFT JOIN dilSeviyesi ds ON kd.seviye_ID = ds.seviye_ID
        WHERE k.kullanici_ID = ?;
    `;
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Veritabanı sorgusu hatası:', err);
            return res.status(500).json({ error: "Sunucu hatası" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Kullanıcı bulunamadı" });
        }
        const userData = {
            kullanici_ID: results[0].kullanici_ID, adSoyad: results[0].adSoyad, mail: results[0].mail, adres: results[0].adres, dg_date: results[0].dg_date, tel: results[0].tel, cinsiyet: results[0].cinsiyet, askerlik_ID: results[0].askerlik_ID, medeniHal_ID: results[0].medeniHal_ID, deneyim: results[0].deneyim, ogrenimDurumuID: results[0].ogrenimDurumuID, sehir: results[0].sehir, ehliyet_ID: results[0].ehliyet_ID, yabanciDiller: []
        };
        results.forEach(row => {
            if (row.dil && row.seviye) {
                userData.yabanciDiller.push({ dil: row.dil, seviye: row.seviye });
            }
        });
        res.json(userData);
    });
});

// Profil güncelleme endpoint'i
app.post('/api/updateProfile', (req, res) => {
    const { kullanici_ID, adSoyad, mail, adres, dg_date, tel, cinsiyet, askerlik_ID, medeniHal_ID, ogrenimDurumuID, sehir_ID, ehliyet_ID, deneyim, yabanciDiller } = req.body;
    if (!kullanici_ID) {
        return res.status(400).json({ success: false, message: "Kullanıcı ID gerekli." });
    }
    connection.beginTransaction(err => {
        if (err) {
            return res.status(500).json({ success: false, message: "Sunucu hatası." });
        }
        const updateSql = `UPDATE Kullanicilar SET adSoyad = ?, mail = ?, adres = ?, dg_date = ?, tel = ?, cinsiyet = ?, askerlik_ID = ?, medeniHal_ID = ?, ogrenimDurumuID = ?, sehir_ID = ?, ehliyet_ID = ?, deneyim = ? WHERE kullanici_ID = ?`;
        const params = [adSoyad, mail, adres, dg_date, tel, cinsiyet, askerlik_ID, medeniHal_ID, ogrenimDurumuID, sehir_ID, ehliyet_ID, deneyim, kullanici_ID];
        connection.query(updateSql, params, (err, results) => {
            if (err) {
                return connection.rollback(() => {
                    res.status(500).json({ success: false, message: "Kullanıcı bilgileri güncellenirken hata oluştu." });
                });
            }
            const deleteLanguagesSql = `DELETE FROM kullanici_dil WHERE kullanici_ID = ?`;
            connection.query(deleteLanguagesSql, [kullanici_ID], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        res.status(500).json({ success: false, message: "Yabancı diller güncellenirken hata oluştu." });
                    });
                }
                if (yabanciDiller && yabanciDiller.length > 0) {
                    const inserts = yabanciDiller.map(lang => new Promise((resolve, reject) => {
                        const findIdsSql = `SELECT d.dil_ID, ds.seviye_ID FROM dil d, dilSeviyesi ds WHERE d.adi = ? AND ds.seviye = ?`;
                        connection.query(findIdsSql, [lang.dil, lang.seviye], (err, ids) => {
                            if (err) return reject(err);
                            if (ids.length === 0) {
                                return reject(new Error('Dil veya seviye bulunamadı'));
                            }
                            const insertSql = `INSERT INTO kullanici_dil (kullanici_ID, dil_ID, seviye_ID) VALUES (?, ?, ?)`;
                            connection.query(insertSql, [kullanici_ID, ids[0].dil_ID, ids[0].seviye_ID], (err, insertResult) => {
                                if (err) return reject(err);
                                resolve(insertResult);
                            });
                        });
                    }));
                    Promise.all(inserts)
                        .then(() => connection.commit(err => {
                            if (err) {
                                return connection.rollback(() => res.status(500).json({ success: false, message: "Veritabanı işlemi tamamlanırken hata oluştu." }));
                            }
                            res.json({ success: true, message: "Profil başarıyla güncellendi!" });
                        }))
                        .catch(err => connection.rollback(() => res.status(500).json({ success: false, message: "Yabancı diller güncellenirken hata oluştu." })));
                } else {
                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => res.status(500).json({ success: false, message: "Veritabanı işlemi tamamlanırken hata oluştu." }));
                        }
                        res.json({ success: true, message: "Profil başarıyla güncellendi!" });
                    });
                }
            });
        });
    });
});

// ====================================================================
// | İlanlar API Uç Noktaları                                         |
// ====================================================================
app.get('/api/ilanlar', (req, res) => {
    const sql = `
        SELECT
            i.ilan_ID,
            p.adi AS pozisyon,
            iv.firmaAdi AS firma,
            s.adi AS lokasyon,
            od.bilgi AS egitim,
            i.yayin_tarihi
        FROM ilanlar i
        JOIN pozisyon p ON i.pozisyon_ID = p.pozisyon_ID
        JOIN isveren iv ON i.isveren_ID = iv.isveren_ID
        JOIN sehir s ON i.sehir_ID = s.sehir_ID
        JOIN ogrenimDurumu od ON i.ogrenimDurumuID = od.ogrenimDurumuID
        ORDER BY i.yayin_tarihi DESC;
    `;
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('[ERROR SQL]', err);
            return res.status(500).json({ success:false, error: err.sqlMessage });
        }
        res.json({ success:true, data: results });
    });
});


// ====================================================================
// | İşveren İlanları API Uç Noktası (Yeni - Güncellenmiş)            |
// ====================================================================
app.get('/api/employer-ads/:kullanici_ID', (req, res) => {
    const kullaniciId = req.params.kullanici_ID;

    if (!kullaniciId) {
        return res.status(400).json({ success: false, error: 'Kullanıcı ID\'si eksik.' });
    }

    // Önce Kullanici ID'sine karşılık gelen Isveren ID'sini bul
    const findIsverenIdSql = 'SELECT isveren_ID FROM isveren WHERE kullanici_ID = ?';
    connection.query(findIsverenIdSql, [kullaniciId], (err, isverenResult) => {
    if (err) {
            console.error('[ERROR SQL]', err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }

        if (isverenResult.length === 0) {
            return res.status(404).json({ success: false, error: 'Belirtilen kullanıcıya ait bir işveren kaydı bulunamadı.' });
        }

        const isverenId = isverenResult[0].isveren_ID;

        // Sonra bu Isveren ID'sine göre ilanları getir
        const adsSql = `
            SELECT
                i.ilan_ID,
                p.adi AS pozisyon,
                s.adi AS lokasyon,
                i.yayin_tarihi,
                'aktif' AS durum -- Veritabanınızda durum kolonu olmadığı için 'aktif' olarak varsayıyoruz
            FROM ilanlar i
            JOIN pozisyon p ON i.pozisyon_ID = p.pozisyon_ID
            JOIN sehir s ON i.sehir_ID = s.sehir_ID
            WHERE i.isveren_ID = ?
            ORDER BY i.yayin_tarihi DESC;
        `;

        connection.query(adsSql, [isverenId], (err, results) => {
            if (err) {
                console.error('[ERROR SQL]', err);
                return res.status(500).json({ success: false, error: err.sqlMessage });
            }

            if (results.length === 0) {
                return res.json({ success: true, data: [], message: 'İşverenin aktif ilanı bulunmamaktadır.' });
            }

            res.json({ success: true, data: results });
        });
    });
});

// ====================================================================
// | Form Seçenekleri için API Uç Noktaları                           |
// ====================================================================

// Pozisyonları getirme
app.get('/api/pozisyonlar', (req, res) => {
    connection.query('SELECT pozisyon_ID, adi FROM pozisyon', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});

// Şehirleri getirme
app.get('/api/sehirler', (req, res) => {
    connection.query('SELECT sehir_ID, adi FROM sehir', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});

// Öğrenim durumlarını getirme
app.get('/api/ogrenimDurumlari', (req, res) => {
    connection.query('SELECT ogrenimDurumuID, bilgi FROM ogrenimDurumu', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});

// Ehliyet tiplerini getirme
app.get('/api/ehliyetler', (req, res) => {
    connection.query('SELECT ehliyet_ID, tipi FROM ehliyet', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});

// Askerlik durumlarını getirme
app.get('/api/askerlikDurumlari', (req, res) => {
    connection.query('SELECT askerlik_ID, rütbe FROM askerlik', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});

// Dilleri getirme
app.get('/api/diller', (req, res) => {
    connection.query('SELECT dil_ID, adi FROM dil', (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });
        res.json({ success: true, data: results });
    });
});


// ====================================================================
// | Yeni İlan Ekleme API Uç Noktası (POST)                           |
// ====================================================================
app.post('/api/yeni-ilan-ekle', (req, res) => {
    const { kullanici_ID, position, city, education, experience, driverLicense, military, language, gender } = req.body;

    if (!kullanici_ID || !position || !city || !education || !experience || !gender) {
        return res.status(400).json({ success: false, error: 'Zorunlu alanlar eksik.' });
    }

    // Önce Kullanici ID'sinden Isveren ID'sini bulma
    const findIsverenIdSql = 'SELECT isveren_ID FROM isveren WHERE kullanici_ID = ?';
    connection.query(findIsverenIdSql, [kullanici_ID], (err, isverenResult) => {
        if (err) {
            console.error('[ERROR SQL]', err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }

        if (isverenResult.length === 0) {
            return res.status(404).json({ success: false, error: 'İlan eklemek için geçerli bir işveren kaydı bulunamadı.' });
        }

        const isverenId = isverenResult[0].isveren_ID;
        const yayinTarihi = new Date().toISOString().slice(0, 10); // Yıl-Ay-Gün formatı

        // Yeni ilanı veritabanına ekleme
        const insertAdSql = `
            INSERT INTO ilanlar (
                pozisyon_ID, isveren_ID, sehir_ID, askerlik_ID, ehliyet_ID, dil_ID, ogrenimDurumuID,
                yayin_tarihi, deneyim, cinsiyet
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        const values = [
            position,
            isverenId,
            city,
            military || null, // Varsa ID, yoksa null
            driverLicense || null,
            language || null,
            education,
            yayinTarihi,
            experience,
            gender
        ];

        connection.query(insertAdSql, values, (err, result) => {
            if (err) {
                console.error('[ERROR SQL]', err);
                return res.status(500).json({ success: false, error: err.sqlMessage });
            }

            res.json({ success: true, message: 'İlan başarıyla eklendi!', ilan_ID: result.insertId });
        });
    });
});

// ====================================================================
// | İlana Başvuru API Uç Noktası (POST)                              |
// ====================================================================
app.post('/api/basvur', (req, res) => {
    const { ilan_ID, kullanici_ID } = req.body;

    if (!ilan_ID || !kullanici_ID) {
        return res.status(400).json({ success: false, error: 'İlan ID ve Kullanıcı ID bilgileri eksik.' });
    }

    // Adayın ve ilanların bilgilerini aynı anda çekmek için JOIN kullanıyoruz
    const sql = `
        SELECT
            k.ogrenimDurumuID AS aday_egitim,
            k.sehir_ID AS aday_sehir,
            k.ehliyet_ID AS aday_ehliyet,
            k.askerlik_ID AS aday_askerlik,
            k.deneyim AS aday_deneyim,
            k.cinsiyet AS aday_cinsiyet,
            i.pozisyon_ID AS ilan_pozisyon,
            i.ogrenimDurumuID AS ilan_egitim,
            i.sehir_ID AS ilan_sehir,
            i.ehliyet_ID AS ilan_ehliyet,
            i.askerlik_ID AS ilan_askerlik,
            i.deneyim AS ilan_deneyim,
            i.cinsiyet AS ilan_cinsiyet
        FROM Kullanicilar k
        JOIN ilanlar i ON i.ilan_ID = ?
        WHERE k.kullanici_ID = ?;
    `;

    connection.query(sql, [ilan_ID, kullanici_ID], (err, result) => {
        if (err) {
            console.error('[ERROR SQL]', err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, error: 'Kullanıcı veya ilan bulunamadı.' });
        }

        const data = result[0];
        let durum = 'Reddedildi'; // Varsayılan durum 'Reddedildi'

        // Basit bir eşleştirme mantığı:
        // Şehir, Eğitim ve Pozisyon ID'leri eşleşiyorsa başvuruyu onaylıyoruz.
        // Daha gelişmiş bir sistemde, deneyim, ehliyet gibi diğer kriterler de dikkate alınabilir.
        if (data.aday_sehir === data.ilan_sehir &&
            data.aday_egitim >= data.ilan_egitim && // Adayın eğitim seviyesi ilan için yeterli veya daha yüksekse
            data.aday_deneyim >= data.ilan_deneyim) {
            durum = 'Onaylandı';
        }
        
        // Askerlik durumu kontrolü, eğer ilan 'Erkek' aday arıyorsa
        if (data.ilan_cinsiyet === 'Erkek') {
          if (!data.aday_askerlik) {
            durum = 'Reddedildi' // Adayın askerlik bilgisi yoksa
          }
        }
        
        // Veritabanına başvuru kaydını ekleme
        const insertSql = `
            INSERT INTO basvurular (ilan_ID, kullanici_ID, basvuru_tarihi, durum)
            VALUES (?, ?, CURDATE(), ?);
        `;

        connection.query(insertSql, [ilan_ID, kullanici_ID, durum], (err, insertResult) => {
            if (err) {
                console.error('[ERROR SQL]', err);
                // Başvuru zaten yapılmışsa 409 hatası dön (Duplicate entry)
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ success: false, error: 'Bu ilana zaten başvuru yaptınız.' });
                }
                return res.status(500).json({ success: false, error: err.sqlMessage });
            }

            // Başvuru sonucunu döndürme
            res.json({ success: true, message: `Başvurunuz ${durum}!` });
        });
    });
});


// ====================================================================
// | Kullanıcının Başvurularını Getirme API Uç Noktası (GET)          |
// ====================================================================
app.get('/api/my-applications', (req, res) => {
    const kullanici_ID = req.query.kullanici_ID; // URL'den kullanıcı ID'sini al

    if (!kullanici_ID) {
        return res.status(400).json({ success: false, error: 'Kullanıcı ID\'si eksik.' });
    }

    // Pozisyon adını, durumu ve ilan ID'sini çeken sorgu
    const sql = `
        SELECT
            p.adi AS ilan_adi,
            b.durum AS sistem_karari,
            b.ilan_ID
        FROM basvurular b
        JOIN ilanlar i ON b.ilan_ID = i.ilan_ID
        JOIN pozisyon p ON i.pozisyon_ID = p.pozisyon_ID
        WHERE b.kullanici_ID = ?
        ORDER BY b.basvuru_tarihi DESC;
    `;

    connection.query(sql, [kullanici_ID], (err, results) => {
        if (err) {
            console.error('[ERROR SQL]', err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }
        res.json({ success: true, data: results });
    });
});



// ====================================================================
// | DİKKAT: Bu 404 (Bulunamadı) rotası, tüm diğer rotalardan SONRA gelmelidir. |
// ====================================================================
app.use((req, res, next) => {
    console.warn(`[404] Endpoint bulunamadı: ${req.method} ${req.originalUrl}`);
    res.status(404).send('Bulunamadı');
});

// Sunucuyu belirtilen port üzerinden başlatma
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
