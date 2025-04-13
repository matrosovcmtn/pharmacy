// Функция для удаления товара из аптеки
async function deleteProductFromPharmacy(productId, pharmacyId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар из аптеки?')) {
        return;
    }
    
    console.log('deleteProductFromPharmacy called with productId:', productId, 'pharmacyId:', pharmacyId);
    
    // Проверяем доступность глобальной переменной currentPharmacyId
    if (typeof window.currentPharmacyId !== 'undefined' && window.currentPharmacyId !== null) {
        console.log('Using global currentPharmacyId:', window.currentPharmacyId);
        pharmacyId = window.currentPharmacyId;
    }
    
    // Если pharmacyId не передан или не является числом, получаем его из атрибута данных
    if (!pharmacyId || isNaN(parseInt(pharmacyId))) {
        const productsList = document.getElementById('pharmacyProductsList');
        if (productsList && productsList.dataset.pharmacyId) {
            pharmacyId = parseInt(productsList.dataset.pharmacyId);
            console.log('Got pharmacyId from dataset:', pharmacyId);
        }
    } else {
        // Преобразуем в число, если передано как строка
        pharmacyId = parseInt(pharmacyId);
        console.log('Converted pharmacyId to number:', pharmacyId);
    }
    
    if (!pharmacyId || isNaN(pharmacyId)) {
        console.error('Failed to determine pharmacyId');
        showNotification('Не удалось определить ID аптеки', 'danger');
        return;
    }
    
    try {
        // Убедимся, что ID являются числами
        const numericPharmacyId = Number(pharmacyId);
        const numericProductId = Number(productId);
        
        console.log('Sending DELETE request with pharmacyId:', numericPharmacyId, 'productId:', numericProductId);
        console.log('URL:', `/products/pharmacy/${numericPharmacyId}/${numericProductId}`);
        
        const result = await apiDelete(`/products/pharmacy/${numericPharmacyId}/${numericProductId}`);
        console.log('Delete result:', result);
        
        showNotification('Товар успешно удален из аптеки');
        
        // Обновляем список товаров
        const pharmacyName = document.getElementById('viewProductsModalLabel').textContent.replace('Товары в аптеке "', '').replace('"', '');
        viewPharmacyProducts(numericPharmacyId, pharmacyName);
    } catch (error) {
        console.error('Error deleting product from pharmacy:', error);
        showNotification('Ошибка при удалении товара из аптеки', 'danger');
    }
}
