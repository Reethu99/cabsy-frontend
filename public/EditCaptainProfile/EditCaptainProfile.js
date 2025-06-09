

//To get User data from local session storage
fetch('/session-user')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {

        document.getElementById('fullName').value = data.name || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phoneNumber').value = data.phoneNumber || '';
        document.getElementById('drivingLicense').value = data.licenseNumber || '';
        document.getElementById('vehicleMake').value = data.vehicleMake || '';
        document.getElementById('vehicleModel').value = data.vehicleModel || '';
        document.getElementById('licenseNumber').value = data.licensePlate || '';
        document.getElementById('address').value = data.address || '';
        document.getElementById('profilePicturePreview').src = data.profilePictureUrl || 'https://via.placeholder.com/150/EEEEEE/888888?text=Add+Photo';

    })
    .catch(error => {
        console.error("Error fetching session data:", error);
    });