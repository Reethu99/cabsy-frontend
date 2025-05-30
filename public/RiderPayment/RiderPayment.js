document.addEventListener('DOMContentLoaded', () => {
    // Fare Breakdown Toggle
    const fareBreakdownToggle = document.getElementById('fareBreakdownToggle');
    const fareBreakdown = document.getElementById('fareBreakdown');
 
    if (fareBreakdownToggle && fareBreakdown) {
        fareBreakdownToggle.addEventListener('click', () => {
            fareBreakdown.classList.toggle('show');
            fareBreakdownToggle.classList.toggle('active'); // Add/remove active class for icon rotation
            if (fareBreakdown.classList.contains('show')) {
                fareBreakdownToggle.querySelector('.toggle-icon').classList.remove('fa-chevron-down');
                fareBreakdownToggle.querySelector('.toggle-icon').classList.add('fa-chevron-up');
            } else {
                fareBreakdownToggle.querySelector('.toggle-icon').classList.remove('fa-chevron-up');
                fareBreakdownToggle.querySelector('.toggle-icon').classList.add('fa-chevron-down');
            }
        });
    }
 
    // Payment Method Selection Logic
    const paymentOptions = document.querySelectorAll('.payment-option');
    const upiOptionsSection = document.getElementById('upiOptionsSection');
 
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove 'selected' from all options
            paymentOptions.forEach(opt => {
                opt.classList.remove('selected');
                opt.querySelector('.check-icon').classList.add('empty');
                opt.querySelector('.check-icon').classList.remove('fa-check-circle');
                opt.querySelector('.check-icon').classList.add('fa-circle'); // Change icon to empty circle
            });
 
            // Add 'selected' to the clicked option
            option.classList.add('selected');
            option.querySelector('.check-icon').classList.remove('empty');
            option.querySelector('.check-icon').classList.remove('fa-circle');
            option.querySelector('.check-icon').classList.add('fa-check-circle'); // Change icon to checkmark circle
 
            const selectedMethod = option.dataset.method;
 
            // Show/hide UPI options section based on selection
            if (selectedMethod === 'upi') {
                upiOptionsSection.classList.remove('hidden');
            } else {
                upiOptionsSection.classList.add('hidden');
            }
        });
    });
 
    // UPI App Button Click (Simulated)
    const proceedToUpiApp = document.getElementById('proceedToUpiApp');
    if (proceedToUpiApp) {
        proceedToUpiApp.addEventListener('click', () => {
            alert('Simulating redirection to UPI App...\n(In a real app, this would use UPI Intent deep linking for mobile, or a QR code/VPA display for desktop)');
            // For desktop, the "Proceed to UPI App" button might actually:
            // 1. Display a QR code for the user to scan with their phone.
            // 2. Open a new tab with a payment gateway page that generates a QR or takes VPA.
            // 3. Or, if integrated with a desktop UPI solution (less common), directly launch a local app.
        });
    }
 
    // UPI ID Verification (Simulated)
    const upiIdInput = document.getElementById('upiIdInput');
    const verifyPayUpiId = document.getElementById('verifyPayUpiId');
    const upiIdError = document.getElementById('upiIdError');
 
    if (verifyPayUpiId && upiIdInput && upiIdError) {
        verifyPayUpiId.addEventListener('click', () => {
            const upiId = upiIdInput.value.trim();
            const upiIdPattern = /^[a-zA-Z0-9.\-]+@[a-zA-Z0-9.\-]+$/; // Basic UPI ID regex
 
            upiIdError.style.display = 'none'; // Hide previous error
 
            if (upiId === "") {
                upiIdError.textContent = "Please enter your UPI ID.";
                upiIdError.style.display = 'block';
            } else if (!upiIdPattern.test(upiId)) {
                upiIdError.textContent = "Invalid UPI ID format. E.g., user@bank";
                upiIdError.style.display = 'block';
            } else {
                alert(`Simulating payment for UPI ID: ${upiId}\n(In a real app, this would initiate a server-side payment request)`);
            }
        });
    }
 
    // Back Button Functionality (Basic)
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', () => {
            alert('Simulating back navigation.');
            // window.history.back(); or navigate to a specific route.
        });
    }
});