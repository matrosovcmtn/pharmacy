// Базовый URL API
const API_URL = '/api/v1';

// Функции для работы с токенами
function saveToken(token) {
    localStorage.setItem('token', token);
}

function getToken() {
    return localStorage.getItem('token');
}

function removeToken() {
    localStorage.removeItem('token');
}

function isAuthenticated() {
    return !!getToken();
}

// Функция для декодирования JWT токена
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Функция для получения роли пользователя из токена
function getUserRole() {
    const token = getToken();
    if (!token) return null;
    
    const decoded = parseJwt(token);
    return decoded ? decoded.role : null;
}

// Функция для получения ID пользователя из токена
function getUserId() {
    const token = getToken();
    if (!token) return null;
    
    const decoded = parseJwt(token);
    return decoded ? decoded.id : null;
}

// Функция для проверки, является ли пользователь администратором
function isAdmin() {
    return getUserRole() === 'ADMIN';
}

// Функция для проверки, является ли пользователь директором
function isDirector() {
    const role = getUserRole();
    return role === 'DIRECTOR' || role === 'ADMIN';
}

// Функция для проверки, является ли пользователь поставщиком
function isSupplier() {
    return getUserRole() === 'SUPPLIER';
}

// Функция для выполнения API-запросов с авторизацией
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    
    if (!options.headers) {
        options.headers = {};
    }
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    options.headers['Content-Type'] = 'application/json';
    
    try {
        // Добавляем слэш между базовым URL и путем, если необходимо
        const separator = API_URL.endsWith('/') || url.startsWith('/') ? '' : '/';
        const response = await fetch(`${API_URL}${separator}${url}`, options);
        
        // Если получили 401 (Unauthorized), перенаправляем на страницу входа
        if (response.status === 401) {
            removeToken();
            window.location.href = '/login';
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Функция для входа пользователя
async function login(email, password) {
    try {
        // Для OAuth2 требуется формат формы, а не JSON
        const formData = new URLSearchParams();
        formData.append('username', email); // OAuth2 в FastAPI ожидает поле username
        formData.append('password', password);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Неверный email или пароль');
        }
        
        const data = await response.json();
        saveToken(data.access_token);
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Функция для регистрации пользователя
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при регистрации');
        }
        
        // После успешной регистрации перенаправляем на страницу входа
        window.location.href = '/login?registered=true';
        
        return true;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Функция для выхода пользователя
function logout() {
    removeToken();
    window.location.href = '/login';
}

// Функция для получения информации о текущем пользователе
async function getCurrentUser() {
    try {
        const response = await fetchWithAuth('/auth/me');
        
        if (!response || !response.ok) {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// Функция для обновления навигационного меню в зависимости от статуса авторизации
async function updateNavMenu() {
    const authNav = document.getElementById('auth-nav');
    const mainNav = document.getElementById('main-nav');
    
    if (!authNav) return;
    
    if (isAuthenticated()) {
        // Обновляем основное навигационное меню
        if (mainNav) {
            mainNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="/">Главная</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/pharmacy">Аптеки</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/products">Товары</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/suppliers">Поставщики</a>
                </li>
            `;
        }
        
        // Обновляем меню авторизации
        const role = getUserRole();
        let navContent = `
            <li class="nav-item">
                <a class="nav-link" href="/profile">Профиль</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout-link">Выход</a>
            </li>
        `;
        
        // Если пользователь администратор, добавляем ссылку на управление пользователями
        if (role === 'ADMIN') {
            navContent = `
                <li class="nav-item">
                    <a class="nav-link" href="/users">Пользователи</a>
                </li>
                ${navContent}
            `;
        }
        
        authNav.innerHTML = navContent;
        
        // Добавляем обработчик для кнопки выхода
        document.getElementById('logout-link').addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    } else {
        // Для неавторизованных пользователей показываем только ссылку на главную
        if (mainNav) {
            mainNav.innerHTML = `
                <li class="nav-item">
                    <a class="nav-link" href="/">Главная</a>
                </li>
            `;
        }
        
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Вход</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register">Регистрация</a>
            </li>
        `;
    }
}

// Функция для проверки авторизации на защищенных страницах
function checkAuth() {
    // Список страниц, доступных без авторизации
    const publicPages = ['/', '/login', '/register'];
    
    // Текущий путь
    const currentPath = window.location.pathname;
    
    // Если страница не в списке публичных и пользователь не авторизован
    if (!publicPages.includes(currentPath) && !isAuthenticated()) {
        window.location.href = '/login?redirect=' + encodeURIComponent(currentPath);
        return false;
    }
    
    // Если пользователь авторизован и пытается зайти на страницу входа или регистрации
    if ((currentPath === '/login' || currentPath === '/register') && isAuthenticated()) {
        window.location.href = '/';
        return false;
    }
    
    // Если страница для администраторов, а пользователь не администратор
    if (currentPath === '/users' && !isAdmin()) {
        window.location.href = '/';
        return false;
    }
    
    return true;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Обновляем навигационное меню
    updateNavMenu();
    
    // Проверяем авторизацию для защищенных страниц
    checkAuth();
    
    // Обработчик формы входа
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('login-error');
            
            try {
                errorElement.classList.add('d-none');
                await login(email, password);
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
        
        // Если пользователь уже авторизован, перенаправляем на главную
        if (isAuthenticated()) {
            window.location.href = '/';
        }
    }
    
    // Обработчик формы регистрации
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorElement = document.getElementById('register-error');
            
            // Проверяем совпадение паролей
            if (password !== confirmPassword) {
                errorElement.textContent = 'Пароли не совпадают';
                errorElement.classList.remove('d-none');
                return;
            }
            
            try {
                errorElement.classList.add('d-none');
                await register(username, email, password);
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
        
        // Если пользователь уже авторизован, перенаправляем на главную
        if (isAuthenticated()) {
            window.location.href = '/';
        }
    }
});
