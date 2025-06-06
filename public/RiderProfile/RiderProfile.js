document.getElementById('profilePictureInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePicture').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Get references to all profile sections by their IDs
    const usernameSection = document.getElementById('username-section');
    const emailSection = document.getElementById('email-section');
    const phoneSection = document.getElementById('phone-section');
    const passwordSection = document.getElementById('password-section'); // For password changes

    let currentUserId = null; // This will store the logged-in user's ID

    // --- Fetch User Data from Session ---
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

                // Populate Username fields
                document.getElementById('display-username').innerText = data.name || 'N/A';
                document.getElementById('edit-username').value = data.name || '';

                // Populate Email fields
                document.getElementById('display-email').innerText = data.email || 'N/A';
                document.getElementById('edit-email').value = data.email || '';

                // Populate Phone Number fields
                document.getElementById('display-phone').innerText = data.phoneNumber || 'N/A';
                document.getElementById('edit-phone').value = data.phoneNumber || '';

                // Password field doesn't display actual value, so no need to populate edit field

            } else {
                console.error("User ID not found in session data. Redirecting to login.");
                window.location.href = '/login'; // Redirect if no user data
            }
        })
        .catch(error => {
            console.error("Error fetching session data:", error);
            window.location.href = '/login'; // Redirect on fetch error
        });
    // --- End Fetch User Data ---

    // --- Generic Function to Set Up Edit Functionality for Profile Sections ---
    // This function encapsulates the common logic for handling "Edit", "Save", and "Cancel" buttons.
    function setupEditFunctionality(sectionElement) {
        const fieldDisplay = sectionElement.querySelector('.field-display');
        const fieldEdit = sectionElement.querySelector('.field-edit');
        const editBtn = sectionElement.querySelector('.edit-btn');
        const saveBtn = sectionElement.querySelector('.save-btn');
        const cancelBtn = sectionElement.querySelector('.cancel-btn');
        const fieldType = editBtn.dataset.field; // Gets 'username', 'email', 'phone', or 'password'

        let originalValue = ''; // Stores the value before editing, for 'Cancel'

        // Event listener for the "Edit" button
        editBtn.addEventListener('click', () => {
            fieldDisplay.classList.add('hidden'); // Hide the display view
            fieldEdit.classList.remove('hidden'); // Show the edit view

            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            if (errorMessageElement) {
                errorMessageElement.textContent = ''; // Clear any previous error messages
            }

            // Special handling for password section as it has multiple input fields
            if (fieldType === 'password') {
                // Clear password input fields when opening edit mode
                sectionElement.querySelector('#old-password').value = '';
                sectionElement.querySelector('#new-password').value = '';
                sectionElement.querySelector('#confirm-password').value = '';
            } else {
                // For other fields (username, email, phone), pre-fill the input with the current displayed value
                const displayValueElement = fieldDisplay.querySelector('.field-value');
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                originalValue = displayValueElement.textContent; // Store current value
                editInputElement.value = originalValue; // Set input value
            }
        });

        // Event listener for the "Cancel" button
        cancelBtn.addEventListener('click', () => {
            fieldEdit.classList.add('hidden'); // Hide the edit view
            fieldDisplay.classList.remove('hidden'); // Show the display view

            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            if (errorMessageElement) {
                errorMessageElement.textContent = ''; // Clear error messages

            }
            // Restore original value for text/email/phone inputs
            if (fieldType !== 'password') {
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                editInputElement.value = originalValue;
            } else {
                // Clear password fields on cancel
                sectionElement.querySelector('#old-password').value = '';
                sectionElement.querySelector('#new-password').value = '';
                sectionElement.querySelector('#confirm-password').value = '';
            }
        });

        // Event listener for the "Save" button
        saveBtn.addEventListener('click', async () => {
            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            errorMessageElement.textContent = ''; // Clear previous errors

            if (!currentUserId) {
                errorMessageElement.textContent = 'User ID not available. Please log in again.';
                console.error("Attempted save without a user ID.");
                return; // Stop if user ID is not available
            }

            let newValue; // Value to send to the backend
            let requestBody = {}; // JSON body for the PUT request
            let endpoint; // API endpoint URL

            // Handle password change separately due to multiple inputs
            if (fieldType === 'password') {
                const oldPassword = sectionElement.querySelector('#old-password').value;
                const newPassword = sectionElement.querySelector('#new-password').value;
                const confirmPassword = sectionElement.querySelector('#confirm-password').value;

                // Client-side validation for password
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

                requestBody = {
                    oldPassword: oldPassword,
                    newPassword: newPassword
                };
                endpoint = `/rider/password/${currentUserId}`; // This endpoint needs to be created in Node.js and Spring Boot
            } else {
                // Handle username, email, phone number fields
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                newValue = editInputElement.value.trim();

                // Check if value actually changed
                if (newValue === originalValue) {
                    fieldEdit.classList.add('hidden');
                    fieldDisplay.classList.remove('hidden');
                    return;
                }

                // Basic empty check
                if (!newValue) {
                    errorMessageElement.textContent = `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} cannot be empty.`;
                    return;
                }

                // --- Specific Client-Side Validation ---
                if (fieldType === 'email') {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue)) {
                        errorMessageElement.textContent = 'Please enter a valid email address.';
                        return;
                    }
                } else if (fieldType === 'phone') {
                    // Simple phone number validation (e.g., optional '+' at start, then 7-15 digits)
                    if (!/^\+?[0-9]{7,15}$/.test(newValue)) {
                        errorMessageElement.textContent = 'Please enter a valid phone number (digits only, optional leading +).';
                        return;
                    }
                }
                // --- End Specific Client-Side Validation ---

                // Construct endpoint and request body for username/email/phone
                endpoint = `/rider/${fieldType}/${currentUserId}`; // e.g., /rider/username/123, /rider/email/123
                requestBody[fieldType] = newValue; // e.g., { name: "New Name" }, { email: "new@example.com" }
            }


            // --- Make API Call to Update Field ---
            try {
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody), // Send the constructed body
                });

                const data = await response.json(); // Parse response JSON

                if (response.ok && data.success) {
                    // Update the displayed value only for non-password fields
                    if (fieldType !== 'password') {
                        const displayValueElement = fieldDisplay.querySelector('.field-value');
                        displayValueElement.textContent = newValue;
                    }

                    fieldEdit.classList.add('hidden'); // Hide edit view
                    fieldDisplay.classList.remove('hidden'); // Show display view
                    console.log(`${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} updated successfully!`, data.updatedUser);
                    // Optionally, show a temporary success message to the user
                } else {
                    // Display error message from backend
                    errorMessageElement.textContent = data.message || `An error occurred updating ${fieldType}.`;
                    console.error(`Error updating ${fieldType}:`, data);
                }
            } catch (error) {
                // Handle network or other fetch errors
                errorMessageElement.textContent = 'Network error or server unavailable.';
                console.error('Fetch error:', error);
            }
        });
    }

    // --- Initialize Edit Functionality for Each Section ---
    setupEditFunctionality(usernameSection);
    setupEditFunctionality(emailSection);
    setupEditFunctionality(phoneSection);
    setupEditFunctionality(passwordSection); // Initialize for the password section
});