document.addEventListener('DOMContentLoaded', function() {
    const profilePictureInput = document.getElementById('profilePicture');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    const captainProfileForm = document.getElementById('captainProfileForm');

    // --- Profile Picture Handling ---
    profilePictureInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profilePicturePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Document Upload Handling ---
    // Make the custom file input display clickable
    document.querySelectorAll('.file-input-display').forEach(displayDiv => {
        displayDiv.addEventListener('click', function() {
            const inputId = this.dataset.inputId;
            const actualInput = document.getElementById(inputId);
            if (actualInput) {
                actualInput.click(); // Trigger the click on the hidden input
            }
        });
    });

    function handleDocumentFileInput(inputElementId, listElementId) {
        const inputElement = document.getElementById(inputElementId);
        const listElement = document.getElementById(listElementId);
        const fileInputDisplay = inputElement.nextElementSibling; // Get the custom display div

        inputElement.addEventListener('change', function() {
            listElement.innerHTML = ''; // Clear previous selections
            const files = this.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const listItem = document.createElement('li');
                    listItem.id = `${inputElementId}-file-${i}`; // Unique ID for each list item
                    listItem.innerHTML = `<i class="far fa-file"></i> <span>${file.name}</span>
                                          <span class="remove-file" data-input-id="${inputElementId}" data-file-index="${i}">&times;</span>`;
                    listElement.appendChild(listItem);
                }
                // Reset border color to default if files are selected
                if (fileInputDisplay) {
                    fileInputDisplay.style.borderColor = 'var(--primary-color)';
                    fileInputDisplay.style.color = 'var(--primary-color)';
                }
            } else {
                // If no files are selected, reset to default style
                if (fileInputDisplay) {
                    fileInputDisplay.style.borderColor = 'var(--primary-color)';
                    fileInputDisplay.style.color = 'var(--primary-color)';
                }
            }
        });

        // Add event listener for removing files (client-side visual only)
        listElement.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-file')) {
                const indexToRemove = parseInt(event.target.dataset.fileIndex);
                const targetInputId = event.target.dataset.inputId;
                const associatedInput = document.getElementById(targetInputId);
                
                if (associatedInput) {
                    const dataTransfer = new DataTransfer();
                    let filesArray = Array.from(associatedInput.files);

                    // Filter out the file at the specified index
                    filesArray = filesArray.filter((_, index) => index !== indexToRemove);

                    filesArray.forEach(file => dataTransfer.items.add(file));
                    associatedInput.files = dataTransfer.files;

                    // Manually trigger the change event to update the displayed list and validation state
                    const changeEvent = new Event('change');
                    associatedInput.dispatchEvent(changeEvent);

                    // No alert here, the visual update is enough
                }
            }
        });
    }

    handleDocumentFileInput('driverLicenseDoc', 'driverLicenseDocList');
    handleDocumentFileInput('vehicleRegistrationDoc', 'vehicleRegistrationDocList');
    handleDocumentFileInput('insuranceDoc', 'insuranceDocList');


    // --- Form Submission (Validation and Direct Save) ---
    captainProfileForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent default form submission

        // --- Client-side Validation ---
        let isValid = true;
        const requiredTextualFields = [
            'fullName', 'email', 'phoneNumber', 'vehicleMake', 'vehicleModel',
            'licensePlate', 'drivingLicense'
        ];
        const requiredFileFields = ['driverLicenseDoc', 'vehicleRegistrationDoc'];

        // Reset styling for all inputs before re-validating
        document.querySelectorAll('input:not([type="file"]), textarea').forEach(input => {
            input.style.borderColor = ''; // Reset border
            input.placeholder = input.getAttribute('placeholder') || ''; // Reset placeholder
        });
        document.querySelectorAll('.file-input-display').forEach(display => {
            display.style.borderColor = 'var(--primary-color)'; // Default border
            display.style.color = 'var(--primary-color)';       // Default text/icon color
        });


        // Validate standard text/email/tel/textarea fields
        requiredTextualFields.forEach(fieldId => {
            const inputElement = document.getElementById(fieldId);
            if (inputElement && inputElement.value.trim() === '') {
                isValid = false;
                inputElement.style.borderColor = 'var(--danger-color)';
                inputElement.placeholder = 'This field is required!';
            }
        });

        // Validate required file inputs
        requiredFileFields.forEach(fieldId => {
            const inputElement = document.getElementById(fieldId);
            if (inputElement && inputElement.files.length === 0) {
                isValid = false;
                const displayElement = inputElement.nextElementSibling; // Get the .file-input-display
                if (displayElement) {
                    displayElement.style.borderColor = 'var(--danger-color)';
                    displayElement.style.color = 'var(--danger-color)';
                }
            }
        });

        // More specific validation (email format, phone number regex)
        const emailInput = document.getElementById('email');
        if (emailInput && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput.value)) {
            isValid = false;
            emailInput.style.borderColor = 'var(--danger-color)';
            // Do not return here, allow other validation to run and collect all errors
        }

        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && !/^[0-9]{10}$/.test(phoneInput.value)) {
            isValid = false;
            phoneInput.style.borderColor = 'var(--danger-color)';
            // Do not return here
        }

        // --- If ANY validation failed, show a general alert and stop ---
        if (!isValid) {
            alert('Please correct the highlighted fields and upload all mandatory documents.');
            return;
        }

        // --- If all validation passes, proceed to gather data and simulate saving ---

        const dataToSend = new FormData(captainProfileForm); // Capture current form data

        // Log FormData contents (for debugging in console)
        console.log('--- FormData Contents ---');
        for (const pair of dataToSend.entries()) {
            console.log(`${pair[0]}: ${pair[1]}`);
        }
        console.log('-------------------------');


        // --- Backend API Call (Conceptual) ---
        // This is where you'd typically send 'dataToSend' to your server.
        // For this demo, we'll simulate success after a short delay.

        alert('Saving changes...'); // Immediate feedback
        setTimeout(() => {
            // This alert will only show if all validation above passed
            alert('All changes saved successfully!');
            // In a real app, you might:
            // - Redirect the user: window.location.href = '/captain-dashboard';
            // - Show a more prominent success message in the UI (not just an alert)
            // - Clear the form (if it's for new entry)
            // - Update UI elements with new data
        }, 1500); // Simulate 1.5 seconds delay for saving
    });

    // --- Optional: Function to pre-fill form with existing data (for a real application) ---
    /*
    function loadCaptainData() {
        // ... (existing loadCaptainData function)
    }
    // loadCaptainData();
    */
});