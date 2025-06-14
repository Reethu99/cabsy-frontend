document.addEventListener('DOMContentLoaded', () => {

    // Declare currentUserId in an accessible scope
    let currentUserId = null;

    // --- 1. Fetch User Data from Session ---
    // This is crucial to populate the current values and get the user's ID
    fetch('/session-user')
        .then(response => {
            if (!response.ok) {
                // If the session user isn't available or there's an error (e.g., 401, 403),
                // redirect to the login page.
                if (response.status === 401 || response.status === 403) {
                    console.error("Session expired or user not authenticated. Redirecting to login.");
                    window.location.href = '/login';
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.id) {
                currentUserId = data.id; // Store the user ID for later API calls
                console.log("User session data loaded. User ID:", currentUserId);

                // Populate general profile fields with checks to prevent errors
                const fullNameElement = document.getElementById('fullName');
                if (fullNameElement) {
                    fullNameElement.value = data.name || '';
                }

                const emailElement = document.getElementById('email');
                if (emailElement) {
                    emailElement.value = data.email || '';
                }

                const phoneNumberElement = document.getElementById('phoneNumber');
                if (phoneNumberElement) {
                    phoneNumberElement.value = data.phoneNumber || '';
                }

                const drivingLicenseElement = document.getElementById('drivingLicense');
                if (drivingLicenseElement) {
                    drivingLicenseElement.value = data.licenseNumber || '';
                }

                const vehicleMakeElement = document.getElementById('vehicleMake');
                if (vehicleMakeElement) {
                    vehicleMakeElement.value = data.vehicleMake || '';
                }

                const vehicleModelElement = document.getElementById('vehicleModel');
                if (vehicleModelElement) {
                    vehicleModelElement.value = data.vehicleModel || '';
                }

                const licenseNumberElement = document.getElementById('licenseNumber');
                if (licenseNumberElement) {
                    licenseNumberElement.value = data.licensePlate || '';
                }

                const addressElement = document.getElementById('address');
                if (addressElement) {
                    addressElement.value = data.address || '';
                }

            } else {
                console.error("User ID not found in session data. Redirecting to login.");
                window.location.href = '/login'; // Redirect if no user data
            }
        })
        .catch(error => {
            console.error("Error fetching session data:", error);
            // Redirect to login on general fetch error for session data
            window.location.href = '/login';
        });
    // --- End Fetch User Data ---

    // --- 2. Set Up Edit Functionality for Password Section ---
    const passwordSection = document.getElementById('password-section');

    if (passwordSection) { // Ensure the password section exists
        const fieldDisplay = passwordSection.querySelector('.field-display');
        const fieldEdit = passwordSection.querySelector('.field-edit');
        const editBtn = passwordSection.querySelector('.edit-btn');
        const saveBtn = passwordSection.querySelector('.save-btn');
        const cancelBtn = passwordSection.querySelector('.cancel-btn');
        const errorMessageElement = fieldEdit.querySelector('.error-message');

        const oldPasswordInput = passwordSection.querySelector('#old-password');
        const newPasswordInput = passwordSection.querySelector('#new-password');
        const confirmPasswordInput = passwordSection.querySelector('#confirm-password');

        // Event listener for the "Cancel" button
        cancelBtn.addEventListener('click', () => {
            errorMessageElement.textContent = ''; // Clear error messages
            oldPasswordInput.value = ''; // Clear password fields on cancel
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
        });

        // Event listener for the "Save" button
        saveBtn.addEventListener('click', async () => {
            errorMessageElement.textContent = ''; // Clear previous errors

            // Ensure currentUserId is available before attempting to save
            if (currentUserId === null) { // Check for null or undefined
                errorMessageElement.textContent = 'User ID not available. Please log in again.';
                console.error("Attempted password save without a user ID.");
                // Optionally redirect here if you want to force re-login immediately
                // window.location.href = '/login';
                return;
            }

            const oldPassword = oldPasswordInput.value.trim();
            const newPassword = newPasswordInput.value.trim();
            const confirmPassword = confirmPasswordInput.value.trim();

            // --- Client-side Validation for Password ---
            if (!oldPassword || !newPassword || !confirmPassword) {
                errorMessageElement.textContent = 'All password fields are required.';
                return;
            }
            if (newPassword !== confirmPassword) {
                errorMessageElement.textContent = 'New passwords do not match.';
                return;
            }
            if (newPassword.length < 8) { // Example: minimum length
                errorMessageElement.textContent = 'New password must be at least 8 characters long.';
                return;
            }
            // Add more complex regex validation for strong passwords here if needed
            // e.g., if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newPassword)) { ... }

            const requestBody = {
                oldPassword: oldPassword,
                newPassword: newPassword
            };
    
            // --- Make API Call to Update Password ---
            try {
                const response = await fetch(`/driver/password/${currentUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json(); // Parse response JSON
                console.log(response,response.ok,response.status)
                if (response.ok) {
                    // Clear fields after successful save
                    oldPasswordInput.value = '';
                    newPasswordInput.value = '';
                    confirmPasswordInput.value = '';
                    alert('Password updated successfully!'); // Provide user feedback
                } else {
                    // Display error message from backend
                    errorMessageElement.textContent = data.message || 'An error occurred updating password.';
                    console.error('Error updating password:', data);
                }
            } catch (error) {
                // Handle network or other fetch errors
                errorMessageElement.textContent = 'Network error or server unavailable.';
                console.error('Fetch error during password update:', error);
            }
        });
    }
});