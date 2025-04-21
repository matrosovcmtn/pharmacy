// JS для управления аптеками и директорами (только для администратора)
document.addEventListener('DOMContentLoaded', async function() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
        document.getElementById('adminPharmaciesSection').style.display = 'none';
        return;
    }
    loadAdminPharmacies();
});

async function loadAdminPharmacies() {
    const pharmaciesTable = document.getElementById('adminPharmaciesTableBody');
    pharmaciesTable.innerHTML = '';
    const pharmacies = await apiGet('/pharmacies/');
    const directors = await apiGet('/users/');
    const directorList = directors.filter(u => u.role === 'director');
    pharmacies.forEach(pharmacy => {
        const row = document.createElement('tr');
        let directorName = 'Не назначен';
        if (pharmacy.director_id) {
            const director = directorList.find(d => d.id === pharmacy.director_id);
            directorName = director ? director.email : `ID: ${pharmacy.director_id}`;
        }
        row.innerHTML = `
            <td>${pharmacy.id}</td>
            <td>${pharmacy.name}</td>
            <td>${directorName}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showAssignDirectorModal(${pharmacy.id})">Назначить директора</button>
                <button class="btn btn-sm btn-danger" onclick="unassignDirector(${pharmacy.id})" ${pharmacy.director_id ? '' : 'disabled'}>Отвязать директора</button>
            </td>
        `;
        pharmaciesTable.appendChild(row);
    });
}

async function showAssignDirectorModal(pharmacyId) {
    const directors = await apiGet('/users/');
    const directorList = directors.filter(u => u.role === 'director');
    const select = document.getElementById('assignDirectorSelect');
    select.innerHTML = '';
    directorList.forEach(d => {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = d.email;
        select.appendChild(option);
    });
    document.getElementById('assignDirectorPharmacyId').value = pharmacyId;
    const modal = new bootstrap.Modal(document.getElementById('assignDirectorModal'));
    modal.show();
}

async function assignDirectorToPharmacy() {
    const pharmacyId = document.getElementById('assignDirectorPharmacyId').value;
    const directorId = document.getElementById('assignDirectorSelect').value;
    const response = await fetchWithAuth(`/pharmacies/${pharmacyId}/assign-director?director_id=${directorId}`, {
        method: 'PATCH'
    });
    if (!response.ok) {
        showNotification('Ошибка при назначении директора', 'danger');
    } else {
        showNotification('Директор успешно назначен', 'success');
        loadAdminPharmacies();
        bootstrap.Modal.getInstance(document.getElementById('assignDirectorModal')).hide();
    }
}

async function unassignDirector(pharmacyId) {
    const response = await fetchWithAuth(`/pharmacies/${pharmacyId}/unassign-director`, {
        method: 'PATCH'
    });
    if (!response.ok) {
        showNotification('Ошибка при отвязке директора', 'danger');
    } else {
        showNotification('Директор успешно отвязан', 'success');
        loadAdminPharmacies();
    }
}
