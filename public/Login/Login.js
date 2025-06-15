document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Toggle Elements ---
    const option1 = document.getElementById('option1'); // Rider option
    const option2 = document.getElementById('option2'); // Captain option
    const highlightLine = document.getElementById('highlight-line');

    // --- Login/Forgot Password Section Elements ---
    const loginFormContent = document.getElementById('login-form-content');
    const forgotPasswordContainer = document.getElementById('forgot-password-container');
    const forgotLink = document.getElementById('forgot');
    const backToLoginLink = document.getElementById('back-to-login');

    // --- Login Form Specific Elements ---
    // IMPORTANT: Assuming 'username' input is actually for 'email' as per backend LoginDTO
    const mainLoginForm = document.getElementById('mainLoginForm'); // Get the form element
    const emailInput = document.getElementById('email'); // Renamed for clarity, corresponds to backend 'email'
    const passwordInput = document.getElementById('password'); // Get password input

    // --- Forgot Password Specific Elements ---
    const forgotEmailInput = document.getElementById('forgot-email');
    const requestOtpBtn = document.getElementById('request-otp-btn');
    const otpSection = document.getElementById('otp-section');
    const otpInput = document.getElementById('otp-input');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const newPasswordSection = document.getElementById('new-password-section');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');
    const resetPasswordBtn = document.getElementById('reset-password-btn');

    // Variable to track selected option (RIDER/CAPTAIN)
    let selectedOptionId = 'option1'; // Default to RIDER

    // --- Utility Function for CSS Transitions (Promisified) ---
    // (Keeping your existing animation utility function as is)
    function animateAndHide(element, classesToAdd, classesToRemove, finalHidden = true, transitionDuration = 350) {
        return new Promise(resolve => {
            if (!element) {
                console.warn("Attempted to animate a null element:", element);
                return resolve();
            }

            // Clean up any existing transition classes that might interfere
            element.classList.remove(...classesToRemove);
            element.classList.remove(...classesToAdd);

            if (!element.classList.contains('hidden')) { // Only animate if visible
                element.classList.remove('fade-in-right'); // Clean up any previous fade-in
                element.classList.remove('fade-out-left'); // Clean up any previous fade-out
                element.style.opacity = ''; // Clear inline opacity
                element.style.transform = ''; // Clear inline transform
            }


            // Set a timeout as a fallback in case transitionend doesn't fire
            let animationTimeout = setTimeout(() => {
                element.removeEventListener('transitionend', onTransitionEnd);
                if (finalHidden) {
                    element.classList.add('hidden');
                }
                // Ensure final state is set even if transitionend doesn't fire
                // Use a short delay for forceReflow scenarios to ensure class is applied before state check
                setTimeout(() => {
                    element.style.opacity = (classesToAdd.includes('fade-out-left') || finalHidden) ? 0 : 1;
                    element.style.transform = (classesToAdd.includes('fade-out-left') || finalHidden) ? 'translateX(-30px)' : 'translateX(0)';
                    resolve();
                }, 50); // Small delay
            }, transitionDuration + 50); // A bit longer than max expected transition

            const onTransitionEnd = (event) => {
                // Ensure the event is from the element itself, not a child
                if (event.target === element) {
                    element.removeEventListener('transitionend', onTransitionEnd);
                    clearTimeout(animationTimeout); // Clear the fallback timeout

                    if (finalHidden) {
                        element.classList.add('hidden');
                    }
                    element.style.opacity = (classesToAdd.includes('fade-out-left') || finalHidden) ? 0 : 1;
                    element.style.transform = (classesToAdd.includes('fade-out-left') || finalHidden) ? 'translateX(-30px)' : 'translateX(0)';
                    resolve();
                }
            };

            // If the element is initially hidden and we're trying to show it, remove 'hidden' first
            if (element.classList.contains('hidden') && !finalHidden) {
                element.classList.remove('hidden');
                // Force reflow after removing 'hidden' to ensure 'display: block' is applied before transition
                void element.offsetWidth;
                // Add the animation class after reflow
                element.classList.add(...classesToAdd);
            } else {
                // For hiding or if already visible, just add the class
                element.classList.add(...classesToAdd);
            }

            // Add event listener
            element.addEventListener('transitionend', onTransitionEnd);
        });
    }

let  userType = "rider";
    // --- Toggle Rider/Captain Logic (Existing) ---
    option1.addEventListener('click', () => {
        option1.classList.add('selected');
        option2.classList.remove('selected');
        highlightLine.style.left = '0';
        selectedOptionId = 'option1'; // Update selected option
        userType = "rider"
    });

    option2.addEventListener('click', () => {
        option2.classList.add('selected');
        option1.classList.remove('selected');
        highlightLine.style.left = '120px';
        selectedOptionId = 'option2'; // Update selected option
        userType = "captain"
    });

    // Set initial selected state for Rider
    option1.classList.add('selected');
    highlightLine.style.left = '0';


    // --- Login Form Submission Logic (MODIFIED) ---
    mainLoginForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent default form submission

        const email = emailInput.value.trim(); // Get email (from 'username' input)
        const password = passwordInput.value.trim(); // Get password

        console.log('Attempting login with Email:', email);
        console.log('Password:', password);
        console.log('Selected Role ID:', selectedOptionId);

        if (!email || !password) {
            alert("Please enter both email and password.");
            return;
        }

        if (!selectedOptionId) {
            alert("Please select a role (Rider or Captain).");
            return;
        }

        try {
            // Make POST request to your Express backend's /login endpoint
            const response = await fetch("/login", { // Relative path to Express server
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, role: userType }),
            });

            const data = await response.json(); // Parse the JSON response from Express

            if (response.ok && data.success) { // Check both HTTP status and custom 'success' field from Express
                // alert(data.message);

                // Express server should send redirectUrl
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl; // Redirect to riderhome or captainhome
                } else {
                    console.warn("No redirectUrl received from server.");
                    // Fallback redirect if Express doesn't provide it
                    if (selectedOptionId === 'option1') {
                        window.location.href = '/riderhome';
                    } else if (selectedOptionId === 'option2') {
                        window.location.href = '/captainhome';
                    }
                }
            } else {
                // Handle login error from Express/Backend
                alert(data.error.error || "Login failed. Please try again.");
                console.error("Login failed details:", data.error);
            }
        } catch (error) {
            console.error("Error during login request:", error);
            alert("An error occurred. Please try again later.");
        }
    });


    // --- Forgot Password Flow Logic ---
    // (Keeping your existing forgot password logic as is)

    async function showForgotPasswordForm() {
        // Reset z-index
        loginFormContent.style.zIndex = '1';
        forgotPasswordContainer.style.zIndex = '2'; // Forgot form on top

        // Ensure login form is ready for fade-out
        loginFormContent.classList.remove('hidden');
        loginFormContent.classList.remove('fade-in-right'); // Clean up from previous entry

        await animateAndHide(loginFormContent, ['fade-out-left'], ['fade-in-right'], true);

        // Prepare forgot password container for fade-in
        forgotPasswordContainer.classList.remove('hidden');
        forgotPasswordContainer.classList.remove('fade-out-left'); // Clean up from previous exit
        forgotPasswordContainer.style.opacity = 0; // Ensure initial state for fade-in
        forgotPasswordContainer.style.transform = 'translateX(30px)'; // Ensure initial state for fade-in

        // Reset internal sections visually in case of re-entry
        otpSection.classList.add('hidden');
        otpSection.style.opacity = 0;
        otpSection.style.transform = 'translateY(10px)';
        newPasswordSection.classList.add('hidden');
        newPasswordSection.style.opacity = 0;
        newPasswordSection.style.transform = 'translateY(10px)';

        // Ensure initial email/request OTP elements are visible for new flow
        forgotEmailInput.classList.remove("hidden");
        requestOtpBtn.classList.remove("hidden");
        otpInput.classList.remove("hidden"); // Ensure OTP input is not hidden by previous flow
        verifyOtpBtn.classList.remove("hidden"); // Ensure Verify OTP button is not hidden
        forgotEmailInput.value = ''; // Clear email input on re-entry


        await animateAndHide(forgotPasswordContainer, ['fade-in-right'], ['fade-out-left'], false); // Don't hide itself
    }

    async function showLoginForm() {
        // Ensure everything within the forgot password container is reset and hidden first
        // This addresses the "Back to Login" issue at different stages.
        if (!newPasswordSection.classList.contains('hidden')) {
            await animateAndHide(newPasswordSection, ['fade-out-left'], ['fade-in-right'], true);
            newPasswordSection.style.opacity = 0; // Explicitly set final state
            newPasswordSection.style.transform = 'translateY(10px)';
        }

        if (!otpSection.classList.contains('hidden')) {
            await animateAndHide(otpSection, ['fade-out-left'], ['fade-in-right'], true);
            otpSection.style.opacity = 0; // Explicitly set final state
            otpSection.style.transform = 'translateY(10px)';
        }

        // Reset the email input and buttons to be visible for next forgot password attempt
        forgotEmailInput.classList.remove("hidden");
        requestOtpBtn.classList.remove("hidden");
        otpInput.classList.remove("hidden");
        verifyOtpBtn.classList.remove("hidden");


        // Reset form values
        forgotEmailInput.value = '';
        otpInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';

        // Reset z-index
        loginFormContent.style.zIndex = '2'; // Login form on top
        forgotPasswordContainer.style.zIndex = '1';

        // Prepare forgot password container for fade-out
        forgotPasswordContainer.classList.remove('hidden');
        forgotPasswordContainer.classList.remove('fade-in-right'); // Clean up from previous entry

        await animateAndHide(forgotPasswordContainer, ['fade-out-left'], ['fade-in-right'], true);

        // Prepare login form for fade-in
        loginFormContent.classList.remove('hidden');
        loginFormContent.classList.remove('fade-out-left'); // Clean up from previous exit
        loginFormContent.style.opacity = 0; // Ensure initial state for fade-in
        loginFormContent.style.transform = 'translateX(30px)'; // Ensure initial state for fade-in

        await animateAndHide(loginFormContent, ['fade-in-right'], ['fade-out-left'], false); // Don't hide itself
    }


    // Event listener for "Forgot Password?" link
    forgotLink.addEventListener('click', async (event) => {
        event.preventDefault(); // Stop the link from navigating
        await showForgotPasswordForm();
    });

    // Event listener for "Back to Login" link
    backToLoginLink.addEventListener('click', async (event) => {
        event.preventDefault();
        await showLoginForm();
    });

    // --- Request OTP Button Logic ---
    requestOtpBtn.addEventListener('click', async () => {
        const email = forgotEmailInput.value.trim();
        if (email) {
            alert(`OTP sent to ${email}! (For testing, OTP is: 123456)`);

            // Animate OTP section in
            otpSection.classList.remove('hidden'); // Ensure it's not hidden
            otpSection.style.opacity = 0; // Set initial state for transition
            otpSection.style.transform = 'translateY(10px)';
            await animateAndHide(otpSection, ['fade-in-right'], ['fade-out-left'], false);
            // After animation, explicitly set final state for robustness
            otpSection.style.opacity = 1;
            otpSection.style.transform = 'translateY(0)';

        } else {
            alert('Please enter your email address to request OTP.');
        }
    });

    // --- Verify OTP Button Logic ---
    verifyOtpBtn.addEventListener('click', async () => {
        const enteredOtp = otpInput.value.trim();
        const correctOtp = '123456'; // This would come from your backend in a real app

        if (enteredOtp === correctOtp) {
            alert('OTP Verified! You can now set your new password.');

            // Hide previous inputs
            forgotEmailInput.classList.add("hidden");
            requestOtpBtn.classList.add("hidden");
            otpInput.classList.add("hidden");
            verifyOtpBtn.classList.add("hidden");

            // Animate new password section in
            newPasswordSection.classList.remove('hidden'); // Ensure it's not hidden
            newPasswordSection.style.opacity = 0; // Set initial state for transition
            newPasswordSection.style.transform = 'translateY(10px)';
            await animateAndHide(newPasswordSection, ['fade-in-right'], ['fade-out-left'], false);
            // After animation, explicitly set final state for robustness
            newPasswordSection.style.opacity = 1;
            newPasswordSection.style.transform = 'translateY(0)';

        } else {
            alert('Invalid OTP. Please try again.');
            otpInput.value = ''; // Clear the OTP field for re-entry
        }
    });

    // --- Reset Password Button Logic ---
    resetPasswordBtn.addEventListener('click', async () => {
        const newPass = newPasswordInput.value;
        const confirmNewPass = confirmNewPasswordInput.value;
        const email = document.getElementById("forgot-email").value;
        if (newPass && newPass.length >= 6 && newPass === confirmNewPass) { // Basic validation
            const response = await fetch("/forgotPassword", { // Relative path to Express server
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ password: newPass ,email,userType}),
            });

            
const data = await response.json();

if (response.ok && data.success) { // Check both HTTP status (2xx) AND backend's success flag
    alert(data.message || 'Password updated successfully!'); // Display success message
    await showLoginForm(); // Only go back to login on success
} else {
    // Display error message from backend if available, otherwise a generic one
    alert(data.error.error || data.error.message || 'Failed to update password. Please try again.');
    // Do not showLoginForm on error, so user can see the message or retry
}
        } else if (!newPass || newPass.length < 6) {
            alert('New password must be at least 6 characters long.');
        } else {
            alert('New passwords do not match. Please ensure both fields are identical.');
        }
    });
});
