// JavaScript для страницы управления товарами

document.addEventListener('DOMContentLoaded', function() {
    // Загрузка списка товаров и поставщиков при загрузке страницы
    loadProducts();
    loadSuppliers();
    loadTotalCost();

    // Обработчик отправки формы для добавления нового товара
    document.getElementById('productForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addProduct();
    });

    // Обработчик для сохранения изменений товара
    document.getElementById('saveProductChanges').addEventListener('click', function() {
        updateProduct();
    });

    // Обработчик для добавления товара в аптеку
    document.getElementById('confirmAddToPharmacy').addEventListener('click', function() {
        addProductToPharmacy();
    });

    // Обработчики для фильтрации товаров
    document.getElementById('showExpiredProducts').addEventListener('click', function() {
        loadExpiredProducts();
    });

    document.getElementById('showAllProducts').addEventListener('click', function() {
        loadProducts();
    });
});

// Функция для загрузки списка товаров
async function loadProducts() {
    try {
        const products = await apiGet('/products/');
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Функция для загрузки просроченных товаров
async function loadExpiredProducts() {
    try {
        const products = await apiGet('/products/expired/');
        displayProducts(products);
    } catch (error) {
        console.error('Error loading expired products:', error);
    }
}

// Функция для загрузки общей стоимости товаров
async function loadTotalCost() {
    try {
        const totalCost = await apiGet('/products/total-cost/');
        document.getElementById('totalCost').textContent = totalCost.toFixed(2);
    } catch (error) {
        console.error('Error loading total cost:', error);
    }
}

// Функция для загрузки списка поставщиков
async function loadSuppliers() {
    try {
        const suppliers = await apiGet('/suppliers/');
        populateSupplierDropdowns(suppliers);
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

// Функция для загрузки списка аптек
async function loadPharmacies() {
    try {
        const pharmacies = await apiGet('/pharmacies/');
        populatePharmacyDropdown(pharmacies);
    } catch (error) {
        console.error('Error loading pharmacies:', error);
    }
}

// Функция для заполнения выпадающих списков поставщиков
function populateSupplierDropdowns(suppliers) {
    const supplierSelects = [
        document.getElementById('productPreferredSupplier'),
        document.getElementById('editProductPreferredSupplier')
    ];

    supplierSelects.forEach(select => {
        if (!select) return;
        
        // Очистка списка, оставляя только первый пустой элемент
        select.innerHTML = '<option value="">Выберите поставщика</option>';
        
        // Добавление поставщиков в список
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            select.appendChild(option);
        });
    });
}

// Функция для заполнения выпадающего списка аптек
function populatePharmacyDropdown(pharmacies) {
    const pharmacySelect = document.getElementById('addToPharmacySelect');
    if (!pharmacySelect) return;
    
    // Очистка списка
    pharmacySelect.innerHTML = '';
    
    // Добавление аптек в список
    pharmacies.forEach(pharmacy => {
        const option = document.createElement('option');
        option.value = pharmacy.id;
        option.textContent = pharmacy.name;
        pharmacySelect.appendChild(option);
    });
}

// Функция для отображения списка товаров
async function displayProducts(products) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    // Получаем роль пользователя
    let userRole = null;
    try {
        const user = await getCurrentUser();
        userRole = user && user.role ? user.role : null;
    } catch (e) {
        userRole = null;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Добавляем класс для просроченных товаров
        if (isExpired(product.expiry_date)) {
            row.classList.add('expired');
        }
        let addToPharmacyBtn = '';
        if (userRole !== 'supplier') {
            addToPharmacyBtn = `<button class="btn btn-sm btn-info btn-action" onclick="showAddToPharmacyModal(${product.id})">В аптеку</button>`;
        }
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.dosages.join(', ')}</td>
            <td>${product.price.toFixed(2)} руб.</td>
            <td>${product.quantity}</td>
            <td>${formatDate(product.expiry_date)}</td>
            <td>${product.preferred_supplier_id ? `ID: ${product.preferred_supplier_id}` : 'Не указан'}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-action" onclick="editProduct(${product.id})">Редактировать</button>
                ${addToPharmacyBtn}
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteProduct(${product.id})">Удалить</button>
            </td>
        `;
        productList.appendChild(row);
    });
}

// Функция для добавления нового товара
async function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const dosagesInput = document.getElementById('productDosages').value.trim();
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const expiryDate = document.getElementById('productExpiryDate').value;
    const preferredSupplierId = document.getElementById('productPreferredSupplier').value;

    if (!name || isNaN(price) || !dosagesInput || isNaN(quantity) || !expiryDate) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
        return;
    }

    // Преобразование строки с фасовками в массив
    const dosages = dosagesInput.split(',').map(d => d.trim()).filter(d => d);

    try {
        const data = {
            name,
            price,
            dosages,
            quantity,
            expiry_date: new Date(expiryDate).toISOString(),
            preferred_supplier_id: preferredSupplierId ? parseInt(preferredSupplierId) : null
        };

        const result = await apiPost('/products/', data);
        showNotification('Товар успешно добавлен');
        
        // Очистка формы
        document.getElementById('productForm').reset();
        
        // Обновление списка товаров и общей стоимости
        loadProducts();
        loadTotalCost();
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

// Функция для получения данных о товаре по ID
async function getProduct(productId) {
    try {
        return await apiGet(`/products/${productId}`);
    } catch (error) {
        console.error('Error getting product:', error);
        return null;
    }
}

// Функция для редактирования товара
async function editProduct(productId) {
    const product = await getProduct(productId);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductDosages').value = product.dosages.join(', ');
    document.getElementById('editProductQuantity').value = product.quantity;
    
    // Форматирование даты для input типа datetime-local
    const dateObj = new Date(product.expiry_date);
    const formattedDate = dateObj.toISOString().slice(0, 16);
    document.getElementById('editProductExpiryDate').value = formattedDate;
    
    // Установка предпочтительного поставщика
    if (product.preferred_supplier_id) {
        document.getElementById('editProductPreferredSupplier').value = product.preferred_supplier_id;
    } else {
        document.getElementById('editProductPreferredSupplier').value = '';
    }
    
    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
    modal.show();
}

// Функция для обновления данных товара
async function updateProduct() {
    const id = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value.trim();
    const price = parseFloat(document.getElementById('editProductPrice').value);
    const dosagesInput = document.getElementById('editProductDosages').value.trim();
    const quantity = parseInt(document.getElementById('editProductQuantity').value);
    const expiryDate = document.getElementById('editProductExpiryDate').value;
    const preferredSupplierId = document.getElementById('editProductPreferredSupplier').value;

    if (!name || isNaN(price) || !dosagesInput || isNaN(quantity) || !expiryDate) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
        return;
    }

    // Преобразование строки с фасовками в массив
    const dosages = dosagesInput.split(',').map(d => d.trim()).filter(d => d);

    try {
        const data = {
            name,
            price,
            dosages,
            quantity,
            expiry_date: new Date(expiryDate).toISOString(),
            preferred_supplier_id: preferredSupplierId ? parseInt(preferredSupplierId) : null
        };

        const result = await apiPut(`/products/${id}`, data);
        showNotification('Товар успешно обновлен');
        
        // Закрытие модального окна
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
        modal.hide();
        
        // Обновление списка товаров и общей стоимости
        loadProducts();
        loadTotalCost();
    } catch (error) {
        console.error('Error updating product:', error);
    }
}

// Функция для удаления товара
async function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }

    try {
        const result = await apiDelete(`/products/${id}`);
        showNotification('Товар успешно удален');
        
        // Обновление списка товаров и общей стоимости
        loadProducts();
        loadTotalCost();
    } catch (error) {
        console.error('Error deleting product:', error);
    }
}

// Функция для отображения модального окна добавления товара в аптеку
function showAddToPharmacyModal(productId) {
    document.getElementById('addToPharmacyProductId').value = productId;
    
    // Загрузка списка аптек
    loadPharmacies();
    
    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('addToPharmacyModal'));
    modal.show();
}

// Функция для добавления товара в аптеку
async function addProductToPharmacy() {
    const productId = document.getElementById('addToPharmacyProductId').value;
    const pharmacyId = document.getElementById('addToPharmacySelect').value;
    const quantity = parseInt(document.getElementById('addToPharmacyQuantity').value);

    if (!pharmacyId || isNaN(quantity) || quantity <= 0) {
        showNotification('Пожалуйста, выберите аптеку и укажите количество', 'warning');
        return;
    }

    try {
        const result = await apiPost(`/products/pharmacy/${pharmacyId}/add/${productId}?quantity=${quantity}`, {});
        showNotification('Товар успешно добавлен в аптеку');
        
        // Закрытие модального окна
        const modal = bootstrap.Modal.getInstance(document.getElementById('addToPharmacyModal'));
        modal.hide();
        
        // Обновление списка товаров и общей стоимости
        loadProducts();
        loadTotalCost();
    } catch (error) {
        console.error('Error adding product to pharmacy:', error);
        
        // Проверяем сообщение об ошибке
        if (error.message && error.message.includes('Недостаточно товара в наличии')) {
            showNotification('Недостаточно товара в наличии. Попытка добавить больше товара, чем есть в наличии', 'danger');
        } else {
            showNotification('Ошибка при добавлении товара в аптеку: ' + error.message, 'danger');
        }
    }
}
