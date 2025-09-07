// ==================================================================== 
// | İlan Sayfası JavaScript İşlevselliği                              | 
// ==================================================================== 

// DOM tamamen yüklendikten sonra çalışacak kodlar 
document.addEventListener('DOMContentLoaded', () => { 

    // İlanları getirecek işlev 
    const fetchJobAds = async () => { 
        try { 
            // API'den ilanları çekmek için fetch kullanıyoruz 
            const response = await fetch('/api/ilanlar'); 
            if (!response.ok) { 
                throw new Error('API\'den ilanlar alınamadı.'); 
            } 
             
            // API'den gelen JSON nesnesinin tamamını al 
            const result = await response.json(); 

            // Eğer API yanıtı başarılı değilse veya ilanlar dizisi yoksa hata fırlat 
            if (!result.success || !Array.isArray(result.data)) { 
                 throw new Error(result.error || 'API\'den beklenen veri formatı alınamadı.'); 
            } 

            // `data` anahtarındaki ilanlar dizisini `displayJobAds` fonksiyonuna gönder 
            displayJobAds(result.data); 

        } catch (error) { 
            console.error('İlanları çekerken hata:', error); 
            const adsGrid = document.querySelector('.job-ads-grid'); 
            adsGrid.innerHTML = '<p class="text-red-500">İlanlar yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>'; 
        } 
    }; 

    // Gelen ilan verilerini sayfada gösterecek işlev 
    const displayJobAds = (ads) => { 
        const adsGrid = document.querySelector('.job-ads-grid'); 
        adsGrid.innerHTML = ''; // Mevcut ilanları temizle 

        if (ads.length === 0) { 
            adsGrid.innerHTML = '<p class="text-gray-500">Gösterilecek ilan bulunamadı.</p>'; 
            return; 
        } 

        ads.forEach(ad => { 
            const adCard = document.createElement('div'); 
            adCard.classList.add('ad-card', 'bg-white', 'p-6', 'rounded-lg', 'shadow-md', 'transition-all', 'duration-300', 'hover:shadow-xl'); 
            adCard.setAttribute('data-id', ad.ilan_ID); 

            adCard.innerHTML = ` 
                <h3 class="text-xl font-bold mb-2">${ad.pozisyon_adi || 'POZİSYON ADI BELİRTİLMEDİ'}</h3> 
                <p class="text-gray-700"><strong>Firma Adı:</strong> ${ad.firma_adi || 'Belirtilmedi'}</p> 
                <p class="text-gray-700"><strong>Lokasyon:</strong> ${ad.lokasyon || 'Belirtilmedi'}</p> 
                <p class="text-gray-700"><strong>Eğitim:</strong> ${ad.egitim || 'Belirtilmedi'}</p> 
                <p class="text-sm text-gray-500 mt-2">Yayınlanma Tarihi: ${new Date(ad.yayinlanma_tarihi).toLocaleDateString('tr-TR')}</p> 
                <button class="apply-btn bg-blue-500 text-white font-bold py-2 px-4 rounded-full mt-4 w-full hover:bg-blue-600 transition-colors duration-200">BAŞVUR ⚡</button> 
            `; 
            adsGrid.appendChild(adCard); 

            // Başvuru butonuna tıklama işlevi ekle 
            const applyBtn = adCard.querySelector('.apply-btn'); 
            applyBtn.addEventListener('click', () => handleApply(ad.ilan_ID)); 
        }); 
    }; 

    // Başvuru işlemini gerçekleştirecek işlev 
      // YENİ `handleApply` FONKSİYONU
      const handleApply = async (ilanId) => {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

       // Kullanıcı giriş yapmamışsa, rolü 'Aday' veya 'user' değilse ya da kullanıcı ID'si yoksa uyarı ver
       if (!currentUser || (currentUser.rol !== 'Aday' && currentUser.rol !== 'user') || !currentUser.id) {
        alert('Başvuru yapmak için bir aday olarak giriş yapmalısınız!');
        return;
    }

        // Butonu deaktive et ve metni değiştir
        const applyBtn = document.querySelector(`.ad-card[data-id='${ilanId}'] .apply-btn`);
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.textContent = 'Başvuruluyor...';
        }

        try {
            // Düzeltilen API adresi ve veri gönderimi
            const response = await fetch('http://localhost:3000/api/basvur', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ilan_ID: ilanId,
                    kullanici_ID: currentUser.id
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                if (applyBtn) {
                    applyBtn.textContent = 'Başvuruldu!';
                }
            } else {
                alert(result.error);
                if (applyBtn) {
                    applyBtn.disabled = false;
                    applyBtn.textContent = 'BAŞVUR ⚡';
                }
            }
        } catch (error) {
            console.error('Başvuru gönderilirken hata:', error);
            alert('Başvuru yapılırken ağ hatası oluştu. Lütfen tekrar deneyin.');
            if (applyBtn) {
                applyBtn.disabled = false;
                applyBtn.textContent = 'BAŞVUR ⚡';
            }
        }
    };

    // Arama çubuğu işlevi 
    const filterInput = document.querySelector('.filter-bar input'); 
    filterInput.addEventListener('keyup', (e) => { 
        const searchText = e.target.value.toLowerCase(); 
        const adCards = document.querySelectorAll('.ad-card'); 
        adCards.forEach(card => { 
            const adText = card.textContent.toLowerCase(); 
            if (adText.includes(searchText)) { 
                card.style.display = 'block'; // Göster 
            } else { 
                card.style.display = 'none'; // Gizle 
            } 
        }); 
    }); 

    // "Geri" butonuna tıklama işlevi 
    const backButton = document.getElementById('adsBackToHomeButton'); 
    if (backButton) { 
        backButton.addEventListener('click', () => { 
            // Anasayfaya dönme işlevi, burada sayfa yönlendirmesi yapılabilir 
            // Örneğin: window.location.href = '/'; 
            alert("Anasayfa'ya dönme işlevi buraya gelecek."); 
        }); 
    } 

    // Sayfa yüklendiğinde ilanları hemen çek 
    fetchJobAds(); 
});