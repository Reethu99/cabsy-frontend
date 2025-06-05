document.addEventListener('DOMContentLoaded', function () {
    // --- Navbar Elements ---
    const menuToggle = document.getElementById('menuToggle'); // Mobile hamburger menu
    const mainNavbar = document.getElementById('mainNavbar'); // The left navbar
    const closeNavbarBtn = document.getElementById('closeNavbarBtn'); // Close button on mobile navbar
    const navbarOverlay = document.getElementById('navbarOverlay'); // Overlay for mobile navbar
    const body = document.body; // Reference to the body element

    // --- Function to toggle mobile navbar (overlay behavior) ---
    function toggleMobileNavbar() {
        mainNavbar.classList.toggle('mobile-active');
        navbarOverlay.classList.toggle('active');
        body.classList.toggle('no-scroll'); // Prevent body scroll
    }

    // --- Desktop Navbar: Handle expand/collapse ---
    // Function to set the desktop navbar state
    // `isCollapsed` will be true if we want it to be icon-only, false if full-width
    function setDesktopNavbarState(isCollapsed) {
        if (isCollapsed) {
            body.classList.add('navbar-desktop-collapsed');
        } else {
            body.classList.remove('navbar-desktop-collapsed');
        }
    }

    // Initial check on load to set desktop state
    if (window.innerWidth > 1024) {
        setDesktopNavbarState(false); // Start EXPANDED on desktop (false means NOT collapsed)
    }

    // Event listener for desktop navbar click (to expand/collapse)
    if (mainNavbar) {
        mainNavbar.addEventListener('click', function (event) {
            // Only apply desktop expand/collapse logic if wide enough AND not in mobile-active state
            if (window.innerWidth > 1024 && !mainNavbar.classList.contains('mobile-active')) {
                // Check if the click is on the navbar itself or its main structural children
                // but not on nav links as they should just navigate/highlight
                if (event.target === mainNavbar || event.target.closest('.profile-summary') || event.target.closest('.navbar-footer') || event.target.closest('.navbar-nav')) {
                    // Toggle the 'navbar-desktop-collapsed' class on the body
                    const isCurrentlyCollapsed = body.classList.contains('navbar-desktop-collapsed');
                    setDesktopNavbarState(!isCurrentlyCollapsed); // Toggle the state
                }
            }
        });
    }


    // --- Mobile Navbar: Event Listeners ---
    if (menuToggle) menuToggle.addEventListener('click', toggleMobileNavbar);
    if (closeNavbarBtn) closeNavbarBtn.addEventListener('click', toggleMobileNavbar);
    if (navbarOverlay) navbarOverlay.addEventListener('click', toggleMobileNavbar);


    // Close mobile navbar if a nav link inside it is clicked
    const navbarNavLinks = document.querySelectorAll('.navbar-nav a');
    navbarNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Check if mobile navbar is active (i.e., currently in mobile view and open)
            if (window.innerWidth <= 1024 && mainNavbar.classList.contains('mobile-active')) {
                toggleMobileNavbar(); // Close navbar after clicking a link
            }
            // --- Highlighting and Scrolling ---
            const targetId = link.dataset.target;
            if (targetId) {
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    // Smooth scroll to the section
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                    // Add highlight class
                    targetSection.classList.add('highlighted');

                    // Remove highlight class after a delay
                    setTimeout(() => {
                        targetSection.classList.remove('highlighted');
                    }, 1500); // Highlight for 1.5 seconds
                }
            }

            // Update active state in navbar
            navbarNavLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
        });
    });

    // --- Handle window resize: Adjust navbar state ---
    // This is crucial to ensure correct behavior when resizing from desktop to mobile and vice-versa
    let currentWindowWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth !== currentWindowWidth) { // Only run if width actually changed
            if (window.innerWidth > 1024) {
                // If resizing to desktop, ensure mobile classes are removed
                mainNavbar.classList.remove('mobile-active');
                navbarOverlay.classList.remove('active');
                body.classList.remove('no-scroll');
                // Ensure desktop state is applied (expanded by default on resize to desktop)
                setDesktopNavbarState(false);
            } else {
                // If resizing to mobile, remove desktop collapsed class
                body.classList.remove('navbar-desktop-collapsed');
            }
            currentWindowWidth = window.innerWidth;
        }
    });


    // --- Online Status Toggle ---
    const onlineStatusToggle = document.getElementById('online-status');
    const onlineStatusMessage = document.getElementById('online-status-message');

    const activityMessage = document.getElementById('activity-message');
    const rideRequestSection = document.getElementById('ride-request-section'); // Card for new request
    const onGoingRideSection = document.getElementById('on-going-ride-section'); // Card for ongoing ride
    const noAvailableBookings = document.getElementById('no-available-bookings'); // Message for no bookings
    const availableRidesList = document.getElementById('available-rides-list'); // List of available rides
    const dashboardSectionGrid = document.querySelector('#dashboard-section .section-cards-grid'); // The grid for dashboard cards

    // Initial state: hide ride request and on-going ride sections
    rideRequestSection.style.display = 'none';
    onGoingRideSection.style.display = 'none';

    function updateDriverStatus() {
        const isOnline = onlineStatusToggle.checked;

        onlineStatusMessage.innerHTML = isOnline ? 'You are **Online**' : 'You are **Offline**';

        if (isOnline) {
            activityMessage.textContent = 'Looking for new ride requests...';
            console.log('Driver is now ONLINE');
            noAvailableBookings.style.display = 'none';
            availableRidesList.style.display = 'grid'; // Assuming it's a grid for its items

            // Simulate a new ride request appearing after a short delay if online
            setTimeout(() => {
                // Ensure still online and no active ride
                if (onlineStatusToggle.checked && rideRequestSection.style.display === 'none' && onGoingRideSection.style.display === 'none') {
                    rideRequestSection.style.display = 'block';
                    dashboardSectionGrid.classList.add('has-active-ride'); // Add class to dashboard grid
                }
            }, 3000); // New request appears after 3 seconds
        } else {
            activityMessage.textContent = 'Go online to receive bookings.';
            console.log('Driver is now OFFLINE');
            rideRequestSection.style.display = 'none';
            onGoingRideSection.style.display = 'none';
            noAvailableBookings.style.display = 'block';
            availableRidesList.style.display = 'none';
            dashboardSectionGrid.classList.remove('has-active-ride'); // Remove class from dashboard grid
            clearInterval(currentRideTimer); // Stop any active ride timer
        }
    }

    onlineStatusToggle.addEventListener('change', updateDriverStatus);
    updateDriverStatus(); // Call on load to set initial state

    // --- Ride Request & Current Ride Logic (Demo) ---
    const acceptRideBtn = document.getElementById('acceptRideBtn');
    const rejectRideBtn = document.getElementById('rejectRideBtn');
    const pickedUpBtn = document.getElementById('pickedUpBtn');
    const endRideBtn = document.getElementById('endRideBtn');
    const timeLeftSpan = document.getElementById('time-left');

    let currentRideTimer;
    let timeInMinutes = 15;

    if (acceptRideBtn) {
        acceptRideBtn.addEventListener('click', function () {
            alert('Ride Accepted! Navigating to pickup location.');
            rideRequestSection.style.display = 'none';
            onGoingRideSection.style.display = 'block';
            noAvailableBookings.style.display = 'none';
            availableRidesList.style.display = 'none';

            timeInMinutes = 15;
            updateRideTimer();
            currentRideTimer = setInterval(updateRideTimer, 1000);
            activityMessage.textContent = 'On a ride to drop-off destination.';
            dashboardSectionGrid.classList.add('has-active-ride');
        });
    }

    if (rejectRideBtn) {
        rejectRideBtn.addEventListener('click', function () {
            alert('Ride Rejected. Looking for next request.');
            rideRequestSection.style.display = 'none';
            noAvailableBookings.style.display = 'block';
            availableRidesList.style.display = 'grid';
            activityMessage.textContent = 'Looking for new ride requests...';
            dashboardSectionGrid.classList.remove('has-active-ride');
            setTimeout(() => {
                if (onlineStatusToggle.checked) {
                    noAvailableBookings.style.display = 'none';
                }
            }, 2000);
        });
    }

    if (pickedUpBtn) {
        pickedUpBtn.addEventListener('click', function () {
            alert('Passenger picked up! Drive safely to destination.');
            activityMessage.textContent = 'Driving passenger to destination.';
        });
    }

    if (endRideBtn) {
        endRideBtn.addEventListener('click', function () {
            alert('Ride Ended! Payment collected.');
            onGoingRideSection.style.display = 'none';
            clearInterval(currentRideTimer);

            const ridesTodayElement = document.getElementById('rides-today');
            ridesTodayElement.textContent = parseInt(ridesTodayElement.textContent) + 1;
            const earningsTodayElement = document.getElementById('earnings-today');
            earningsTodayElement.textContent = '₹ ' + (parseInt(earningsTodayElement.textContent.replace('₹ ', '').replace(',', '')) + 350).toLocaleString();

            activityMessage.textContent = 'Ride completed. Looking for new requests...';
            dashboardSectionGrid.classList.remove('has-active-ride');

            setTimeout(() => {
                if (onlineStatusToggle.checked) {
                    rideRequestSection.style.display = 'block'; // Show a new request
                    noAvailableBookings.style.display = 'none';
                    availableRidesList.style.display = 'grid';
                    dashboardSectionGrid.classList.add('has-active-ride');
                }
            }, 2000);
        });
    }

    // --- Dummy Ride Timer Function ---
    function updateRideTimer() {
        const minutes = Math.floor(timeInMinutes);
        const seconds = Math.floor((timeInMinutes * 60) % 60);

        if (timeInMinutes <= 0) {
            clearInterval(currentRideTimer);
            timeLeftSpan.textContent = 'Arrived!';
            alert('You have arrived at the destination!');
        } else {
            timeLeftSpan.textContent = `${minutes} min ${seconds < 10 ? '0' : ''}${Math.floor(seconds)} sec`;
            timeInMinutes -= (1 / 60);
        }
    }

    // Event listener for accepting "Available Rides" list items
    const availableRideAcceptBtns = document.querySelectorAll('.ride-item [data-action="accept-available"]');
    availableRideAcceptBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            alert('Accepted ride from Available Rides! Proceeding to pickup.');
            rideRequestSection.style.display = 'none';
            onGoingRideSection.style.display = 'block';
            noAvailableBookings.style.display = 'none';
            availableRidesList.style.display = 'none';
            dashboardSectionGrid.classList.add('has-active-ride');
            timeInMinutes = 15;
            updateRideTimer();
            currentRideTimer = setInterval(updateRideTimer, 1000);
            activityMessage.textContent = 'On a ride to drop-off destination.';
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
      document.querySelector('.h-name').textContent =`Hi, ${data.name}`;
      document.querySelector('.name').textContent =data.name;
      document.querySelector('.rating').textContent = data.rating;
    })
    .catch(error => {
      console.error("Error fetching session data:", error);
    });
  

});