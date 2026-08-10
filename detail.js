// API Configuration
const API_URL = 'https://apiorder.phuonganhkhanh683.workers.dev/api/menu';

// State
let currentEmployee = null;
let selectedDate = new Date().toISOString().split('T')[0];

// Get employee ID from URL
function getEmployeeIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// CRUD: READ - Load employee detail
async function loadEmployeeDetail() {
    const employeeId = getEmployeeIdFromURL();
    
    if (!employeeId) {
        showNotification('Không tìm thấy ID nhân viên', 'error');
        setTimeout(() => window.location.href = 'index2.html', 2000);
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}?id=${employeeId}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            currentEmployee = result.data;
            renderEmployeeInfo();
            renderDateSelector();
            renderMenuForDate(selectedDate);
        } else {
            throw new Error('Không tìm thấy nhân viên');
        }
    } catch (error) {
        console.error('Load error:', error);
        showNotification('Lỗi tải dữ liệu: ' + error.message, 'error');
    }
}

// Render employee info header
function renderEmployeeInfo() {
    if (!currentEmployee) return;
    
    const initials = currentEmployee.name.split(' ').map(w => w[0]).slice(-2).join('');
    
    // Update header
    document.getElementById('headerName').textContent = currentEmployee.name;
    document.getElementById('headerId').textContent = `Mã NV: ${currentEmployee.id}`;
    
    // Render employee card
    const headerHTML = `
        <div class="employee-card">
            <div class="employee-header">
                <div class="avatar">${initials}</div>
                <div class="employee-details">
                    <h2 class="employee-name">${currentEmployee.name}</h2>
                    <p class="employee-id">Mã NV: ${currentEmployee.id}</p>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('employeeInfo');
    if (container) {
        container.innerHTML = headerHTML;
    }
}

// Render date selector
function renderDateSelector() {
    const selectorHTML = `
        <div class="date-card">
            <label class="date-label">Chọn ngày xem thực đơn</label>
            <input type="date" 
                   id="dateInput"
                   value="${selectedDate}"
                   class="date-input"
                   onchange="handleDateChange(this.value)">
        </div>
    `;
    
    const container = document.getElementById('dateSelector');
    if (container) {
        container.innerHTML = selectorHTML;
    }
}

// Handle date change
function handleDateChange(newDate) {
    selectedDate = newDate;
    renderMenuForDate(selectedDate);
}

// Render menu for selected date
function renderMenuForDate(date) {
    if (!currentEmployee) return;
    
    const menu = currentEmployee.menu[date] || {};
    const sang = menu.sang || 'Chưa có món';
    const trua = menu.trua || 'Chưa có món';
    const xe = menu.xe || 'Chưa có món';
    
    const menuHTML = `
        <div class="menu-grid">
            <!-- Món Sáng -->
            <div class="meal-card">
                <div class="meal-icon-wrapper breakfast">
                    <i class="fas fa-sun meal-icon breakfast"></i>
                </div>
                <div class="meal-content">
                    <h3 class="meal-title">Món Sáng</h3>
                    <p class="meal-description">${sang}</p>
                </div>
            </div>
            
            <!-- Món Trưa -->
            <div class="meal-card">
                <div class="meal-icon-wrapper lunch">
                    <i class="fas fa-bowl-food meal-icon lunch"></i>
                </div>
                <div class="meal-content">
                    <h3 class="meal-title">Món Trưa</h3>
                    <p class="meal-description">${trua}</p>
                </div>
            </div>
            
            <!-- Món Xế -->
            <div class="meal-card">
                <div class="meal-icon-wrapper snack">
                    <i class="fas fa-cookie-bite meal-icon snack"></i>
                </div>
                <div class="meal-content">
                    <h3 class="meal-title">Món Xế</h3>
                    <p class="meal-description">${xe}</p>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('menuDisplay');
    if (container) {
        container.innerHTML = menuHTML;
    }
}

// Update date display
function updateDateDisplay(date) {
    // Date already shown in header, no need for separate display
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
    loadEmployeeDetail();
});
