// JavaScript для страницы управления аптеками

document.addEventListener('DOMContentLoaded', function() {
    // Загрузка списка аптек при загрузке страницы
    loadPharmacies();

    // Обработчик отправки формы для добавления новой аптеки
    document.getElementById('pharmacyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addPharmacy();
    });

    // Обработчик для сохранения изменений аптеки
    document.getElementById('savePharmacyChanges').addEventListener('click', function() {
        updatePharmacy();
    });
});

// Функция для загрузки списка аптек
async function loadPharmacies() {
    try {
        const pharmacies = await apiGet('/pharmacies/');
        displayPharmacies(pharmacies);
    } catch (error) {
        console.error('Error loading pharmacies:', error);
    }
}

// Функция для отображения списка аптек
function displayPharmacies(pharmacies) {
    const pharmacyList = document.getElementById('pharmacyList');
    pharmacyList.innerHTML = '';

    pharmacies.forEach(pharmacy => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pharmacy.id}</td>
            <td>${pharmacy.name}</td>
            <td>${formatDate(pharmacy.current_date)}</td>
            <td>
                <button class="btn btn-sm btn-info btn-action" onclick="viewPharmacyProducts(${pharmacy.id}, '${pharmacy.name}')">
                    Товары
                </button>
                <button class="btn btn-sm btn-primary btn-action" onclick="editPharmacy(${pharmacy.id}, '${pharmacy.name}', '${pharmacy.current_date}')">
                    Редактировать
                </button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deletePharmacy(${pharmacy.id})">
                    Удалить
                </button>
            </td>
        `;
        pharmacyList.appendChild(row);
    });
}

// Функция для добавления новой аптеки
async function addPharmacy() {
    const nameInput = document.getElementById('pharmacyName');
    const name = nameInput.value.trim();

    if (!name) {
        showNotification('Введите название аптеки', 'warning');
        return;
    }

    try {
        const data = { name };
        const result = await apiPost('/pharmacies/', data);
        showNotification('Аптека успешно добавлена');
        nameInput.value = '';
        loadPharmacies();
    } catch (error) {
        console.error('Error adding pharmacy:', error);
    }
}

// Функция для редактирования аптеки
function editPharmacy(id, name, date) {
    document.getElementById('editPharmacyId').value = id;
    document.getElementById('editPharmacyName').value = name;
    
    // Форматирование даты для input типа datetime-local
    const dateObj = new Date(date);
    const formattedDate = dateObj.toISOString().slice(0, 16);
    document.getElementById('editPharmacyDate').value = formattedDate;
    
    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('editPharmacyModal'));
    modal.show();
}

// Функция для обновления данных аптеки
async function updatePharmacy() {
    const id = document.getElementById('editPharmacyId').value;
    const name = document.getElementById('editPharmacyName').value.trim();
    const currentDate = document.getElementById('editPharmacyDate').value;

    if (!name) {
        showNotification('Введите название аптеки', 'warning');
        return;
    }

    try {
        const data = { 
            name,
            current_date: new Date(currentDate).toISOString()
        };
        const result = await apiPut(`/pharmacies/${id}`, data);
        showNotification('Аптека успешно обновлена');
        
        // Закрытие модального окна
        const modal = bootstrap.Modal.getInstance(document.getElementById('editPharmacyModal'));
        modal.hide();
        
        // Обновление списка аптек
        loadPharmacies();
    } catch (error) {
        console.error('Error updating pharmacy:', error);
    }
}

// Функция для удаления аптеки
async function deletePharmacy(id) {
    if (!confirm('Вы уверены, что хотите удалить эту аптеку?')) {
        return;
    }

    try {
        const result = await apiDelete(`/pharmacies/${id}`);
        showNotification('Аптека успешно удалена');
        loadPharmacies();
    } catch (error) {
        console.error('Error deleting pharmacy:', error);
    }
}

// Функция для просмотра товаров в аптеке
async function viewPharmacyProducts(pharmacyId, pharmacyName) {
    try {
        const products = await apiGet(`/products/pharmacy/${pharmacyId}`);
        displayPharmacyProducts(products, pharmacyName);
        
        // Открытие модального окна
        const modal = new bootstrap.Modal(document.getElementById('viewProductsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading pharmacy products:', error);
    }
}

// Функция для отображения товаров в аптеке
function displayPharmacyProducts(products, pharmacyName) {
    const productsList = document.getElementById('pharmacyProductsList');
    productsList.innerHTML = '';
    
    // Обновление заголовка модального окна
    document.getElementById('viewProductsModalLabel').textContent = `Товары в аптеке "${pharmacyName}"`;

    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">Нет товаров в этой аптеке</td>';
        productsList.appendChild(row);
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        // Добавляем класс для просроченных товаров
        if (isExpired(product.expiry_date)) {
            row.classList.add('expired');
        }
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.dosages.join(', ')}</td>
            <td>${product.price.toFixed(2)} руб.</td>
            <td>${product.quantity}</td>
            <td>${formatDate(product.expiry_date)}</td>
        `;
        productsList.appendChild(row);
    });
}
