// This object will store verification statuses for email and phone numbers
const verificationStatus = {
    'rider-email': false,
    'rider-phone': false,
    'captain-email': false,
    'captain-phone': false,
};

// Function to switch between Rider and Captain forms
function showForm(formType) {
    const riderForm = document.getElementById('rider-form');
    const captainForm = document.getElementById('captain-form');
    const riderTab = document.getElementById('rider-tab');
    const captainTab = document.getElementById('captain-tab');
    const signInHeading = document.getElementById('signin');

    if (formType === 'rider') {
        riderForm.classList.add('active-form');
        captainForm.classList.remove('active-form');
        riderTab.classList.add('active');
        captainTab.classList.remove('active');
        signInHeading.textContent = 'Rider Registration'; // Change heading
    } else {
        captainForm.classList.add('active-form');
        riderForm.classList.remove('active-form');
        captainTab.classList.add('active');
        riderTab.classList.remove('active');
        signInHeading.textContent = 'Captain Registration'; // Change heading
    }
}

// Initial call to set the default form (Rider) and heading
document.addEventListener('DOMContentLoaded', () => {
    showForm('rider');
});

//function to generate otp
let currentOtp = null;

// Function to simulate sending OTP
function sendOtp(inputId) {
    currentOtp = Math.floor(100000 + Math.random() * 900000);
    const inputElement = document.getElementById(inputId);
    const otpGroup = document.getElementById(`${inputId}-otp-group`);
    const statusParagraph = document.getElementById(`${inputId}-status`);

    if (inputId.includes('email')) {
        if (!validateEmail(inputElement.value)) {
            statusParagraph.textContent = 'Please enter a valid email address.';
            statusParagraph.style.color = 'red';
            return;
        }
    } else if (inputId.includes('phone')) {
        if (!validatePhoneNumber(inputElement.value)) {
            statusParagraph.textContent = 'Please enter a valid 10-digit phone number.';
            statusParagraph.style.color = 'red';
            return;
        }
    }

    // Simulate sending OTP
    alert(`Your OTP is: ${currentOtp}`); // Changed to a more user-friendly alert
    console.log(`Sending OTP to ${inputElement.value}`);
    statusParagraph.textContent = `OTP sent to ${inputElement.value}.`;
    statusParagraph.style.color = 'orange';
    otpGroup.style.display = 'flex';
}

// Function to simulate verifying OTP
function verifyOtp(inputId) {
    let otpInput = document.getElementById(`${inputId}-otp-group`).querySelector('input');
    const statusParagraph = document.getElementById(`${inputId}-status`);

    // In a real application, you'd send this OTP to your backend for verification
    if (otpInput.value == currentOtp) { // Dummy OTP for demonstration
        statusParagraph.textContent = 'OTP Verified Successfully!';
        statusParagraph.style.color = 'green';
        verificationStatus[inputId] = true; // Mark as verified
        // Optionally disable the OTP input and verify button after successful verification
        otpInput.disabled = true;
        document.getElementById(`${inputId}-otp-group`).querySelector('button').disabled = true;
    } else {
        statusParagraph.textContent = 'Invalid OTP. Please try again.';
        statusParagraph.style.color = 'red';
        verificationStatus[inputId] = false;
    }
}

// --- Validation Functions ---
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(String(phone));
}

function validateUsername(username) {
    return username.length >= 3;
}

// --- Helper to reset OTP fields after successful submission ---
function resetOtpFields(formType) {
    const emailOtpGroup = document.getElementById(`${formType}-email-otp-group`);
    const phoneOtpGroup = document.getElementById(`${formType}-phone-otp-group`);
    const emailStatus = document.getElementById(`${formType}-email-status`);
    const phoneStatus = document.getElementById(`${formType}-phone-status`);

    verificationStatus[`${formType}-email`] = false;
    verificationStatus[`${formType}-phone`] = false;

    emailOtpGroup.style.display = 'none';
    phoneOtpGroup.style.display = 'none';

    emailStatus.textContent = '';
    phoneStatus.textContent = '';

    emailOtpGroup.querySelector('input').value = '';
    emailOtpGroup.querySelector('input').disabled = false;
    emailOtpGroup.querySelector('button').disabled = false;

    phoneOtpGroup.querySelector('input').value = '';
    phoneOtpGroup.querySelector('input').disabled = false;
    phoneOtpGroup.querySelector('button').disabled = false;
}

// Get Rider password elements
const riderPassword = document.getElementById("rider-password");
const riderConfirmPassword = document.getElementById("rider-confirmPassword");
const riderPasswordMessage = document.getElementById("rider-passwordMessage");
const riderConfirmMessage = document.getElementById("rider-confirmMessage");

// Get Captain password elements
const captainPassword = document.getElementById("captain-password");
const captainConfirmPassword = document.getElementById("captain-confirmPassword");
const captainPasswordMessage = document.getElementById("captain-passwordMessage");
const captainConfirmMessage = document.getElementById("captain-confirmMessage");


// Attaching event listeners for Rider form
// Use arrow functions to ensure `this` context or pass specific elements
if (riderPassword) {
    riderPassword.addEventListener('input', () => validatePassword(riderPassword, riderPasswordMessage));
}
if (riderConfirmPassword) {
    riderConfirmPassword.addEventListener('input', () => validateConfirmPassword(riderPassword, riderConfirmPassword, riderConfirmMessage));
}

// Attaching event listeners for Captain form
if (captainPassword) {
    captainPassword.addEventListener('input', () => validatePassword(captainPassword, captainPasswordMessage));
}
if (captainConfirmPassword) {
    captainConfirmPassword.addEventListener('input', () => validateConfirmPassword(captainPassword, captainConfirmPassword, captainConfirmMessage));
}


function validatePassword(passwordInput, passwordMessageElement) {
    const pwd = passwordInput.value;
    // Minimum 6 characters, at least one uppercase, one lowercase, one number, one special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;

    if (!re.test(pwd)) {
        passwordMessageElement.textContent = "Min 6 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.";
        passwordInput.classList.add("password-change"); // Add this class for visual feedback (e.g., red border)
        passwordMessageElement.classList.add("error");
        passwordMessageElement.classList.remove("success");
    } else {
        passwordMessageElement.textContent = "Password looks good!";
        passwordInput.classList.remove("password-change"); // Remove the class if valid
        passwordMessageElement.classList.remove("error");
        passwordMessageElement.classList.add("success");
    }

    // Always re-validate confirm password when the main password changes
    if (passwordInput.id === 'rider-password' && riderConfirmPassword) {
        validateConfirmPassword(riderPassword, riderConfirmPassword, riderConfirmMessage);
    } else if (passwordInput.id === 'captain-password' && captainConfirmPassword) {
        validateConfirmPassword(captainPassword, captainConfirmPassword, captainConfirmMessage);
    }
}

function validateConfirmPassword(passwordInput, confirmPasswordInput, confirmMessageElement) {
    const pwd = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    // Only validate if both fields have content or if confirm has content
    if (confirm === '') {
        confirmMessageElement.textContent = ""; // Clear message if confirm is empty
        confirmPasswordInput.classList.remove("password-change", "error", "success");
        return;
    }

    if (pwd !== confirm) {
        confirmMessageElement.textContent = "Passwords do not match!";
        confirmPasswordInput.classList.add("password-change");
        confirmMessageElement.classList.add("error");
        confirmMessageElement.classList.remove("success");
    } else {
        confirmMessageElement.textContent = "Passwords match!";
        confirmPasswordInput.classList.remove("password-change"); // Remove the class if valid
        confirmMessageElement.classList.remove("error");
        confirmMessageElement.classList.add("success");
    }
}
