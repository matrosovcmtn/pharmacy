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
    

    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('editPharmacyModal'));
    modal.show();
}

// Функция для обновления данных аптеки
async function updatePharmacy() {
    const id = document.getElementById('editPharmacyId').value;
    const name = document.getElementById('editPharmacyName').value.trim();

    if (!name) {
        showNotification('Введите название аптеки', 'warning');
        return;
    }

    try {
        const data = { 
            name
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

// Глобальная переменная для хранения ID текущей аптеки
window.currentPharmacyId = null;

// Функция для просмотра товаров в аптеке
async function viewPharmacyProducts(pharmacyId, pharmacyName) {
    // ...
    // После получения товаров сохраняем их глобально
    window.lastPharmacyProducts = [];

    console.log('viewPharmacyProducts called with pharmacyId:', pharmacyId, 'pharmacyName:', pharmacyName);
    
    // Убедимся, что pharmacyId является числом
    if (typeof pharmacyId === 'string') {
        pharmacyId = parseInt(pharmacyId);
        console.log('Converted pharmacyId to number:', pharmacyId);
    }
    
    // Сохраняем ID аптеки в глобальной переменной
    window.currentPharmacyId = pharmacyId;
    console.log('Set window.currentPharmacyId to:', window.currentPharmacyId);
    
    try {
        console.log('Fetching products for pharmacy ID:', pharmacyId);
        const products = await apiGet(`/products/pharmacy/${pharmacyId}`);
window.lastPharmacyProducts = products;
        console.log('Products received:', products.length);
        
        // Передаем ID аптеки в функцию отображения
        displayPharmacyProducts(products, pharmacyName, pharmacyId, true);
        
        // Открытие модального окна
        const modal = new bootstrap.Modal(document.getElementById('viewProductsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading pharmacy products:', error);
    }
}

// --- Обработчик кнопки фильтрации ---
document.addEventListener('DOMContentLoaded', function() {
    const filterBtn = document.getElementById('applyProductFilters');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            const pharmacyName = document.getElementById('viewProductsModalLabel').textContent.replace('Товары в аптеке "', '').replace('"', '');
            const pharmacyId = window.currentPharmacyId;
            displayPharmacyProducts(window.lastPharmacyProducts || [], pharmacyName, pharmacyId, false);
        });
    }
});

// Функция для отображения товаров в аптеке
function displayPharmacyProducts(products, pharmacyName, pharmacyId, skipFilters) {
    // skipFilters=true — отрисовать без применения фильтров (после загрузки)
    if (!skipFilters) {
        // Берём оригинальный список
        products = window.lastPharmacyProducts || products || [];
    }

    // --- Фильтры ---
    const minPriceInput = document.getElementById('minPriceFilter');
    const maxPriceInput = document.getElementById('maxPriceFilter');
    const expiredOnlyCheckbox = document.getElementById('expiredOnlyFilter');

    let filteredProducts = products.slice();
    if (!skipFilters) {
        if (minPriceInput && minPriceInput.value) {
            filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPriceInput.value));
        }
        if (maxPriceInput && maxPriceInput.value) {
            filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPriceInput.value));
        }
        if (expiredOnlyCheckbox && expiredOnlyCheckbox.checked) {
            filteredProducts = filteredProducts.filter(p => isExpired(p.expiry_date));
        }
    }
    products = filteredProducts;

    console.log('displayPharmacyProducts called with:', {
        productsCount: products.length,
        pharmacyName,
        pharmacyId,
        productsData: products.length > 0 ? products[0] : 'No products'
    });
    
    const productsList = document.getElementById('pharmacyProductsList');
    productsList.innerHTML = '';
    
    // Сохраняем ID аптеки в атрибуте данных
    if (pharmacyId) {
        console.log('Setting pharmacyId from parameter:', pharmacyId);
        productsList.dataset.pharmacyId = pharmacyId;
    } else {
        // Если ID аптеки не передан, пробуем получить его из товаров
        const productPharmacyId = products.length > 0 ? products[0].pharmacy_id : null;
        if (productPharmacyId) {
            console.log('Setting pharmacyId from products:', productPharmacyId);
            productsList.dataset.pharmacyId = productPharmacyId;
        } else {
            // Если ID аптеки не найден в товарах, получаем его из URL
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if (id) {
                console.log('Setting pharmacyId from URL:', id);
                productsList.dataset.pharmacyId = id;
            } else {
                console.warn('Could not determine pharmacyId from any source!');
            }
        }
    }
    
    console.log('Final pharmacyId in dataset:', productsList.dataset.pharmacyId);
    
    // Обновление заголовка модального окна
    document.getElementById('viewProductsModalLabel').textContent = `Товары в аптеке "${pharmacyName}"`;

    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">Нет товаров в этой аптеке</td>';
        productsList.appendChild(row);
        return;
    }

    (async () => {
        // Получаем роль пользователя и id пользователя
        let userRole = null;
        let userId = null;
        try {
            const user = await getCurrentUser();
            userRole = user && user.role ? user.role : null;
            userId = user && user.id ? user.id : null;
        } catch (e) {
            userRole = null;
            userId = null;
        }

        products.forEach(product => {
            const row = document.createElement('tr');
            // Добавляем класс для просроченных товаров
            if (isExpired(product.expiry_date)) {
                row.classList.add('expired');
            }
            
            // Получаем ID аптеки из атрибута данных
            const currentPharmacyId = parseInt(productsList.dataset.pharmacyId);
            
            // Создаем базовую структуру строки
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.dosages.join(', ')}</td>
                <td>${product.price.toFixed(2)} руб.</td>
                <td>${product.quantity_in_pharmacy}</td>
                <td>${formatDate(product.expiry_date)}</td>
                <td id="delete-cell-${product.id}"></td>
            `;
            
            // Кнопка удаления для директора (владелец аптеки)
            if (userRole === 'director' && product.pharmacy_director_id === userId) {
                const deleteButton = document.createElement('button');
                deleteButton.className = 'btn btn-sm btn-danger';
                deleteButton.textContent = 'Удалить';
                deleteButton.title = 'Удалить товар из аптеки';
                deleteButton.addEventListener('click', function() {
                    const pid = product.id;
                    const phid = currentPharmacyId;
                    deleteProductFromPharmacy(pid, phid);
                });
                const deleteCell = row.querySelector(`#delete-cell-${product.id}`);
                deleteCell.appendChild(deleteButton);
            } else {
                // Для других ролей или если не владелец — пустая ячейка
                const deleteCell = row.querySelector(`#delete-cell-${product.id}`);
                deleteCell.textContent = '';
            }
            productsList.appendChild(row);
        });
    })();
}
