// أضف هذا في بداية الملف
document.addEventListener('DOMContentLoaded', function() {
    // كل الكود هنا سيتم تنفيذه بعد تحميل الـ DOM
    initializeFirebase();
});



// Firebase Configuration
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

// Global Variables
let currentUser = null;
let membersData = [];
let filteredMembers = [];
let currentPage = 1;
const itemsPerPage = 10;

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const header = document.querySelector('.header');
const adminProfile = document.getElementById('adminProfile');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const profileLogout = document.getElementById('profileLogout');

// Members Elements
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const subscriptionFilter = document.getElementById('subscriptionFilter');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const membersTableBody = document.getElementById('membersTableBody');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const addMemberBtn = document.getElementById('addMemberBtn');

// Modal Elements
const addMemberModal = document.getElementById('addMemberModal');
const closeMemberModalBtn = document.getElementById('closeMemberModalBtn');
const cancelMemberBtn = document.getElementById('cancelMemberBtn');
const saveMemberBtn = document.getElementById('saveMemberBtn');
const addMemberForm = document.getElementById('addMemberForm');
const memberDetailsModal = document.getElementById('memberDetailsModal');
const memberDetailsBody = document.getElementById('memberDetailsBody');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');

// Renew Modal Elements
const renewModal = document.getElementById('renewModal');
const closeRenewModalBtn = document.getElementById('closeRenewModalBtn');
const cancelRenewBtn = document.getElementById('cancelRenewBtn');
const saveRenewBtn = document.getElementById('saveRenewBtn'); // تأكد من وجود هذا
const renewForm = document.getElementById('renewForm');

// Authentication Check
auth.onAuthStateChanged((user) => {
    if (user) {
        checkAdminRole(user);
    } else {
        window.location.href = 'index.html';
    }
});

async function checkAdminRole(user) {
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      // User document doesn't exist in 'users' collection
      console.error('User document not found in Firestore');
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة - المستخدم غير مسجل في النظام');
      await auth.signOut();
      window.location.href = 'index.html';
      return;
    }
    
    const userData = userDoc.data();
    
    if (userData.role === 'admin' || userData.role === 'captain') {
      currentUser = { ...user, userData: userData };
      initializePage();
    } else {
      alert('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      auth.signOut();
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    alert('حدث خطأ في التحقق من الصلاحيات: ' + error.message);
    auth.signOut();
  }
}

// Initialize Page
    function initializePage() {
        loadAdminInfo();
        setupEventListeners();
        loadMembersData();
        handleResize();
        initializeDefaultDates();
        restoreSidebarState();
        setupRenewFormCalculations();
        updateMenuIconState(); // <--- أضف هذا السطر لضبط الأيقونة عند التحميل
    }


    function updateMenuIconState() {
        const menuIcon = menuBtn.querySelector('ion-icon');
        if (sidebar.classList.contains('closed')) {
            menuIcon.setAttribute('name', 'menu-outline');
        } else {
            menuIcon.setAttribute('name', 'close-outline');
        }
    }

function loadAdminInfo() {
    const adminPhoto = document.getElementById('adminPhoto');
    const adminName = document.getElementById('adminName');

    if (currentUser.userData.photoUrl) {
        adminPhoto.src = currentUser.userData.photoUrl;
    }
    adminName.textContent = currentUser.userData.name || 'مستخدم';
}

// Event Listeners Setup
function setupEventListeners() {
    // تحقق من وجود العناصر قبل إضافة Event Listeners
    const elements = {
        menuBtn: document.getElementById('menuBtn'),
        adminProfile: document.getElementById('adminProfile'),
        logoutBtn: document.getElementById('logoutBtn'),
        profileLogout: document.getElementById('profileLogout'),
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        subscriptionFilter: document.getElementById('subscriptionFilter'),
        applyFiltersBtn: document.getElementById('applyFiltersBtn'),
        prevPageBtn: document.getElementById('prevPage'),
        nextPageBtn: document.getElementById('nextPage'),
        addMemberBtn: document.getElementById('addMemberBtn'),
        closeMemberModalBtn: document.getElementById('closeMemberModalBtn'),
        cancelMemberBtn: document.getElementById('cancelMemberBtn'),
        saveMemberBtn: document.getElementById('saveMemberBtn'),
        closeDetailsBtn: document.getElementById('closeDetailsBtn'),
        closeRenewModalBtn: document.getElementById('closeRenewModalBtn'),
        cancelRenewBtn: document.getElementById('cancelRenewBtn'),
        saveRenewBtn: document.getElementById('saveRenewBtn'), // تمت الإضافة
        renewForm: document.getElementById('renewForm'),
        renewDurationMethod: document.getElementById('renewDurationMethod'),
        renewStartDate: document.getElementById('renewStartDate'),
        renewDays: document.getElementById('renewDays'),
        renewManualStartDate: document.getElementById('renewManualStartDate'),
        renewManualEndDate: document.getElementById('renewManualEndDate'),
        addMemberModal: document.getElementById('addMemberModal'),
        memberDetailsModal: document.getElementById('memberDetailsModal'),
        renewModal: document.getElementById('renewModal')
    };

    // Menu and Navigation
    if (elements.menuBtn) {
        elements.menuBtn.addEventListener('click', toggleSidebar);
    } else {
        console.error('Element not found: menuBtn');
    }

    if (elements.adminProfile) {
        elements.adminProfile.addEventListener('click', toggleProfileDropdown);
    } else {
        console.error('Element not found: adminProfile');
    }

    // Logout handlers
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    } else {
        console.error('Element not found: logoutBtn');
    }

    if (elements.profileLogout) {
        elements.profileLogout.addEventListener('click', handleLogout);
    } else {
        console.error('Element not found: profileLogout');
    }

    // Search and filters
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', applyFilters);
    } else {
        console.error('Element not found: searchInput');
    }

    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', applyFilters);
    } else {
        console.error('Element not found: statusFilter');
    }

    if (elements.subscriptionFilter) {
        elements.subscriptionFilter.addEventListener('change', applyFilters);
    } else {
        console.error('Element not found: subscriptionFilter');
    }

    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', applyFilters);
    } else {
        console.error('Element not found: applyFiltersBtn');
    }

    // Pagination
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', goToPrevPage);
    } else {
        console.error('Element not found: prevPageBtn');
    }

    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', goToNextPage);
    } else {
        console.error('Element not found: nextPageBtn');
    }

    // Modals
    if (elements.addMemberBtn) {
        elements.addMemberBtn.addEventListener('click', () => showModal(elements.addMemberModal));
    } else {
        console.error('Element not found: addMemberBtn');
    }

    if (elements.closeMemberModalBtn) {
        elements.closeMemberModalBtn.addEventListener('click', () => hideModal(elements.addMemberModal));
    } else {
        console.error('Element not found: closeMemberModalBtn');
    }

    if (elements.cancelMemberBtn) {
        elements.cancelMemberBtn.addEventListener('click', () => hideModal(elements.addMemberModal));
    } else {
        console.error('Element not found: cancelMemberBtn');
    }

    if (elements.closeDetailsBtn) {
        elements.closeDetailsBtn.addEventListener('click', () => hideModal(elements.memberDetailsModal));
    } else {
        console.error('Element not found: closeDetailsBtn');
    }

    if (elements.saveMemberBtn) {
        elements.saveMemberBtn.addEventListener('click', handleAddMember);
    } else {
        console.error('Element not found: saveMemberBtn');
    }

    // Renew Modal - إزالة التكرارات
    if (elements.closeRenewModalBtn) {
        elements.closeRenewModalBtn.addEventListener('click', () => hideModal(elements.renewModal));
    } else {
        console.error('Element not found: closeRenewModalBtn');
    }

    if (elements.cancelRenewBtn) {
        elements.cancelRenewBtn.addEventListener('click', () => hideModal(elements.renewModal));
    } else {
        console.error('Element not found: cancelRenewBtn');
    }

    // Renew form calculations
    if (elements.renewDurationMethod) {
        elements.renewDurationMethod.addEventListener('change', toggleRenewDurationFields);
    } else {
        console.error('Element not found: renewDurationMethod');
    }

    if (elements.renewStartDate) {
        elements.renewStartDate.addEventListener('change', calculateRenewEndDate);
    } else {
        console.error('Element not found: renewStartDate');
    }

    if (elements.renewDays) {
        elements.renewDays.addEventListener('input', calculateRenewEndDate);
    } else {
        console.error('Element not found: renewDays');
    }

    if (elements.renewManualStartDate) {
        elements.renewManualStartDate.addEventListener('change', validateManualDates);
    } else {
        console.error('Element not found: renewManualStartDate');
    }

    if (elements.renewManualEndDate) {
        elements.renewManualEndDate.addEventListener('change', validateManualDates);
    } else {
        console.error('Element not found: renewManualEndDate');
    }

    // زر الحفظ - معالج واحد فقط
    if (elements.saveRenewBtn) {
        elements.saveRenewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleRenewSubscription(e);
        });
    } else {
        console.error('Element not found: saveRenewBtn');
    }

    // معالج النموذج - لمنع إعادة التحميل
    if (elements.renewForm) {
        // إزالة أي معالجات سابقة
        elements.renewForm.onsubmit = null;
        // إضافة معالج جديد
        elements.renewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRenewSubscription(e);
        });
    } else {
        console.error('Element not found: renewForm');
    }

    // Close modals on outside click
    if (elements.addMemberModal) {
        elements.addMemberModal.addEventListener('click', (e) => {
            if (e.target === elements.addMemberModal) hideModal(elements.addMemberModal);
        });
    } else {
        console.error('Element not found: addMemberModal');
    }

    if (elements.memberDetailsModal) {
        elements.memberDetailsModal.addEventListener('click', (e) => {
            if (e.target === elements.memberDetailsModal) hideModal(elements.memberDetailsModal);
        });
    } else {
        console.error('Element not found: memberDetailsModal');
    }

    if (elements.renewModal) {
        elements.renewModal.addEventListener('click', (e) => {
            if (e.target === elements.renewModal) hideModal(elements.renewModal);
        });
    } else {
        console.error('Element not found: renewModal');
    }

    // Close profile dropdown on outside click
    if (elements.adminProfile) {
        document.addEventListener('click', (e) => {
            if (!elements.adminProfile.contains(e.target)) {
                hideProfileDropdown();
            }
        });
    }

    // Window resize
    window.addEventListener('resize', handleResize);
}

// Auto-calculate end date when days are changed
// بدلاً من تعريف الدوال داخل window، نعرفها بشكل مباشر
function toggleRenewDurationFields() {
    const renewDurationMethod = document.getElementById('renewDurationMethod');
    const renewDaysGroup = document.getElementById('renewDaysGroup');
    const renewManualDatesGroup = document.getElementById('renewManualDatesGroup');
    const calculatedEndDateDisplay = document.getElementById('calculatedEndDateDisplay');
    
    if (renewDurationMethod && renewDaysGroup && renewManualDatesGroup && calculatedEndDateDisplay) {
        if (renewDurationMethod.value === 'days') {
            renewDaysGroup.style.display = 'grid';
            renewManualDatesGroup.style.display = 'none';
            calculatedEndDateDisplay.style.display = 'block';
            document.getElementById('renewDays').setAttribute('required', 'true');
            document.getElementById('renewStartDate').setAttribute('required', 'true');
            document.getElementById('renewManualStartDate').removeAttribute('required');
            document.getElementById('renewManualEndDate').removeAttribute('required');
            calculateRenewEndDate();
        } else {
            renewDaysGroup.style.display = 'none';
            renewManualDatesGroup.style.display = 'grid';
            calculatedEndDateDisplay.style.display = 'none';
            document.getElementById('renewDays').removeAttribute('required');
            document.getElementById('renewStartDate').removeAttribute('required');
            document.getElementById('renewManualStartDate').setAttribute('required', 'true');
            document.getElementById('renewManualEndDate').setAttribute('required', 'true');
            validateManualDates();
        }
    }
}

function calculateRenewEndDate() {
    const startDateInput = document.getElementById('renewStartDate');
    const daysInput = document.getElementById('renewDays');
    const renewCalculatedEndDate = document.getElementById('renewCalculatedEndDate');
    
    if (startDateInput && daysInput && renewCalculatedEndDate) {
        const startDate = new Date(startDateInput.value);
        const days = parseInt(daysInput.value) || 0;
        
        if (!isNaN(startDate.getTime()) && days > 0) {
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + days);
            renewCalculatedEndDate.value = formatDate(firebase.firestore.Timestamp.fromDate(endDate));
        } else {
            renewCalculatedEndDate.value = '';
        }
    }
}

function validateManualDates() {
    const manualStartDateInput = document.getElementById('renewManualStartDate');
    const manualEndDateInput = document.getElementById('renewManualEndDate');
    
    if (manualStartDateInput && manualEndDateInput) {
        const startDate = new Date(manualStartDateInput.value);
        const endDate = new Date(manualEndDateInput.value);

        if (manualStartDateInput.value && manualEndDateInput.value && startDate >= endDate) {
            showAlert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 'error');
            manualEndDateInput.value = '';
        }
    }
}

// ثم في دالة setupRenewFormCalculations، نقوم بإزالة التعريفات الداخلية
function setupRenewFormCalculations() {
    const renewDurationMethod = document.getElementById('renewDurationMethod');
    
    if (renewDurationMethod) {
        renewDurationMethod.addEventListener('change', toggleRenewDurationFields);
    }
    
    const renewStartDate = document.getElementById('renewStartDate');
    if (renewStartDate) {
        renewStartDate.addEventListener('change', calculateRenewEndDate);
    }
    
    const renewDays = document.getElementById('renewDays');
    if (renewDays) {
        renewDays.addEventListener('input', calculateRenewEndDate);
    }
    
    const renewManualStartDate = document.getElementById('renewManualStartDate');
    if (renewManualStartDate) {
        renewManualStartDate.addEventListener('change', validateManualDates);
    }
    
    const renewManualEndDate = document.getElementById('renewManualEndDate');
    if (renewManualEndDate) {
        renewManualEndDate.addEventListener('change', validateManualDates);
    }
    
    // Initial call to set up fields correctly
    toggleRenewDurationFields();
}


// Sidebar Functions
    function toggleSidebar() {
        sidebar.classList.toggle('closed');
        mainContent.classList.toggle('sidebar-closed');
        header.classList.toggle('sidebar-closed');

        localStorage.setItem('sidebarClosed', sidebar.classList.contains('closed'));

        // تبديل أيقونة زر القائمة
        const menuIcon = menuBtn.querySelector('ion-icon');
        if (sidebar.classList.contains('closed')) {
            menuIcon.setAttribute('name', 'menu-outline'); // أيقونة الهامبرغر عندما تكون مغلقة
        } else {
            menuIcon.setAttribute('name', 'close-outline'); // أيقونة X عندما تكون مفتوحة
        }
    }
    

function restoreSidebarState() {
    const savedSidebarState = localStorage.getItem('sidebarClosed');
    
    if (window.innerWidth > 1024) {
        if (savedSidebarState === 'true') {
            sidebar.classList.add('closed');
            mainContent.classList.add('sidebar-closed');
            header.classList.add('sidebar-closed');
        } else {
            sidebar.classList.remove('closed');
            mainContent.classList.remove('sidebar-closed');
            header.classList.remove('sidebar-closed');
        }
    }
}

function toggleProfileDropdown() {
    profileDropdown.classList.toggle('show');
    adminProfile.classList.toggle('active');
}

function hideProfileDropdown() {
    profileDropdown.classList.remove('show');
    adminProfile.classList.remove('active');
}

// Logout
function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
}

// Modal Functions
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';

    if (modal === addMemberModal) {
        addMemberForm.reset();
    }
    if (modal === renewModal) {
        renewForm.reset();
        // إعادة تعيين الحقول الإضافية إذا لزم الأمر
        document.getElementById('renewReceipt').value = '';
        document.getElementById('renewNotes').value = '';
    }
}

// Load Members Data
async function loadMembersData() {
    try {
        showGlobalLoading('جاري تحميل بيانات المشتركين...');
        
        const membersQuery = await db.collection('members')
            .where('status', '!=', 'deleted')
            .orderBy('status')
            .orderBy('createdAt', 'desc')
            .get();

        membersData = [];
        
        for (const doc of membersQuery.docs) {
            const member = doc.data();
            member.id = doc.id;
            
            // Get latest subscription
            const subscriptionQuery = await db.collection('subscriptions')
                .where('memberId', '==', doc.id)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (!subscriptionQuery.empty) {
                const subscriptionDoc = subscriptionQuery.docs[0];
                member.subscription = subscriptionDoc.data();
                member.subscriptionId = subscriptionDoc.id;
                
                // Calculate remaining days
                if (member.subscription.endDate) {
                    const endDate = member.subscription.endDate.toDate ? 
                        member.subscription.endDate.toDate() : 
                        new Date(member.subscription.endDate);
                    const today = new Date();
                    const timeDiff = endDate.getTime() - today.getTime();
                    member.daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    
                    // Set status based on remaining days
                    if (member.status === 'blocked') {
                        member.statusText = 'محظور';
                    } else if (member.status === 'cancelled') {
                        member.statusText = 'ملغي';
                    } else if (member.daysRemaining < 0) {
                        member.statusText = 'منتهي';
                    } else {
                        member.statusText = 'نشط';
                    }
                } else {
                    member.daysRemaining = 0;
                    member.statusText = 'غير محدد';
                }
            } else {
                member.statusText = member.status === 'blocked' ? 'محظور' : 
                                  member.status === 'cancelled' ? 'ملغي' : 'غير مشترك';
                member.daysRemaining = 0;
                member.subscription = null;
            }
            
            membersData.push(member);
        }
        
        filteredMembers = [...membersData];
        renderMembersTable();
        updatePagination();
        hideGlobalLoading();
        
    } catch (error) {
        console.error('Error loading members:', error);
        hideGlobalLoading();
        showAlert('حدث خطأ في تحميل بيانات المشتركين: ' + error.message, 'error');
        
        membersTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 30px; color: #dc2626;">
                    خطأ في تحميل البيانات: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Add Member Function
async function handleAddMember(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('saveMemberBtn');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> جاري الحفظ...';
        
        // Collect form data
        const formData = {
            name: document.getElementById('memberName').value.trim(),
            phone: document.getElementById('memberPhone').value.trim(),
            email: document.getElementById('memberEmail').value.trim().toLowerCase(),
            password: document.getElementById('memberPassword').value,
            dob: document.getElementById('memberDob').value,
            photoUrl: document.getElementById('memberPhoto').value.trim() || "",
            subscriptionType: document.getElementById('subscriptionType').value,
            subscriptionPrice: parseInt(document.getElementById('subscriptionPrice').value),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            paymentMethod: document.getElementById('paymentMethod').value,
            paymentProof: document.getElementById('paymentProof').value.trim() || "",
            notes: document.getElementById('memberNotes').value.trim()
        };
        
        // Validate required fields
        if (!formData.name || !formData.phone || !formData.email || !formData.password || 
            !formData.subscriptionPrice || !formData.startDate || !formData.endDate) {
            throw new Error('يرجى ملء جميع الحقول المطلوبة');
        }
        
        // Validate email
        if (!isValidEmail(formData.email)) {
            throw new Error('البريد الإلكتروني غير صحيح');
        }
        
        // Validate password
        if (formData.password.length < 6) {
            throw new Error('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل');
        }
        
        const user = auth.currentUser;
        if (!user) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }
        
        // Create member data
        const memberData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            dob: formData.dob ? firebase.firestore.Timestamp.fromDate(new Date(formData.dob)) : null,
            photoUrl: formData.photoUrl,
            status: 'active',
            role: 'trainee',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid,
            createdByName: currentUser?.userData?.name || user.email,
            notes: formData.notes,
            hasAuthAccount: false,
            tempPassword: formData.password
        };
        
        // Save member to Firestore
        const memberRef = await db.collection('members').add(memberData);
        
        // Create subscription
        const subscriptionData = {
            memberId: memberRef.id,
            memberName: formData.name,
            memberPhone: formData.phone,
            type: formData.subscriptionType,
            price: formData.subscriptionPrice,
            startDate: firebase.firestore.Timestamp.fromDate(new Date(formData.startDate)),
            endDate: firebase.firestore.Timestamp.fromDate(new Date(formData.endDate)),
            paymentMethod: formData.paymentMethod,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid,
            createdByName: currentUser?.userData?.name || user.email,
            receipts: formData.paymentProof ? [formData.paymentProof] : []
        };
        
        const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);
        
        // Record payment if price > 0
        if (formData.subscriptionPrice > 0) {
            const paymentData = {
                type: 'new_subscription',
                refId: subscriptionRef.id,
                memberId: memberRef.id,
                memberName: formData.name,
                amount: formData.subscriptionPrice,
                method: formData.paymentMethod,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                by: user.uid,
                byName: currentUser?.userData?.name || user.email,
                receiptUrl: formData.paymentProof
            };
            
            await db.collection('payments').add(paymentData);
        }
        
        // Log activity
        await db.collection('audit_logs').add({
            action: 'create_member',
            targetId: memberRef.id,
            targetName: formData.name,
            by: user.uid,
            byName: currentUser?.userData?.name || user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            details: {
                subscriptionType: formData.subscriptionType,
                price: formData.subscriptionPrice,
                hasAuthAccount: false
            }
        });
        
        showAlert('تم إضافة المشترك بنجاح', 'success');
        
        setTimeout(() => {
            hideModal(addMemberModal);
            addMemberForm.reset();
            loadMembersData();
        }, 1500);
        
    } catch (error) {
        console.error('Error adding member:', error);
        showAlert(error.message || 'حدث خطأ في إضافة المشترك', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Apply Filters
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const subscriptionValue = subscriptionFilter.value;
    
    filteredMembers = membersData.filter(member => {
        const matchesSearch = searchTerm === '' || 
            member.name.toLowerCase().includes(searchTerm) || 
            member.phone.includes(searchTerm);
        
        const matchesStatus = statusValue === 'all' || 
            (statusValue === 'active' && member.statusText === 'نشط') ||
            (statusValue === 'expired' && member.statusText === 'منتهي') ||
            (statusValue === 'blocked' && member.statusText === 'محظور') ||
            (statusValue === 'cancelled' && member.statusText === 'ملغي');
        
        const matchesSubscription = subscriptionValue === 'all' || 
            (member.subscription && member.subscription.type === subscriptionValue);
        
        return matchesSearch && matchesStatus && matchesSubscription;
    });
    
    currentPage = 1;
    renderMembersTable();
    updatePagination();
}

// Render Members Table
function renderMembersTable() {
    membersTableBody.innerHTML = '';
    
    if (filteredMembers.length === 0) {
        membersTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 30px;">
                    لا توجد نتائج مطابقة للبحث
                </td>
            </tr>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMembers.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const member = filteredMembers[i];
        const row = document.createElement('tr');
        
        const subscriptionType = member.subscription ? 
            (member.subscription.type === 'normal' ? 'عادي' : 
             member.subscription.type === 'cardio' ? 'كارديو' : 
             member.subscription.type === 'single' ? 'حصة فردية' : 
             member.subscription.type) : 'غير محدد';
        
        let daysRemainingText = 'غير محدد';
        let daysRemainingClass = 'warning';
        
        if (member.daysRemaining !== undefined && member.daysRemaining !== null) {
            if (member.daysRemaining > 0) {
                daysRemainingText = member.daysRemaining + ' يوم';
                daysRemainingClass = member.daysRemaining > 7 ? 'success' : 'warning';
            } else if (member.daysRemaining === 0) {
                daysRemainingText = 'ينتهي اليوم';
                daysRemainingClass = 'warning';
            } else {
                daysRemainingText = 'انتهى';
                daysRemainingClass = 'danger';
            }
        }
        
        row.innerHTML = `
            <td>
                <img src="${member.photoUrl || 'https://via.placeholder.com/40'}" 
                     alt="صورة ${member.name}" class="member-avatar">
            </td>
            <td>${member.name || 'غير محدد'}</td>
            <td>${member.phone || 'غير محدد'}</td>
            <td>${subscriptionType}</td>
            <td>${member.subscription ? formatDate(member.subscription.startDate) : 'غير محدد'}</td>
            <td>${member.subscription ? formatDate(member.subscription.endDate) : 'غير محدد'}</td>
            <td>
                <span class="status-badge ${daysRemainingClass}">
                    ${daysRemainingText}
                </span>
            </td>
            <td>
                <span class="status-badge ${getStatusClass(member.statusText)}">
                    ${member.statusText}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn renew-btn" onclick="showRenewModal('${member.id}', '${member.name}')">
                        <ion-icon name="refresh-outline"></ion-icon>
                    </button>
                    <button class="action-btn view-btn" onclick="showMemberDetails('${member.id}')">
                        <ion-icon name="eye-outline"></ion-icon>
                    </button>
                    <button class="action-btn edit-btn" onclick="editMember('${member.id}')">
                        <ion-icon name="pencil-outline"></ion-icon>
                    </button>
                    ${member.status === 'blocked' ? `
                        <button class="action-btn unblock-btn" onclick="unblockMember('${member.id}', '${member.name}')">
                            <ion-icon name="lock-open-outline"></ion-icon>
                        </button>
                    ` : `
                        <button class="action-btn block-btn" onclick="blockMember('${member.id}', '${member.name}')">
                            <ion-icon name="ban-outline"></ion-icon>
                        </button>
                    `}
                    <button class="action-btn delete-btn" onclick="deleteMember('${member.id}', '${member.name}')">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            </td>
        `;
        
        membersTableBody.appendChild(row);
    }
}

// Renew Modal Functions
function showRenewModal(memberId, memberName) {
    document.getElementById('renewMemberId').value = memberId;
    
    // Get current member data to set intelligent defaults
    const member = membersData.find(m => m.id === memberId);
    
    if (member && member.subscription) {
        // Set same subscription type as current
        document.getElementById('renewType').value = member.subscription.type;
        
        // Set start date as day after current subscription ends
        if (member.subscription.endDate) {
            const endDate = member.subscription.endDate.toDate ? 
                member.subscription.endDate.toDate() : 
                new Date(member.subscription.endDate);
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            document.getElementById('renewStartDate').value = nextDay.toISOString().split('T')[0];
        } else {
            // If no end date, start from today
            const today = new Date();
            document.getElementById('renewStartDate').value = today.toISOString().split('T')[0];
        }
        
        // Set similar price as current subscription
        document.getElementById('renewPrice').value = member.subscription.price || 500;
    } else {
        // Default values for new subscriptions
        document.getElementById('renewType').value = 'normal';
        const today = new Date();
        document.getElementById('renewStartDate').value = today.toISOString().split('T')[0];
        document.getElementById('renewPrice').value = 500;
    }
    
        // Reset form fields to ensure clean state
    renewForm.reset();
 document.getElementById('renewMemberId').value = memberId;

    // Set default values
    document.getElementById('renewDurationMethod').value = 'days'; // Default to days
    document.getElementById('renewDays').value = 30;
    document.getElementById('renewPaymentMethod').value = 'cash';
    
    // Get current member data to set intelligent defaults
    const members = membersData.find(m => m.id === memberId);
    
    if (member && member.subscription) {
        // Set same subscription type as current
        document.getElementById('renewType').value = member.subscription.type;
        
        // Set start date as day after current subscription ends
        if (member.subscription.endDate) {
            const endDate = member.subscription.endDate.toDate ? 
                member.subscription.endDate.toDate() : 
                new Date(member.subscription.endDate);
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            document.getElementById('renewStartDate').value = nextDay.toISOString().split('T')[0];
            document.getElementById('renewManualStartDate').value = nextDay.toISOString().split('T')[0];
        } else {
            // If no end date, start from today
            const today = new Date();
            document.getElementById('renewStartDate').value = today.toISOString().split('T')[0];
            document.getElementById('renewManualStartDate').value = today.toISOString().split('T')[0];
        }
        
        // Set similar price as current subscription
        document.getElementById('renewPrice').value = member.subscription.price || 500;
    } else {
        // Default values for new subscriptions
        document.getElementById('renewType').value = 'normal';
        const today = new Date();
        document.getElementById('renewStartDate').value = today.toISOString().split('T')[0];
        document.getElementById('renewManualStartDate').value = today.toISOString().split('T')[0];
        document.getElementById('renewPrice').value = 500;
    }
    
    // Trigger initial calculation and field visibility
    toggleRenewDurationFields();
    calculateRenewEndDate(); // Ensure calculated end date is shown if 'days' is default

    showModal(renewModal);

}

async function handleRenewSubscription(e) {
    if (e) e.preventDefault();
    
    const submitBtn = document.getElementById('saveRenewBtn');
    if (!submitBtn) {
        console.error('زر الحفظ غير موجود');
        showAlert('خطأ في النظام: زر الحفظ غير موجود', 'error');
        return;
    }
    
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading"></div> جاري التجديد...';

        // Collect form data
        const renewDurationMethod = document.getElementById('renewDurationMethod').value;
        let startDate, endDate, days;

        if (renewDurationMethod === 'days') {
            startDate = document.getElementById('renewStartDate').value;
            days = parseInt(document.getElementById('renewDays').value);
            if (!startDate || !days || days <= 0) {
                throw new Error('يرجى تحديد تاريخ البداية وعدد الأيام للتجديد.');
            }
            const tempEndDate = new Date(startDate);
            tempEndDate.setDate(tempEndDate.getDate() + days);
            endDate = tempEndDate.toISOString().split('T')[0];
        } else { // manual
            startDate = document.getElementById('renewManualStartDate').value;
            endDate = document.getElementById('renewManualEndDate').value;
            if (!startDate || !endDate) {
                throw new Error('يرجى تحديد تاريخ البداية وتاريخ النهاية يدويًا.');
            }
            if (new Date(startDate) >= new Date(endDate)) {
                throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.');
            }
            
            // Calculate days for logging
            const start = new Date(startDate);
            const end = new Date(endDate);
            days = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }

        const formData = {
            memberId: document.getElementById('renewMemberId').value,
            type: document.getElementById('renewType').value,
            price: parseFloat(document.getElementById('renewPrice').value),
            startDate: startDate,
            endDate: endDate,
            paymentMethod: document.getElementById('renewPaymentMethod').value,
            receipt: document.getElementById('renewReceipt').value.trim() || "",
            notes: document.getElementById('renewNotes').value.trim()
        };

        // Validate required fields
        if (!formData.memberId || !formData.type || !formData.price || !formData.paymentMethod) {
            throw new Error('يرجى ملء جميع الحقول المطلوبة.');
        }

        const user = auth.currentUser;
        if (!user) {
            throw new Error('يجب تسجيل الدخول أولاً');
        }

        // Get member data
        const memberDoc = await db.collection('members').doc(formData.memberId).get();
        if (!memberDoc.exists) {
            throw new Error('المشترك غير موجود');
        }
        const member = memberDoc.data();

        // Create new subscription
        const subscriptionData = {
            memberId: formData.memberId,
            memberName: member.name,
            memberPhone: member.phone,
            type: formData.type,
            price: formData.price,
            startDate: firebase.firestore.Timestamp.fromDate(new Date(formData.startDate)),
            endDate: firebase.firestore.Timestamp.fromDate(new Date(formData.endDate)),
            paymentMethod: formData.paymentMethod,
            isRenewal: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: user.uid,
            createdByName: currentUser?.userData?.name || user.email,
            receipts: formData.receipt ? [formData.receipt] : [],
            renewalNotes: formData.notes
        };

        const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);

        // Record payment if price > 0
        if (formData.price > 0) {
            const paymentData = {
                type: 'renewal',
                refId: subscriptionRef.id,
                memberId: formData.memberId,
                memberName: member.name,
                amount: formData.price,
                method: formData.paymentMethod,
                date: firebase.firestore.FieldValue.serverTimestamp(),
                by: user.uid,
                byName: currentUser?.userData?.name || user.email,
                receiptUrl: formData.receipt
            };
            await db.collection('payments').add(paymentData);
        }

        // Update member status
        await db.collection('members').doc(formData.memberId).update({
            status: 'active',
            renewedAt: firebase.firestore.FieldValue.serverTimestamp(),
            renewedBy: user.uid,
            renewedByName: currentUser?.userData?.name || user.email
        });

        // Log activity
        await db.collection('audit_logs').add({
            action: 'renew_subscription',
            targetId: formData.memberId,
            targetName: member.name,
            by: user.uid,
            byName: currentUser?.userData?.name || user.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            details: {
                subscriptionId: subscriptionRef.id,
                type: formData.type,
                price: formData.price,
                period: `${days} يوم`,
                startDate: formData.startDate,
                endDate: formData.endDate
            }
        });

        showAlert(`تم تجديد اشتراك ${member.name} بنجاح`, 'success');

        // Close modal and refresh data
        setTimeout(() => {
            hideModal(renewModal);
            renewForm.reset();
            loadMembersData();
        }, 1500);

    } catch (error) {
        console.error('Error renewing subscription:', error);
        showAlert(error.message || 'حدث خطأ في تجديد الاشتراك', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}


// Pagination Functions
function updatePagination() {
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    
    pageInfo.textContent = `الصفحة ${currentPage} من ${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderMembersTable();
        updatePagination();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    
    if (currentPage < totalPages) {
        currentPage++;
        renderMembersTable();
        updatePagination();
    }
}

// Member Actions
async function showMemberDetails(memberId) {
    try {
        showGlobalLoading('جاري تحميل التفاصيل...');
        
        const memberDoc = await db.collection('members').doc(memberId).get();
        if (!memberDoc.exists) {
            throw new Error('المشترك غير موجود');
        }
        
        const member = memberDoc.data();
        member.id = memberDoc.id;
        
        // Get subscriptions
        const subscriptionsQuery = await db.collection('subscriptions')
            .where('memberId', '==', memberId)
            .orderBy('createdAt', 'desc')
            .get();
        
        member.subscriptions = [];
        subscriptionsQuery.forEach(doc => {
            const subscription = doc.data();
            subscription.id = doc.id;
            member.subscriptions.push(subscription);
        });
        
        // Get payments
        const paymentsQuery = await db.collection('payments')
            .where('memberId', '==', memberId)
            .orderBy('date', 'desc')
            .get();
        
        member.payments = [];
        paymentsQuery.forEach(doc => {
            const payment = doc.data();
            payment.id = doc.id;
            member.payments.push(payment);
        });
        
        // Display details in modal
        memberDetailsBody.innerHTML = generateMemberDetailsHTML(member);
        
        showModal(memberDetailsModal);
        hideGlobalLoading();
        
    } catch (error) {
        console.error('Error loading member details:', error);
        hideGlobalLoading();
        showAlert('حدث خطأ في تحميل تفاصيل المشترك', 'error');
    }
}

function generateMemberDetailsHTML(member) {
    return `
        <div class="member-details-header">
            <img src="${member.photoUrl || 'https://via.placeholder.com/100'}" 
                 alt="صورة ${member.name}" class="member-details-avatar">
            <div>
                <h4>${member.name}</h4>
                <p>${member.phone}</p>
                <p>${member.email}</p>
                <p>${member.dob ? formatDate(member.dob) : 'تاريخ الميلاد غير محدد'}</p>
            </div>
        </div>
        
        <div class="details-section">
            <h4>الاشتراكات</h4>
            ${member.subscriptions.length > 0 ? `
            <div class="subscriptions-list">
                ${member.subscriptions.map(sub => `
                    <div class="subscription-item">
                        <div class="subscription-info">
                            <strong>${getSubscriptionTypeArabic(sub.type)}</strong>
                            <span>${formatCurrency(sub.price)}</span>
                        </div>
                        <div class="subscription-dates">
                            من ${formatDate(sub.startDate)} إلى ${formatDate(sub.endDate)}
                        </div>
                        <div class="subscription-meta">
                            طريقة الدفع: ${getPaymentMethodArabic(sub.paymentMethod)}
                            | بواسطة: ${sub.createdByName}
                        </div>
                    </div>
                `).join('')}
            </div>
            ` : '<p>لا توجد اشتراكات</p>'}
        </div>
        
        <div class="details-section">
            <h4>سجل المدفوعات</h4>
            ${member.payments.length > 0 ? `
            <div class="payments-list">
                ${member.payments.map(payment => `
                    <div class="payment-item">
                        <div class="payment-info">
                            <strong>${getPaymentTypeArabic(payment.type)}</strong>
                            <span>${formatCurrency(payment.amount)}</span>
                        </div>
                        <div class="payment-details">
                            ${formatDate(payment.date)} | 
                            طريقة الدفع: ${getPaymentMethodArabic(payment.method)}
                            | بواسطة: ${payment.byName}
                        </div>
                        ${payment.receiptUrl ? `
                        <div class="payment-receipt">
                            <a href="${payment.receiptUrl}" target="_blank">عرض إثبات الدفع</a>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : '<p>لا توجد مدفوعات</p>'}
        </div>
        
        ${member.notes ? `
        <div class="details-section">
            <h4>ملاحظات</h4>
            <p>${member.notes}</p>
        </div>
        ` : ''}
    `;
}

async function blockMember(memberId, memberName) {
    const user = auth.currentUser;
    if (!user) {
        showAlert('يجب تسجيل الدخول أولاً', 'error');
        return;
    }

    const reason = prompt('يرجى إدخال سبب الحظر:');
    if (reason === null) return;
    
    if (confirm(`هل أنت متأكد من حظر المشترك ${memberName}؟`)) {
        try {
            showGlobalLoading('جاري حظر المشترك...');
            
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            await db.collection('members').doc(memberId).update({
                status: 'blocked',
                blockedAt: firebase.firestore.FieldValue.serverTimestamp(),
                blockedBy: user.uid,
                blockedByName: userData.name || user.email || 'مدير النظام',
                blockReason: reason
            });
            
            await db.collection('audit_logs').add({
                action: 'block_member',
                targetId: memberId,
                targetName: memberName,
                by: user.uid,
                byName: userData.name || user.email || 'مدير النظام',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: { reason: reason }
            });
            
            showAlert('تم حظر المشترك بنجاح', 'success');
            loadMembersData();
            
        } catch (error) {
            console.error('Error blocking member:', error);
            hideGlobalLoading();
            showAlert('حدث خطأ في حظر المشترك', 'error');
        }
    }
}

async function unblockMember(memberId, memberName) {
    const user = auth.currentUser;
    if (!user) {
        showAlert('يجب تسجيل الدخول أولاً', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من فك حظر المشترك ${memberName}؟`)) {
        try {
            showGlobalLoading('جاري فك حظر المشترك...');
            
            const userDoc = await db.collection('users').doc(user.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            
            await db.collection('members').doc(memberId).update({
                status: 'active',
                unblockedAt: firebase.firestore.FieldValue.serverTimestamp(),
                unblockedBy: user.uid,
                unblockedByName: userData.name || user.email || 'مدير النظام'
            });
            
            await db.collection('audit_logs').add({
                action: 'unblock_member',
                targetId: memberId,
                targetName: memberName,
                by: user.uid,
                byName: userData.name || user.email || 'مدير النظام',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showAlert('تم فك حظر المشترك بنجاح', 'success');
            loadMembersData();
            
        } catch (error) {
            console.error('Error unblocking member:', error);
            hideGlobalLoading();
            showAlert('حدث خطأ في فك حظر المشترك', 'error');
        }
    }
}

async function deleteMember(memberId, memberName) {
    const user = auth.currentUser;
    if (!user) {
        showAlert('يجب تسجيل الدخول أولاً', 'error');
        return;
    }

    if (confirm(`هل أنت متأكد من الحذف الكامل للمشترك ${memberName}؟ هذه العملية لا يمكن التراجع عنها وسيتم حذف جميع بيانات المشترك بشكل نهائي.`)) {
        try {
            showGlobalLoading('جاري حذف المشترك بشكل نهائي...');
            
            const batch = db.batch();
            
            // Delete related records
            const payments = await db.collection('payments')
                .where('memberId', '==', memberId)
                .get();
            payments.forEach(doc => {
                batch.delete(db.collection('payments').doc(doc.id));
            });
            
            const subscriptions = await db.collection('subscriptions')
                .where('memberId', '==', memberId)
                .get();
            subscriptions.forEach(doc => {
                batch.delete(db.collection('subscriptions').doc(doc.id));
            });
            
            const attendance = await db.collection('attendance')
                .where('memberId', '==', memberId)
                .get();
            attendance.forEach(doc => {
                batch.delete(db.collection('attendance').doc(doc.id));
            });
            
            await batch.commit();
            
            // Delete member
            await db.collection('members').doc(memberId).delete();
            
            // Log activity
            await db.collection('audit_logs').add({
                action: 'permanent_delete_member',
                targetId: memberId,
                targetName: memberName,
                by: user.uid,
                byName: user.displayName || user.email || 'مدير النظام',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                details: {
                    deletedPayments: payments.size,
                    deletedSubscriptions: subscriptions.size,
                    deletedAttendance: attendance.size
                }
            });
            
            showAlert('تم حذف المشترك وبياناته بشكل نهائي', 'success');
            loadMembersData();
            
        } catch (error) {
            console.error('Error deleting member:', error);
            hideGlobalLoading();
            showAlert('حدث خطأ في حذف المشترك', 'error');
        }
    }
}

function editMember(memberId) {
    showAlert('سيتم تطوير صفحة تعديل المشترك قريباً', 'info');
}

// Responsive Handling
    function handleResize() {
        if (window.innerWidth <= 1024) {
            sidebar.classList.add('closed');
            mainContent.classList.add('sidebar-closed');
            header.classList.add('sidebar-closed');
        } else {
            const savedSidebarState = localStorage.getItem('sidebarClosed');
            if (savedSidebarState === 'true') {
                sidebar.classList.add('closed');
                mainContent.classList.add('sidebar-closed');
                header.classList.add('sidebar-closed');
            } else {
                sidebar.classList.remove('closed');
                mainContent.classList.remove('sidebar-closed');
                header.classList.remove('sidebar-closed');
            }
        }
        updateMenuIconState(); // <--- أضف هذا السطر لضبط الأيقونة بعد تغيير الحجم
    }
    

    
// Initialize Default Dates
function initializeDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) {
        startDateInput.value = today;
    }
    
    if (endDateInput) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        endDateInput.value = endDate.toISOString().split('T')[0];
    }
}

// Helper Functions
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    try {
        if (timestamp.toDate) {
            const date = timestamp.toDate();
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'غير محدد';
        
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'غير محدد';
    }
}

function formatCurrency(amount) {
    return `${amount.toLocaleString('ar-EG')} جنيه`;
}

function getStatusClass(status) {
    switch (status) {
        case 'نشط': return 'success';
        case 'منتهي': return 'warning';
        case 'محظور': case 'ملغي': return 'danger';
        default: return 'info';
    }
}

function getSubscriptionTypeArabic(type) {
    switch (type) {
        case 'normal': return 'عادي';
        case 'cardio': return 'كارديو';
        case 'single': return 'حصة فردية';
        default: return type;
    }
}

function getPaymentMethodArabic(method) {
    switch (method) {
        case 'cash': return 'كاش';
        case 'visa': return 'فيزا';
        case 'instapay': return 'انستاباي';
        default: return method;
    }
}

function getPaymentTypeArabic(type) {
    switch (type) {
        case 'new_subscription': return 'اشتراك جديد';
        case 'renewal': return 'تجديد';
        case 'single': return 'حصة فردية';
        default: return type;
    }
}

function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const iconName = type === 'success' ? 'checkmark-circle-outline' : 
                     type === 'error' ? 'alert-circle-outline' : 
                     type === 'warning' ? 'warning-outline' : 'information-circle-outline';
    
    alert.innerHTML = `
        <ion-icon name="${iconName}"></ion-icon>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function showGlobalLoading(message = 'جاري التحميل...') {
    hideGlobalLoading();
    
    const loading = document.createElement('div');
    loading.id = 'globalLoading';
    loading.className = 'global-loading';
    loading.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loading);
}

function hideGlobalLoading() {
    const loading = document.getElementById('globalLoading');
    if (loading) {
        loading.remove();
    }
}

// Make functions globally available for onclick handlers
window.showRenewModal = showRenewModal;
window.showMemberDetails = showMemberDetails;
window.editMember = editMember;
window.blockMember = blockMember;
window.unblockMember = unblockMember;
window.deleteMember = deleteMember;
window.toggleRenewDurationFields = toggleRenewDurationFields;
window.calculateRenewEndDate = calculateRenewEndDate;
window.validateManualDates = validateManualDates;
