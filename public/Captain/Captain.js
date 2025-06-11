// Captain.js

// --- Global State Variables ---
let selectedRideId = null; // Used for selecting an available ride in the list
let activeRideId = localStorage.getItem('activeRideId'); // Stores the ID of the currently accepted/ongoing ride
let driverID = null; // This will be set dynamically on login from session data

// --- HTML Element References (get them once the DOM is ready) ---
const menuToggle = document.getElementById('menuToggle');
const mainNavbar = document.getElementById('mainNavbar');
const closeNavbarBtn = document.getElementById('closeNavbarBtn');
const navbarOverlay = document.getElementById('navbarOverlay');
const body = document.body;

const onlineStatusToggle = document.getElementById('online-status');
const onlineStatusMessage = document.getElementById('online-status-message');
const activityMessage = document.getElementById('activity-message');

const rideRequestSection = document.getElementById('ride-request-section');
const onGoingRideSection = document.getElementById('on-going-ride-section');
const noAvailableBookings = document.getElementById('no-available-bookings');
const availableRidesList = document.getElementById('available-rides-list');
const dashboardSectionGrid = document.querySelector('#dashboard-section .section-cards-grid'); // The grid for dashboard cards
const previousRidesList = document.getElementById('previous-rides-list'); // Add this reference
const ridesTodayElement = document.getElementById('rides-today'); // Dashboard stat
const earningsTodayElement = document.getElementById('earnings-today'); // Dashboard stat

let currentRideTimer;
let timeInMinutes = 0; // Initialize timeInMinutes

// --- Helper function to show/hide sections ---
// This function hides ALL major content sections first, then shows the target one.
// This ensures only one primary view is active at a time.
function showSection(sectionElement) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
}

// --- Navbar Functionality (Keep existing code) ---

// Function to toggle mobile navbar (overlay behavior)
function toggleMobileNavbar() {
    mainNavbar.classList.toggle('mobile-active');
    navbarOverlay.classList.toggle('active');
    body.classList.toggle('no-scroll'); // Prevent body scroll
}

// Function to set the desktop navbar state
function setDesktopNavbarState(isCollapsed) {
    if (isCollapsed) {
        body.classList.add('navbar-desktop-collapsed');
    } else {
        body.classList.remove('navbar-desktop-collapsed');
    }
}

// Initial check on load to set desktop state
if (window.innerWidth > 1024) {
    setDesktopNavbarState(false); // Start EXPANDED on desktop
}

// Event listener for desktop navbar click (to expand/collapse)
if (mainNavbar) {
    mainNavbar.addEventListener('click', function (event) {
        if (window.innerWidth > 1024 && !mainNavbar.classList.contains('mobile-active')) {
            if (event.target === mainNavbar || event.target.closest('.profile-summary') || event.target.closest('.navbar-footer') || event.target.closest('.navbar-nav')) {
                const isCurrentlyCollapsed = body.classList.contains('navbar-desktop-collapsed');
                setDesktopNavbarState(!isCurrentlyCollapsed);
            }
        }
    });
}

// Mobile Navbar: Event Listeners
if (menuToggle) menuToggle.addEventListener('click', toggleMobileNavbar);
if (closeNavbarBtn) closeNavbarBtn.addEventListener('click', toggleMobileNavbar);
if (navbarOverlay) navbarOverlay.addEventListener('click', toggleMobileNavbar);

// Close mobile navbar if a nav link inside it is clicked
const navbarNavLinks = document.querySelectorAll('.navbar-nav a');
navbarNavLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor jump

        if (window.innerWidth <= 1024 && mainNavbar.classList.contains('mobile-active')) {
            toggleMobileNavbar(); // Close navbar after clicking a link
        }

        const targetId = link.dataset.target;
        if (targetId) {
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                showSection(targetSection); // Use our new showSection function
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                targetSection.classList.add('highlighted');
                setTimeout(() => {
                    targetSection.classList.remove('highlighted');
                }, 1500);
            }
        }

        // Update active state in navbar
        navbarNavLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');
    });
});

// Handle window resize: Adjust navbar state
let currentWindowWidth = window.innerWidth;
window.addEventListener('resize', () => {
    if (window.innerWidth !== currentWindowWidth) {
        if (window.innerWidth > 1024) {
            mainNavbar.classList.remove('mobile-active');
            navbarOverlay.classList.remove('active');
            body.classList.remove('no-scroll');
            setDesktopNavbarState(false);
        } else {
            body.classList.remove('navbar-desktop-collapsed');
        }
        currentWindowWidth = window.innerWidth;
    }
});


// --- Online Status Toggle ---
function updateDriverStatus() {
    const isOnline = onlineStatusToggle.checked;
    onlineStatusMessage.innerHTML = isOnline ? 'You are **Online**' : 'You are **Offline**';

    if (isOnline) {
        activityMessage.textContent = 'Looking for new ride requests...';
        console.log('Driver is now ONLINE');
        // When going online, refresh available rides
        fetchAvailableRides();
    } else {
        activityMessage.textContent = 'Go online to receive bookings.';
        console.log('Driver is now OFFLINE');
        // When going offline, hide all ride-related sections
        rideRequestSection.style.display = 'none';
        onGoingRideSection.style.display = 'none';
        noAvailableBookings.style.display = 'none';
        availableRidesList.innerHTML = ''; // Clear available rides list
        dashboardSectionGrid.classList.remove('has-active-ride');
        clearInterval(currentRideTimer); // Stop any active ride timer
        showSection(document.getElementById('dashboard-section')); // Default to dashboard when offline
    }
}

onlineStatusToggle.addEventListener('change', updateDriverStatus);


// --- Function to Populate and Show On-Going Ride Section ---
function displayOngoingRide(ride) {
    if (!onGoingRideSection) return;

    // Set time for timer based on the ride's duration (if available) or a default
    timeInMinutes = (ride.duration && typeof ride.duration === 'string')
        ? parseFloat(ride.duration.replace('min', '').trim())
        : 15; // Default if not provided or invalid

    onGoingRideSection.innerHTML = `
        <h2>On-Going Ride</h2>
        <div class="ride-details">
            <p><i class="fas fa-user-circle"></i> <strong>Passenger:</strong> ${ride.userName || 'N/A'}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Pickup:</strong> ${ride.pickupAddress || 'Unknown'}</p>
            <p><i class="fas fa-flag-checkered"></i> <strong>Destination:</strong> ${ride.destinationAddress || 'Unknown'}</p>
            <p><i class="fas fa-clock"></i> <strong>Approx. Time Left:</strong> <span id="time-left">${ride.duration || 'N/A'}</span></p>
        </div>
        <div class="ride-actions">
            <button class="btn btn-primary"><i class="fas fa-location-arrow"></i> Navigate</button>
            <button class="btn btn-success" id="pickedUpBtn"><i class="fas fa-handshake"></i> Picked Up</button>
            <button class="btn btn-danger" id="endRideBtn"><i class="fas fa-car-side"></i> End Ride</button>
        </div>
    `;
    showSection(onGoingRideSection);
    dashboardSectionGrid.classList.add('has-active-ride'); // Indicate active ride on dashboard

    // Update activity message
    activityMessage.textContent = 'On a ride to drop-off destination.';


    // Add event listeners for ongoing ride buttons
    document.getElementById('pickedUpBtn').addEventListener('click', () => updateRideStatus(ride.id, 'picked_up'));
    document.getElementById('endRideBtn').addEventListener('click', () => endRide(ride.id, ride.estimatedFare)); // Pass fare for earnings update

    // Start or restart the timer
    clearInterval(currentRideTimer); // Clear any existing timer
    updateRideTimer(); // Call immediately to set initial time
    currentRideTimer = setInterval(updateRideTimer, 1000); // Update every second
}


// --- Function to Fetch Available Rides ---
function fetchAvailableRides() {
    // If there's an active ride and the driver is online, try to restore/show the active one
    if (activeRideId && onlineStatusToggle.checked) {
        fetch(`/ride-details/${activeRideId}`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch active ride details.');
                return response.json();
            })
            .then(data => {
                // If ride is active and belongs to this driver
                if (data.success && data.data && data.data.status !== 'completed' && data.data.status !== 'cancelled' && data.data.driverId === driverID) {
                    displayOngoingRide(data.data); // Show the ongoing ride section
                    availableRidesList.innerHTML = ''; // Clear available rides list
                    noAvailableBookings.style.display = 'none'; // Hide "no bookings"
                } else {
                    // Active ride was completed/cancelled, or doesn't belong to current driver, or not found, clear it
                    localStorage.removeItem('activeRideId');
                    activeRideId = null;
                    fetchAvailableRidesActual(); // Now fetch available rides as there's no ongoing ride
                }
            })
            .catch(err => {
                console.error("Error restoring active ride:", err);
                localStorage.removeItem('activeRideId'); // Clear invalid active ride ID
                activeRideId = null;
                fetchAvailableRidesActual(); // Then fetch available rides
            });
    } else if (onlineStatusToggle.checked) {
        // No active ride, and driver is online, proceed to fetch available rides
        fetchAvailableRidesActual();
    } else {
        // Driver is offline, hide ride sections
        rideRequestSection.style.display = 'none';
        onGoingRideSection.style.display = 'none';
        noAvailableBookings.style.display = 'block';
        availableRidesList.innerHTML = '';
    }
}

function fetchAvailableRidesActual() {
    fetch('/available-rides')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            document.querySelector('.h-name').textContent = `Hi, ${data.name}`;
            document.querySelector('.name').textContent = data.name;
            document.querySelector('.rating').textContent = data.rating;

        })
        .catch(error => {
            console.error("Error fetching session data:", error);
        });


       

        const driverID = 'driver_123'; // Replace with actual driver ID

        let selectedRideId = null;
        
        function fetchRides() {
          fetch('/available-rides')
            .then(response => response.json())
            .then(data => {
              if (!data.success) throw new Error('Failed to fetch rides');
        
              const rides = data.data.data;
              const rideList = document.getElementById('available-rides-list');
              const noBookings = document.getElementById('no-available-bookings');
              const rideRequestSection = document.getElementById('ride-request-section');
        
              rideList.innerHTML = '';
        
              if (rides.length === 0) {
                noBookings.style.display = 'block';
                rideRequestSection.style.display = 'none';
                return;
            }

            noAvailableBookings.style.display = 'none';

            // Default to most recent ride if none selected
            const rideToShow = selectedRideId
                ? rides.find(r => r.id === selectedRideId)
                : rides[0];

            if (!rideToShow) {
                rideRequestSection.style.display = 'none';
                noAvailableBookings.style.display = 'block'; // Show "no bookings" if selected ride not found
                return;
            }

            // Populate the detailed ride request section
            rideRequestSection.innerHTML = `
                <h2>New Ride Alert!</h2>
                <div class="ride-details">
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Pickup:</strong> ${rideToShow.pickupAddress || 'Unknown'}</p>
                    <p><i class="fas fa-flag-checkered"></i> <strong>Drop-off:</strong> ${rideToShow.destinationAddress || 'Unknown'}</p>
                    <p><i class="fas fa-rupee-sign"></i> <strong>Est. Fare:</strong> ₹ ${rideToShow.estimatedFare || 'N/A'}</p>
                    <p><i class="fas fa-road"></i> <strong>Distance:</strong> ${rideToShow.distance || 'N/A'} km</p>
                    <p><i class="fas fa-user-circle"></i> <strong>Passenger:</strong> ${rideToShow.userName || 'N/A'}</p>
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${rideToShow.userPhone || '-'}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time to Pickup:</strong> ${rideToShow.eta || 'N/A'}</p>
                </div>
                <div class="ride-actions">
                    <button class="btn btn-accept" id="acceptRideBtn"><i class="fas fa-check-circle"></i> Accept Ride</button>
                    <button class="btn btn-reject" id="rejectRideBtn"><i class="fas fa-times-circle"></i> Reject</button>
                </div>
            `;
            rideRequestSection.style.display = 'block'; // Show the detailed ride request card
            onGoingRideSection.style.display = 'none'; // Ensure ongoing ride is hidden

            // Add event listeners for the Accept and Reject buttons
            document.getElementById('acceptRideBtn').addEventListener('click', () => acceptRide(rideToShow.id));
            document.getElementById('rejectRideBtn').addEventListener('click', () => {
                selectedRideId = null; // Clear selected ride
                fetchAvailableRidesActual(); // Re-fetch to potentially show another ride or no bookings
            });

            // List all rides in the 'available-rides-list' for selection
            rides.forEach(ride => {
                const rideItem = document.createElement('div');
                rideItem.className = 'ride-item';
                rideItem.setAttribute('data-id', ride.id);

                rideItem.innerHTML = `
                    <div class="ride-item-header">
                        <h3>Pickup: ${ride.pickupAddress || 'Unknown'}</h3>
                        <span>ETA: ${ride.eta || 'N/A'}</span>
                    </div>
                    <p>Drop-off: ${ride.destinationAddress || 'Unknown'}</p>
                    <p>Est. Fare: ₹ ${ride.estimatedFare || 'N/A'}</p>
                    <button class="btn btn-accept-small" data-id="${ride.id}">Select</button>
                `;

                // Add click listener to 'Select' button to show ride details
                rideItem.querySelector('button').addEventListener('click', () => {
                    selectedRideId = ride.id; // Set the selected ride ID
                    fetchAvailableRidesActual(); // Re-fetch to update the detailed view with the selected ride
                });

                availableRidesList.appendChild(rideItem);
            });
        })
        .catch(err => {
            console.error("Error fetching available rides:", err);
            availableRidesList.innerHTML = `<p class="error-message">Error fetching available rides: ${err.message}</p>`;
            noAvailableBookings.style.display = 'none';
            rideRequestSection.style.display = 'none';
        });
}

// --- Function to Handle Ride Acceptance ---
function acceptRide(rideId) {
    console.log("Attempting to accept Ride:", rideId);
    fetch(`/accept-ride/${rideId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ driverID: driverID })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Failed to accept ride. Status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        alert('Ride accepted successfully!');
        selectedRideId = null; // Clear selected ride from available list
        activeRideId = rideId; // Set this as the active ride
        localStorage.setItem('activeRideId', activeRideId); // Store for persistence

        // Now, display the ongoing ride section by fetching its details
        fetch(`/ride-details/${activeRideId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to get accepted ride details.');
                return res.json();
            })
            .then(rideData => {
                if (rideData.success) {
                    displayOngoingRide(rideData.data);
                } else {
                    console.error('Failed to display accepted ride:', rideData.error);
                    // Fallback: just hide current sections and prompt for next action
                    showSection(document.getElementById('dashboard-section')); // Show dashboard
                }
            })
            .catch(err => {
                console.error("Error displaying accepted ride:", err);
                showSection(document.getElementById('dashboard-section'));
            });
        
        // Refresh previous rides and stats as a new ride has started
        fetchPreviousRides();
    })
    .catch(err => {
        console.error("Error accepting ride:", err);
        alert(`Error accepting ride: ${err.message}`);
    });
}

// --- Function to Update Ride Status (e.g., Picked Up) ---
function updateRideStatus(rideId, status) {
    console.log(`Updating ride ${rideId} status to: ${status}`);
    fetch(`/update-ride-status/${rideId}`, { // This endpoint needs to be created in your backend
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status, driverID: driverID })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Failed to update ride status to ${status}. Status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(() => {
        alert(`Ride status updated to ${status}!`);
        // If status changes affect UI (e.g., "Picked Up" button hides, "End Ride" shows),
        // re-fetch active ride details to update the ongoing section
        fetch(`/ride-details/${activeRideId}`)
            .then(res => res.json())
            .then(rideData => {
                if (rideData.success) {
                    displayOngoingRide(rideData.data); // Re-render with new status
                    if (status === 'picked_up') {
                        activityMessage.textContent = 'Driving passenger to destination.';
                    }
                }
            })
            .catch(err => console.error('Error re-displaying ongoing ride after status update:', err));
    })
    .catch(err => {
        console.error("Error updating ride status:", err);
        alert(`Error updating ride status: ${err.message}`);
    });
}

// --- Function to End a Ride ---
function endRide(rideId, estimatedFare) {
    console.log(`Ending ride: ${rideId}`);
    fetch(`/end-ride/${rideId}`, { // This endpoint needs to be created in your backend
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverID: driverID }) // Assuming your backend needs driverID
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errData => {
                throw new Error(errData.error || `Failed to end ride. Status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(() => {
        alert('Ride completed successfully!');
        localStorage.removeItem('activeRideId'); // Clear active ride from local storage
        activeRideId = null; // Reset global variable
        clearInterval(currentRideTimer); // Stop the timer

        // Update dashboard stats immediately (frontend estimate)
        if (ridesTodayElement) {
            ridesTodayElement.textContent = parseInt(ridesTodayElement.textContent) + 1;
        }
        if (earningsTodayElement && estimatedFare) {
            const currentEarnings = parseFloat(earningsTodayElement.textContent.replace('₹ ', '').replace(/,/g, ''));
            const newEarnings = currentEarnings + parseFloat(estimatedFare);
            earningsTodayElement.textContent = `₹ ${newEarnings.toLocaleString('en-IN')}`;
        }
        
        activityMessage.textContent = 'Ride completed. Looking for new requests...';
        dashboardSectionGrid.classList.remove('has-active-ride');

        // Hide ongoing ride section and re-fetch available rides
        onGoingRideSection.style.display = 'none';
        showSection(document.getElementById('dashboard-section')); // Show dashboard
        fetchAvailableRides(); // Fetch new available rides (will handle showing request card if any)
        fetchPreviousRides(); // Refresh previous rides and performance stats
    })
    .catch(err => {
        console.error("Error ending ride:", err);
        alert(`Error ending ride: ${err.message}`);
    });
}

// --- Dummy Ride Timer Function ---
// This function needs to be outside any conditional blocks to be accessible
function updateRideTimer() {
    const timeLeftSpan = document.getElementById('time-left');
    if (!timeLeftSpan) return; // Exit if the element is not there

    const totalSeconds = Math.floor(timeInMinutes * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (timeInMinutes <= 0) {
        clearInterval(currentRideTimer);
        timeLeftSpan.textContent = 'Arrived!';
        if (onGoingRideSection.style.display === 'block') { // Only alert if ride is actually ongoing
            alert('You have arrived at the destination!');
        }
    } else {
        timeLeftSpan.textContent = `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;
        timeInMinutes -= (1 / 60); // Decrement by one second (1/60th of a minute)
    }
}


// --- Function to Fetch and Process Previous Rides and Stats ---
function fetchPreviousRides() {
    fetch('/previous-rides')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                throw new Error(data.error || 'Failed to fetch previous rides');
            }

            const rides = data.data.data;
            if (previousRidesList) { // Check if element exists
                previousRidesList.innerHTML = ''; // Clear previous list items
            }

            let totalRidesCount = 0;
            let totalFare = 0;
            let acceptedRides = 0; // Assuming all fetched previous rides were accepted
            let totalRequests = 0; // This would need actual 'request' data from backend to be accurate

            if (rides.length === 0) {
                if (previousRidesList) {
                    previousRidesList.innerHTML = `<p><i class="fas fa-info-circle"></i> No previous rides found.</p>`;
                }
            } else {
                rides.forEach(ride => {
                    const rideItem = document.createElement('div');
                    rideItem.className = 'ride-item';

                    rideItem.innerHTML = `
                        <div class="ride-item-header">
                            <h3>To ${ride.destinationAddress || 'Unknown'}</h3>
                            <span class="status-completed">${ride.status || 'Completed'}</span>
                        </div>
                        <p><i class="fas fa-calendar-alt"></i> Date: ${new Date(ride.endTime).toLocaleDateString('en-IN')} |
                           <i class="fas fa-rupee-sign"></i> Fare: ₹ ${parseFloat(ride.estimatedFare).toLocaleString('en-IN') || 'N/A'}</p>
                        <p><i class="fas fa-user-circle"></i> Customer: ${ride.userName || 'N/A'}</p>
                        <div class="ride-item-actions">
                            <button class="btn btn-secondary-small"><i class="fas fa-redo-alt"></i> Re-ride</button>
                            <button class="btn btn-primary-small"><i class="fas fa-info-circle"></i> Details</button>
                        </div>
                    `;
                    if (previousRidesList) {
                        previousRidesList.appendChild(rideItem);
                    }

                    totalRidesCount++;
                    const fare = parseFloat(ride.estimatedFare);
                    if (!isNaN(fare)) {
                        totalFare += fare;
                    }
                    acceptedRides++; // Assuming previous rides imply accepted
                    totalRequests++; // Simplistic: counting each previous ride as a request
                });
            }

            // Update dashboard status indicators
            if (ridesTodayElement) ridesTodayElement.textContent = totalRidesCount;
            if (earningsTodayElement) earningsTodayElement.textContent = `₹ ${totalFare.toLocaleString('en-IN')}`;

            // Update Ride Performance section (assuming elements exist in HTML based on commented out section)
            const totalRidesStat = document.getElementById('total-rides-stat');
            const avgRatingStat = document.getElementById('avg-rating-stat');
            const acceptanceRateStat = document.getElementById('acceptance-rate-stat');
            const insightTextElement = document.getElementById('insight-text');

            if (totalRidesStat) totalRidesStat.textContent = totalRidesCount;
            if (avgRatingStat) avgRatingStat.innerHTML = `4.8 <i class="fas fa-star"></i>`; // Placeholder for now, integrate actual rating later
            let acceptanceRate = totalRequests > 0 ? ((acceptedRides / totalRequests) * 100).toFixed(0) : '0';
            if (acceptanceRateStat) acceptanceRateStat.textContent = `${acceptanceRate}%`;

            if (insightTextElement) {
                insightTextElement.textContent = totalRidesCount > 0
                    ? `You've completed ${totalRidesCount} rides! Keep going.`
                    : 'No ride data available yet. Start your first ride!';
                insightTextElement.style.color = totalRidesCount > 0 ? '#46ba57' : '#888';
            }
        })
        .catch(err => {
            console.error("Error fetching previous rides:", err);
            if (previousRidesList) {
                previousRidesList.innerHTML = `<p class="error-message">Error fetching previous rides: ${err.message}</p>`;
            }
            if (ridesTodayElement) ridesTodayElement.textContent = 'N/A';
            if (earningsTodayElement) earningsTodayElement.textContent = '₹ N/A';
            // Update performance stats to N/A on error
            const statsElements = ['total-rides-stat', 'avg-rating-stat', 'acceptance-rate-stat'];
            statsElements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = 'N/A';
            });
            if (document.getElementById('insight-text')) {
                document.getElementById('insight-text').textContent = 'Failed to load ride performance data.';
                document.getElementById('insight-text').style.color = '#dc3545';
            }
        });
}

// --- Initial Page Load / Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // Fetch user data first to get driverID
    fetch('/session-user')
        .then(response => {
            if (!response.ok) {
                // If session is not valid or user not logged in, redirect to login
                window.location.href = '/Login/Login.html'; // Adjust path if necessary
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Set driverID globally after fetching session data
            driverID = data.id; // Assuming the user ID from session is the driverID
            document.querySelector('.h-name').textContent = `Hi, ${data.name}`;
            document.querySelector('.name').textContent = data.name;
            // Update rating if available, otherwise keep placeholder or default
            const ratingElement = document.getElementById('rating');
            if (ratingElement) {
                ratingElement.innerHTML = `${data.rating || 'N/A'} <i class="fas fa-star"></i>`;
            }

            // Now that driverID is set, proceed with other fetches
            updateDriverStatus(); // Set initial online/offline state
            fetchAvailableRides(); // This function now intelligently checks for activeRideId
            fetchPreviousRides(); // Always fetch previous rides and stats on load
        })
        .catch(error => {
            console.error("Error fetching session data:", error);
            // Optionally, display an error message on the page
            alert('Error fetching user data. Please try logging in again.');
            window.location.href = '/Login/Login.html'; // Redirect to login on critical error
        });
    
    // Ensure initial section display (e.g., dashboard)
    showSection(document.getElementById('dashboard-section'));
});

// --- Periodic Refreshes ---
// Refresh available rides (and check for active ride) frequently if online
setInterval(() => {
    if (onlineStatusToggle.checked) {
        fetchAvailableRides();
    }
}, 30000); // Every 30 seconds

// Refresh previous rides and stats less frequently
setInterval(fetchPreviousRides, 300000); // Every 5 minutes
}