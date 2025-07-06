// API Base URL - Thay đổi theo backend của bạn
const API_BASE_URL = 'http://localhost:8082/api';

// Global variables
let currentTab = 'rooms';
let currentEditId = null;
let currentEditType = null;
let customers = [];
let rooms = [];
let roomTypes = [];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    loadInitialData();
});

// Tab Navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;
    loadDataForTab(tabName);
}

// Load initial data
async function loadInitialData() {
    showLoading();
    try {
        await Promise.all([
            loadCustomers(),
            loadRooms(),
            loadRoomTypes()
        ]);
        loadDataForTab(currentTab);
    } catch (error) {
        showError('Lỗi khi tải dữ liệu ban đầu: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Load data for specific tab
async function loadDataForTab(tabName) {
    showLoading();
    try {
        switch (tabName) {
            case 'rooms':
                await loadRooms();
                break;
            case 'customers':
                await loadCustomers();
                break;
            case 'bookings':
                await loadBookings();
                break;
            case 'room-types':
                await loadRoomTypes();
                break;
        }
    } catch (error) {
        showError('Lỗi khi tải dữ liệu: ' + error.message);
    } finally {
        hideLoading();
    }
}

// API Functions
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
}

// CRUD Operations for Rooms
async function loadRooms() {
    try {
        const data = await apiCall('/rooms');
        rooms = data;
        renderRoomsTable(data);
    } catch (error) {
        showError('Lỗi khi tải danh sách phòng: ' + error.message);
    }
}

function renderRoomsTable(rooms) {
    const tbody = document.getElementById('roomsTableBody');
    if (!rooms || rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-bed"></i>
                    <h3>Chưa có phòng nào</h3>
                    <p>Hãy thêm phòng đầu tiên!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = rooms.map(room => `
        <tr>
            <td>${room.id}</td>
            <td>${room.roomNumber}</td>
            <td><span class="status-badge status-${room.status?.toLowerCase() || 'available'}">${room.status || 'AVAILABLE'}</span></td>
            <td>${room.typeName || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editItem('room', ${room.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('room', ${room.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// CRUD Operations for Customers
async function loadCustomers() {
    try {
        const data = await apiCall('/customers');
        customers = data;
        renderCustomersTable(data);
    } catch (error) {
        showError('Lỗi khi tải danh sách khách hàng: ' + error.message);
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customersTableBody');
    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>Chưa có khách hàng nào</h3>
                    <p>Hãy thêm khách hàng đầu tiên!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${customer.fullName}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${customer.idCard || 'N/A'}</td>
            <td>${customer.address || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editItem('customer', ${customer.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('customer', ${customer.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// CRUD Operations for Bookings
async function loadBookings() {
    try {
        const data = await apiCall('/bookings');
        renderBookingsTable(data);
    } catch (error) {
        showError('Lỗi khi tải danh sách đặt phòng: ' + error.message);
    }
}

function renderBookingsTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!bookings || bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <h3>Chưa có đặt phòng nào</h3>
                    <p>Hãy tạo đặt phòng đầu tiên!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.bookingId}</td>
            <td>${getCustomerName(booking.customerId)}</td>
            <td>${getRoomNumber(booking.roomId)}</td>
            <td>${formatDateTime(booking.checkInTime)}</td>
            <td>${formatDateTime(booking.checkOutTime)}</td>
            <td><span class="status-badge status-${booking.status?.toLowerCase() || 'pending'}">${booking.status || 'PENDING'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editItem('booking', ${booking.bookingId})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('booking', ${booking.bookingId})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// CRUD Operations for Room Types
async function loadRoomTypes() {
    try {
        const data = await apiCall('/room-types');
        roomTypes = data;
        renderRoomTypesTable(data);
    } catch (error) {
        showError('Lỗi khi tải danh sách loại phòng: ' + error.message);
    }
}

function renderRoomTypesTable(roomTypes) {
    const tbody = document.getElementById('roomTypesTableBody');
    if (!roomTypes || roomTypes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <i class="fas fa-tags"></i>
                    <h3>Chưa có loại phòng nào</h3>
                    <p>Hãy thêm loại phòng đầu tiên!</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = roomTypes.map(type => `
        <tr>
            <td>${type.id}</td>
            <td>${type.name}</td>
            <td>${formatCurrency(type.pricePerHour)}/giờ</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editItem('roomType', ${type.id})">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('roomType', ${type.id})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Modal Functions
function openModal(type, editId = null) {
    currentEditType = type;
    currentEditId = editId;
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('dataForm');
    
    modalTitle.textContent = editId ? 'Chỉnh sửa' : 'Thêm mới';
    form.innerHTML = generateFormFields(type, editId);
    
    modal.style.display = 'block';
    
    if (editId) {
        loadDataForEdit(type, editId);
    }
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    currentEditId = null;
    currentEditType = null;
}

function generateFormFields(type, editId) {
    switch (type) {
        case 'room':
            return `
                <div class="form-group">
                    <label for="roomNumber">Số phòng *</label>
                    <input type="text" id="roomNumber" required>
                </div>
                <div class="form-group">
                    <label for="roomStatus">Trạng thái</label>
                    <select id="roomStatus">
                        <option value="AVAILABLE">Có sẵn</option>
                        <option value="OCCUPIED">Đã thuê</option>
                        <option value="MAINTENANCE">Bảo trì</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="roomTypeId">Loại phòng *</label>
                    <select id="roomTypeId" required>
                        <option value="">Chọn loại phòng</option>
                        ${roomTypes.map(type => `<option value="${type.id}">${type.name}</option>`).join('')}
                    </select>
                </div>
            `;
            
        case 'customer':
            return `
                <div class="form-group">
                    <label for="fullName">Họ tên *</label>
                    <input type="text" id="fullName" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="phone">Số điện thoại *</label>
                        <input type="tel" id="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email">
                    </div>
                </div>
                <div class="form-group">
                    <label for="idCard">CMND/CCCD</label>
                    <input type="text" id="idCard">
                </div>
                <div class="form-group">
                    <label for="address">Địa chỉ</label>
                    <textarea id="address" rows="3"></textarea>
                </div>
            `;
            
        case 'booking':
            return `
                <div class="form-group">
                    <label for="customerId">Khách hàng *</label>
                    <select id="customerId" required>
                        <option value="">Chọn khách hàng</option>
                        ${customers.map(customer => `<option value="${customer.id}">${customer.fullName} - ${customer.phone}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="roomId">Phòng *</label>
                    <select id="roomId" required>
                        <option value="">Chọn phòng</option>
                        ${rooms.filter(room => room.status === 'AVAILABLE').map(room => `<option value="${room.id}">${room.roomNumber} - ${room.typeName}</option>`).join('')}
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="checkInTime">Check-in *</label>
                        <input type="datetime-local" id="checkInTime" required>
                    </div>
                    <div class="form-group">
                        <label for="checkOutTime">Check-out *</label>
                        <input type="datetime-local" id="checkOutTime" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="bookingStatus">Trạng thái</label>
                    <select id="bookingStatus">
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                </div>
            `;
            
        case 'roomType':
            return `
                <div class="form-group">
                    <label for="typeName">Tên loại phòng *</label>
                    <input type="text" id="typeName" required>
                </div>
                <div class="form-group">
                    <label for="pricePerHour">Giá/giờ (VNĐ) *</label>
                    <input type="number" id="pricePerHour" min="0" step="1000" required>
                </div>
            `;
            
        default:
            return '<p>Loại không hợp lệ</p>';
    }
}

async function loadDataForEdit(type, id) {
    try {
        let data;
        switch (type) {
            case 'room':
                data = await apiCall(`/rooms/${id}`);
                document.getElementById('roomNumber').value = data.roomNumber || '';
                document.getElementById('roomStatus').value = data.status || 'AVAILABLE';
                document.getElementById('roomTypeId').value = data.typeId || '';
                break;
            case 'customer':
                data = await apiCall(`/customers/${id}`);
                document.getElementById('fullName').value = data.fullName || '';
                document.getElementById('phone').value = data.phone || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('idCard').value = data.idCard || '';
                document.getElementById('address').value = data.address || '';
                break;
            case 'booking':
                data = await apiCall(`/bookings/${id}`);
                document.getElementById('customerId').value = data.customerId || '';
                document.getElementById('roomId').value = data.roomId || '';
                document.getElementById('checkInTime').value = formatDateTimeForInput(data.checkInTime);
                document.getElementById('checkOutTime').value = formatDateTimeForInput(data.checkOutTime);
                document.getElementById('bookingStatus').value = data.status || 'PENDING';
                break;
            case 'roomType':
                data = await apiCall(`/room-types/${id}`);
                document.getElementById('typeName').value = data.name || '';
                document.getElementById('pricePerHour').value = data.pricePerHour || '';
                break;
        }
    } catch (error) {
        showError('Lỗi khi tải dữ liệu để chỉnh sửa: ' + error.message);
    }
}

// Save Data
async function saveData() {
    const form = document.getElementById('dataForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showLoading();
    try {
        const data = collectFormData();
        
        if (currentEditId) {
            // Update
            await apiCall(`/${getEndpoint(currentEditType)}/${currentEditId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showSuccess('Cập nhật thành công!');
        } else {
            // Create
            await apiCall(`/${getEndpoint(currentEditType)}`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showSuccess('Thêm mới thành công!');
        }
        
        closeModal();
        loadDataForTab(currentTab);
    } catch (error) {
        showError('Lỗi khi lưu dữ liệu: ' + error.message);
    } finally {
        hideLoading();
    }
}

function collectFormData() {
    switch (currentEditType) {
        case 'room':
            return {
                roomNumber: document.getElementById('roomNumber').value,
                status: document.getElementById('roomStatus').value,
                typeId: parseInt(document.getElementById('roomTypeId').value)
            };
        case 'customer':
            return {
                fullName: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value || null,
                idCard: document.getElementById('idCard').value || null,
                address: document.getElementById('address').value || null
            };
        case 'booking':
            return {
                customerId: parseInt(document.getElementById('customerId').value),
                roomId: parseInt(document.getElementById('roomId').value),
                checkInTime: document.getElementById('checkInTime').value,
                checkOutTime: document.getElementById('checkOutTime').value,
                status: document.getElementById('bookingStatus').value
            };
        case 'roomType':
            return {
                name: document.getElementById('typeName').value,
                pricePerHour: parseFloat(document.getElementById('pricePerHour').value)
            };
        default:
            return {};
    }
}

// Delete Functions
function deleteItem(type, id) {
    currentEditType = type;
    currentEditId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentEditId = null;
    currentEditType = null;
}

async function confirmDelete() {
    showLoading();
    try {
        await apiCall(`/${getEndpoint(currentEditType)}/${currentEditId}`, {
            method: 'DELETE'
        });
        showSuccess('Xóa thành công!');
        closeDeleteModal();
        loadDataForTab(currentTab);
    } catch (error) {
        showError('Lỗi khi xóa: ' + error.message);
    } finally {
        hideLoading();
    }
}

// Edit Function
function editItem(type, id) {
    openModal(type, id);
}

// Search Functions
function searchRooms() {
    const searchTerm = document.getElementById('roomSearch').value.toLowerCase();
    const filteredRooms = rooms.filter(room => 
        room.roomNumber.toLowerCase().includes(searchTerm) ||
        room.status.toLowerCase().includes(searchTerm) ||
        (room.typeName && room.typeName.toLowerCase().includes(searchTerm))
    );
    renderRoomsTable(filteredRooms);
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const filteredCustomers = customers.filter(customer => 
        customer.fullName.toLowerCase().includes(searchTerm) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );
    renderCustomersTable(filteredCustomers);
}

function searchBookings() {
    const searchTerm = document.getElementById('bookingSearch').value.toLowerCase();
    // Implement booking search if needed
}

function searchRoomTypes() {
    const searchTerm = document.getElementById('roomTypeSearch').value.toLowerCase();
    const filteredRoomTypes = roomTypes.filter(type => 
        type.name.toLowerCase().includes(searchTerm)
    );
    renderRoomTypesTable(filteredRoomTypes);
}

// Utility Functions
function getEndpoint(type) {
    const endpoints = {
        'room': 'rooms',
        'customer': 'customers',
        'booking': 'bookings',
        'roomType': 'room-types'
    };
    return endpoints[type] || '';
}

function getCustomerName(customerId) {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.fullName : 'N/A';
}

function getRoomNumber(roomId) {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.roomNumber : 'N/A';
}

function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString('vi-VN');
}

function formatDateTimeForInput(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toISOString().slice(0, 16);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// UI Functions
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function showSuccess(message) {
    alert('✅ ' + message); // Simple alert for now
}

function showError(message) {
    alert('❌ ' + message); // Simple alert for now
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
} 