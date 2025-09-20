// ====== تهيئة Firebase ======
const firebaseConfig = {
    apiKey: "AIzaSyD0gTA8MKZI5Hlf2c4s1bstDChrUPRVJBg",
    authDomain: "bahr-fleet.firebaseapp.com",
    projectId: "bahr-fleet",
    storageBucket: "bahr-fleet.appspot.com",
    messagingSenderId: "179523931838",
    appId: "1:179523931838:web:d6ff79669fe042ee3618ef",
    measurementId: "G-RL5Q1KSQS0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ====== إنشاء فقاعات متحركة ======
document.addEventListener('DOMContentLoaded', function() {
    const bubblesContainer = document.getElementById('bubbles');
    const bubbleCount = 15;
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        const size = Math.random() * 90 + 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDelay = `${Math.random() * 10}s`;
        
        bubblesContainer.appendChild(bubble);
    }
    
    // إضافة تأثير عند تحميل النموذج
    const formContainer = document.querySelector('.form-container');
    formContainer.style.transform = 'scale(0.9)';
    setTimeout(() => {
        formContainer.style.transform = 'scale(1)';
        formContainer.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.3)';
    }, 100);
});

// ====== دوال مساعدة ======
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.inputbox').forEach(el => {
        el.classList.remove('error');
    });
    document.getElementById('loginAlert').style.display = 'none';
}

function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function isValidPassword(password) { 
    return password && password.length >= 6; 
}

function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field && errorElement) {
        field.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field && errorElement) {
        field.classList.remove('error');
        errorElement.style.display = 'none';
    }
}

function showAlert(alertId, message, type) {
    const alert = document.getElementById(alertId);
    if (!alert) return;
    alert.textContent = message;
    alert.className = 'alert';
    alert.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
    const icon = document.createElement('ion-icon');
    icon.name = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';
    alert.prepend(icon);
    alert.style.display = 'flex';
    setTimeout(() => { alert.style.display = 'none'; }, 5000);
}

// ====== تحقق فوري عند الخروج من الحقول ======
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', function() {
        const id = this.id;
        const value = this.value;
        
        if (id === 'loginEmail') {
            if (value && !isValidEmail(value)) {
                showError(id, 'البريد الإلكتروني غير صحيح');
            } else {
                hideError(id);
            }
        }
        
        if (id === 'loginPassword') {
            if (value && !isValidPassword(value)) {
                showError(id, 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
            } else {
                hideError(id);
            }
        }
    });
});

// ====== تسجيل الدخول ======
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // التحقق من صحة البيانات
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        let isValid = true;
        clearErrors();
        
        if (!email) { 
            showError('loginEmail', 'البريد الإلكتروني مطلوب'); 
            isValid = false; 
        } else if (!isValidEmail(email)) { 
            showError('loginEmail', 'البريد الإلكتروني غير صحيح'); 
            isValid = false; 
        }
        
        if (!password) { 
            showError('loginPassword', 'كلمة المرور مطلوبة'); 
            isValid = false; 
        } else if (!isValidPassword(password)) { 
            showError('loginPassword', 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل'); 
            isValid = false; 
        }
        
        if (!isValid) return;
        
        const loginButton = document.getElementById('loginButton');
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="loading"></span> جاري تسجيل الدخول...';
        
        // محاولة تسجيل الدخول
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // الحصول على بيانات المستخدم من Firestore
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            
                            // عرض رسالة نجاح
                            showAlert('loginAlert', `مرحباً بعودتك، ${userData.name}!`, 'success');
                            // في دالة تسجيل الدخول، إضافة هذا السطر بعد نجاح التسجيل
window.currentAdminPassword = password;
                            // توجيه المستخدم حسب نوع حسابه
                            setTimeout(() => {
                                switch(userData.role) {
                                    case 'admin':
                                        window.location.href = 'admin-dashboard.html';
                                        break;
                                    case 'captain':
                                        window.location.href = 'captain-dashboard.html';
                                        break;
                                    case 'trainee':
                                        window.location.href = 'trainee-dashboard.html';
                                        break;
                                    default:
                                        window.location.href = 'dashboard.html';
                                }
                            }, 1500);
                        } else {
                            // إذا لم توجد بيانات المستخدم
                            showAlert('loginAlert', 'بيانات المستخدم غير موجودة', 'error');
                            loginButton.disabled = false;
                            loginButton.textContent = 'تسجيل الدخول';
                        }
                    })
                    .catch((error) => {
                        showAlert('loginAlert', 'حدث خطأ في جلب بيانات المستخدم', 'error');
                        console.error("Error getting user document:", error);
                        loginButton.disabled = false;
                        loginButton.textContent = 'تسجيل الدخول';
                    });
            })
            .catch((error) => {
                // معالجة الأخطار
                let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
                
                switch(error.code) {
                    case 'auth/invalid-email':
                        errorMessage = 'البريد الإلكتروني غير صحيح';
                        showError('loginEmail', errorMessage);
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'هذا الحساب معطل';
                        break;
                    case 'auth/user-not-found':
                        errorMessage = 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
                        showError('loginEmail', errorMessage);
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'كلمة المرور غير صحيحة';
                        showError('loginPassword', errorMessage);
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'خطأ في الشبكة، يرجى التحقق من اتصال الإنترنت';
                        break;
                    default:
                        errorMessage = error.message || 'حدث خطأ غير متوقع';
                }
                
                showAlert('loginAlert', errorMessage, 'error');
                loginButton.disabled = false;
                loginButton.textContent = 'تسجيل الدخول';
            });
    });
}

// ====== نسيان كلمة المرور ======
const forgotEl = document.getElementById('forgotPassword');
if (forgotEl) {
    forgotEl.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('يرجى إدخال بريدك الإلكتروني لإعادة تعيين كلمة المرور:');
        if (email) {
            if (!isValidEmail(email)) {
                alert('البريد الإلكتروني غير صحيح');
                return;
            }
            
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
                })
                .catch((error) => {
                    alert('حدث خطأ: ' + error.message);
                });
        }
    });
}