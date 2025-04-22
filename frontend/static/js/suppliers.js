// JavaScript для страницы управления поставщиками

document.addEventListener('DOMContentLoaded', async function() {
    const user = await getCurrentUser();
    if (!user || user.role.toLowerCase() !== 'admin') {
        alert('У вас недостаточно прав для просмотра этой страницы.');
        window.location.href = '/';
        return;
    }
    // Загрузка списка поставщиков при загрузке страницы
    loadSuppliers();

    // Обработчик отправки формы для добавления нового поставщика
    document.getElementById('supplierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addSupplier();
    });

    // Обработчик для сохранения изменений поставщика
    document.getElementById('saveSupplierChanges').addEventListener('click', function() {
        updateSupplier();
    });

    // Обработчик для добавления товара к поставщику
    document.getElementById('addProductToSupplier').addEventListener('click', function() {
        showAddProductToSupplierModal();
    });

    // Обработчик для подтверждения добавления товара к поставщику
    document.getElementById('confirmAddProductToSupplier').addEventListener('click', function() {
        addProductToSupplier();
    });

    // Обработчик для поиска по фасовке
    document.getElementById('searchByDosageForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchSuppliersByDosage();
    });
});

// Функция для загрузки списка поставщиков
async function loadSuppliers() {
    try {
        const suppliers = await apiGet('/suppliers/');
        displaySuppliers(suppliers);
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

// Функция для загрузки списка товаров
async function loadProducts() {
    try {
        const products = await apiGet('/products/');
        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Функция для отображения списка поставщиков
async function displaySuppliers(suppliers) {
    const supplierList = document.getElementById('supplierList');
    supplierList.innerHTML = '';
    const user = await getCurrentUser();

    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        let actions = `<button class="btn btn-sm btn-info btn-action" onclick="viewSupplierProducts(${supplier.id}, '${supplier.name}')">
                    Товары
                </button>`;
        if (user && user.role === 'admin') {
            actions += ` <button class="btn btn-sm btn-primary btn-action" onclick="editSupplier(${supplier.id}, '${supplier.name}')">
                    Редактировать
                </button>
                <button class="btn btn-sm btn-danger btn-action" onclick="deleteSupplier(${supplier.id})">
                    Удалить
                </button>`;
        }
        row.innerHTML = `
            <td>${supplier.id}</td>
            <td>${supplier.name}</td>
            <td>
                ${actions}
            </td>
        `;
        supplierList.appendChild(row);
    });
}

// Функция для добавления нового поставщика
async function addSupplier() {
    const nameInput = document.getElementById('supplierName');
    const name = nameInput.value.trim();

    if (!name) {
        showNotification('Введите название поставщика', 'warning');
        return;
    }

    try {
        const data = { name };
        const result = await apiPost('/suppliers/', data);
        showNotification('Поставщик успешно добавлен');
        nameInput.value = '';
        loadSuppliers();
    } catch (error) {
        console.error('Error adding supplier:', error);
    }
}

// Функция для редактирования поставщика
function editSupplier(id, name) {
    document.getElementById('editSupplierId').value = id;
    document.getElementById('editSupplierName').value = name;
    
    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
    modal.show();
}

// Функция для обновления данных поставщика
async function updateSupplier() {
    const id = document.getElementById('editSupplierId').value;
    const name = document.getElementById('editSupplierName').value.trim();

    if (!name) {
        showNotification('Введите название поставщика', 'warning');
        return;
    }

    try {
        const data = { name };
        const result = await apiPut(`/suppliers/${id}`, data);
        showNotification('Поставщик успешно обновлен');
        
        // Закрытие модального окна
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSupplierModal'));
        modal.hide();
        
        // Обновление списка поставщиков
        loadSuppliers();
    } catch (error) {
        console.error('Error updating supplier:', error);
    }
}

// Функция для удаления поставщика
async function deleteSupplier(id) {
    if (!confirm('Вы уверены, что хотите удалить этого поставщика?')) {
        return;
    }

    try {
        const result = await apiDelete(`/suppliers/${id}`);
        showNotification('Поставщик успешно удален');
        loadSuppliers();
    } catch (error) {
        console.error('Error deleting supplier:', error);
    }
}

// Функция для просмотра товаров у поставщика
async function viewSupplierProducts(supplierId, supplierName) {
    try {
        const products = await apiGet(`/products/supplier/${supplierId}`);
        displaySupplierProducts(products, supplierId, supplierName);
        
        // Открытие модального окна
        const modal = new bootstrap.Modal(document.getElementById('viewSupplierProductsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading supplier products:', error);
    }
}

// Функция для отображения товаров у поставщика
function displaySupplierProducts(products, supplierId, supplierName) {
    const productsList = document.getElementById('supplierProductsList');
    productsList.innerHTML = '';
    
    // Сохраняем ID поставщика для добавления товаров
    document.getElementById('addProductSupplierId').value = supplierId;
    
    // Обновление заголовка модального окна
    document.getElementById('viewSupplierProductsModalLabel').textContent = `Товары у поставщика "${supplierName}"`;

    if (products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">Нет товаров у этого поставщика</td>';
        productsList.appendChild(row);
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.dosages.join(', ')}</td>
            <td>${product.price.toFixed(2)} руб.</td>
            <td>${product.quantity}</td>
            <td>${product.supplier_preference || 1}</td>
            <td>
                <button class="btn btn-sm btn-danger btn-action" onclick="removeProductFromSupplier(${supplierId}, ${product.id})">
                    Удалить
                </button>
            </td>
        `;
        productsList.appendChild(row);
    });
}

// Функция для отображения модального окна добавления товара к поставщику
async function showAddProductToSupplierModal() {
    const supplierId = document.getElementById('addProductSupplierId').value;
    if (!supplierId) {
        showNotification('Не указан поставщик', 'warning');
        return;
    }
    
    // Загрузка списка товаров
    const products = await loadProducts();
    const productSelect = document.getElementById('addProductSelect');
    
    // Очистка списка
    productSelect.innerHTML = '';
    
    // Добавление товаров в список
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.dosages.join(', ')})`;
        productSelect.appendChild(option);
    });
    
    // Открытие модального окна
    const modal = new bootstrap.Modal(document.getElementById('addProductToSupplierModal'));
    modal.show();
}

// Функция для добавления товара к поставщику
async function addProductToSupplier() {
    const supplierId = document.getElementById('addProductSupplierId').value;
    const productId = document.getElementById('addProductSelect').value;
    const quantity = parseInt(document.getElementById('addProductQuantity').value);
    const preference = parseInt(document.getElementById('addProductPreference').value);

    if (!productId || isNaN(quantity) || quantity <= 0) {
        showNotification('Пожалуйста, выберите товар и укажите количество', 'warning');
        return;
    }

    try {
        const result = await apiPost(`/suppliers/${supplierId}/add-product/${productId}?quantity=${quantity}&preference=${preference}`, {});
        showNotification('Товар успешно добавлен к поставщику');
        
        // Закрытие модального окна
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductToSupplierModal'));
        modal.hide();
        
        // Обновление списка товаров у поставщика
        const supplierName = document.getElementById('viewSupplierProductsModalLabel').textContent.replace('Товары у поставщика "', '').replace('"', '');
        viewSupplierProducts(supplierId, supplierName);
    } catch (error) {
        console.error('Error adding product to supplier:', error);
    }
}

// Функция для удаления товара у поставщика
async function removeProductFromSupplier(supplierId, productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар у поставщика?')) {
        return;
    }

    try {
        const result = await apiDelete(`/suppliers/${supplierId}/remove-product/${productId}`);
        showNotification('Товар успешно удален у поставщика');
        
        // Обновление списка товаров у поставщика
        const supplierName = document.getElementById('viewSupplierProductsModalLabel').textContent.replace('Товары у поставщика "', '').replace('"', '');
        viewSupplierProducts(supplierId, supplierName);
    } catch (error) {
        console.error('Error removing product from supplier:', error);
    }
}

// Функция для поиска поставщиков по фасовке товара
async function searchSuppliersByDosage() {
    const dosage = document.getElementById('dosageSearch').value.trim();
    
    if (!dosage) {
        showNotification('Введите фасовку для поиска', 'warning');
        return;
    }
    
    try {
        const suppliers = await apiGet(`/suppliers/product-dosage/${encodeURIComponent(dosage)}`);
        displayDosageSearchResults(suppliers, dosage);
    } catch (error) {
        console.error('Error searching suppliers by dosage:', error);
    }
}

// Функция для отображения результатов поиска по фасовке
async function displayDosageSearchResults(suppliers, dosage) {
    const resultsContainer = document.getElementById('dosageSearchResults');
    resultsContainer.innerHTML = '';
    
    if (suppliers.length === 0) {
        resultsContainer.innerHTML = '<tr><td colspan="4" class="text-center">Поставщики с товарами указанной фасовки не найдены</td></tr>';
        return;
    }
    
    // Для каждого поставщика получаем его товары с указанной фасовкой
    for (const supplier of suppliers) {
        try {
            const products = await apiGet(`/products/supplier/${supplier.id}`);
            const matchingProducts = products.filter(product => 
                product.dosages.some(d => d.includes(dosage))
            );
            
            matchingProducts.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${supplier.name}</td>
                    <td>${product.name}</td>
                    <td>${product.dosages.join(', ')}</td>
                    <td>${product.quantity}</td>
                `;
                resultsContainer.appendChild(row);
            });
        } catch (error) {
            console.error(`Error getting products for supplier ${supplier.id}:`, error);
        }
    }
}
