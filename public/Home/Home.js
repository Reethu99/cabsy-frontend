
document.addEventListener('DOMContentLoaded', () => {
    // Set current date for rideDate input
    const rideDateInput = document.getElementById('rideDate');
    if (rideDateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0!
        const dd = String(today.getDate()).padStart(2, '0');
        rideDateInput.value = `${yyyy}-${mm}-${dd}`;
        rideDateInput.min = `${yyyy}-${mm}-${dd}`; // Prevent past dates
    }
 
    // Set current time for rideTime input
    const rideTimeInput = document.getElementById('rideTime');
    if (rideTimeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        rideTimeInput.value = `${hours}:${minutes}`;
    }
 
    // Booking Form Submission (Simulated)
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent actual form submission
 
            const pickup = document.getElementById('pickupLocation').value;
            const dropoff = document.getElementById('dropoffLocation').value;
            const date = document.getElementById('rideDate').value;
            const time = document.getElementById('rideTime').value;
 
            if (pickup && dropoff && date && time) {
                alert(`Booking Request:\nPickup: ${pickup}\nDrop-off: ${dropoff}\nDate: ${date}\nTime: ${time}\n\n(In a real app, this would go to a booking confirmation page or initiate a search for cabs.)`);
                // Here, you would typically redirect to a /book-ride?pickup=... page
                // or make an AJAX call to your backend.
            } else {
                alert('Please fill in all booking details.');
            }
        });
    }
 
    // Hamburger Menu Toggle for Mobile
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
 
    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
 
        // Close menu if a link is clicked (for single-page navigation)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }
 
    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('.nav-links a, .footer-col a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Only smooth scroll if it's an internal anchor link
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Adjust for fixed header height
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
 