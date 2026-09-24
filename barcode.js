const params = new URLSearchParams(window.location.search);
const employeeId = params.get('id');
const employeeName = params.get('name') ? decodeURIComponent(params.get('name')) : '';

document.getElementById('empName').textContent = employeeName || 'Nhân viên';
document.getElementById('empId').textContent = employeeId || '--';

// Barcode portrait
if (employeeId) {
    JsBarcode('#barcode', employeeId, {
        format: 'CODE128',
        width: 3,
        height: 100,
        displayValue: false,
        background: '#ffffff',
        lineColor: '#000000',
        margin: 12
    });
} else {
    document.getElementById('empName').textContent = 'Không tìm thấy mã nhân viên';
}

// ============================================================
// Landscape overlay toggle
// ============================================================
let isLandscape = false;

function toggleLandscape() {
    isLandscape = !isLandscape;
    const overlay = document.getElementById('landscapeOverlay');
    const icon    = document.getElementById('fullscreenIcon');

    if (isLandscape) {
        overlay.classList.add('active');
        icon.className = 'fas fa-compress';

        const svgL = document.getElementById('barcodeL');
        if (employeeId && !svgL.getAttribute('data-rendered')) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            // landscape-inner: 90vh × 90vw, padding 16px mỗi bên
            const innerW = vh * 0.9 - 32;
            const innerH = vw * 0.9 - 32;
            JsBarcode('#barcodeL', employeeId, {
                format: 'CODE128',
                width: Math.max(2, Math.round(innerW / 55)),
                height: Math.round(innerH),
                displayValue: false,
                background: '#ffffff',
                lineColor: '#000000',
                margin: 6
            });
            // preserveAspectRatio none → SVG stretch fill toàn bộ container
            svgL.setAttribute('preserveAspectRatio', 'none');
            svgL.setAttribute('data-rendered', '1');
        }

        // Mobile: thử lock landscape
        try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}

    } else {
        overlay.classList.remove('active');
        icon.className = 'fas fa-expand';
        try { screen.orientation.unlock(); } catch (e) {}
    }
}
