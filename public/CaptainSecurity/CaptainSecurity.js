document.addEventListener('DOMContentLoaded', () => {
    // --- Change Password Form Handling ---
    const changePasswordForm = document.getElementById('changePasswordForm');
    const passwordMessage = document.getElementById('passwordMessage');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

    let generatedOTP = ''; // To store the OTP generated on the frontend

    // changePasswordForm.addEventListener('submit', async (e) => {
    //     e.preventDefault();

    //     const currentPassword = currentPasswordInput.value;
    //     const newPassword = newPasswordInput.value;
    //     const confirmNewPassword = confirmNewPasswordInput.value;

    //     passwordMessage.textContent = '';
    //     passwordMessage.className = 'message'; // Reset message classes

    //     if (newPassword !== confirmNewPassword) {
    //         passwordMessage.classList.add('error');
    //         passwordMessage.textContent = 'New password and confirmation do not match.';
    //         return;
    //     }

    //     if (newPassword.length < 8) {
    //         passwordMessage.classList.add('error');
    //         passwordMessage.textContent = 'New password must be at least 8 characters long.';
    //         return;
    //     }

    //     // --- Frontend-only OTP Generation and "Sending" ---
    //     generatedOTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    //     console.log(`[DEMO] OTP generated: ${generatedOTP}`); // Log OTP to console for demo
    //     alert(`For demo purposes, your OTP is: ${generatedOTP}\n(Check console for demo OTP)`);

    //     const userEnteredOTP = prompt("Please enter the OTP sent to your registered mobile/email (check console for demo OTP):");

    //     if (userEnteredOTP === null || userEnteredOTP.trim() === '') {
    //         passwordMessage.classList.add('error');
    //         passwordMessage.textContent = 'OTP verification cancelled or empty.';
    //         return;
    //     }

    //     if (userEnteredOTP !== generatedOTP) {
    //         passwordMessage.classList.add('error');
    //         passwordMessage.textContent = 'Invalid OTP. Password update failed.';
    //         return;
    //     }

    //     // If OTP is correct (frontend-verified for this demo), proceed to "update password"
    //     console.log('OTP verified successfully (frontend-only verification). Attempting to change password...');
    //     console.log('Current:', currentPassword);
    //     console.log('New:', newPassword);

    //     // --- Simulate Password Update API Call ---
    //     // For DEMO purposes, we'll now make this always succeed if OTP is correct.
    //     // In a real application, you would make an actual fetch() call to your backend here.
    //     try {
    //         // Simulate a slight delay for the "API call"
    //         await new Promise(resolve => setTimeout(resolve, 500));

    //         // Simulate success for the password update if OTP was correct
    //         passwordMessage.classList.add('success');
    //         passwordMessage.textContent = 'Password changed successfully!';
    //         changePasswordForm.reset(); // Clear form fields
    //         currentPasswordInput.focus(); // Set focus back to first input
            
    //         // In a real app, you might also clear the OTP related states/variables here
    //         generatedOTP = ''; // Clear generated OTP after successful update
    //     } catch (error) {
    //         // This catch block would typically handle network errors or unexpected server issues
    //         console.error('Error during simulated password change:', error);
    //         passwordMessage.classList.add('error');
    //         passwordMessage.textContent = 'An unexpected error occurred. Please try again.';
    //     }
    // });

    // --- Two-Factor Authentication (2FA) Handling ---
    const toggle2faBtn = document.getElementById('toggle2faBtn');
    const twoFaStatusSpan = document.getElementById('2faStatus');
    const twoFaMessage = document.getElementById('2faMessage');
    let is2faEnabled = false; // This should be fetched from your backend

    // Function to update 2FA UI based on status
    const update2faUI = () => {
        if (is2faEnabled) {
            twoFaStatusSpan.textContent = 'Enabled';
            twoFaStatusSpan.style.color = '#28a745'; // Green
            toggle2faBtn.textContent = 'Disable 2FA';
            toggle2faBtn.style.backgroundColor = '#dc3545'; // Red
        } else {
            twoFaStatusSpan.textContent = 'Disabled';
            twoFaStatusSpan.style.color = '#dc3545'; // Red
            toggle2faBtn.textContent = 'Enable 2FA';
            toggle2faBtn.style.backgroundColor = '#5d7b9c'; // Blue
        }
    };

    // Simulate fetching initial 2FA status
    setTimeout(() => {
        is2faEnabled = localStorage.getItem('is2faEnabled') === 'true'; // Persistent for demo
        update2faUI();
    }, 100);


    toggle2faBtn.addEventListener('click', async () => {
        twoFaMessage.textContent = '';
        twoFaMessage.className = 'message';

        console.log(`Attempting to ${is2faEnabled ? 'disable' : 'enable'} 2FA...`);

        try {
            // Simulate success/failure for 2FA toggle
            const success = Math.random() > 0.3; // Higher chance of success for demo

            if (success) {
                is2faEnabled = !is2faEnabled; // Toggle status
                localStorage.setItem('is2faEnabled', is2faEnabled); // Store for demo persistence
                update2faUI();
                twoFaMessage.classList.add('success');
                twoFaMessage.textContent = `Two-Factor Authentication ${is2faEnabled ? 'enabled' : 'disabled'} successfully!`;
            } else {
                twoFaMessage.classList.add('error');
                twoFaMessage.textContent = `Failed to ${is2faEnabled ? 'disable' : 'enable'} 2FA. Please try again.`;
            }
        } catch (error) {
            console.error('Error toggling 2FA:', error);
            twoFaMessage.classList.add('error');
            twoFaMessage.textContent = 'An error occurred while toggling 2FA.';
        }
    });

    // --- Security Logs Handling ---
    const logTableBody = document.getElementById('logTableBody');
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');

    const fetchSecurityLogs = async () => {
        logTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Loading logs...</td></tr>';
        try {
            const simulatedLogs = [
                { time: new Date().toLocaleString(), event: 'Successful Login', ip: '192.168.1.100' },
                { time: new Date(Date.now() - 3600000).toLocaleString(), event: 'Password Change Attempt', ip: '203.0.113.5' },
                { time: new Date(Date.now() - 7200000).toLocaleString(), event: 'Failed Login (Wrong Password)', ip: '10.0.0.1' },
                { time: new Date(Date.now() - 10800000).toLocaleString(), event: '2FA Enabled', ip: '192.168.1.100' },
            ];

            logTableBody.innerHTML = ''; // Clear loading message
            if (simulatedLogs.length === 0) {
                logTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No security logs available.</td></tr>';
            } else {
                simulatedLogs.forEach(log => {
                    const row = logTableBody.insertRow();
                    row.insertCell().textContent = log.time;
                    row.insertCell().textContent = log.event;
                    row.insertCell().textContent = log.ip;
                });
            }
        } catch (error) {
            console.error('Error fetching security logs:', error);
            logTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Failed to load logs.</td></tr>';
        }
    };

    // Fetch logs on page load
    fetchSecurityLogs();

    // Refresh logs button
    refreshLogsBtn.addEventListener('click', fetchSecurityLogs);
});