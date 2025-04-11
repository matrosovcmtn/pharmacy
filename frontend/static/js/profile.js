// Функция для загрузки данных профиля
async function loadProfileData() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            throw new Error('Не удалось загрузить данные профиля');
        }
        
        // Заполняем данные профиля
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email;
        
        // Отображаем роль пользователя на русском языке
        let roleText = '';
        switch (user.role) {
            case 'admin':
                roleText = 'Администратор';
                // Показываем панель администратора
                document.getElementById('admin-panel').classList.remove('d-none');
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
        document.getElementById('profile-role').textContent = roleText;
        
    } catch (error) {
        console.error('Error loading profile data:', error);
        const errorElement = document.getElementById('profile-error');
        errorElement.textContent = error.message;
        errorElement.classList.remove('d-none');
    }
}

// Функция для изменения пароля
async function changePassword(currentPassword, newPassword) {
    try {
        const userId = getUserId();
        if (!userId) {
            throw new Error('Пользователь не авторизован');
        }
        
        const response = await fetchWithAuth(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({
                password: newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при изменении пароля');
        }
        
        return true;
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные профиля
    loadProfileData();
    
    // Обработчик формы изменения пароля
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmNewPassword = document.getElementById('confirm-new-password').value;
            const errorElement = document.getElementById('profile-error');
            const successElement = document.getElementById('profile-success');
            
            // Скрываем сообщения об ошибках и успехе
            errorElement.classList.add('d-none');
            successElement.classList.add('d-none');
            
            // Проверяем совпадение паролей
            if (newPassword !== confirmNewPassword) {
                errorElement.textContent = 'Новые пароли не совпадают';
                errorElement.classList.remove('d-none');
                return;
            }
            
            try {
                await changePassword(currentPassword, newPassword);
                
                // Очищаем форму
                changePasswordForm.reset();
                
                // Показываем сообщение об успехе
                successElement.textContent = 'Пароль успешно изменен';
                successElement.classList.remove('d-none');
            } catch (error) {
                errorElement.textContent = error.message;
                errorElement.classList.remove('d-none');
            }
        });
    }
});
