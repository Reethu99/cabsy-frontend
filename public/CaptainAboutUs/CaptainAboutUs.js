document.addEventListener('DOMContentLoaded', () => {
    // Basic functionality for active nav link (optional)
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // No "Read More" functionality as per the simplified content request.
    // This script can be expanded for other interactive elements if needed in the future.
});