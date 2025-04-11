// Основной JavaScript файл для общих функций

// Базовый URL для API
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Функция для форматирования даты
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
}

// Функция для проверки, истек ли срок годности
function isExpired(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    return expiry < now;
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Добавляем уведомление в начало контейнера
    const container = document.querySelector('.container');
    container.insertBefore(notification, container.firstChild);
    
    // Автоматически скрываем уведомление через 5 секунд
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Функция для управления видимостью элементов на главной странице
function updateHomePageElements() {
    // Проверяем, находимся ли мы на главной странице
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        const authRequiredMessage = document.getElementById('auth-required-message');
        const sectionsBlock = document.getElementById('sections-block');
        
        if (isAuthenticated()) {
            // Для авторизованных пользователей показываем блок с разделами и скрываем сообщение
            if (authRequiredMessage) {
                authRequiredMessage.style.display = 'none';
            }
            
            if (sectionsBlock) {
                sectionsBlock.style.display = 'block';
            }
        } else {
            // Для неавторизованных пользователей скрываем блок с разделами и показываем сообщение
            if (authRequiredMessage) {
                authRequiredMessage.style.display = 'block';
            }
            
            if (sectionsBlock) {
                sectionsBlock.style.display = 'none';
            }
        }
    }
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли функция updateNavMenu (из auth.js)
    if (typeof updateNavMenu === 'function') {
        updateNavMenu();
    }
    
    // Обновляем элементы на главной странице
    updateHomePageElements();
});

// Функция для обработки ошибок API
async function handleApiResponse(response) {
    if (!response.ok) {
        console.error(`API Error: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch((e) => {
            console.error('Error parsing error response:', e);
            return {};
        });
        console.error('Error data:', errorData);
        const errorMessage = errorData.detail || 'Произошла ошибка при выполнении запроса';
        throw new Error(errorMessage);
    }
    const data = await response.json().catch((e) => {
        console.error('Error parsing success response:', e);
        return {};
    });
    console.log('API Response data:', data);
    return data;
}

// Функция для выполнения GET-запроса к API
async function apiGet(endpoint) {
    try {
        // Удаляем начальный слэш, если он есть
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        console.log(`Making GET request to API: ${path}`);
        const response = await fetchWithAuth(path);
        console.log(`Response status: ${response.status}`);
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API GET Error:', error);
        showNotification(error.message, 'danger');
        throw error;
    }
}

// Функция для выполнения POST-запроса к API
async function apiPost(endpoint, data) {
    try {
        // Удаляем начальный слэш, если он есть
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const response = await fetchWithAuth(path, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API POST Error:', error);
        showNotification(error.message, 'danger');
        throw error;
    }
}

// Функция для выполнения PUT-запроса к API
async function apiPut(endpoint, data) {
    try {
        // Удаляем начальный слэш, если он есть
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const response = await fetchWithAuth(path, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API PUT Error:', error);
        showNotification(error.message, 'danger');
        throw error;
    }
}

// Функция для выполнения DELETE-запроса к API
async function apiDelete(endpoint) {
    try {
        // Удаляем начальный слэш, если он есть
        const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const response = await fetchWithAuth(path, {
            method: 'DELETE'
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error('API DELETE Error:', error);
        showNotification(error.message, 'danger');
        throw error;
    }
}
