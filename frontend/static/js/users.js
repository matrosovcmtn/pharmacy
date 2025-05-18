// Функция для загрузки списка пользователей
async function loadUsers() {
    try {
        console.log('Loading users...');
        const response = await fetchWithAuth('/users');
        
        if (!response || !response.ok) {
            throw new Error('Не удалось загрузить список пользователей');
        }
        
        const users = await response.json();
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        const errorElement = document.getElementById('users-error');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    }
}

// Функция для отображения таблицы пользователей
function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (!tableBody || !users.length) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Нет данных</td></tr>';
        return;
    }
    
    let html = '';
    
    users.forEach(user => {
        // Преобразуем роль в читаемый вид
        let roleText = '';
        switch (user.role) {
            case 'admin':
                roleText = 'Администратор';
                break;
            case 'director':
                roleText = 'Директор';
                break;
            case 'supplier':
                roleText = 'Поставщик';
                break;
            default:
                roleText = user.role;
        }
        
        // Статус пользователя
        const statusClass = user.is_active ? 'text-success' : 'text-danger';
        const statusText = user.is_active ? 'Активен' : 'Неактивен';
        
        html += `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${roleText}</td>
                <td class="${statusClass}">${statusText}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="openEditUserModal(${user.id})">
                        Редактировать
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        Удалить
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Функция для открытия модального окна редактирования пользователя
async function openEditUserModal(userId) {
    try {
        const response = await fetchWithAuth(`/users/${userId}`);
        
        if (!response || !response.ok) {
            throw new Error('Не удалось загрузить данные пользователя');
        }
        
        const user = await response.json();
        
        // Заполняем форму данными пользователя
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-role').value = user.role;
        document.getElementById('edit-supplier-id').value = user.supplier_id || '';
        document.getElementById('edit-is-active').checked = user.is_active;
        
        // Показываем/скрываем поле ID поставщика в зависимости от роли
        toggleSupplierIdField('edit-role', 'edit-supplier-id-container');
        
        // Открываем модальное окно
        const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
        editUserModal.show();
    } catch (error) {
        console.error('Error loading user data:', error);
        alert(error.message);
    }
}

// Функция для создания нового пользователя
async function createUser(userData) {
    try {
        const response = await fetchWithAuth('/users/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при создании пользователя');
        }
        
        // Перезагружаем список пользователей
        loadUsers();
        
        // Закрываем модальное окно
        const addUserModal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        addUserModal.hide();
        
        return true;
    } catch (error) {
        console.error('Create user error:', error);
        throw error;
    }
}

// Функция для обновления пользователя
async function updateUser(userId, userData) {
    try {
        const response = await fetchWithAuth(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (!response || !response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при обновлении пользователя');
        }
        
        // Перезагружаем список пользователей
        loadUsers();
        
        // Закрываем модальное окно
        const editUserModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        editUserModal.hide();
        
        return true;
    } catch (error) {
        console.error('Update user error:', error);
        throw error;
    }
}

// Функция для удаления пользователя
async function deleteUser(userId) {
    console.log('deleteUser called', userId);
    // Проверяем, не пытается ли пользователь удалить самого себя
    if (userId === parseInt(getUserId())) {
        alert('Вы не можете удалить собственную учетную запись');
        return;
    }
    
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return;
    }
    
    try {
        const response = await fetchWithAuth(`/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response || !response.ok) {
            let errorMsg = 'Ошибка при удалении пользователя';
            try {
                const errorData = await response.json();
                errorMsg = errorData.detail || errorMsg;
            } catch (jsonErr) {
                // Если ответ не JSON — читаем текст
                const errorText = await response.text();
                errorMsg = errorText || errorMsg;
            }
            throw new Error(errorMsg);
        }
        
        // Перезагружаем список пользователей
        loadUsers();
        
        return true;
    } catch (error) {
        console.error('Delete user error:', error);
        alert(error.message);
    }
}

// Функция для показа/скрытия поля ID поставщика в зависимости от роли
function toggleSupplierIdField(roleSelectId, containerDivId) {
    const roleSelect = document.getElementById(roleSelectId);
    const containerDiv = document.getElementById(containerDivId);
    
    if (roleSelect.value === 'supplier') {
        containerDiv.style.display = 'block';
    } else {
        containerDiv.style.display = 'none';
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, является ли пользователь администратором
    if (!isAdmin()) {
        window.location.href = '/';
        return;
    }
    
    // Загружаем список пользователей
    loadUsers();
    
    // Обработчик изменения роли в форме добавления пользователя
    const addRoleSelect = document.getElementById('add-role');
    if (addRoleSelect) {
        addRoleSelect.addEventListener('change', function() {
            toggleSupplierIdField('add-role', 'supplier-id-container');
        });
        
        // Инициализация при загрузке
        toggleSupplierIdField('add-role', 'supplier-id-container');
    }
    
    // Обработчик изменения роли в форме редактирования пользователя
    const editRoleSelect = document.getElementById('edit-role');
    if (editRoleSelect) {
        editRoleSelect.addEventListener('change', function() {
            toggleSupplierIdField('edit-role', 'edit-supplier-id-container');
        });
    }
    
    // Обработчик формы добавления пользователя
    const addUserSubmitBtn = document.getElementById('add-user-submit');
    if (addUserSubmitBtn) {
        addUserSubmitBtn.addEventListener('click', async function() {
            const username = document.getElementById('add-username').value;
            const email = document.getElementById('add-email').value;
            const password = document.getElementById('add-password').value;
            const role = document.getElementById('add-role').value;
            const supplierIdInput = document.getElementById('add-supplier-id');
            const errorElement = document.getElementById('add-user-error');
            
            // Скрываем сообщение об ошибке
            errorElement.classList.add('d-none');
            
            // Проверяем обязательные поля
            if (!username || !email || !password || !role) {
                errorElement.textContent = 'Заполните все обязательные поля';
                errorElement.classList.remove('d-none');
                return;
            }
            
            // Создаем объект с данными пользователя
            const userData = {
                username,
                email,
                password,
                role
            };
            
            // Если роль - поставщик, добавляем ID поставщика
            if (role === 'supplier' && supplierIdInput.value) {
                userData.supplier_id = parseInt(supplierIdInput.value);
            }
            
            try {
                await createUser(userData);
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
    }
    
    // Обработчик формы редактирования пользователя
    const editUserSubmitBtn = document.getElementById('edit-user-submit');
    if (editUserSubmitBtn) {
        editUserSubmitBtn.addEventListener('click', async function() {
            const userId = document.getElementById('edit-user-id').value;
            const username = document.getElementById('edit-username').value;
            const email = document.getElementById('edit-email').value;
            const password = document.getElementById('edit-password').value;
            const role = document.getElementById('edit-role').value;
            const supplierIdInput = document.getElementById('edit-supplier-id');
            const isActive = document.getElementById('edit-is-active').checked;
            const errorElement = document.getElementById('edit-user-error');
            
            // Скрываем сообщение об ошибке
            errorElement.classList.add('d-none');
            
            // Проверяем обязательные поля
            if (!username || !email || !role) {
                errorElement.textContent = 'Заполните все обязательные поля';
                errorElement.classList.remove('d-none');
                return;
            }
            
            // Создаем объект с данными пользователя
            const userData = {
                username,
                email,
                role,
                is_active: isActive
            };
            
            // Если указан новый пароль, добавляем его
            if (password) {
                userData.password = password;
            }
            
            // Если роль - поставщик, добавляем ID поставщика
            if (role === 'supplier' && supplierIdInput.value) {
                userData.supplier_id = parseInt(supplierIdInput.value);
            } else {
                userData.supplier_id = null;
            }
            
            try {
                await updateUser(userId, userData);
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
    }
});
