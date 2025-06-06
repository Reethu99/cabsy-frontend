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
    const profileSections = document.querySelectorAll('.profile-section');

    profileSections.forEach(section => {
        const fieldDisplay = section.querySelector('.field-display');
        const fieldEdit = section.querySelector('.field-edit');
        const editBtn = section.querySelector('.edit-btn');
        const saveBtn = section.querySelector('.save-btn');
        const cancelBtn = section.querySelector('.cancel-btn');
        const fieldType = editBtn.dataset.field; // e.g., 'username', 'email'

        let originalValue = ''; // Store original value for cancellation

        editBtn.addEventListener('click', () => {
            fieldDisplay.classList.add('hidden');
            fieldEdit.classList.remove('hidden');

            if (fieldType === 'password') {
                // Clear password fields when entering edit mode for security
                fieldEdit.querySelector('#old-password').value = '';
                fieldEdit.querySelector('#new-password').value = '';
                fieldEdit.querySelector('#confirm-password').value = '';
            } else {
                const displayValueElement = fieldDisplay.querySelector('.field-value');
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                originalValue = displayValueElement.textContent; // Store current value
                editInputElement.value = originalValue; // Set input value
            }
            // Clear any previous error messages
            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            if (errorMessageElement) {
                errorMessageElement.textContent = '';
            }
        });

        cancelBtn.addEventListener('click', () => {
            fieldEdit.classList.add('hidden');
            fieldDisplay.classList.remove('hidden');
            // Restore original value if it was an input field
            if (fieldType !== 'password') {
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                editInputElement.value = originalValue;
            }
            // Clear any previous error messages
            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            if (errorMessageElement) {
                errorMessageElement.textContent = '';
            }
        });

        saveBtn.addEventListener('click', async () => {
            const errorMessageElement = fieldEdit.querySelector(`.error-message`);
            errorMessageElement.textContent = ''; // Clear previous errors

            let newValue = '';
            let payload = {};
            let isValid = true; // Client-side validation flag

            if (fieldType === 'password') {
                const oldPassword = fieldEdit.querySelector('#old-password').value;
                const newPassword = fieldEdit.querySelector('#new-password').value;
                const confirmPassword = fieldEdit.querySelector('#confirm-password').value;

                if (!oldPassword || !newPassword || !confirmPassword) {
                    errorMessageElement.textContent = 'All password fields are required.';
                    isValid = false;
                } else if (newPassword !== confirmPassword) {
                    errorMessageElement.textContent = 'New passwords do not match.';
                    isValid = false;
                } else if (newPassword.length < 8) { // Basic password complexity
                    errorMessageElement.textContent = 'New password must be at least 8 characters long.';
                    isValid = false;
                }
                payload = { oldPassword, newPassword };
            } else {
                const editInputElement = fieldEdit.querySelector(`#edit-${fieldType}`);
                newValue = editInputElement.value.trim();

                if (newValue === originalValue) {
                    // No change, just switch back to display mode
                    fieldEdit.classList.add('hidden');
                    fieldDisplay.classList.remove('hidden');
                    return;
                }

                if (!newValue) {
                    errorMessageElement.textContent = `${fieldType.charAt(0).toUpperCase() + fieldType.slice(1)} cannot be empty.`;
                    isValid = false;
                } else if (fieldType === 'email' && !/\S+@\S+\.\S+/.test(newValue)) {
                    errorMessageElement.textContent = 'Please enter a valid email address.';
                    isValid = false;
                }
                payload[fieldType] = newValue; // Dynamic payload key
            }

            if (!isValid) {
                return; // Stop if client-side validation fails
            }

            // Simulate API call
            try {
               
                    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

                    const displayValueElement = fieldDisplay.querySelector('.field-value');
                    if (fieldType === 'password') {
                        // Password change success, no value to display
                        // Optionally show a success message temporarily
                    } else {
                        displayValueElement.textContent = newValue; // Update displayed value
                    }

                    fieldEdit.classList.add('hidden');
                    fieldDisplay.classList.remove('hidden');
                    console.log(`${fieldType} updated successfully!`); // For debugging
                    // You might add a temporary success message here
                // } else {
                    // Simulate server error
                    // const errorData = data.message || 'An error occurred during update.';
                    // errorMessageElement.textContent = errorData;
                    // console.error(`Error updating ${fieldType}:`, errorData);
                // }
            } catch (error) {
                errorMessageElement.textContent = 'Network error or server unavailable.';
                console.error('Fetch error:', error);
            }
        });
    });



     //To get User data from local session storage
     fetch('/session-user')
     .then(response => {
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
         }
         return response.json();
     })
     .then(data => {
         
         document.getElementById('display-username').innerText = data.name || '';
         document.getElementById('edit-username').value=data.name||'';
         
        
         document.getElementById('display-email').innerHTML = data.email || '';
         document.getElementById('edit-email').value=data.email||'';

         document.getElementById('display-phone').innerHTML = data.phoneNumber || '';
         document.getElementById('edit-phone').value=data.phoneNumber||'';

     })
     .catch(error => {
         console.error("Error fetching session data:", error);
     });

});

