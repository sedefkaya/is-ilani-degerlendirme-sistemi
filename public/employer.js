// employer.js
// Bu dosya, ana script.js dosyasını değiştirmeden işveren paneli işlevlerini yönetir.

document.addEventListener('DOMContentLoaded', () => {

    const employerPage = document.getElementById('employerPage');
    const homePage = document.getElementById('homePage');
    const employerNameElement = employerPage.querySelector('h2');
    const addAdBtn = employerPage.querySelector('.add-ad-btn');
    const employerAdsTableBody = employerPage.querySelector('.employer-ads-table-container tbody');
    const backToHomeBtn = document.getElementById('employerBackToHomeButton');
    // ... diğer tanımlamalar
    const newAdPage = document.getElementById('newAdPage');
    const newAdForm = document.getElementById('newAdForm');
    const newAdBackToEmployerButton = document.getElementById('newAdBackToEmployerButton');
    const adPositionSelect = document.getElementById('adPosition');
    const adCitySelect = document.getElementById('adCity');
    const adEducationSelect = document.getElementById('adEducation');
    const adDriverLicenseSelect = document.getElementById('adDriverLicense');
    const adMilitarySelect = document.getElementById('adMilitary');
    const adLanguageSelect = document.getElementById('adLanguage');
    
    // İşverenin ilanlarını API'den çeken ve tabloyu güncelleyen ana fonksiyon.
    const fetchAndRenderEmployerAds = async () => {
        console.log("fetchAndRenderEmployerAds çağrıldı");
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        console.log("İlanları çekmeden önce localStorage'dan alınan currentUser:", currentUser);

        // KESİN ÇÖZÜM: Hem 'İşveren' hem de 'employer' rollerini kontrol et
        if (!currentUser || (currentUser.rol !== 'İşveren' && currentUser.rol !== 'employer') || !currentUser.id) {
            console.error("Yetkisiz erişim: Oturum bilgisi bulunamadı veya rol işveren değil. Veya kullanıcı ID'si eksik.");
            employerAdsTableBody.innerHTML = '<tr><td colspan="5">Bu sayfayı görüntülemek için yetkiniz yok veya giriş yapmalısınız.</td></tr>';
            return;
        }

        // Kullanıcı adını başlığa yerleştirme
        employerNameElement.textContent = `Hoş Geldiniz, ${currentUser.adSoyad}!`;

        // Yükleniyor mesajını göster
        employerAdsTableBody.innerHTML = '<tr><td colspan="5">Veriler yükleniyor...</td></tr>';

        try {
            // API'den işverenin ilanlarını çekme (Doğru Kullanıcı ID'si ile)
            const response = await fetch(`http://localhost:3000/api/employer-ads/${currentUser.id}`);
            const result = await response.json();

            if (result.success) {
                if (result.data.length > 0) {
                    // İlanlar varsa tabloyu doldur
                    employerAdsTableBody.innerHTML = ''; // Önceki içeriği temizle
                    result.data.forEach(ad => {
                        // Veritabanında durum kolonu olmadığı için statik bir sınıf kullandık
                        const statusClass = 'status-active';
                        const statusText = 'Aktif';
                        const formattedDate = new Date(ad.yayin_tarihi).toLocaleDateString('tr-TR');
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${ad.pozisyon}</td>
                            <td>${formattedDate}</td>
                            <td>Henüz Başvuru Sayısı Gelmiyor</td>
                            <td class="${statusClass}">${statusText}</td>
                            <td>
                                <button class="edit-btn">DÜZENLE</button>
                                <button class="delete-btn" data-ilan-id="${ad.ilan_ID}">SİL</button>
                                <button class="apply-btn" data-ilan-id="${ad.ilan_ID}">Başvur</button>

                            </td>
                        `;
                        employerAdsTableBody.appendChild(row);
                    });

                    // SİL butonları için olay dinleyicileri ekleme
                    attachDeleteEventListeners();
                } else {
                    // İlan yoksa mesajı göster
                    employerAdsTableBody.innerHTML = '<tr><td colspan="5">Henüz yayımlanmış bir ilanınız bulunmamaktadır.</td></tr>';
                }
            } else {
                // API'den hata gelirse
                employerAdsTableBody.innerHTML = `<tr><td colspan="5">İlanlar yüklenirken bir hata oluştu: ${result.error}</td></tr>`;
                console.error('API Hatası:', result.error);
            }
        } catch (error) {
            // Ağ veya fetch hatası
            employerAdsTableBody.innerHTML = '<tr><td colspan="5">Sunucuya bağlanırken bir hata oluştu. Lütfen tekrar deneyin.</td></tr>';
            console.error('Fetch Hatası:', error);
        }
    };

    
    // Formdaki <select> elemanlarını veritabanı verileriyle doldurur
const populateAdFormSelects = async () => {
    try {
        // Pozisyonları çekme
        const positionsRes = await fetch('http://localhost:3000/api/pozisyonlar');
        const positionsData = await positionsRes.json();
        populateSelect(adPositionSelect, positionsData.data, 'pozisyon_ID', 'adi');

        // Şehirleri çekme
        const citiesRes = await fetch('http://localhost:3000/api/sehirler');
        const citiesData = await citiesRes.json();
        populateSelect(adCitySelect, citiesData.data, 'sehir_ID', 'adi');

        // Eğitim durumlarını çekme
        const educationRes = await fetch('http://localhost:3000/api/ogrenimDurumlari');
        const educationData = await educationRes.json();
        populateSelect(adEducationSelect, educationData.data, 'ogrenimDurumuID', 'bilgi');

        // Ehliyet tiplerini çekme
        const driverLicenseRes = await fetch('http://localhost:3000/api/ehliyetler');
        const driverLicenseData = await driverLicenseRes.json();
        populateSelect(adDriverLicenseSelect, driverLicenseData.data, 'ehliyet_ID', 'tipi', 'Farketmez');

        // Askerlik durumlarını çekme
        const militaryRes = await fetch('http://localhost:3000/api/askerlikDurumlari');
        const militaryData = await militaryRes.json();
        populateSelect(adMilitarySelect, militaryData.data, 'askerlik_ID', 'rütbe', 'Farketmez');

        // Dilleri çekme
        const languagesRes = await fetch('http://localhost:3000/api/diller');
        const languagesData = await languagesRes.json();
        populateSelect(adLanguageSelect, languagesData.data, 'dil_ID', 'adi', 'Farketmez');

    } catch (error) {
        console.error('Form dropdownları yüklenirken bir hata oluştu:', error);
    }
};

// Yardımcı fonksiyon: <select> elemanlarını doldurur
const populateSelect = (selectElement, data, valueKey, textKey, defaultOptionText = null) => {
    selectElement.innerHTML = '';
    if (defaultOptionText) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = defaultOptionText;
        selectElement.appendChild(defaultOption);
    }
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
};
    // Silme olay dinleyicilerini dinamik olarak ekleyen fonksiyon
    const attachDeleteEventListeners = () => {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const ilanId = e.target.dataset.ilanId;
                if (confirm(`ID'si ${ilanId} olan ilanı silmek istediğinize emin misiniz?`)) {
                    // Silme işlemini burada yapacaksınız.
                    // Şimdilik sadece konsola logluyoruz.
                    console.log(`İlan ID: ${ilanId} silme işlemi başlatıldı.`);
                }
            });
        });
    };
    
    // Yeni İlan Ekle butonu.
    if (addAdBtn) {
        addAdBtn.addEventListener('click', () => {
        console.log("Yeni ilan ekleme formu açılıyor.");
        employerPage.classList.remove('active');
        newAdPage.classList.add('active');
        populateAdFormSelects(); // Dropdown'ları doldurmak için yeni fonksiyon
        });
    }
    // Geri Dön butonu.
    if (backToHomeBtn && homePage) {
        backToHomeBtn.addEventListener('click', () => {
            employerPage.classList.remove('active');
            homePage.classList.add('active');
            console.log("Anasayfaya dönülüyor...");
        });
    }

    // yeni ilan ekleme sayda Form gönderildiğindeki olay dinleyicisi
if (newAdForm) {
    newAdForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Form verilerini al
        const formData = new FormData(newAdForm);
        const data = Object.fromEntries(formData.entries());

        // Kullanıcı ID'sini ekle
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        data.kullanici_ID = currentUser.id;

        try {
            const response = await fetch('http://localhost:3000/api/yeni-ilan-ekle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                alert('İlan başarıyla yayımlandı!');
                // Başarılı olursa formu temizle ve işveren sayfasına dön
                newAdForm.reset();
                newAdPage.classList.remove('active');
                employerPage.classList.add('active');
            } else {
                alert('İlan yayımlanırken bir hata oluştu: ' + result.error);
            }
        } catch (error) {
            console.error('İlan yayımlama hatası:', error);
            alert('İlan yayımlanırken bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });
}
    // Yeni İlan Ekleme sayfasından geri dönme butonu
if (newAdBackToEmployerButton) {
    newAdBackToEmployerButton.addEventListener('click', () => {
        newAdPage.classList.remove('active');
        employerPage.classList.add('active');
    });
}

    // `employerPage`'in aktif olup olmadığını izlemek için `MutationObserver`.
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (employerPage.classList.contains('active')) {
                    console.log("İşveren sayfası aktif hale geldi. Veriler yükleniyor...");
                    fetchAndRenderEmployerAds();
                }
            }
        });
    });

    const mainContainer = document.querySelector('body');
    if (mainContainer) {
        observer.observe(mainContainer, { attributes: true, subtree: true });
    }
});