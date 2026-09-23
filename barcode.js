// Lấy thông tin từ URL query params
const params = new URLSearchParams(window.location.search);
const employeeId = params.get('id');
const employeeName = params.get('name') ? decodeURIComponent(params.get('name')) : '';

// Render thông tin nhân viên
document.getElementById('empName').textContent = employeeName || 'Nhân viên';
document.getElementById('empId').textContent = employeeId || '--';

// Tạo Barcode
if (employeeId) {
    JsBarcode('#barcode', employeeId, {
        format: 'CODE128',
        width: 3,
        height: 100,
        displayValue: false,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 12,
        valid: function(valid) {
            if (!valid) document.getElementById('barcode').style.display = 'none';
        }
    });
} else {
    document.getElementById('empName').textContent = 'Không tìm thấy mã nhân viên';
    document.getElementById('empId').textContent = '--';
}

// Chỉ iOS Safari mới cần CSS transform fallback
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

let isLandscapeMode = false;

async function toggleFullscreen() {
    const icon = document.getElementById('fullscreenIcon');
    isLandscapeMode = !isLandscapeMode;

    if (isLandscapeMode) {
        icon.className = 'fas fa-compress';
        document.body.classList.add('landscape-mode');

        if (isIOS()) {
            // iOS: dùng CSS transform xoay body vì không có orientation lock
            applyIOSLandscape(true);
        } else {
            // Android hoặc PC DevTools: thử orientation lock (sẽ pass trên Android, fail im lặng trên PC)
            try { await screen.orientation.lock('landscape'); } catch (e) {}
        }

    } else {
        icon.className = 'fas fa-expand';
        document.body.classList.remove('landscape-mode');

        if (isIOS()) {
            applyIOSLandscape(false);
        } else {
            try { screen.orientation.unlock(); } catch (e) {}
        }
    }
}

// iOS Safari fallback: xoay body bằng CSS transform
function applyIOSLandscape(active) {
    if (active) {
        const w = window.innerHeight; // portrait height → landscape width
        const h = window.innerWidth;  // portrait width  → landscape height
        document.body.style.cssText = `
            transform: rotate(90deg);
            transform-origin: top left;
            width: ${w}px;
            height: ${h}px;
            position: fixed;
            top: 0;
            left: ${h}px;
            overflow: hidden;
            background: #ffffff;
        `;
    } else {
        document.body.style.cssText = '';
    }
}
