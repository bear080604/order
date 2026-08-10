// API Configuration
const API_URL = 'https://apiorder.phuonganhkhanh683.workers.dev/api/menu';

// State Management
let users = [];
let currentUser = null;

// Date Utilities
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function toISODate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Initialize App
function init() {
    const today = new Date();
    document.getElementById('current-date').textContent = `Hôm nay, ${formatDate(today)}`;
    
    setupEventListeners();
    loadUsers();
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('add-btn').addEventListener('click', openModal);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('save-btn').addEventListener('click', saveJSON);
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('date-picker').addEventListener('change', updateDetailView);
    
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

// API Functions
async function loadUsers() {
    try {
        console.log('Đang tải từ:', API_URL);
        const response = await fetch(API_URL);
        console.log('Response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log('Data nhận được:', result);
        
        // API trả về {status: "success", data: [...]}
        if (result.status === "success" && Array.isArray(result.data)) {
            users = result.data;
        } else if (Array.isArray(result)) {
            // Trường hợp API trả về array trực tiếp
            users = result;
        } else {
            users = [];
        }
        
        console.log('Số người dùng:', users.length);
        renderUserList();
    } catch (error) {
        const errorMsg = error.message || 'Không thể kết nối API';
        document.getElementById('user-list').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <p>❌ Lỗi tải dữ liệu</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">${errorMsg}</p>
                <button onclick="loadUsers()" style="margin-top: 1rem; padding: 0.5rem 1rem; border: none; background: #3498db; color: white; border-radius: 8px; cursor: pointer;">
                    Thử lại
                </button>
            </div>
        `;
        console.error('Load error:', error);
    }
}

async function saveJSON() {
    const input = document.getElementById('json-input').value.trim();
    const messageEl = document.getElementById('modal-message');
    
    if (!input) {
        showMessage('Vui lòng nhập dữ liệu JSON', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(input);
        
        // Kiểm tra nếu là mảng
        if (Array.isArray(data)) {
            // Validate từng phần tử trong mảng
            for (const item of data) {
                if (!item.id || !item.name || !item.menu) {
                    throw new Error('Dữ liệu không đúng định dạng (thiếu id, name hoặc menu)');
                }
            }
            
            // Lưu từng người dùng
            let successCount = 0;
            for (const user of data) {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(user)
                });
                
                if (response.ok) successCount++;
            }
            
            showMessage(`Lưu thành công ${successCount}/${data.length} người dùng!`, 'success');
            
        } else {
            // Xử lý trường hợp dán 1 người dùng
            if (!data.id || !data.name || !data.menu) {
                throw new Error('Dữ liệu không đúng định dạng (thiếu id, name hoặc menu)');
            }
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to save');
            
            showMessage('Lưu thành công!', 'success');
        }
        
        document.getElementById('json-input').value = '';
        
        setTimeout(() => {
            closeModal();
            loadUsers();
        }, 1500);
        
    } catch (error) {
        showMessage('Lỗi: ' + error.message, 'error');
        console.error('Save error:', error);
    }
}

// UI Functions
function renderUserList() {
    const container = document.getElementById('user-list');
    const today = toISODate(new Date());
    
    if (users.length === 0) {
        container.innerHTML = '<p class="loading">Chưa có dữ liệu nhân viên</p>';
        return;
    }
    
    container.innerHTML = users.map(user => {
        const todayMenu = user.menu[today];
        let badgeHTML = '';
        
        if (todayMenu) {
            const meals = [];
            if (todayMenu.sang) meals.push('Sáng');
            if (todayMenu.trua) meals.push('Trưa');
            if (todayMenu.xe) meals.push('Xế');
            badgeHTML = `<div class="badge">${meals.join(' / ')}</div>`;
        } else {
            badgeHTML = '<div class="badge empty">Chưa có thực đơn hôm nay</div>';
        }
        
        return `
            <div class="user-card" data-id="${user.id}">
                <h3>${user.name}</h3>
                <p class="user-id">ID: ${user.id}</p>
                ${badgeHTML}
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => openDetail(card.dataset.id));
    });
}

function openDetail(userId) {
    currentUser = users.find(u => u.id === userId);
    if (!currentUser) return;
    
    document.getElementById('detail-name').textContent = currentUser.name;
    document.getElementById('detail-id').textContent = `ID: ${currentUser.id}`;
    
    const today = new Date();
    document.getElementById('date-picker').value = toISODate(today);
    
    updateDetailView();
    showScreen('detail-screen');
}

function updateDetailView() {
    if (!currentUser) return;
    
    const selectedDate = document.getElementById('date-picker').value;
    const menu = currentUser.menu[selectedDate] || {};
    
    document.getElementById('sang-meal').textContent = menu.sang || '-';
    document.getElementById('trua-meal').textContent = menu.trua || '-';
    document.getElementById('xe-meal').textContent = menu.xe || '-';
}

function goBack() {
    showScreen('main-screen');
    currentUser = null;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function openModal() {
    document.getElementById('modal').classList.add('active');
    document.getElementById('json-input').value = '';
    document.getElementById('modal-message').textContent = '';
    document.getElementById('modal-message').className = 'modal-message';
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function showMessage(text, type) {
    const messageEl = document.getElementById('modal-message');
    messageEl.textContent = text;
    messageEl.className = `modal-message ${type}`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
