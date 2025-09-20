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

// ====== Global Variables ======
let currentUser = null;
let currentSection = 'dashboard';
let dateFilter = {
    start: null,
    end: null
};
let sidebarClosed = false;

// ====== DOM Elements ======
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const header = document.querySelector('.header');
const adminProfile = document.getElementById('adminProfile');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const profileLogout = document.getElementById('profileLogout');

// Modal Elements
const addCaptainModal = document.getElementById('addCaptainModal');
const addCaptainBtn = document.getElementById('addCaptainBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveCaptainBtn = document.getElementById('saveCaptainBtn');
const addCaptainForm = document.getElementById('addCaptainForm');

// Captain Details Modal
const captainDetailsModal = document.getElementById('captainDetailsModal');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');

// Date Filter Elements
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const filterBtn = document.getElementById('filterBtn');

// ====== Authentication Check ======
auth.onAuthStateChanged((user) => {
    if (user) {
        // Check if user is admin
        checkAdminRole(user);
    } else {
        // Redirect to login
        window.location.href = 'index.html';
    }
});

async function checkAdminRole(user) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            currentUser = { ...user, userData: userDoc.data() };
            initializeAdminDashboard();
        } else {
            alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
            auth.signOut();
        }
    } catch (error) {
        console.error('Error checking admin role:', error);
        alert('حدث خطأ في التحقق من الصلاحيات');
        auth.signOut();
    }
}

// ====== تحديث دالة التهيئة ======
function initializeAdminDashboard() {
    console.log('بدء تهيئة لوحة تحكم الأدمن...');
    loadAdminInfo();
    setupEventListeners();
    setDefaultDateFilter();
    
    // التحقق من وجود القسم الحالي قبل محاولة تحميله
    const currentSectionElement = document.getElementById(`${currentSection}-section`);
    if (currentSectionElement) {
        loadDashboardData();
    } else {
        console.warn(`Section ${currentSection} not found, defaulting to dashboard`);
        navigateToSection('dashboard');
    }
    
    // استعادة حالة القائمة من التخزين المحلي
    const savedSidebarState = localStorage.getItem('sidebarClosed');
    if (savedSidebarState === 'true' && window.innerWidth > 1024) {
        toggleSidebar();
    }
    
    handleResize();
    console.log('تم الانتهاء من تهيئة لوحة التحكم');
}

// ====== Load Admin Info ======
function loadAdminInfo() {
    const adminPhoto = document.getElementById('adminPhoto');
    const adminName = document.getElementById('adminName');

    if (currentUser.userData.photoUrl) {
        adminPhoto.src = currentUser.userData.photoUrl;
    }
    adminName.textContent = currentUser.userData.name || 'أدمن';
}

// ====== Event Listeners ======
function setupEventListeners() {
    // Menu Toggle
    menuBtn.addEventListener('click', toggleSidebar);

    // Admin Profile Dropdown
    adminProfile.addEventListener('click', toggleProfileDropdown);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    profileLogout.addEventListener('click', handleLogout);

    // Sidebar Navigation - 
    sidebar.addEventListener('mouseleave', handleMouseLeave);
    
    // Modal Events
    addCaptainBtn.addEventListener('click', () => showModal(addCaptainModal));
    closeModalBtn.addEventListener('click', () => hideModal(addCaptainModal));
    cancelBtn.addEventListener('click', () => hideModal(addCaptainModal));
    closeDetailsBtn.addEventListener('click', () => hideModal(captainDetailsModal));

    // ربط زر الحفظ بدلاً من الفورم
    saveCaptainBtn.addEventListener('click', handleAddCaptain);

    // Date Filter
    filterBtn.addEventListener('click', applyDateFilter);

    // إغلاق النوافذ المنبثقة عند النقر خارجها
    addCaptainModal.addEventListener('click', (e) => {
        if (e.target === addCaptainModal) hideModal(addCaptainModal);
    });

    captainDetailsModal.addEventListener('click', (e) => {
        if (e.target === captainDetailsModal) hideModal(captainDetailsModal);
    });

    // إغلاق قائمة الملف الشخصي عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!adminProfile.contains(e.target)) {
            hideProfileDropdown();
        }
    });

    // معالج خاص لرابط المشتركين
    const membersLink = document.querySelector('.sidebar-menu a[href="members.html"]');
    if (membersLink) {
        membersLink.addEventListener('click', handleMembersLink);
    }

     // Sidebar Navigation
    setupSidebarNavigation(); // <--- أضف هذا السطر

}

// دالة منفصلة للتعامل مع رابط المشتركين
function handleMembersLink(e) {
    e.preventDefault();
    
    // لا حاجة لإغلاق القائمة هنا، setupSidebarNavigation ستفعل ذلك
    // وتخزن الحالة في localStorage
    
    // الانتقال بعد تأخير بسيط
    setTimeout(() => {
        window.location.href = 'members.html';
    }, 300);
}

// ====== Sidebar Functions ======
function toggleSidebar() {
    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('sidebar-closed');
    header.classList.toggle('sidebar-closed');
    
    // تخزين حالة القائمة في localStorage
    localStorage.setItem('sidebarClosed', sidebar.classList.contains('closed'));
}



// استبدال كامل لدالة setupSidebarNavigation()
function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';

            // إذا كان الرابط يشير إلى صفحة خارجية (مثل members.html)
            if (href && !href.startsWith('#')) {
                e.preventDefault();
                
                // إغلاق القائمة الجانبية أولاً
                if (!sidebar.classList.contains('closed')) {
                    toggleSidebar(); // هذا سيقوم بتحديث localStorage
                } else {
                    // إذا كانت مغلقة بالفعل، تأكد من تحديث localStorage
                    localStorage.setItem('sidebarClosed', 'true');
                }
                
                // الانتقال إلى الصفحة بعد تأخير بسيط للسماح بإغلاق القائمة
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
                return;
            }

            // للروابط الداخلية (التي تبدأ بـ #)
            e.preventDefault();
            
            // إغلاق القائمة الجانبية في جميع أحجام الشاشات
            if (!sidebar.classList.contains('closed')) {
                toggleSidebar(); // هذا سيقوم بتحديث localStorage
            } else {
                // إذا كانت مغلقة بالفعل، تأكد من تحديث localStorage
                localStorage.setItem('sidebarClosed', 'true');
            }

            if (href.startsWith('#') && href.length > 1) {
                const section = href.substring(1);
                setTimeout(() => navigateToSection(section), 120);
            }
        });
    });
}







function navigateToSection(sectionName) {
    // البحث عن رابط القسم في القائمة الجانبية
    const targetLink = document.querySelector(`[href="#${sectionName}"]`);
    
    // إذا لم يتم العثور على الرابط، لا تتابع التنفيذ
    if (!targetLink) {
        console.error(`Cannot find section: ${sectionName}`);
        return;
    }

    // Update active sidebar item
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });

    targetLink.parentElement.classList.add('active');

    // Show target section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Load section-specific data
        loadSectionData(sectionName);
    } else {
        console.error(`Cannot find section element: ${sectionName}-section`);
    }
}

function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'captains':
            loadCaptainsData();
            break;
        case 'members':
            // سيتم تطوير هذه الصفحة لاحقاً
            break;
        default:
            break;
    }
}

// ====== Profile Dropdown ======
function toggleProfileDropdown() {
    profileDropdown.classList.toggle('show');
    adminProfile.classList.toggle('active');
}

function hideProfileDropdown() {
    profileDropdown.classList.remove('show');
    adminProfile.classList.remove('active');
}

// ====== Logout ======
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
}

// ====== Modal Functions ======
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';

    // Reset form if it's add captain modal
    if (modal === addCaptainModal) {
        addCaptainForm.reset();
    }
}

// ====== Date Filter ======
function setDefaultDateFilter() {
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
    dateFilter.start = today;
    dateFilter.end = today;
}

function applyDateFilter() {
    dateFilter.start = startDateInput.value;
    dateFilter.end = endDateInput.value;

    if (!dateFilter.start || !dateFilter.end) {
        alert('يرجى تحديد تاريخ البداية والنهاية');
        return;
    }

    if (new Date(dateFilter.start) > new Date(dateFilter.end)) {
        alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
    }

    loadDashboardData();
}

// ====== Dashboard Data ======
async function loadDashboardData() {
    try {
        showLoadingStats();

        const startDate = new Date(dateFilter.start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        
        // Load statistics
        const stats = await getStatistics(startDate, endDate);
        updateStatistics(stats);
        
        // Load captain performance
        const captainPerformance = await getCaptainPerformance(startDate, endDate);
        updateCaptainPerformance(captainPerformance);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('حدث خطأ في تحميل بيانات لوحة التحكم');
    }
}

function showLoadingStats() {
    const statValues = ['newMembers', 'renewals', 'singleSessions', 'totalRevenue', 'blockedMembers', 'cancelledSubs'];
    statValues.forEach(id => {
        document.getElementById(id).innerHTML = '<div class="loading"></div>';
    });
}

async function getStatistics(startDate, endDate) {
    const stats = {
        newMembers: 0,
        renewals: 0,
        singleSessions: 0,
        totalRevenue: 0,
        blockedMembers: 0,
        cancelledSubs: 0
    };

    try {
        // الحصول على جميع الأعضاء النشطين فقط
        const activeMembersQuery = await db.collection('members')
            .where('status', '==', 'active')
            .get();
        
        const activeMemberIds = new Set();
        activeMembersQuery.forEach(doc => {
            activeMemberIds.add(doc.id);
        });

        // Get payments data - فقط للمشتركين النشطين
        const paymentsQuery = await db.collection('payments')
            .where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('date', '<=', firebase.firestore.Timestamp.fromDate(endDate))
            .get();
        
        paymentsQuery.forEach(doc => {
            const payment = doc.data();
            
            // التحقق من أن العضو لا يزال نشطاً
            if (activeMemberIds.has(payment.memberId)) {
                stats.totalRevenue += payment.amount || 0;
                
                switch (payment.type) {
                    case 'new_subscription':
                        stats.newMembers++;
                        break;
                    case 'renewal':
                        stats.renewals++;
                        break;
                    case 'single_session':
                        stats.singleSessions++;
                        break;
                }
            }
        });
        
        
        // Get blocked members count
        const blockedMembersQuery = await db.collection('members')
            .where('status', '==', 'blocked')
            .get();
        
        stats.blockedMembers = blockedMembersQuery.size;
        
        // Get cancelled subscriptions count
        const cancelledSubsQuery = await db.collection('members')
            .where('status', '==', 'cancelled')
            .get();
        
        stats.cancelledSubs = cancelledSubsQuery.size;
        
    } catch (error) {
        console.error('Error getting statistics:', error);
    }

    return stats;
}


function updateStatistics(stats) {
    document.getElementById('newMembers').textContent = stats.newMembers;
    document.getElementById('renewals').textContent = stats.renewals;
    document.getElementById('singleSessions').textContent = stats.singleSessions;
    document.getElementById('totalRevenue').textContent = `${stats.totalRevenue.toLocaleString()} جنيه`;
    document.getElementById('blockedMembers').textContent = stats.blockedMembers;
    document.getElementById('cancelledSubs').textContent = stats.cancelledSubs;
}

async function getCaptainPerformance(startDate, endDate) {
    const captainPerformance = {};

    try {
        // الحصول على جميع الأعضاء النشطين فقط
        const activeMembersQuery = await db.collection('members')
            .where('status', '==', 'active')
            .get();
        
        const activeMemberIds = new Set();
        activeMembersQuery.forEach(doc => {
            activeMemberIds.add(doc.id);
        });

        // Get all captains
        const captainsQuery = await db.collection('users')
            .where('role', '==', 'captain')
            .get();
        
        // Initialize captain data
        captainsQuery.forEach(doc => {
            const captain = doc.data();
            captainPerformance[doc.id] = {
                name: captain.name,
                newMembers: 0,
                renewals: 0,
                singleSessions: 0,
                cancellations: 0,
                blocks: 0,
                total: 0
            };
        });
        
        // Get payments by captain - فقط للمشتركين النشطين
        const paymentsQuery = await db.collection('payments')
            .where('date', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('date', '<=', firebase.firestore.Timestamp.fromDate(endDate))
            .get();
        
        paymentsQuery.forEach(doc => {
            const payment = doc.data();
            const captainId = payment.by;
            
            // التحقق من أن العضو لا يزال نشطاً
            if (activeMemberIds.has(payment.memberId) && captainPerformance[captainId]) {
                captainPerformance[captainId].total += payment.amount || 0;
                
                switch (payment.type) {
                    case 'new_subscription':
                        captainPerformance[captainId].newMembers++;
                        break;
                    case 'renewal':
                        captainPerformance[captainId].renewals++;
                        break;
                    case 'single_session':
                        captainPerformance[captainId].singleSessions++;
                        break;
                }
            }
            
        });
        
        // Get audit logs for cancellations and blocks
        const auditQuery = await db.collection('audit_logs')
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('timestamp', '<=', firebase.firestore.Timestamp.fromDate(endDate))
            .get();
        
        auditQuery.forEach(doc => {
            const audit = doc.data();
            const captainId = audit.by;
            
            if (captainPerformance[captainId]) {
                switch (audit.action) {
                    case 'cancel':
                        captainPerformance[captainId].cancellations++;
                        break;
                    case 'block':
                        captainPerformance[captainId].blocks++;
                        break;
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting captain performance:', error);
    }

    return captainPerformance;
}

function updateCaptainPerformance(performance) {
    const tableBody = document.getElementById('performanceTableBody');
    tableBody.innerHTML = '';

    if (Object.keys(performance).length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">لا توجد بيانات لعرضها</td>
            </tr>
        `;
        return;
    }

    Object.entries(performance).forEach(([captainId, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.name}</td>
            <td>${data.newMembers}</td>
            <td>${data.renewals}</td>
            <td>${data.singleSessions}</td>
            <td>${data.cancellations}</td>
            <td>${data.blocks}</td>
            <td>${data.total.toLocaleString()} جنيه</td>
            <td>
                <button class="details-btn" onclick="showCaptainDetails('${captainId}')">
                    التفاصيل
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ====== Captain Management ======
async function loadCaptainsData() {
    try {
        const captainsQuery = await db.collection('users')
            .where('role', '==', 'captain')
            .get();

        const captainsGrid = document.getElementById('captainsGrid');
        captainsGrid.innerHTML = '';
        
        if (captainsQuery.empty) {
            captainsGrid.innerHTML = '<p class="no-data">لا يوجد كباتن مسجلين حالياً</p>';
            return;
        }
        
        captainsQuery.forEach(doc => {
            const captain = doc.data();
            const captainCard = createCaptainCard(doc.id, captain);
            captainsGrid.appendChild(captainCard);
        });
        
    } catch (error) {
        console.error('Error loading captains:', error);
        alert('حدث خطأ في تحميل بيانات الكباتن');
    }
}

function createCaptainCard(captainId, captain) {
    const card = document.createElement('div');
    card.className = 'captain-card';

    card.innerHTML = `
        <div class="captain-header">
            <img src="${captain.photoUrl || 'https://via.placeholder.com/60'}" 
                 alt="صورة ${captain.name}" class="captain-avatar">
            <div>
                <div class="captain-name">${captain.name}</div>
                <div class="captain-job">${captain.jobTitle || 'مدرب'}</div>
            </div>
        </div>
        <div class="captain-stats">
            <div class="captain-stat">
                <div class="captain-stat-value" id="captain-${captainId}-members">0</div>
                <div class="captain-stat-label">مشتركين</div>
            </div>
            <div class="captain-stat">
                <div class="captain-stat-value" id="captain-${captainId}-renewals">0</div>
                <div class="captain-stat-label">تجديدات</div>
            </div>
            <div class="captain-stat">
                <div class="captain-stat-value" id="captain-${captainId}-sessions">0</div>
                <div class="captain-stat-label">حصص</div>
            </div>
            <div class="captain-stat">
                <div class="captain-stat-value" id="captain-${captainId}-revenue">0</div>
                <div class="captain-stat-label">الإيرادات</div>
            </div>
        </div>
        <div class="captain-actions">
            <button class="action-btn view-btn" onclick="showCaptainDetails('${captainId}')">
                عرض
            </button>
            <button class="action-btn edit-btn" onclick="editCaptain('${captainId}')">
                تعديل
            </button>
            <button class="action-btn block-btn" onclick="blockCaptain('${captainId}')">
                بلوك
            </button>
        </div>
    `;

    // Load captain stats
    loadCaptainStats(captainId);

    return card;
}

async function loadCaptainStats(captainId) {
    try {
        // Get all-time stats for this captain
        const paymentsQuery = await db.collection('payments')
            .where('by', '==', captainId)
            .get();

        let newMembers = 0;
        let renewals = 0;
        let sessions = 0;
        let revenue = 0;
        
        paymentsQuery.forEach(doc => {
            const payment = doc.data();
            revenue += payment.amount || 0;
            
            switch (payment.type) {
                case 'new_subscription':
                    newMembers++;
                    break;
                case 'renewal':
                    renewals++;
                    break;
                case 'single_session':
                    sessions++;
                    break;
            }
        });
        
        // Update UI
        document.getElementById(`captain-${captainId}-members`).textContent = newMembers;
        document.getElementById(`captain-${captainId}-renewals`).textContent = renewals;
        document.getElementById(`captain-${captainId}-sessions`).textContent = sessions;
        document.getElementById(`captain-${captainId}-revenue`).textContent = `${revenue.toLocaleString()}`;
        
    } catch (error) {
        console.error('Error loading captain stats:', error);
    }
}

// ====== Enhanced Add Captain Function ======
// ====== دالة محدثة لإضافة الكابتن ======
async function handleAddCaptain(e) {
    if (e) e.preventDefault();
    
    const submitBtn = document.getElementById('saveCaptainBtn');
    const originalText = submitBtn.textContent;
    let isProcessing = false;

    // منع التنفيذ المتعدد
    if (isProcessing) {
        showAlert('جاري معالجة طلب سابق، يرجى الانتظار', 'warning');
        return;
    }

    try {
        isProcessing = true;
        
        // عرض حالة التحميل
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> جاري الحفظ...';
        
        // الحصول على بيانات الفورم
        const formData = {
            name: document.getElementById('captainName').value.trim(),
            phone: document.getElementById('captainPhone').value.trim(),
            email: document.getElementById('captainEmail').value.trim().toLowerCase(),
            dob: document.getElementById('captainDob').value,
            jobTitle: document.getElementById('captainJob').value.trim(),
            password: document.getElementById('captainPassword').value,
            photoUrl: document.getElementById('captainPhoto').value.trim() || ""
        };
        
        // التحقق من الحقول المطلوبة
        const validationErrors = validateCaptainForm(formData);
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('\n'));
        }

        // التحقق من عدم تكرار البريد الإلكتروني
        const emailCheck = await checkEmailExists(formData.email);
        if (emailCheck.exists) {
            throw new Error('البريد الإلكتروني مستخدم بالفعل في النظام');
        }

        // حفظ معلومات الأدمن الحالي قبل إنشاء المستخدم الجديد
        const currentAdminUser = auth.currentUser;
        if (!currentAdminUser) {
            throw new Error('انتهت جلسة التسجيل، يرجى إعادة تسجيل الدخول');
        }

        console.log('بدء إنشاء حساب الكابتن...');
        
        // إنشاء مستخدم Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
        const newCaptainUser = userCredential.user;
        
        console.log('تم إنشاء المستخدم في Authentication:', newCaptainUser.uid);
        
        try {
            // إعادة تسجيل الدخول للأدمن فوراً
            await auth.updateCurrentUser(currentAdminUser);
            console.log('تم استعادة جلسة الأدمن');
            
            // إعداد بيانات الكابتن للحفظ في Firestore
            const captainData = {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                photoURL: formData.photoUrl, // تأكد من استخدام photoURL وليس photoUrl
                role: 'captain',
                status: 'active',
                uid: newCaptainUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentAdminUser.uid,
                createdByName: currentUser?.userData?.name || 'Admin',
                approved: true,
                blocked: false,
                // الحقول الإضافية
                dob: formData.dob || null,
                jobTitle: formData.jobTitle || 'مدرب'
            };
            
            console.log('بيانات الكابتن:', captainData);
            
            // حفظ البيانات في Firestore باستخدام UID كمعرف للمستند
            await db.collection('users').doc(newCaptainUser.uid).set(captainData);
            
            console.log('تم حفظ بيانات الكابتن في Firestore بنجاح');
            
            // تسجيل العملية في سجل الأنشطة (اختياري)
            try {
                await db.collection('audit_logs').add({
                    action: 'create_captain',
                    targetUserId: newCaptainUser.uid,
                    targetUserName: formData.name,
                    by: currentAdminUser.uid,
                    byName: currentUser?.userData?.name || 'Admin',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    details: {
                        email: formData.email,
                        phone: formData.phone
                    }
                });
            } catch (auditError) {
                console.warn('فشل في تسجيل العملية:', auditError);
            }
            
            // عرض رسالة نجاح
            showAlert(`تم إنشاء حساب الكابتن ${formData.name} بنجاح`, 'success');
            
            // إغلاق النافذة المنبثقة وإعادة تعيين الفورم
            setTimeout(() => {
                hideModal(addCaptainModal);
                addCaptainForm.reset();
                
                // تحديث البيانات إذا كنا في صفحة الكباتن
                if (currentSection === 'captains') {
                    loadCaptainsData();
                }
            }, 1500);
            
        } catch (firestoreError) {
            console.error('خطأ في حفظ البيانات في Firestore:', firestoreError);
            
            // إذا فشل الحفظ في Firestore، احذف المستخدم من Authentication
            try {
                // تسجيل الدخول مؤقتاً للمستخدم الجديد لحذفه
                await auth.signInWithEmailAndPassword(formData.email, formData.password);
                await auth.currentUser.delete();
                // إعادة تسجيل الدخول للأدمن
                await auth.updateCurrentUser(currentAdminUser);
                console.log('تم حذف المستخدم من Authentication بسبب فشل Firestore');
            } catch (deleteError) {
                console.error('فشل في حذف المستخدم من Authentication:', deleteError);
            }
            
            throw new Error(`فشل في حفظ بيانات الكابتن: ${getErrorMessage(firestoreError)}`);
        }
        
    } catch (error) {
        console.error('خطأ في إنشاء الكابتن:', error);
        const errorMessage = getErrorMessage(error);
        showAlert(errorMessage, 'error');
        
    } finally {
        // إعادة تعيين الزر
        isProcessing = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

// ====== دالة محسنة للتحقق من البريد الإلكتروني ======
async function checkEmailExists(email) {
    try {
        // التحقق من Firestore
        const userQuery = await db.collection('users')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        
        if (!userQuery.empty) {
            return { exists: true, source: 'firestore' };
        }
        
        // التحقق من Firebase Auth
        try {
            const methods = await auth.fetchSignInMethodsForEmail(email);
            if (methods.length > 0) {
                return { exists: true, source: 'auth' };
            }
        } catch (authError) {
            console.log('Auth check failed, continuing with Firestore check only');
        }
        
        return { exists: false };
        
    } catch (error) {
        console.error('Error checking email exists:', error);
        throw new Error('خطأ في فحص البريد الإلكتروني');
    }
}

// ====== دالة محسنة لمعالجة الأخطاء ======
function getErrorMessage(error) {
    console.log('Error details:', error);
    
    if (typeof error === 'string') {
        return error;
    }
    
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'البريد الإلكتروني مستخدم بالفعل';
            case 'auth/weak-password':
                return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
            case 'auth/invalid-email':
                return 'البريد الإلكتروني غير صحيح';
            case 'auth/network-request-failed':
                return 'خطأ في الشبكة، تحقق من الاتصال';
            case 'permission-denied':
                return 'ليس لديك صلاحية لتنفيذ هذه العملية. تحقق من قواعد Firestore';
            case 'unavailable':
                return 'الخدمة غير متاحة حالياً';
            case 'unauthenticated':
                return 'يجب تسجيل الدخول أولاً';
            default:
                return error.message || 'حدث خطأ غير متوقع';
        }
    }
    
    return error.message || 'حدث خطأ غير متوقع';
}

// ====== دالة للتحقق من قواعد Firestore ======
async function testFirestoreWritePermission() {
    try {
        const testDoc = db.collection('test').doc('write_test');
        await testDoc.set({
            test: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // حذف المستند التجريبي
        await testDoc.delete();
        
        console.log('Write permission test passed');
        return true;
        
    } catch (error) {
        console.error('Write permission test failed:', error);
        return false;
    }
}

// ====== اختبار الصلاحيات عند تحميل الصفحة ======
document.addEventListener('DOMContentLoaded', async function() {
    // اختبار صلاحيات الكتابة في Firestore
    const hasWritePermission = await testFirestoreWritePermission();
    if (!hasWritePermission) {
        console.warn('تحذير: لا توجد صلاحية كتابة في Firestore');
        showAlert('تحذير: قد تواجه مشاكل في حفظ البيانات. تحقق من قواعد Firestore', 'warning');
    }
});

// ====== دالة مساعدة لحفظ بيانات الكابتن في Firestore ======
async function saveCaptainToFirestore(uid, captainData) {
    try {
        console.log('محاولة حفظ بيانات الكابتن في Firestore:', uid);
        
        // التأكد من أن الاتصال يعمل
        const isConnected = await testFirestoreConnection();
        if (!isConnected) {
            throw new Error('لا يوجد اتصال بقاعدة البيانات');
        }
        
        // المحاولة الأولى: استخدام set مع UID المحدد
        await db.collection('users').doc(uid).set(captainData);
        
        console.log('تم حفظ البيانات بنجاح باستخدام set مع UID');
        return { success: true };
        
    } catch (error) {
        console.error('خطأ في حفظ البيانات في Firestore:', error);
        
        // المحاولة الثانية: استخدام add مع معرف مستند عشوائي
        try {
            console.log('المحاولة الثانية: استخدام add مع معرف عشوائي');
            
            // إزالة الحقل uid إذا كان موجوداً لأن add سيولد معرفاً تلقائياً
            const { uid: _, ...dataWithoutUid } = captainData;
            await db.collection('users').add(dataWithoutUid);
            
            console.log('تم حفظ البيانات بنجاح باستخدام add');
            return { success: true };
            
        } catch (secondError) {
            console.error('خطأ ثانٍ في حفظ البيانات في Firestore:', secondError);
            
            return { 
                success: false, 
                error: getFirestoreErrorMessage(secondError) 
            };
        }
    }
}
// ====== دالة لمعالجة أخطاء Firestore ======
function getFirestoreErrorMessage(error) {
    if (error.code === 'permission-denied') {
        return 'ليس لديك صلاحية الكتابة في قاعدة البيانات. يرجى التواصل مع المسؤول.';
    } else if (error.code === 'not-found') {
        return 'المجموعة غير موجودة. يرجى التأكد من إعداد قاعدة البيانات بشكل صحيح.';
    } else {
        return `خطأ في قاعدة البيانات: ${error.message}`;
    }
}

// ====== دالة للحصول على رسالة الخطأ المناسبة ======
function getErrorMessage(error) {
    console.log('كود الخطأ:', error.code);
    
    if (error.code === 'permission-denied' || error.message.includes('insufficient permissions')) {
        return 'ليس لديك الصلاحية لإنشاء كابتن. يرجى التواصل مع المسؤول.';
    } else if (error.code === 'auth/email-already-in-use') {
        return 'البريد الإلكتروني مستخدم بالفعل في النظام';
    } else if (error.code === 'auth/weak-password') {
        return 'كلمة المرور ضعيفة جداً. يرجى استخدام كلمة مرور أقوى';
    } else if (error.code === 'auth/invalid-email') {
        return 'البريد الإلكتروني غير صحيح';
    } else if (error.message) {
        return error.message;
    } else {
        return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    }
}

// ====== دالة للتحقق من البريد الإلكتروني في Authentication ======
async function checkEmailInAuth(email) {
    try {
        // محاولة تسجيل الدخول بالبريد الإلكتروني (للتأكد من وجوده)
        const methods = await auth.fetchSignInMethodsForEmail(email);
        return { exists: methods.length > 0 };
    } catch (error) {
        console.error('Error checking email in auth:', error);
        return { exists: false, error: error.message };
    }
}

// ====== دالة للتحقق من صحة نموذج الكابتن ======
function validateCaptainForm(formData) {
    const errors = [];
    
    if (!formData.name || formData.name.length < 2) {
        errors.push('الاسم يجب أن يكون على الأقل حرفين');
    }
    
    if (!formData.phone || formData.phone.length < 10) {
        errors.push('رقم الهاتف يجب أن يكون على الأقل 10 أرقام');
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.push('البريد الإلكتروني غير صحيح');
    }
    
    if (!formData.password || formData.password.length < 6) {
        errors.push('كلمة المرور يجب أن تكون على الأقل 6 أحرف');
    }
    
    return errors;
}

// ====== دالة لاختبار اتصال Firestore ======
async function testFirestoreConnection() {
    try {
        // محاولة قراءة وثيقة بسيطة لاختبار الاتصال
        const testDoc = await db.collection('test').doc('connection').get();
        console.log('اتصال Firestore يعمل بشكل صحيح');
        return true;
    } catch (error) {
        console.error('فشل اتصال Firestore:', error);
        
        // محاولة إنشاء وثيقة اختبار إذا فشلت القراءة
        try {
            await db.collection('test').doc('connection').set({
                test: true,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('تم إنشاء وثيقة الاختبار بنجاح');
            return true;
        } catch (writeError) {
            console.error('فشل إنشاء وثيقة الاختبار:', writeError);
            return false;
        }
    }
}

// ====== دالة لإنشاء وثيقة اختبارية ======
async function createTestDocument() {
    try {
        const testData = {
            test: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('test').doc('connection').set(testData);
        console.log('تم إنشاء وثيقة الاختبار بنجاح');
        return true;
    } catch (error) {
        console.error('فشل إنشاء وثيقة الاختبار:', error);
        return false;
    }
}

// تشغيل اختبار الاتصال عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    const isConnected = await testFirestoreConnection();
    if (!isConnected) {
        console.warn('تحذير: هناك مشكلة في اتصال Firestore');
        // يمكنك إضافة رسالة تنبيه للمستخدم هنا إذا لزم الأمر
    }
});


// ====== Enhanced Validation Functions ======
function validateCaptainForm(formData) {
    const errors = [];
    
    if (!formData.name) {
        errors.push('اسم الكابتن مطلوب');
    } else if (formData.name.length < 2) {
        errors.push('اسم الكابتن يجب أن يحتوي على حرفين على الأقل');
    }
    
    if (!formData.phone) {
        errors.push('رقم الهاتف مطلوب');
    } else if (!isValidPhone(formData.phone)) {
        errors.push('رقم الهاتف غير صحيح');
    }
    
    if (!formData.email) {
        errors.push('البريد الإلكتروني مطلوب');
    } else if (!isValidEmail(formData.email)) {
        errors.push('البريد الإلكتروني غير صحيح');
    }
    
    if (!formData.password) {
        errors.push('كلمة المرور مطلوبة');
    } else if (formData.password.length < 6) {
        errors.push('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
    }
    
    if (!formData.jobTitle) {
        errors.push('الوظيفة مطلوبة');
    }
    
    if (!formData.dob) {
        errors.push('تاريخ الميلاد مطلوب');
    } else if (new Date(formData.dob) >= new Date()) {
        errors.push('تاريخ الميلاد غير صحيح');
    }
    
    return errors;
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

function isValidPhone(phone) {
    // تحقق من أن الرقم يحتوي على أرقام فقط ويتراوح بين 10-15 رقم
    const re = /^[\d\+\-\(\)\s]{10,15}$/;
    return re.test(phone);
}

// ====== Check Email/Phone Exists Functions ======
// ====== Enhanced Check Email/Phone Functions ======
async function checkEmailExists(email) {
    try {
        const userQuery = await db.collection('users')
            .where('email', '==', email.toLowerCase())
            .get();
        
        return { 
            exists: !userQuery.empty,
            error: false
        };
    } catch (error) {
        console.error('Error checking email exists:', error);
        return { 
            exists: false, 
            error: true,
            message: 'خطأ في فحص البريد الإلكتروني'
        };
    }
}

async function checkPhoneExists(phone) {
    try {
        const userQuery = await db.collection('users')
            .where('phone', '==', phone)
            .get();
        
        return { 
            exists: !userQuery.empty,
            error: false
        };
    } catch (error) {
        console.error('Error checking phone exists:', error);
        return { 
            exists: false, 
            error: true,
            message: 'خطأ في فحص رقم الهاتف'
        };
    }
}

// ====== Enhanced Error Handling ======
function getErrorMessage(error) {
    console.log('Error details:', error);
    
    // إذا كان الخطأ عبارة عن نص بسيط، أرجعه كما هو
    if (typeof error === 'string') {
        return error;
    }
    
    // إذا كان للخطأ خاصية message فقط
    if (error.message && !error.code) {
        return error.message;
    }
    
    // معالجة أخطاء Firebase Auth
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'البريد الإلكتروني مستخدم بالفعل في النظام';
            case 'auth/weak-password':
                return 'كلمة المرور ضعيفة جداً (يجب أن تحتوي على 6 أحرف على الأقل)';
            case 'auth/invalid-email':
                return 'البريد الإلكتروني غير صحيح';
            case 'auth/network-request-failed':
                return 'خطأ في الشبكة، يرجى التحقق من اتصال الإنترنت';
            case 'auth/too-many-requests':
                return 'تم إرسال طلبات كثيرة، يرجى المحاولة لاحقاً';
            case 'permission-denied':
                return 'ليس لديك صلاحية لتنفيذ هذه العملية';
            case 'unavailable':
                return 'الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً';
            case 'cancelled':
                return 'تم إلغاء العملية';
            case 'deadline-exceeded':
                return 'انتهت مهلة الانتظار، يرجى المحاولة مرة أخرى';
            case 'resource-exhausted':
                return 'تم تجاوز حد الاستخدام المسموح';
            default:
                return error.message || 'حدث خطأ غير متوقع';
        }
    }
    
    return error.message || 'حدث خطأ غير متوقع';
}

// ====== Enhanced Alert Function ======
function showAlert(message, type = 'info') {
    // إزالة التنبيهات السابقة
    document.querySelectorAll('.alert').forEach(alert => {
        if (alert.parentElement && alert.parentElement.classList.contains('main-content')) {
            alert.remove();
        }
    });
    
    // إنشاء عنصر التنبيه
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const iconName = type === 'success' ? 'checkmark-circle-outline' : 
                     type === 'error' ? 'alert-circle-outline' : 
                     type === 'warning' ? 'warning-outline' : 'information-circle-outline';
    
    alert.innerHTML = `
        <ion-icon name="${iconName}"></ion-icon>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;

    // إضافة للصفحة
    const container = document.querySelector('.main-content');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        // إضافة تأثير الظهور
        alert.style.opacity = '0';
        alert.style.transform = 'translateY(-20px)';
        
        requestAnimationFrame(() => {
            alert.style.transition = 'all 0.3s ease';
            alert.style.opacity = '1';
            alert.style.transform = 'translateY(0)';
        });
        
        // إزالة تلقائية بعد 7 ثواني للرسائل غير الخطأ
        if (type !== 'error') {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (alert.parentElement) {
                            alert.remove();
                        }
                    }, 300);
                }
            }, 7000);
        }
    }
}

// ====== Captain Actions ======
function showCaptainDetails(captainId) {
    // Implementation for showing captain details
    showAlert('سيتم تطوير صفحة تفاصيل الكابتن قريباً', 'info');
}

function editCaptain(captainId) {
    // Implementation for editing captain
    showAlert('سيتم تطوير صفحة تعديل بيانات الكابتن قريباً', 'info');
}

async function blockCaptain(captainId) {
    if (confirm('هل أنت متأكد من بلوك هذا الكابتن؟')) {
        try {
            // Get captain data first
            const captainDoc = await db.collection('users').doc(captainId).get();
            if (!captainDoc.exists) {
                throw new Error('الكابتن غير موجود');
            }
            
            const captainData = captainDoc.data();
            
            // Update captain status
            await db.collection('users').doc(captainId).update({
                blocked: true,
                blockedAt: firebase.firestore.FieldValue.serverTimestamp(),
                blockedBy: currentUser.uid,
                blockedByName: currentUser.userData.name
            });
            
            // Log the action
            await db.collection('audit_logs').add({
                action: 'block_captain',
                targetUserId: captainId,
                targetUserName: captainData.name,
                by: currentUser.uid,
                byName: currentUser.userData.name,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: {
                    reason: 'Admin action'
                }
            });
            
            showAlert(`تم بلوك الكابتن ${captainData.name} بنجاح`, 'success');
            
            // Refresh captains list
            if (currentSection === 'captains') {
                await loadCaptainsData();
            }
            
        } catch (error) {
            console.error('Error blocking captain:', error);
            showAlert('حدث خطأ في بلوك الكابتن', 'error');
        }
    }
}

// ====== Utility Functions ======
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return `${amount.toLocaleString('ar-EG')} جنيه`;
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ====== Mobile Responsive ======
function handleResize() {
    if (window.innerWidth <= 1024) {
        // في الشاشات الصغيرة، تأكد من أن القائمة مغلقة افتراضياً
        sidebar.classList.add('closed');
        mainContent.classList.add('sidebar-closed');
        header.classList.add('sidebar-closed');
    } else {
        // في الشاشات الكبيرة، أزل كلاس closed إذا لم يتم حفظه في localStorage
        const savedSidebarState = localStorage.getItem('sidebarClosed');
        if (savedSidebarState !== 'true') {
            sidebar.classList.remove('closed');
            mainContent.classList.remove('sidebar-closed');
            header.classList.remove('sidebar-closed');
        }
    }
}

// دالة منفصلة للتعامل مع خروج الماوس
function handleMouseLeave() {
    // تم إلغاء هذه الوظيفة لتحسين تجربة المستخدم
    // if (window.innerWidth > 1024 && !sidebar.classList.contains('closed')) {
    //     toggleSidebar();
    // }
}

// ====== Performance Optimization ======
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تحسين أداء تغيير حجم النافذة
const debouncedResize = debounce(handleResize, 250);
window.addEventListener('resize', debouncedResize);

// ====== Initialize on Load ======
document.addEventListener('DOMContentLoaded', () => {
    // Handle responsive design
    handleResize();
    window.addEventListener('resize', debouncedResize);

    // Set up keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modals
        if (e.key === 'Escape') {
            hideModal(addCaptainModal);
            hideModal(captainDetailsModal);
            hideProfileDropdown();
        }
        
        // Ctrl+N to add new captain (when on captains page)
        if (e.ctrlKey && e.key === 'n' && currentSection === 'captains') {
            e.preventDefault();
            showModal(addCaptainModal);
        }
        
        // Ctrl+R to refresh current section
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            loadSectionData(currentSection);
        }
    });
    
    // إضافة مؤشر التحميل العام
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'global-loading';
    loadingIndicator.className = 'global-loading hidden';
    loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>جاري التحميل...</p>
    `;
    document.body.appendChild(loadingIndicator);
});

// ====== Global Loading Functions ======
function showGlobalLoading(message = 'جاري التحميل...') {
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.querySelector('p').textContent = message;
        loadingEl.classList.remove('hidden');
    }
}

function hideGlobalLoading() {
    const loadingEl = document.getElementById('global-loading');
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
}

// ====== Error Handling ======
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    hideGlobalLoading();
    showAlert('حدث خطأ في التطبيق، يرجى إعادة تحميل الصفحة', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    hideGlobalLoading();
    showAlert('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى', 'error');
    e.preventDefault();
});

// ====== Network Status ======
window.addEventListener('online', () => {
    showAlert('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', () => {
    showAlert('انقطع الاتصال بالإنترنت، يرجى التحقق من الشبكة', 'warning');
});

// ====== Performance Monitoring ======
let performanceStart = Date.now();

window.addEventListener('load', () => {
    const loadTime = Date.now() - performanceStart;
    console.log(`Page loaded in ${loadTime}ms`);
    
    // إخفاء مؤشر التحميل العام عند اكتمال التحميل
    hideGlobalLoading();
});

// ====== Data Refresh Functions ======
async function refreshCurrentSection() {
    showGlobalLoading(`جاري تحديث ${getSectionName(currentSection)}...`);
    try {
        await loadSectionData(currentSection);
        showAlert('تم تحديث البيانات بنجاح', 'success');
    } catch (error) {
        console.error('Error refreshing section:', error);
        showAlert('حدث خطأ في تحديث البيانات', 'error');
    } finally {
        hideGlobalLoading();
    }
}

function getSectionName(section) {
    const names = {
        'dashboard': 'لوحة التحكم',
        'captains': 'الكباتن',
        'members': 'المشتركين',
        'reports': 'التقارير',
        'permissions': 'الصلاحيات',
        'settings': 'الإعدادات'
    };
    return names[section] || 'البيانات';
}

// ====== Export functions for global access ======
window.showCaptainDetails = showCaptainDetails;
window.editCaptain = editCaptain;
window.blockCaptain = blockCaptain;
window.refreshCurrentSection = refreshCurrentSection;
window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;
