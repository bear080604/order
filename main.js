// API Configuration
const API_URL = 'https://apiorder.phuonganhkhanh683.workers.dev/api/menu';

// State
let employees = [];
let isLoading = false;

// Cache
const CACHE_KEY = 'employees_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility: Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// Cache utilities
function saveToCache(data) {
    try {
        const cache = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('Cache save error:', e);
    }
}

function getFromCache() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        
        const cache = JSON.parse(cached);
        const isExpired = (Date.now() - cache.timestamp) > CACHE_DURATION;
        
        return isExpired ? null : cache.data;
    } catch (e) {
        console.error('Cache read error:', e);
        return null;
    }
}

// CRUD: READ - Load all employees
async function loadEmployees() {
    if (isLoading) return;
    isLoading = true;
    
    // Try cache first
    const cachedData = getFromCache();
    if (cachedData) {
        employees = cachedData;
        renderEmployeeGrid();
        updateDateDisplay();
        isLoading = false;
        
        // Load fresh data in background
        loadFreshData();
        return;
    }
    
    // No cache, load from API
    await loadFreshData();
}

async function loadFreshData() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            employees = result.data;
            saveToCache(employees);
            renderEmployeeGrid();
            updateDateDisplay();
        }
    } catch (error) {
        console.error('Load error:', error);
        if (employees.length === 0) {
            showNotification('Lỗi tải dữ liệu: ' + error.message, 'error');
        }
    } finally {
        isLoading = false;
    }
}

// CRUD: CREATE/UPDATE - Save employee
async function saveEmployee(employeeData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Lưu thành công!', 'success');
            
            // Update cache immediately
            const existingIndex = employees.findIndex(e => e.id === employeeData.id);
            if (existingIndex >= 0) {
                employees[existingIndex] = employeeData;
            } else {
                employees.push(employeeData);
            }
            saveToCache(employees);
            renderEmployeeGrid();
            
            return true;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Lỗi lưu dữ liệu: ' + error.message, 'error');
        return false;
    }
}

// CRUD: DELETE - Delete employee
async function deleteEmployee(employeeId) {
    if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    
    try {
        const response = await fetch(`${API_URL}?id=${employeeId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification('Xóa thành công!', 'success');
            
            // Update cache immediately
            employees = employees.filter(e => e.id !== employeeId);
            saveToCache(employees);
            renderEmployeeGrid();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Lỗi xóa dữ liệu: ' + error.message, 'error');
    }
}

// Render employee grid
function renderEmployeeGrid() {
    const grid = document.getElementById('employeeGrid');
    const today = getTodayISO();
    
    if (!employees || employees.length === 0) {
        grid.innerHTML = '<p class="empty">Chưa có dữ liệu nhân viên</p>';
        return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    const tempDiv = document.createElement('div');
    
    tempDiv.innerHTML = employees.map(emp => {
        const todayMenu = emp.menu[today] || {};
        const hasSang = !!todayMenu.sang;
        const hasTrua = !!todayMenu.trua;
        const hasXe = !!todayMenu.xe;
        
        const initials = emp.name.split(' ').map(w => w[0]).slice(-2).join('');
        
        return `
            <div class="employee-card" data-id="${emp.id}">
                <div class="card-header">
                    <div class="avatar">${initials}</div>
                    <div class="employee-info">
                        <h3 class="employee-name">${emp.name}</h3>
                        <p class="employee-id">ID: ${emp.id}</p>
                    </div>
                    <button class="delete-btn" data-id="${emp.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="badges">
                    <span class="badge ${hasSang ? 'badge-breakfast' : 'badge-inactive'}">
                        <i class="fas fa-sun badge-icon"></i> Sáng
                    </span>
                    <span class="badge ${hasTrua ? 'badge-lunch' : 'badge-inactive'}">
                        <i class="fas fa-bowl-food badge-icon"></i> Trưa
                    </span>
                    <span class="badge ${hasXe ? 'badge-snack' : 'badge-inactive'}">
                        <i class="fas fa-cookie-bite badge-icon"></i> Xế
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = '';
    grid.appendChild(tempDiv);
    
    // Add event listeners after render
    grid.querySelectorAll('.employee-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn')) {
                goToDetail(card.dataset.id);
            }
        });
    });
    
    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEmployee(btn.dataset.id);
        });
    });
}

// Update date display
function updateDateDisplay() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = `Hôm nay, ${formatDate(new Date())}`;
    }
}

// Navigate to detail page
function goToDetail(employeeId) {
    window.location.href = `detail.html?id=${employeeId}`;
}

// Handle JSON modal submit
function handleJSONSubmit() {
    const textarea = document.querySelector('#jsonModal .json-input');
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
        showNotification('Vui lòng nhập dữ liệu JSON', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(jsonText);
        const items = Array.isArray(data) ? data : [data];
        
        let completed = 0;
        let total = items.length;
        
        // Save all items
        Promise.all(items.map(async (item) => {
            if (item.id && item.name && item.menu) {
                const success = await saveEmployee(item);
                if (success) completed++;
            }
        })).then(() => {
            if (completed > 0) {
                showNotification(`Đã lưu ${completed}/${total} nhân viên`, 'success');
                closeModal();
                textarea.value = '';
            }
        });
        
    } catch (error) {
        showNotification('Lỗi: JSON không hợp lệ - ' + error.message, 'error');
    }
}

// Modal controls
function openModal() {
    document.getElementById('jsonModal').classList.add('show');
}

function closeModal() {
    document.getElementById('jsonModal').classList.remove('show');
}

// Show notification
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
});
