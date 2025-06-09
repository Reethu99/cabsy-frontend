document.addEventListener('DOMContentLoaded', function() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;

            // Close all other open accordions except the current one
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== this && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.classList.remove('show');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                    otherHeader.nextElementSibling.style.paddingTop = '0';
                    otherHeader.nextElementSibling.style.paddingBottom = '0';
                }
            });

            // Toggle the clicked accordion
            this.classList.toggle('active');
            if (content.classList.contains('show')) {
                content.classList.remove('show');
                content.style.maxHeight = null;
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
            } else {
                content.classList.add('show');
                content.style.maxHeight = content.scrollHeight + 'px'; // Set max-height to scrollHeight
                content.style.paddingTop = '15px';
                content.style.paddingBottom = '15px';
            }
        });
    });


    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include', // Important for sending cookies
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    alert(data.message || 'Logged out successfully!');
                    window.location.href = '/'; // Redirect to home/login page
                } else {
                    alert(`Logout failed: ${data.message || 'An unknown error occurred.'}`);
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An error occurred during logout. Please check your connection.');
            }
        });
    }
});