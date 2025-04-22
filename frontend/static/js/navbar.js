// Универсальный динамический navbar для всех страниц
// Вставьте <script src="/static/js/navbar.js"></script> в шаблоны после подключения bootstrap и перед закрывающим </body>

document.addEventListener('DOMContentLoaded', async function() {
    // Контейнеры для навигации
    const mainNav = document.getElementById('main-nav');
    const authNav = document.getElementById('auth-nav');
    if (!mainNav || !authNav) return;

    // Получение текущего пользователя
    let user = null;
    try {
        user = await getCurrentUser();
    } catch (e) {
        user = null;
    }

    // Формируем основной набор вкладок
    let navItems = [
        { href: '/', label: 'Главная', roles: ['admin', 'director', 'supplier', null] },
        { href: '/pharmacy', label: 'Аптеки', roles: ['admin', 'director'] },
        { href: '/products', label: 'Товары', roles: ['admin', 'director', 'supplier'] },
        { href: '/suppliers', label: 'Поставщики', roles: ['admin'] }
    ];

    // Очищаем текущий navbar
    mainNav.innerHTML = '';
    navItems.forEach(item => {
        if (!user && item.roles.includes(null)) {
            mainNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="${item.href}">${item.label}</a></li>`;
        } else if (user && item.roles.includes((user.role || '').toLowerCase())) {
            mainNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="${item.href}">${item.label}</a></li>`;
        }
    });

    // Формируем правую часть navbar (авторизация/профиль/выход)
    authNav.innerHTML = '';
    if (user) {
        authNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="/profile">Профиль</a></li>`;
        authNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="#" id="logout-link">Выход</a></li>`;
        // Навешиваем обработчик выхода
        setTimeout(() => {
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) logoutLink.addEventListener('click', logout);
        }, 100);
    } else {
        authNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="/login">Вход</a></li>`;
        authNav.innerHTML += `<li class="nav-item"><a class="nav-link" href="/register">Регистрация</a></li>`;
    }
});

// Пример функции getCurrentUser (должна быть определена глобально или импортирована)
// async function getCurrentUser() { ... }
// Пример функции logout (должна быть определена глобально или импортирована)
// function logout() { ... }
