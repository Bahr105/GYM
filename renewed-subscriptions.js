// Enhanced Admin Dashboard JavaScript - جافا سكريبت محسّن للوحة الإدارة

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

// Global State Management
class AppState {
    constructor() {
        this.currentUser = null;
        this.renewedSubscriptionsData = [];
        this.filteredRenewedSubscriptions = [];
        this.captainsList = [];
        this.currentPage = 1;
        this.itemsPerPage = 12; // زيادة عدد العناصر لأن الكاردز أصغر
        this.sidebarCollapsed = this.getSidebarState();
        this.isMobile = window.innerWidth <= 1024;
        
        // إضافة event listeners للتفاعل
        this.setupEventListeners();
        this.setupThemeToggle();
    }
    
    getSidebarState() {
        return localStorage.getItem('sidebarCollapsed') === 'true';
    }
    
    setSidebarState(collapsed) {
        this.sidebarCollapsed = collapsed;
        localStorage.setItem('sidebarCollapsed', collapsed.toString());
    }
    
    setupEventListeners() {
        // Responsive handling
        window.addEventListener('resize', this.debounce(() => {
            this.isMobile = window.innerWidth <= 1024;
            this.handleResize();
        }, 250));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'k':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.toggleSidebar();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Intersection Observer for animations
        this.setupScrollAnimations();
    }
    
    setupThemeToggle() {
        // Auto dark mode based on system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addListener(this.handleThemeChange);
        this.handleThemeChange(mediaQuery);
    }
    
    handleThemeChange(e) {
        if (e.matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });
        
        // Observe cards when they're created
        this.observer = observer;
    }
    
    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal-overlay.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }
    
    debounce(func, wait) {
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
    
    handleResize() {
    this.isMobile = window.innerWidth <= 1024;
    
    if (this.isMobile) {
        // على الموبايل، نتأكد أن القائمة مغلقة
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('closed');
            document.body.classList.remove('sidebar-open');
            document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
        }
    } else {
        // على سطح المكتب، نستخدم حالة التخزين المحلي
        this.updateLayout();
    }
}
    
    updateLayout() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        const header = document.querySelector('.header');
        
        if (sidebar && mainContent && header) {
            if (this.sidebarCollapsed || this.isMobile) {
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
    
    // في كلاس AppState، عدل دالة toggleSidebar
toggleSidebar() {
    if (this.isMobile) {
        // على الموبايل، نفتح/نغلق القائمة مباشرة
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('closed');
            document.body.classList.toggle('sidebar-open');
            
            // تحديث حالة ARIA للوصول
            const isExpanded = !sidebar.classList.contains('closed');
            document.getElementById('menuBtn').setAttribute('aria-expanded', isExpanded);
        }
    } else {
        // على سطح المكتب، نستخدم النظام القديم
        this.setSidebarState(!this.sidebarCollapsed);
        this.updateLayout();
    }
    this.updateMenuIcon();
}
    
       updateMenuIcon() {
                const menuBtn = document.getElementById('menuBtn');
                const icon = menuBtn.querySelector('ion-icon');
                
                if (icon) {
                    if (this.sidebarCollapsed || (this.isMobile && document.getElementById('sidebar').classList.contains('closed'))) {
                        icon.setAttribute('name', 'menu-outline');
                    } else {
                        icon.setAttribute('name', 'close-outline');
                    }
                }
            }
}

// Initialize app state
const appState = new AppState();

// DOM Elements - العناصر الأساسية
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const header = document.querySelector('.header');
const adminProfile = document.getElementById('adminProfile');
const profileDropdown = document.getElementById('profileDropdown');
const logoutBtn = document.getElementById('logoutBtn');
const profileLogout = document.getElementById('profileLogout');

// Renewed Subscriptions Elements - عناصر الاشتراكات المجددة
const searchInput = document.getElementById('searchInput');
const captainFilter = document.getElementById('captainFilter');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const startDateFilter = document.getElementById('startDateFilter');
const endDateFilter = document.getElementById('endDateFilter');
const applyFiltersBtn = document.getElementById('applyFiltersBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Enhanced UI Components - مكونات واجهة محسّنة
class UIComponents {
    static createLoadingCard() {
        return `
            <div class="subscription-card loading-shimmer">
                <div class="card-header">
                    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div class="space-y-3">
                    <div class="h-4 bg-gray-200 rounded"></div>
                    <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div class="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
            </div>
        `;
    }
    
    static createToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'checkmark-circle-outline' : 
                     type === 'error' ? 'alert-circle-outline' : 
                     type === 'warning' ? 'warning-outline' : 'information-circle-outline';
        
        toast.innerHTML = `
            <div class="toast-content">
                <ion-icon name="${icon}"></ion-icon>
                <span>${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        `;
        
        // Add to toast container or create one
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        return toast;
    }
    
    static createConfirmDialog(title, message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay confirm-dialog';
        dialog.innerHTML = `
            <div class="modal confirm-modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" id="confirmCancel">إلغاء</button>
                    <button class="save-btn confirm-btn" id="confirmOk">تأكيد</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        dialog.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const cancelBtn = dialog.querySelector('#confirmCancel');
        const confirmBtn = dialog.querySelector('#confirmOk');
        
        const cleanup = () => {
            dialog.classList.remove('show');
            document.body.style.overflow = 'auto';
            setTimeout(() => dialog.remove(), 300);
        };
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });
        
        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });
        
        // Close on outside click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                cleanup();
                if (onCancel) onCancel();
            }
        });
        
        return dialog;
    }
}
// إضافة تفاعل خيارات العرض
function setupViewOptions() {
    const viewOptions = document.querySelectorAll('.view-option-btn');
    const cardsContainer = document.getElementById('renewedSubscriptionsCards');
    
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            // إزالة النشاط من جميع الأزرار
            viewOptions.forEach(btn => btn.classList.remove('active'));
            
            // إضافة النشاط للزر المحدد
            this.classList.add('active');
            
            // تطبيق نمط العرض المحدد
            const viewType = this.getAttribute('data-view');
            cardsContainer.className = 'cards-container';
            if (viewType !== 'default') {
                cardsContainer.classList.add(viewType);
            }
            
            // حفظ التفضيل في localStorage
            localStorage.setItem('preferredView', viewType);
        });
    });
    
    // استعادة التفضيل السابق إذا exists
    const preferredView = localStorage.getItem('preferredView');
    if (preferredView && preferredView !== 'default') {
        const button = document.querySelector(`[data-view="${preferredView}"]`);
        if (button) {
            button.click();
        }
    }
}

// استدعاء الدالة عند التهيئة
// أضف هذا السطر في دالة initializePage
setupViewOptions();


// Authentication Check - فحص المصادقة
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
        if (userDoc.exists && ['admin', 'captain'].includes(userDoc.data().role)) {
            appState.currentUser = { ...user, userData: userDoc.data() };
            initializePage();
        } else {
            UIComponents.createToast('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'error');
            setTimeout(() => auth.signOut(), 2000);
        }
    } catch (error) {
        console.error('Error checking admin role:', error);
        UIComponents.createToast('حدث خطأ في التحقق من الصلاحيات', 'error');
        auth.signOut();
    }
}

// Initialize Page - تهيئة الصفحة
function initializePage() {
    loadAdminInfo();
    setupEventListeners();
    loadCaptainsForFilter();
    loadRenewedSubscriptionsData();
    setDefaultDateFilters();
    appState.updateLayout();
    appState.updateMenuIcon();
    setupSidebar();
    setupViewOptions();
    
    // Add loading animation to page
    document.body.classList.add('page-loaded');
}

function loadAdminInfo() {
    const adminPhoto = document.getElementById('adminPhoto');
    const adminName = document.getElementById('adminName');

    if (appState.currentUser.userData.photoUrl) {
        adminPhoto.src = appState.currentUser.userData.photoUrl;
    }
    adminName.textContent = appState.currentUser.userData.name || 'أدمن';
}

// Enhanced Event Listeners - مستمعي الأحداث المحسّنة
function setupEventListeners() {
    // Menu toggle with enhanced animation
    menuBtn?.addEventListener('click', () => {
        appState.toggleSidebar();
        menuBtn.classList.add('clicked');
        setTimeout(() => menuBtn.classList.remove('clicked'), 200);
    });

    // Profile dropdown with outside click handling
    adminProfile?.addEventListener('click', toggleProfileDropdown);
    
    // Logout handlers
    logoutBtn?.addEventListener('click', handleLogout);
    profileLogout?.addEventListener('click', handleLogout);

    // Enhanced search with debouncing
    searchInput?.addEventListener('input', appState.debounce(applyFilters, 300));
    
    // Filter changes
    captainFilter?.addEventListener('change', applyFilters);
    typeFilter?.addEventListener('change', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
    startDateFilter?.addEventListener('change', applyFilters);
    endDateFilter?.addEventListener('change', applyFilters);
    applyFiltersBtn?.addEventListener('click', applyFilters);

    // Pagination with keyboard support
    prevPageBtn?.addEventListener('click', goToPrevPage);
    nextPageBtn?.addEventListener('click', goToNextPage);
    
    // Keyboard navigation for pagination
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        if (e.key === 'ArrowLeft' && !prevPageBtn.disabled) {
            goToPrevPage();
        } else if (e.key === 'ArrowRight' && !nextPageBtn.disabled) {
            goToNextPage();
        }
    });

    // Close profile dropdown on outside click
    document.addEventListener('click', (e) => {
        if (adminProfile && !adminProfile.contains(e.target) && 
            profileDropdown && !profileDropdown.contains(e.target)) {
            hideProfileDropdown();
        }
    });

    // Enhanced sidebar navigation
    setupSidebarNavigation();
    
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';

            // External page navigation
            if (href && !href.startsWith('#')) {
                e.preventDefault();
                
                // Add loading state
                link.classList.add('loading');
                
                // Close sidebar on mobile
                if (appState.isMobile) {
                    appState.toggleSidebar();
                }
                
                // Navigate with delay for UX
                setTimeout(() => {
                    window.location.href = href;
                }, 200);
                return;
            }

            // Internal navigation (if any)
            e.preventDefault();
            if (appState.isMobile) {
                appState.toggleSidebar();
            }
        });
        
        // Add hover effects
        link.addEventListener('mouseenter', () => {
            if (!link.parentElement.classList.contains('active')) {
                link.style.transform = 'translateX(-2px)';
            }
        });
        
        link.addEventListener('mouseleave', () => {
            link.style.transform = '';
        });
    });
}


// أضف هذا الكود في جزء تهيئة الصفحة
function setupSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (!menuBtn || !sidebar) return;
    
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        appState.toggleSidebar();
    });
    
    // إغلاق القائمة عند النقر خارجها على الهواتف
    document.addEventListener('click', function(e) {
        if (appState.isMobile && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target) && 
            !sidebar.classList.contains('closed')) {
            sidebar.classList.add('closed');
            document.body.classList.remove('sidebar-open');
            menuBtn.setAttribute('aria-expanded', 'false');
            appState.updateMenuIcon();
        }
    });
    
    // منع إغلاق القائمة عند النقر داخلها
    sidebar.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// استدعاء الدالة عند التهيئة في دالة initializePage
function initializePage() {
    loadAdminInfo();
    setupEventListeners();
    loadCaptainsForFilter();
    loadRenewedSubscriptionsData();
    setDefaultDateFilters();
    appState.updateLayout();
    appState.updateMenuIcon();
    setupSidebar(); // أضف هذا السطر
    setupViewOptions();
    
    // Add loading animation to page
    document.body.classList.add('page-loaded');
}

// استدعاء الدالة عند التهيئة
// أضف هذا السطر في دالة initializePage
setupSidebar();

// Profile Management - إدارة الملف الشخصي
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        adminProfile.classList.toggle('active');
    }
}

function hideProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
        adminProfile.classList.remove('active');
    }
}

function handleLogout() {
    UIComponents.createConfirmDialog(
        'تسجيل الخروج',
        'هل أنت متأكد من تسجيل الخروج؟',
        () => {
            const loadingToast = UIComponents.createToast('جاري تسجيل الخروج...', 'info', 0);
            auth.signOut().then(() => {
                loadingToast.remove();
                window.location.href = 'index.html';
            });
        }
    );
}

// Data Loading Functions - دوال تحميل البيانات
async function loadCaptainsForFilter() {
    try {
        const captainsQuery = await db.collection('users')
            .where('role', '==', 'captain')
            .get();
        
        appState.captainsList = captainsQuery.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));

        if (captainFilter) {
            captainFilter.innerHTML = '<option value="all">جميع الكباتن</option>';
            appState.captainsList.forEach(captain => {
                const option = document.createElement('option');
                option.value = captain.id;
                option.textContent = captain.name;
                captainFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading captains:', error);
        UIComponents.createToast('حدث خطأ في تحميل قائمة الكباتن', 'error');
    }
}

async function loadRenewedSubscriptionsData() {
    try {
        showGlobalLoading('جاري تحميل الاشتراكات المجددة...');
        
        const subscriptionsQuery = await db.collection('subscriptions')
            .where('isRenewal', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        appState.renewedSubscriptionsData = [];
        
        // Process data with loading animation
        const promises = subscriptionsQuery.docs.map(async (doc) => {
            const sub = doc.data();
            sub.id = doc.id;

            // Get member data
            const memberDoc = await db.collection('members').doc(sub.memberId).get();
            if (memberDoc.exists) {
                const memberData = memberDoc.data();
                sub.memberName = memberData.name;
                sub.memberPhone = memberData.phone;
                sub.status = memberData.status || 'active';
                sub.cancelReason = memberData.cancelReason || '';
            } else {
                sub.memberName = 'مشترك محذوف';
                sub.memberPhone = 'غير متوفر';
                sub.status = 'active';
                sub.cancelReason = '';
            }

            // Get captain data
            const captainDoc = await db.collection('users').doc(sub.createdBy).get();
            sub.captainName = captainDoc.exists ? captainDoc.data().name : 'غير معروف';
            
            return sub;
        });

        appState.renewedSubscriptionsData = await Promise.all(promises);
        appState.filteredRenewedSubscriptions = [...appState.renewedSubscriptionsData];
        
        renderRenewedSubscriptionsCards();
        updatePagination();
        hideGlobalLoading();
        
    } catch (error) {
        console.error('Error loading renewed subscriptions:', error);
        hideGlobalLoading();
        UIComponents.createToast('حدث خطأ في تحميل الاشتراكات المجددة: ' + error.message, 'error');
        
        // Show error state
        const cardsContainer = document.getElementById('renewedSubscriptionsCards');
        if (cardsContainer) {
            cardsContainer.innerHTML = `
                <div class="error-state">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    <h3>خطأ في تحميل البيانات</h3>
                    <p>${error.message}</p>
                    <button class="retry-btn" onclick="loadRenewedSubscriptionsData()">
                        <ion-icon name="refresh-outline"></ion-icon>
                        إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }
}

// Enhanced Filtering - تصفية محسّنة
function applyFilters() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedCaptain = captainFilter?.value || 'all';
    const selectedType = typeFilter?.value || 'all';
    const selectedStatus = statusFilter?.value || 'all';
    const startFilterDate = startDateFilter?.value ? new Date(startDateFilter.value) : null;
    const endFilterDate = endDateFilter?.value ? new Date(endDateFilter.value) : null;

    appState.filteredRenewedSubscriptions = appState.renewedSubscriptionsData.filter(sub => {
        const matchesSearch = searchTerm === '' || 
            (sub.memberName && sub.memberName.toLowerCase().includes(searchTerm)) || 
            (sub.captainName && sub.captainName.toLowerCase().includes(searchTerm));
        
        const matchesCaptain = selectedCaptain === 'all' || sub.createdBy === selectedCaptain;
        const matchesType = selectedType === 'all' || sub.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;

        let matchesDate = true;
        if (startFilterDate || endFilterDate) {
            const subDate = sub.createdAt ? (sub.createdAt.toDate ? sub.createdAt.toDate() : new Date(sub.createdAt)) : null;
            
            if (subDate) {
                // Normalize dates to compare only day, month, year
                const normalizedSubDate = new Date(subDate.getFullYear(), subDate.getMonth(), subDate.getDate());
                
                if (startFilterDate) {
                    const normalizedStartDate = new Date(startFilterDate.getFullYear(), startFilterDate.getMonth(), startFilterDate.getDate());
                    if (normalizedSubDate < normalizedStartDate) matchesDate = false;
                }
                
                if (endFilterDate && matchesDate) {
                    const normalizedEndDate = new Date(endFilterDate.getFullYear(), endFilterDate.getMonth(), endFilterDate.getDate());
                    if (normalizedSubDate > normalizedEndDate) matchesDate = false;
                }
            } else {
                matchesDate = false;
            }
        }
        
        return matchesSearch && matchesCaptain && matchesType && matchesStatus && matchesDate;
    });
    
    appState.currentPage = 1;
    renderRenewedSubscriptionsCards();
    updatePagination();
    
    // Show filter results count
    const resultsCount = appState.filteredRenewedSubscriptions.length;
    const totalCount = appState.renewedSubscriptionsData.length;
    
    if (resultsCount !== totalCount) {
        UIComponents.createToast(`تم العثور على ${resultsCount} نتيجة من أصل ${totalCount}`, 'info', 3000);
    }
}

// Enhanced Card Rendering - رندر الكاردز المحسّن
function renderRenewedSubscriptionsCards() {
    const cardsContainer = document.getElementById('renewedSubscriptionsCards');
    if (!cardsContainer) return;

    // Show loading state
    cardsContainer.innerHTML = Array(6).fill(UIComponents.createLoadingCard()).join('');

    setTimeout(() => {
        if (appState.filteredRenewedSubscriptions.length === 0) {
            cardsContainer.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="document-outline"></ion-icon>
                    <h3>لا توجد نتائج</h3>
                    <p>لا توجد اشتراكات مجددة مطابقة للبحث</p>
                    <button class="filter-btn" onclick="clearFilters()">
                        <ion-icon name="refresh-outline"></ion-icon>
                        مسح الفلاتر
                    </button>
                </div>
            `;
            return;
        }

        const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
        const endIndex = Math.min(startIndex + appState.itemsPerPage, appState.filteredRenewedSubscriptions.length);
        
        const cards = [];
        for (let i = startIndex; i < endIndex; i++) {
            const sub = appState.filteredRenewedSubscriptions[i];
            cards.push(createEnhancedSubscriptionCard(sub));
        }
        
        cardsContainer.innerHTML = cards.join('');
        
        // Add animation to new cards
        const newCards = cardsContainer.querySelectorAll('.subscription-card');
        newCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 50}ms`;
            card.classList.add('fade-in');
            appState.observer.observe(card);
        });
    }, 300);
}

function createEnhancedSubscriptionCard(sub) {
    const statusClass = getStatusClass(sub.status);
    const statusText = getStatusArabic(sub.status);
    
    return `
        <div class="subscription-card" data-id="${sub.id}">
            <div class="card-header">
                <h3>${sub.memberName || 'غير محدد'}</h3>
                <span class="status-badge ${statusClass}">
                    <ion-icon name="${getStatusIcon(sub.status)}"></ion-icon>
                    ${statusText}
                </span>
            </div>
            
            <div class="card-body">
                <div class="card-detail">
                    <span>نوع الاشتراك:</span>
                    <span class="subscription-type">${getSubscriptionTypeArabic(sub.type)}</span>
                </div>
                
                <div class="card-detail">
                    <span>تاريخ البداية:</span>
                    <span>${formatDate(sub.startDate)}</span>
                </div>
                
                <div class="card-detail">
                    <span>تاريخ النهاية:</span>
                    <span>${formatDate(sub.endDate)}</span>
                </div>
                
                <div class="card-detail">
                    <span>السعر:</span>
                    <span class="price">${formatCurrency(sub.price)}</span>
                </div>
                
                <div class="card-detail">
                    <span>طريقة الدفع:</span>
                    <span>${getPaymentMethodArabic(sub.paymentMethod)}</span>
                </div>
                
                <div class="card-detail">
                    <span>الكابتن المجدد:</span>
                    <span>${sub.captainName || 'غير معروف'}</span>
                </div>
                
                <div class="card-detail">
                    <span>تاريخ التجديد:</span>
                    <span>${formatDate(sub.createdAt)}</span>
                </div>
                
                ${sub.status === 'cancelled' && sub.cancelReason ? `
                <div class="card-detail cancel-reason">
                    <span>سبب الإلغاء:</span>
                    <span title="${sub.cancelReason}">${sub.cancelReason}</span>
                </div>` : ''}
            </div>
            
            <div class="card-actions">
                ${sub.status === 'cancelled' ?
                    `<button class="action-btn restore-btn" onclick="restoreSubscription('${sub.memberId}', '${sub.memberName}', '${sub.id}')">
                        <ion-icon name="refresh-outline"></ion-icon>
                        استرجاع
                    </button>` :
                    `<button class="action-btn cancel-btn" onclick="cancelSubscription('${sub.memberId}', '${sub.memberName}', '${sub.id}')">
                        <ion-icon name="close-circle-outline"></ion-icon>
                        إلغاء
                    </button>`
                }
                <button class="action-btn delete-btn" onclick="deleteRenewedSubscription('${sub.id}', '${sub.memberName}', '${sub.type}')">
                    <ion-icon name="trash-outline"></ion-icon>
                    حذف
                </button>
            </div>
        </div>
    `;
}

// Helper Functions - دوال مساعدة
function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'cancelled': return 'status-cancelled';
        case 'expired': return 'status-expired';
        default: return 'status-active';
    }
}

function getStatusArabic(status) {
    switch (status) {
        case 'active': return 'نشط';
        case 'cancelled': return 'ملغي';
        case 'expired': return 'منتهي';
        default: return status;
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'active': return 'checkmark-circle-outline';
        case 'cancelled': return 'close-circle-outline';
        case 'expired': return 'time-outline';
        default: return 'help-circle-outline';
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

function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        if (isNaN(date.getTime())) return 'غير محدد';
        
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
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

// Action Functions - دوال الإجراءات
async function cancelSubscription(memberId, memberName, subscriptionId) {
    const reason = await promptWithModal('سبب الإلغاء', `يرجى إدخال سبب إلغاء اشتراك المشترك ${memberName}:`);
    if (!reason) return;

    UIComponents.createConfirmDialog(
        'تأكيد الإلغاء',
        `هل أنت متأكد من إلغاء اشتراك المشترك ${memberName}؟`,
        async () => {
            try {
                const loadingToast = UIComponents.createToast('جاري إلغاء الاشتراك...', 'info', 0);
                
                const user = auth.currentUser;
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.exists ? userDoc.data() : {};

                await db.collection('members').doc(memberId).update({
                    status: 'cancelled',
                    cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
                    cancelledBy: user.uid,
                    cancelledByName: userData.name || user.email || 'مدير النظام',
                    cancelReason: reason
                });

                await db.collection('audit_logs').add({
                    action: 'cancel_subscription',
                    targetId: memberId,
                    targetName: memberName,
                    by: user.uid,
                    byName: userData.name || user.email || 'مدير النظام',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    details: {
                        subscriptionId: subscriptionId,
                        reason: reason
                    }
                });
                
                loadingToast.remove();
                UIComponents.createToast(`تم إلغاء اشتراك المشترك ${memberName} بنجاح`, 'success');
                loadRenewedSubscriptionsData();

                
            } catch (error) {
                console.error('Error cancelling subscription:', error);
                UIComponents.createToast('حدث خطأ في إلغاء الاشتراك: ' + error.message, 'error');
            }
        }
    );
}

async function restoreSubscription(memberId, memberName, subscriptionId) {
    UIComponents.createConfirmDialog(
        'تأكيد الاسترجاع',
        `هل أنت متأكد من استرجاع اشتراك المشترك ${memberName}؟`,
        async () => {
            try {
                const loadingToast = UIComponents.createToast('جاري استرجاع الاشتراك...', 'info', 0);
                
                const user = auth.currentUser;
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.exists ? userDoc.data() : {};

                await db.collection('members').doc(memberId).update({
                    status: 'active',
                    restoredAt: firebase.firestore.FieldValue.serverTimestamp(),
                    restoredBy: user.uid,
                    restoredByName: userData.name || user.email || 'مدير النظام',
                    cancelReason: firebase.firestore.FieldValue.delete()
                });

                await db.collection('audit_logs').add({
                    action: 'restore_subscription',
                    targetId: memberId,
                    targetName: memberName,
                    by: user.uid,
                    byName: userData.name || user.email || 'مدير النظام',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    details: {
                        subscriptionId: subscriptionId
                    }
                });
                
                loadingToast.remove();
                UIComponents.createToast(`تم استرجاع اشتراك المشترك ${memberName} بنجاح`, 'success');
                loadRenewedSubscriptionsData();
                
            } catch (error) {
                console.error('Error restoring subscription:', error);
                UIComponents.createToast('حدث خطأ في استرجاع الاشتراك: ' + error.message, 'error');
            }
        }
    );
}

async function deleteRenewedSubscription(subscriptionId, memberName, subscriptionType) {
    UIComponents.createConfirmDialog(
        'تأكيد الحذف',
        `هل أنت متأكد من حذف تجديد الاشتراك (${getSubscriptionTypeArabic(subscriptionType)}) للمشترك ${memberName}؟ هذه العملية لا يمكن التراجع عنها.`,
        async () => {
            try {
                const loadingToast = UIComponents.createToast('جاري حذف التجديد...', 'info', 0);
                
                const user = auth.currentUser;
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.exists ? userDoc.data() : {};

                // Delete the renewal subscription
                await db.collection('subscriptions').doc(subscriptionId).delete();

                // Delete related payments
                const paymentsQuery = await db.collection('payments')
                    .where('refId', '==', subscriptionId)
                    .where('type', '==', 'renewal')
                    .get();
                
                const batch = db.batch();
                paymentsQuery.forEach(doc => {
                    batch.delete(db.collection('payments').doc(doc.id));
                });
                await batch.commit();

                // Log the action
                await db.collection('audit_logs').add({
                    action: 'delete_renewal',
                    targetId: subscriptionId,
                    targetName: `تجديد ${getSubscriptionTypeArabic(subscriptionType)} للمشترك ${memberName}`,
                    by: user.uid,
                    byName: userData.name || user.email || 'مدير النظام',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    details: {
                        memberId: appState.renewedSubscriptionsData.find(s => s.id === subscriptionId)?.memberId,
                        subscriptionType: subscriptionType,
                        deletedPaymentsCount: paymentsQuery.size
                    }
                });

                loadingToast.remove();
                UIComponents.createToast('تم حذف التجديد بنجاح', 'success');
                loadRenewedSubscriptionsData();

            } catch (error) {
                console.error('Error deleting renewed subscription:', error);
                UIComponents.createToast('حدث خطأ في حذف التجديد: ' + error.message, 'error');
            }
        }
    );
}

// Enhanced Prompt Modal
async function promptWithModal(title, message, placeholder = '') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay prompt-modal';
        modal.innerHTML = `
            <div class="modal prompt-modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <textarea id="promptInput" placeholder="${placeholder}" rows="3"></textarea>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn" id="promptCancel">إلغاء</button>
                    <button class="save-btn" id="promptOk">تأكيد</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        const input = modal.querySelector('#promptInput');
        const cancelBtn = modal.querySelector('#promptCancel');
        const okBtn = modal.querySelector('#promptOk');
        
        const cleanup = () => {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            setTimeout(() => modal.remove(), 300);
        };
        
        input.focus();
        
        cancelBtn.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });
        
        okBtn.addEventListener('click', () => {
            const value = input.value.trim();
            if (value) {
                cleanup();
                resolve(value);
            } else {
                input.style.borderColor = 'var(--danger-color)';
                input.focus();
            }
        });
        
        input.addEventListener('input', () => {
            input.style.borderColor = '';
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                okBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });
    });
}

// Pagination Functions - دوال التصفح
function updatePagination() {
    const totalPages = Math.ceil(appState.filteredRenewedSubscriptions.length / appState.itemsPerPage);
    
    if (pageInfo) {
        pageInfo.innerHTML = `
            <span>الصفحة ${appState.currentPage} من ${totalPages}</span>
            <small>(${appState.filteredRenewedSubscriptions.length} نتيجة)</small>
        `;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = appState.currentPage === 1;
        prevPageBtn.classList.toggle('disabled', appState.currentPage === 1);
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = appState.currentPage === totalPages || totalPages === 0;
        nextPageBtn.classList.toggle('disabled', appState.currentPage === totalPages || totalPages === 0);
    }
}

function goToPrevPage() {
    if (appState.currentPage > 1) {
        appState.currentPage--;
        renderRenewedSubscriptionsCards();
        updatePagination();
        scrollToTop();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(appState.filteredRenewedSubscriptions.length / appState.itemsPerPage);
    
    if (appState.currentPage < totalPages) {
        appState.currentPage++;
        renderRenewedSubscriptionsCards();
        updatePagination();
        scrollToTop();
    }
}

function scrollToTop() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Utility Functions - دوال مساعدة
function setDefaultDateFilters() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (startDateFilter) {
        startDateFilter.value = firstDayOfMonth.toISOString().split('T')[0];
    }
    if (endDateFilter) {
        endDateFilter.value = today.toISOString().split('T')[0];
    }
}

function clearFilters() {
    if (searchInput) searchInput.value = '';
    if (captainFilter) captainFilter.value = 'all';
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (startDateFilter) startDateFilter.value = '';
    if (endDateFilter) endDateFilter.value = '';
    
    setDefaultDateFilters();
    applyFilters();
    UIComponents.createToast('تم مسح جميع الفلاتر', 'success', 2000);
}

// Global Loading Functions - دوال التحميل العامة
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
    requestAnimationFrame(() => {
        loading.classList.add('show');
    });
}

function hideGlobalLoading() {
    const loading = document.getElementById('globalLoading');
    if (loading) {
        loading.classList.remove('show');
        setTimeout(() => loading.remove(), 300);
    }
}

// Export functions for global access - تصدير الدوال للوصول العام
window.cancelSubscription = cancelSubscription;
window.restoreSubscription = restoreSubscription;
window.deleteRenewedSubscription = deleteRenewedSubscription;
window.clearFilters = clearFilters;
window.loadRenewedSubscriptionsData = loadRenewedSubscriptionsData;
window.promptWithModal = promptWithModal; // تم إضافة هذا السطر لحل المشكلة

// Initialize when DOM is ready - التهيئة عند جاهزية DOM
document.addEventListener('DOMContentLoaded', () => {
    // Add page loading class
    document.body.classList.add('loading');
    
    // Remove loading class after a short delay
    setTimeout(() => {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
    }, 500);
});

// Service Worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}