document.addEventListener('DOMContentLoaded', () => {
    // HTML elemanlarını seçme
    const menuButton = document.getElementById('menuButton');
    const closeButton = document.getElementById('closeButton');
    const sidePanel = document.getElementById('sidePanel');
    const loginPageButton = document.getElementById('loginPageButton');
    const registerPageButton = document.getElementById('registerPageButton');
    const mainLoginPageButton = document.getElementById('mainLoginPageButton');
    const mainRegisterPageButton = document.getElementById('mainRegisterPageButton');
    const homeButton = document.getElementById('homeButton');
    const homePage = document.getElementById('homePage');
    const loginRegisterPage = document.getElementById('loginRegisterPage');
    const forgotPasswordPage = document.getElementById('forgotPasswordPage');
    const passwordToggleButtons = document.querySelectorAll('.password-toggle');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToSignInLink = document.getElementById('backToSignInLink');
    const resetPasswordButton = document.getElementById('resetPasswordButton');
    const checkEmailPage = document.getElementById('checkEmailPage');
    const checkEmailBackToSignInButton = document.getElementById('checkEmailBackToSignInButton');
    const registerPage = document.getElementById('registerPage');
    const loginHereLink = document.getElementById('loginHereLink');
    const signupLink = document.getElementById('signupLink');
    const createAccountButton = document.getElementById('createAccountButton');
    const profilePage = document.getElementById('profilePage');
    const forgotPasswordLinkEmployer = document.getElementById('forgotPasswordLinkEmployer');
    const signupLinkEmployer = document.getElementById('signupLinkEmployer');
    const maleGenderRadio = document.getElementById('male');
    const femaleGenderRadio = document.getElementById('female');
    const militaryServiceSection = document.getElementById('militaryServiceSection');
    const applicationsLink = document.getElementById('applicationsLink');
    const applicationsPage = document.getElementById('applicationsPage');
    const adsLink = document.getElementById('adsLink');
    const adsPage = document.getElementById('adsPage');
    const employerLink = document.getElementById('employerLink');
    const employerPage = document.getElementById('employerPage');
    const usersListLink = document.getElementById('usersListLink');
    const usersListPage = document.getElementById('usersListPage');
    const fetchUsersBtn = document.getElementById('fetch-users-btn');
    const usersTableBody = document.querySelector('#users-table tbody');
    const usersTable = document.getElementById('users-table');
    const loadingMessage = document.getElementById('loading-message');
    
    // Giriş ve Kayıt Formları için elemanlar
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const employerLoginForm = document.getElementById('employerLoginForm');
    const employerLoginError = document.getElementById('employerLoginError');
    const registerForm = document.getElementById('registerForm');
    const registerError = document.getElementById('registerError');

    const applicationsTableBody = document.getElementById('applicationsTableBody');
    const applicationsBackToHomeButton = document.getElementById('applicationsBackToHomeButton');

    // Yeni eklenen navigasyon butonları
    const myAccountLink = document.getElementById('myAccountLink');
    const logoutLink = document.getElementById('logoutLink');

    // Kullanıcıya özel karşılama mesajı için gerekli element
    const welcomeMessage = document.getElementById('welcomeMessage');
    //arama çubuğu için gerekli element
    const searchInput = document.querySelector('#adsPage input[type="text"]');

    // Kullanıcının giriş durumunu takip eden değişken
    isLoggedIn = false;
    currentUser = null;

// Uygulama yüklendiğinde çalışacak başlatma fonksiyonu
const init = () => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        isLoggedIn = true;
         
        console.log('init içinden fetchUserProfile çağrılıyor, userId:', currentUser.id);
        fetchUserProfile(currentUser.id);  // Burada currentUser.id olarak düzelttim
    }
    updateNavButtons();
};

// Profil bilgilerini çekip formu dolduracak fonksiyon
const fetchUserProfile = (kullanici_ID) => {
    console.log('fetchUserProfile çağrıldı, userId:', kullanici_ID);
    if (!kullanici_ID) {
        console.error("Kullanıcı ID'si yok.");
        return;
    }

    fetch(`/api/user/${kullanici_ID}`)
        .then(res => res.json())
        .then(data => {
            console.log("API'den gelen profil verisi:", data);
            if (data.error) {
                console.error(data.error);
                return;
            }

            // Form alanlarını doldur
            document.getElementById("full-name").value = data.adSoyad || "";
            document.getElementById("email").value = data.mail || "";
            document.getElementById("address").value = data.adres || "";
            document.getElementById("phone").value = data.tel || "";

            if (data.cinsiyet === "Erkek") document.getElementById("male").checked = true;
            if (data.cinsiyet === "Kadın") document.getElementById("female").checked = true;

            // Medeni hal ID'sine göre radio seçimi, örnek: 1 = evli, 2 = bekar
            if (data.medeniHal_ID === 1) document.getElementById("married").checked = true;
            if (data.medeniHal_ID === 2) document.getElementById("single").checked = true;
  
            // Doğum tarihi
            document.getElementById("birth-date").value = data.dg_date ? data.dg_date.split("T")[0] : "";

           // Şehir seçimi (sehir_ID)
           document.getElementById("city-select").value = data.sehir_ID || "";

           // Öğrenim durumu seçimi (Dropdown)
           let educationText = "";
           switch (data.ogrenimDurumuID) {
               case 1:
                   educationText = "Ortaokul";
                   break;
               case 2:
                   educationText = "Lise";
                   break;
               case 3:
                   educationText = "ÖnLisans";
                   break;
               case 4:
                   educationText = "Lisans";
                   break;
               default:
                   educationText = "";
           }
           document.getElementById("education-level").value = educationText;

           // Yabancı dil bilgilerini ekrana doldur
           const languageContainer = document.getElementById('added-languages-container');
           languageContainer.innerHTML = ''; // Önceki bilgileri temizle

           if (data.yabanciDiller && data.yabanciDiller.length > 0) {
               data.yabanciDiller.forEach(lang => {
                   const languageEntry = document.createElement('div');
                   languageEntry.classList.add('language-entry');
                   languageEntry.innerHTML = `
                       <span>Dil: ${lang.dil}</span>
                       <span>Seviye: ${lang.seviye}</span>
                       <button onclick="this.parentNode.remove()">Sil</button>
                   `;
                   languageContainer.appendChild(languageEntry);
               });
           }
       
           
           // Ehliyet durumu
           if (data.ehliyet_ID === 1) document.getElementById("license-yes").checked = true;
           if (data.ehliyet_ID === 2) document.getElementById("license-no").checked = true;
           
           document.getElementById("experience-year").value = data.deneyim || "";

           // Askerlik durumu checkbox (örnek: askerlik_ID 1=var, 2=yok)
           document.getElementById("military-service").checked = data.askerlik_ID === 1;
           })
        .catch(err => console.error("Veri çekme hatası:", err));
};

// Yabancı dil ekleme butonu
document.getElementById('addLanguageBtn').addEventListener('click', () => {
    // Dil için input, seviye için select kullanıyoruz
    const languageInput = document.getElementById('language-input');
    const levelSelect = document.getElementById('language-level');

    const languageText = languageInput.value.trim();
    const levelText = levelSelect.options[levelSelect.selectedIndex].text;

    // Hem dil hem de seviye seçilmişse devam et
    if (languageText && levelText && levelSelect.value !== "") {
        const languageContainer = document.getElementById('added-languages-container');
        const languageEntry = document.createElement('div');
        languageEntry.classList.add('language-entry');
        languageEntry.innerHTML = `
            <span>Dil: ${languageText}</span>
            <span>Seviye: ${levelText}</span>
            <button onclick="this.parentNode.remove()" type="button">Sil</button>
        `;
        languageContainer.appendChild(languageEntry);

        // Ekledikten sonra input'u temizle
        languageInput.value = '';
    } else {
        alert("Lütfen bir dil girin ve seviye seçin.");
    }
});
//profili güncelleme yeni bilgi ekleme butonu 
document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    if (!currentUser || !currentUser.id) {
        alert("Kullanıcı ID bulunamadı, lütfen tekrar giriş yapın.");
        return;
    }
    const kullanici_ID = currentUser.id;

    // Formdan verileri al
    const adSoyad = document.getElementById('full-name').value.trim(); // ID'leri düzelttim
    const mail = document.getElementById('email').value.trim();       // ID'leri düzelttim
    const adres = document.getElementById('address').value.trim();    // ID'leri düzelttim
    const dg_date = document.getElementById('birth-date').value.trim(); // ID'leri düzelttim
    const tel = document.getElementById('phone').value.trim();    // ID'leri düzelttim
    const cinsiyet = document.querySelector('input[name="gender"]:checked')?.value || null; // name'i düzelttim
    
    // Diğer alanları da alın
    const medeniHal_value = document.querySelector('input[name="marital-status"]:checked')?.value;
    console.log("Radyo butondan gelen ham değer:", medeniHal_value);
    const medeniHal_ID_final = medeniHal_value === 'married' ? 1 : (medeniHal_value === 'single' ? 2 : null);
    console.log("Dönüştürülen medeni hal ID'si:", medeniHal_ID_final);    
    const sehirSelect = document.getElementById('city-select');
    const sehir_ID = sehirSelect.value;

    const selectedEducationText = document.getElementById('education-level').value;
    const ogrenimDurumuID =selectedEducationText === "Ortaokul" ? 1 : 
                           selectedEducationText === "Lise" ? 2 : 
                           selectedEducationText === "ÖnLisans" ? 3 : 
                           selectedEducationText === "Lisans" ? 4 : null;

    // Yabancı dil ve seviye bilgilerini güvenli bir şekilde al
    const yabanciDiller = [];
    const languageEntries = document.querySelectorAll('#added-languages-container .language-entry');
    languageEntries.forEach(entry => {
        const dilSpan = entry.querySelector('span:first-child');
        const seviyeSpan = entry.querySelector('span:last-child');
        
        if (dilSpan && seviyeSpan) {
            const dil = dilSpan.textContent.replace('Dil: ', '').trim();
            const seviye = seviyeSpan.textContent.replace('Seviye: ', '').trim();
            
            if (dil && seviye) {
                yabanciDiller.push({ dil, seviye });
            }
        }
    });
  


    const ehliyet_value = document.querySelector('input[name="license"]:checked')?.value;
    console.log("Ehliyet için radyo butondan gelen ham değer:", ehliyet_value);
    const ehliyet_ID_final = ehliyet_value === 'var' ? 1 : (ehliyet_value === 'yok' ? 2 : null);
    console.log("Dönüştürülen ehliyet ID'si:", ehliyet_ID_final);
    

    const askerlik_ID = document.getElementById('military-service').checked ? 1 : 2; // Checkbox durumu
    const experienceYear = document.getElementById('experience-year').value;

    // API'ye göndermek için veri objesi
    const data = {
        kullanici_ID,
        adSoyad,
        mail,
        adres,
        dg_date: dg_date === '' ? null : dg_date,
        tel,
        cinsiyet,
        medeniHal_ID: medeniHal_ID_final, 
        deneyim: experienceYear ? parseInt(experienceYear) : 0, // Yeni eklenen satır
        sehir_ID,
        ogrenimDurumuID,
        ehliyet_ID: ehliyet_ID_final,
        askerlik_ID,
        yabanciDiller:yabanciDiller
    };

    console.log("Kaydedilecek veri:", data);

    try {
        const response = await fetch(`http://localhost:3000/api/updateProfile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Sunucu hatası: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            alert("Profil başarıyla güncellendi!");
        } else {
            alert("Güncelleme başarısız: " + result.message);
        }

    } catch (error) {
        console.error("Profil güncelleme hatası:", error);
        alert("Profil güncellenirken bir hata oluştu.");
    }
});

    // Yan Paneli Açma İşlevi
    if (menuButton && sidePanel) {
        menuButton.addEventListener('click', () => {
            sidePanel.style.width = '250px';
            console.log('Yan panel açıldı.');
        });
    }

    // Yan Paneli Kapatma İşlevi
    if (closeButton && sidePanel) {
        closeButton.addEventListener('click', () => {
            sidePanel.style.width = '0';
            console.log('Yan panel kapatıldı.');
        });
    }

    // Sayfa geçiş işlevlerini yöneten fonksiyon
    const showPage = (pageToShow) => {
        document.querySelectorAll('.page-section').forEach(page => page.classList.remove('active'));
        if (pageToShow) {
            pageToShow.classList.add('active');
        }
        if (sidePanel) {
            sidePanel.style.width = '0';
        }
    };
    
    // Ana sayfaya dönme işlevi
    const goBackToHome = () => {
        showPage(homePage);
    };

    // Ana sayfa butonu
    if (homeButton) {
        homeButton.addEventListener('click', goBackToHome);
    }





    // Başvurular linki için tıklama olayı dinleyicisi
    if (applicationsLink) {
        applicationsLink.addEventListener('click', (e) => {
            e.preventDefault();
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser || (currentUser.rol !== 'Aday' && currentUser.rol !== 'user') || !currentUser.id) {
                 alert('Yaptığınız başvuruları görmek için bir aday olarak giriş yapmalısınız!');
                 return;
            }
            showPage(applicationsPage);
            fetchAndRenderApplications();
        });
    }




    
    // Yan panel butonlarını ve ana sayfa karşılama mesajını güncelleyen fonksiyon
    const updateNavButtons = () => {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => link.classList.add('hidden'));

        if (mainLoginPageButton) mainLoginPageButton.style.display = 'block';
        if (mainRegisterPageButton) mainRegisterPageButton.style.display = 'block';
        
        if (welcomeMessage) {
            welcomeMessage.classList.add('hidden');
            welcomeMessage.textContent = '';
        }

        if (isLoggedIn) {
            if (mainLoginPageButton) mainLoginPageButton.style.display = 'none';
            if (mainRegisterPageButton) mainRegisterPageButton.style.display = 'none';

            if (welcomeMessage && currentUser) {
                welcomeMessage.textContent = `Merhaba, ${currentUser.adSoyad || currentUser.mail}!`;
                welcomeMessage.classList.remove('hidden');
            }
            
            // Tüm giriş yapmış kullanıcıların göreceği linkler
            if (logoutLink) logoutLink.classList.remove('hidden');
            
            if (currentUser && currentUser.rol === 'user') {
                // Sadece adayların (user) göreceği linkler
                if (myAccountLink) myAccountLink.classList.remove('hidden');
                if (adsLink) adsLink.classList.remove('hidden');
                if (applicationsLink) applicationsLink.classList.remove('hidden');
                if (usersListLink) usersListLink.classList.remove('hidden'); // Kullanıcı listesi de görebilir (yönetici gibi düşünülmüş olabilir)
            } else if (currentUser && currentUser.rol === 'employer') {
                // Sadece işverenlerin (employer) göreceği linkler
                if (employerLink) employerLink.classList.remove('hidden');
                if (usersListLink) usersListLink.classList.remove('hidden');
            }
        } else {
            // Kullanıcı giriş yapmamışsa
            if (loginPageButton) loginPageButton.classList.remove('hidden');
            if (registerPageButton) registerPageButton.classList.remove('hidden');
        }
    };

    // Sayfa geçişleri için olay dinleyicilerini tanımlama
    const pageMappings = {
        'loginPageButton': loginRegisterPage,
        'registerPageButton': registerPage,
        'mainLoginPageButton': loginRegisterPage,
        'mainRegisterPageButton': registerPage,
        'forgotPasswordLink': forgotPasswordPage,
        'forgotPasswordLinkEmployer': forgotPasswordPage,
        'backToSignInLink': loginRegisterPage,
        'checkEmailBackToSignInButton': loginRegisterPage,
        'signupLink': registerPage,
        'signupLinkEmployer': registerPage,
        'loginHereLink': loginRegisterPage,
        'myAccountLink': profilePage,
        'adsLink': adsPage,
        'applicationsLink': applicationsPage,
        'employerLink': employerPage,
        'usersListLink': usersListPage
    };

    // Navigasyon linkleri için olay dinleyicisi
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.id;
    
            // Login ve Register butonları için sayfa gösterimi
            if (id === 'loginPageButton' || id === 'registerPageButton') {
                showPage(pageMappings[id]);
                return;
            }
    
            // Çıkış yapma işlemi
            if (id === 'logoutLink') {
                isLoggedIn = false;
                currentUser = null;
                localStorage.removeItem('currentUser');
                updateNavButtons();
                showPage(homePage);
                return;
            }
    
            // Giriş yapılmamışsa uyar ve login sayfasını göster
            if (!isLoggedIn || !currentUser) {
                alert("Bu sayfaya erişmek için giriş yapmalısınız.");
                showPage(loginRegisterPage);
                return;
            }
    
            let hasPermission = false;
    
            // Rol bazlı sayfa erişim kontrolü
            if (currentUser.rol === 'user') {
                const userPages = ['myAccountLink', 'adsLink', 'applicationsLink', 'usersListLink'];
                if (userPages.includes(id)) {
                    hasPermission = true;
                }
            } else if (currentUser.rol === 'employer') {
                const employerPages = ['employerLink', 'usersListLink'];
                if (employerPages.includes(id)) {
                    hasPermission = true;
                }
            }
    
            if (hasPermission) {
                showPage(pageMappings[id]);
            } else {
                alert("Bu sayfaya erişim yetkiniz yoktur.");
                showPage(homePage);
            }
        });
    });
    
    // Ana sayfadaki giriş/kayıt butonları için olay dinleyicileri
    if(mainLoginPageButton) {
        mainLoginPageButton.addEventListener('click', () => showPage(loginRegisterPage));
    }
    if(mainRegisterPageButton) {
        mainRegisterPageButton.addEventListener('click', () => showPage(registerPage));
    }

    // Geri dön butonları için ortak işlevsellik
    document.querySelectorAll('.back-to-home-btn').forEach(btn => {
        btn.addEventListener('click', goBackToHome);
    });

    // Çıkış yap butonu
    if (logoutLink) { 
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLoggedIn = false;
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateNavButtons();
            showPage(homePage);
        });
    }

    // Şifre göster/gizle butonu
    if (passwordToggleButtons) {
        passwordToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const passwordInput = button.previousElementSibling;
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                button.textContent = type === 'password' ? '👁️' : '🔒';
            });
        });
    }
    document.addEventListener('DOMContentLoaded', () => {
        const maleRadio = document.getElementById('male');
        const femaleRadio = document.getElementById('female');
        const militaryServiceSection = document.getElementById('militaryServiceSection');
      
        if (!maleRadio || !femaleRadio || !militaryServiceSection) {
          console.warn('Elementlerden biri bulunamadı!');
          return;
        }
      
        function toggleMilitarySection() {
          militaryServiceSection.style.display = maleRadio.checked ? 'block' : 'none';
        }
      
        maleRadio.addEventListener('change', toggleMilitarySection);
        femaleRadio.addEventListener('change', toggleMilitarySection);
      
        // Sayfa ilk açıldığında durumu ayarla
        toggleMilitarySection();
      });
      
    
    
    // ====================================================================
    // | GİRİŞ (LOGIN) FONKSİYONU VE İŞVEREN GİRİŞ İŞLEVİ                 |
    // ====================================================================

    // Giriş işlemini gerçekleştiren ortak fonksiyon
    const handleLogin = async (email, password, errorElement) => {
        errorElement.textContent = '';
        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                console.error('API çağrısı başarısız oldu. Durum:', response.status);
                const errorData = await response.json();
                console.error('Sunucudan gelen yanıt:', errorData.error);
                errorElement.textContent = errorData.error;
                return;
            }
            
            const data = await response.json();
            
            console.log('Giriş başarılı:', data.message);
            isLoggedIn = true;
            currentUser = data.user;

            localStorage.setItem('userId', data.user.kullanici_ID);

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateNavButtons();
            showPage(homePage);
        
        } catch (error) {
            console.error('API çağrısı sırasında bir hata oluştu:', error);
            errorElement.textContent = 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        }
    };

    // Normal kullanıcı girişi için olay dinleyicisi
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            handleLogin(email, password, loginError);
        });
    }

    // İşveren girişi için olay dinleyicisi 
    if (employerLoginForm) {
        employerLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('employerLoginEmail').value;
            const password = document.getElementById('employerLoginPassword').value;
            handleLogin(email, password, employerLoginError);
        });
    }
    
    // ====================================================================
    // |  YENİ EKLENEN KOD: KAYIT OLMA (REGISTRATION) FONKSİYONU           |
    // ====================================================================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value; // <-- Yeni satır
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            registerError.textContent = '';
            
            // Yeni kontrol: Ad ve soyadın boş olup olmadığını kontrol et
            if (!name || !email || !password) {
                registerError.textContent = 'Ad Soyad, E-posta ve şifre zorunludur.';
                return;
            }
    
            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    // name alanını body'ye ekleyin
                    body: JSON.stringify({ name, email, password })
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    registerError.textContent = errorData.error;
                    console.error('Kayıt başarısız:', errorData.error);
                    return;
                }
                
                const data = await response.json();
                console.log('Kayıt başarılı:', data.message);
    
                isLoggedIn = true;
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                updateNavButtons();
                alert("Kayıt başarılı! Şimdi profilinizi tamamlamak için yönlendiriliyorsunuz.");
                showPage(profilePage);
            
            } catch (error) {
                console.error('API çağrısı sırasında bir hata oluştu:', error);
                registerError.textContent = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
            }
        });
    }

    // ====================================================================
    // |  Veritabanı bağlantı ve kullanıcı listesi kodları                   |
    // ====================================================================
    if (fetchUsersBtn) {
        fetchUsersBtn.addEventListener('click', fetchUsers);
    }
    
    async function fetchUsers() {
        if (!isLoggedIn) {
            alert("Kullanıcı listesini görüntülemek için giriş yapmalısınız.");
            return;
        }

        console.log('Kullanıcıları getirmek için API çağrısı başlatıldı...');
        
        loadingMessage.classList.remove('hidden');
        usersTable.classList.add('hidden');
        
        try {
            const response = await fetch('http://localhost:3000/api/users');
            console.log('API yanıtı alındı. Yanıt durumu:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API çağrısı başarısız oldu. Durum: ${response.status}, Mesaj: ${errorText}`);
            }
            
            const users = await response.json();
            console.log('API\'den gelen veriler:', users);

            usersTableBody.innerHTML = '';
            
            if (users && users.length > 0) {
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.kullanici_ID}</td>
                        <td>${user.adSoyad || 'Bilinmiyor'}</td>
                        <td>${user.mail}</td>
                        <td>${user.rol}</td>
                    `;
                    usersTableBody.appendChild(row);
                });
                usersTable.classList.remove('hidden');
                console.log('Kullanıcı verileri tabloya başarıyla eklendi.');
            } else {
                console.log('API\'den hiç kullanıcı verisi gelmedi veya veriler boş.');
                loadingMessage.textContent = 'Veritabanında hiç kullanıcı bulunamadı.';
            }
        } catch (error) {
            console.error('Kullanıcılar getirilirken bir hata oluştu:', error);
            loadingMessage.textContent = `Veriler yüklenirken bir hata oluştu: ${error.message}. Lütfen tarayıcı konsolunu ve Terminali kontrol edin.`;
        } finally {
            loadingMessage.classList.add('hidden');
        }
    }
// ilanlar sayfası (Frontend)
document.addEventListener('DOMContentLoaded', () => {
    const adsGrid = document.querySelector('.job-ads-grid');

    fetch('/api/ilanlar')
        .then(res => {
            if (!res.ok) {
                // HTTP hatası (404, 500 vb.) varsa hata fırlat.
                throw new Error('API isteği başarısız oldu.');
            }
            return res.json();
        })
        .then(response => { 
            // API'den gelen ana nesneyi 'response' adıyla alıyoruz.
            if (!response.success) {
                // Backend'den gelen hata mesajını kullanıyoruz.
                throw new Error(response.error || 'İşlem başarısız oldu.');
            }
            
            // 'data' anahtarındaki ilanlar dizisine erişiyoruz.
            const ilanlar = response.data;

            if (!ilanlar || !Array.isArray(ilanlar)) {
                throw new Error('API\'den beklenen veri formatı alınamadı.');
            }

            adsGrid.innerHTML = '';

            if (ilanlar.length === 0) {
                adsGrid.innerHTML = '<p>Henüz yayınlanmış ilan bulunmamaktadır.</p>';
                return;
            }

            ilanlar.forEach(ilan => {
                const adCard = document.createElement('div');
                adCard.classList.add('ad-card');
                adCard.innerHTML = `
                    <h3>POZİSYON ADI: ${ilan.pozisyon}</h3>
                    <p>Firma Adı : ${ilan.firma}</p>
                    <p>Lokasyon : ${ilan.lokasyon}</p>
                    <p>Eğitim: ${ilan.egitim}</p>
                    <p class="publish-date">yayınlanma tarihi : ${ilan.yayin_tarihi || 'Belirtilmemiş'}</p>
                    <button class="apply-btn" data-ilan-id="${ilan.ilan_ID}">BAŞVUR ⚡</button>
                `;
                adsGrid.appendChild(adCard);
            });
        })
        .catch(err => {
            console.error('İlanları çekerken hata:', err);
            document.querySelector('.job-ads-grid').innerHTML = '<p>İlanlar yüklenirken bir sorun oluştu.</p>';
        });
});

// Başvuruları çekme ve ekrana basma fonksiyonu
    const fetchAndRenderApplications = async () => {
        const applicationsTableBody = document.getElementById('applicationsTableBody');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!currentUser || (currentUser.rol !== 'Aday' && currentUser.rol !== 'user') || !currentUser.id) {
            applicationsTableBody.innerHTML = '<tr><td colspan="3">Başvurularınızı görmek için lütfen bir aday olarak giriş yapın.</td></tr>';
            return;
        }

        try {
            const response = await fetch(`/api/my-applications?kullanici_ID=${currentUser.id}`);
            const result = await response.json();

            applicationsTableBody.innerHTML = ''; // Tablo içeriğini temizle

            if (result.success && result.data.length > 0) {
                result.data.forEach(app => {
                    const row = document.createElement('tr');
                    
                    let durumText = '';
                    let durumClass = '';
                    if (app.sistem_karari === 'Onaylandı') {
                        durumText = 'UYGUN';
                        durumClass = 'status-suitable';
                    } else if (app.sistem_karari === 'Reddedildi') {
                        durumText = 'UYGUN DEĞİL';
                        durumClass = 'status-not-suitable';
                    } else {
                        durumText = 'BEKLEMEDE';
                        durumClass = 'status-pending';
                    }

                    row.innerHTML = `
                        <td>${app.ilan_adi}</td>
                        <td class="${durumClass}">${durumText}</td>
                        <td>
                            <button class="view-btn" data-ilan-id="${app.ilan_ID}">Görüntüle</button>
                        </td>
                    `;
                    applicationsTableBody.appendChild(row);

                    const viewBtn = row.querySelector('.view-btn');
                    viewBtn.addEventListener('click', () => {
                        console.log(`İlan ID'si ${app.ilan_ID} olan başvurunun detayları görüntüleniyor.`);
                        alert(`İlan ID'si ${app.ilan_ID} olan başvurunun detayları buraya gelecek.`);
                    });
                });
            } else {
                applicationsTableBody.innerHTML = '<tr><td colspan="3">Henüz yaptığınız bir başvuru bulunmamaktadır.</td></tr>';
            }
        } catch (error) {
            console.error('Başvurular çekilirken hata:', error);
            applicationsTableBody.innerHTML = '<tr><td colspan="3">Başvurularınız yüklenirken bir hata oluştu.</td></tr>';
        }
    };


    // ... Diğer tüm fonksiyonların ve değişkenlerin tanımlandığı yer ...

    // ====================================================================
    // | EKSİK OLAN SAYFA GEÇİŞLERİ İÇİN OLAY DİNLEYİCİLERİ              |
    // ====================================================================

    // Kayıt ekranındaki "Giriş Yap" linki
    if (loginHereLink) {
        loginHereLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginRegisterPage);
        });
    }

    // Kullanıcı giriş ekranındaki "Kayıt Ol" linki
if (signupLink) {
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(registerPage);
    });
}

// İşveren giriş ekranındaki "Kayıt Ol" linki
if (signupLinkEmployer) {
    signupLinkEmployer.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(registerPage);
    });
}

// Kullanıcı girişi için "Şifremi Unuttum" linki
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(forgotPasswordPage);
    });
}

// İşveren girişi için "Şifremi Unuttum" linki
if (forgotPasswordLinkEmployer) {
    forgotPasswordLinkEmployer.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(forgotPasswordPage);
    });
}

// Şifremi unuttum sayfasındaki "Geri Dön" linki
if (backToSignInLink) {
    backToSignInLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(loginRegisterPage);
    });
}

    // Uygulama ilk yüklendiğinde başlatma fonksiyonunu çağır
    init();
});