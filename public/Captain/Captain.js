// Captain.js

// --- Global State Variables ---
let selectedRideId = null; // Used for selecting an available ride in the list
let activeRideId = localStorage.getItem('activeRideId'); // Stores the ID of the currently accepted/ongoing ride
let driverID = null; // This will be set dynamically on login from session data
let activeRideDetails = null; // To store the full details of the ongoing ride

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
const dashboardSectionGrid = document.querySelector('#dashboard-section .section-cards-grid');
const currentStatusCard = document.querySelector('.current-status-card'); // Add this for explicit control
const previousRidesList = document.getElementById('previous-rides-list');
const ridesTodayElement = document.getElementById('rides-today');
const earningsTodayElement = document.getElementById('earnings-today');

// For the ride performance section (uncommented in HTML)
const totalRidesStat = document.getElementById('total-rides-stat');
const avgRatingStat = document.getElementById('avg-rating-stat');
const acceptanceRateStat = document.getElementById('acceptance-rate-stat');
const insightTextElement = document.getElementById('insight-text');

let currentRideTimer;
let countdownEndTime; // Store the exact time the ride should end

// --- Helper function to show/hide sections ---
// This helper controls the main content sections
function showSection(sectionElement) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    if (sectionElement) {
        sectionElement.style.display = 'block';
    }
}

// --- Navbar Functionality ---

function toggleMobileNavbar() {
    mainNavbar.classList.toggle('mobile-active');
    navbarOverlay.classList.toggle('active');
    body.classList.toggle('no-scroll');
}

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
            // Only toggle if clicking on the navbar itself or within its main content areas,
            // not on specific interactive elements like links or buttons within
            const isClickOnToggleArea = event.target === mainNavbar ||
                                        event.target.closest('.profile-summary') ||
                                        event.target.closest('.navbar-footer') ||
                                        event.target.closest('.navbar-nav') ||
                                        event.target.closest('.menu-toggle'); // Added menu toggle if it's within desktop context

            if (isClickOnToggleArea) {
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
                showSection(targetSection);
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
            setDesktopNavbarState(false); // Ensure expanded on desktop resize
        } else {
            body.classList.remove('navbar-desktop-collapsed'); // Ensure no desktop-specific class on mobile
        }
        currentWindowWidth = window.innerWidth;
    }
});

// --- Online Status Toggle ---
function updateDriverStatus() {
    const isOnline = onlineStatusToggle.checked;
    onlineStatusMessage.innerHTML = isOnline ? 'You are **Online**' : 'You are **Offline**';
    onlineStatusMessage.style.color = isOnline ? '#46ba57' : '#dc3545'; // Green for online, red for offline

    if (isOnline) {
        activityMessage.textContent = 'Looking for new ride requests...';
        console.log('Driver is now ONLINE. Initiating fetchAvailableRides().');
        fetchAvailableRides(); // When going online, refresh available rides
    } else {
        activityMessage.textContent = 'Go online to receive bookings.';
        console.log('Driver is now OFFLINE. Hiding ride sections.');
        // When going offline, hide all ride-related sections on dashboard
        rideRequestSection.style.display = 'none';
        onGoingRideSection.style.display = 'none';
        noAvailableBookings.style.display = 'none';
        availableRidesList.innerHTML = ''; // Clear available rides list
        dashboardSectionGrid.classList.remove('has-active-ride');
        currentStatusCard.style.display = 'block'; // Ensure current status is visible
        clearInterval(currentRideTimer); // Stop any active ride timer
        showSection(document.getElementById('dashboard-section')); // Default to dashboard when offline
    }
}

onlineStatusToggle.addEventListener('change', updateDriverStatus);


// --- Function to Populate and Show On-Going Ride Section ---
function displayOngoingRide(ride) {
    if (!onGoingRideSection) {
        console.error("onGoingRideSection element not found!");
        return;
    }

    activeRideDetails = ride; // Store current ride details globally
    activeRideId = ride.id; // Ensure activeRideId is set correctly from the fetched ride data
    localStorage.setItem('activeRideId', activeRideId); // Make sure it's stored for refresh

    // Determine button states based on ride status (using your enum values)
    const isAccepted = ride.status === 'ACCEPTED' || ride.status === 'ON_ROUTE_TO_PICKUP' || ride.status === 'ARRIVED_AT_PICKUP';
    const isInProgress = ride.status === 'IN_PROGRESS';
    const isCompletedOrCancelled = ride.status === 'COMPLETED' || ride.status === 'CANCELLED';

    // Disable End Ride until IN_PROGRESS, Disable Picked Up once IN_PROGRESS
    const endRideDisabled = isInProgress ? '' : 'disabled';
    const pickedUpDisabled = isInProgress || isCompletedOrCancelled ? 'disabled' : '';

    onGoingRideSection.innerHTML = `
        <h2>On-Going Ride</h2>
        <div class="ride-details">
            <p><i class="fas fa-user-circle"></i> <strong>Passenger:</strong> ${ride.userName || 'N/A'}</p>
            <p><i class="fas fa-map-marker-alt"></i> <strong>Pickup:</strong> ${ride.pickupAddress || 'Unknown'}</p>
            <p><i class="fas fa-flag-checkered"></i> <strong>Destination:</strong> ${ride.destinationAddress || 'Unknown'}</p>
            <p><i class="fas fa-rupee-sign"></i> <strong>Est. Fare:</strong> ₹ ${parseFloat(ride.actualFare) || 'N/A'}</p>
            <p><i class="fas fa-road"></i> <strong>Distance:</strong> ${ride.distance || 'N/A'} km</p>
            <p><i class="fas fa-clock"></i> <strong>Approx. Time Left:</strong> <span id="time-left">${ride.duration || 'N/A'}</span></p>
            <p><i class="fas fa-info-circle"></i> <strong>Ride Status:</strong> <span id="current-ride-status">${ride.status ? ride.status.replace(/_/g, ' ') : 'N/A'}</span></p>
        </div>
        <div class="ride-actions">
            <button class="btn btn-success" id="pickedUpBtn" ${pickedUpDisabled}><i class="fas fa-handshake"></i> Picked Up</button>
            <button class="btn btn-danger" id="endRideBtn" ${endRideDisabled}><i class="fas fa-car-side"></i> End Ride</button>
            ${!isInProgress && !isCompletedOrCancelled ? `<button class="btn btn-warning" id="cancelRideBtn"><i class="fas fa-times-circle"></i> Cancel Ride</button>` : ''}
        </div>
    `;

    // Explicitly show the ongoing ride section and hide others
    currentStatusCard.style.display = 'none';
    rideRequestSection.style.display = 'none';
    noAvailableBookings.style.display = 'none'; // Ensure this is also hidden
    onGoingRideSection.style.display = 'block';
    dashboardSectionGrid.classList.add('has-active-ride'); // Indicate active ride on dashboard
    showSection(document.getElementById('dashboard-section')); // Ensure dashboard section is active

    // Attach event listeners *only once* after the element is (re)created
    const pickedUpButton = document.getElementById('pickedUpBtn');
    if (pickedUpButton) {
        pickedUpButton.onclick = null; // Clear previous handler
        if (!pickedUpButton.disabled) {
            pickedUpButton.onclick = () => updateRideStatus(ride.id, 'IN_PROGRESS');

        }
    }

    const endRideButton = document.getElementById('endRideBtn');
    if (endRideButton) {
        endRideButton.onclick = null; // Clear previous handler
        if (!endRideButton.disabled) {
            endRideButton.onclick = () => updateRideStatus(ride.id, 'COMPLETED'); // Call endRide function
        }
    }

    const cancelRideButton = document.getElementById('cancelRideBtn');
    if (cancelRideButton) {
        cancelRideButton.onclick = null; // Clear previous handler
        cancelRideButton.onclick = () => updateRideStatus(ride.id, 'CANCELLED'); // Allow cancellation before pickup
    }

    // If ride is completed or cancelled, clear activeRideId and reset view
    if (isCompletedOrCancelled) {
        console.log(`Ride ${ride.id} is already ${ride.status}. Clearing activeRideId and resetting UI.`);
        localStorage.removeItem('activeRideId');
        activeRideId = null;
        activeRideDetails = null;
        clearInterval(currentRideTimer);
        showSection(document.getElementById('dashboard-section')); // Go back to dashboard
        currentStatusCard.style.display = 'block'; // Show current status card again
        dashboardSectionGrid.classList.remove('has-active-ride');
        fetchAvailableRides(); // Re-fetch available rides
        fetchPreviousRides(); // Update previous rides and stats
    }
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers

    // Convert degrees to radians
    const toRadians = (deg) => deg * (Math.PI / 180);

    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);

    const deltaLat = lat2Rad - lat1Rad;
    const deltaLon = lon2Rad - lon1Rad;

    // Haversine formula
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers
    return distance;
}


// --- Function to Fetch Available Rides ---
function fetchAvailableRides() {
    // If there's an active ride and the driver is online, try to restore/show the active one
    if (activeRideId && onlineStatusToggle.checked) {
        console.log(`FetchAvailableRides: Attempting to restore active ride: ${activeRideId} for driver: ${driverID}`);
        fetch(`/ride-details/${activeRideId}`)
            .then(response => {
                if (!response.ok) {
                    console.warn(`FetchAvailableRides: Failed to fetch active ride details for ${activeRideId}. Status: ${response.status}. Assuming ride no longer active.`);
                    // If backend says ride not found or internal error, treat as non-restorable
                    throw new Error('Failed to fetch active ride details.');
                }
                return response.json();
            })
            .then(data => {
                // If ride is active and belongs to this driver
                if (data.success && data.data && data.data.status !== 'COMPLETED' && data.data.status !== 'CANCELLED' && data.data.driverId === driverID) {
                    console.log(`FetchAvailableRides: Successfully restored active ride: ${activeRideId}, status: ${data.data.status}`);
                    displayOngoingRide(data.data); // Show the ongoing ride section
                    // displayOngoingRide already handles hiding others
                } else {
                    console.log(`FetchAvailableRides: Active ride ${activeRideId} not valid for restoration (status: ${data.data ? data.data.status : 'N/A'}, driverId match: ${data.data ? data.data.driverId === driverID : 'N/A'}). Clearing activeRideId.`);
                    // Active ride was completed/cancelled, or doesn't belong to current driver, or not found, clear it
                    localStorage.removeItem('activeRideId');
                    activeRideId = null;
                    activeRideDetails = null;
                    fetchAvailableRidesActual(); // Now fetch available rides as there's no ongoing ride
                }
            })
            .catch(err => {
                console.error("FetchAvailableRides: Error restoring active ride, clearing activeRideId from localStorage:", err);
                localStorage.removeItem('activeRideId'); // Clear invalid active ride ID
                activeRideId = null;
                activeRideDetails = null;
                fetchAvailableRidesActual(); // Then fetch available rides
            });
    } else if (onlineStatusToggle.checked) {
        // No active ride in localStorage, and driver is online, proceed to fetch available rides
        console.log("FetchAvailableRides: No active ride found in localStorage. Fetching available rides.");
        fetchAvailableRidesActual();
    } else {
        // Driver is offline, hide ride sections
        console.log("FetchAvailableRides: Driver is offline. Not fetching available rides.");
        rideRequestSection.style.display = 'none';
        onGoingRideSection.style.display = 'none';
        noAvailableBookings.style.display = 'block';
        availableRidesList.innerHTML = '';
        currentStatusCard.style.display = 'block'; // Show current status card when offline
        showSection(document.getElementById('dashboard-section')); // Ensure dashboard section is active
    }
}

function fetchAvailableRidesActual() {
    console.log("Fetching actual available rides from server...");
    fetch('/available-rides')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.success) throw new Error(data.error || 'Failed to fetch available rides');

            const rides = data.data.data;
            availableRidesList.innerHTML = ''; // Clear previous list items

            // Ensure ongoing ride section is hidden if we are fetching available rides
            onGoingRideSection.style.display = 'none';
            dashboardSectionGrid.classList.remove('has-active-ride'); // Remove active ride styling
            showSection(document.getElementById('dashboard-section')); // Ensure dashboard section is active


            if (rides.length === 0) {
                console.log("No available bookings found.");
                noAvailableBookings.style.display = 'block';
                rideRequestSection.style.display = 'none';
                currentStatusCard.style.display = 'block'; // Show current status card when no bookings
                return;
            }

            console.log(`Found ${rides.length} available rides.`);
            noAvailableBookings.style.display = 'none';

            // Default to most recent ride if none selected and no active ride
            const rideToShow = selectedRideId
                ? rides.find(r => r.id === selectedRideId)
                : rides[0]; // Always show the first available ride as default

            if (!rideToShow) {
                console.warn("No ride to show after filtering/selection. Displaying no bookings.");
                rideRequestSection.style.display = 'none';
                noAvailableBookings.style.display = 'block'; // Show "no bookings" if selected ride not found
                currentStatusCard.style.display = 'block'; // Show current status card
                return;
            }

            // Populate the detailed ride request section
            rideRequestSection.innerHTML = `
                <h2>New Ride Alert!</h2>
                <div class="ride-details">
                    <p><i class="fas fa-map-marker-alt"></i> <strong>Pickup:</strong> ${rideToShow.pickupAddress || 'Unknown'}</p>
                    <p><i class="fas fa-flag-checkered"></i> <strong>Drop-off:</strong> ${rideToShow.destinationAddress || 'Unknown'}</p>
                    <p><i class="fas fa-rupee-sign"></i> <strong>Est. Fare:</strong> ₹ ${rideToShow.actualFare || 'N/A'}</p>
                    <p><i class="fas fa-road"></i> <strong>Distance:</strong> ${calculateHaversineDistance(rideToShow.pickupLat,rideToShow.pickupLon,rideToShow.destinationLat,rideToShow.destinationLon) || '12'} km</p>
                    <p><i class="fas fa-user-circle"></i> <strong>Passenger:</strong> ${rideToShow.userName || 'N/A'}</p>
                    <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${rideToShow.userPhone || '-'}</p>
                    <p><i class="fas fa-clock"></i> <strong>Time to Pickup:</strong> ${rideToShow.eta || 'N/A'}</p>
                </div>
                <div class="ride-actions">
                    <button class="btn btn-accept" id="acceptRideBtn"><i class="fas fa-check-circle"></i> Accept Ride</button>
                    <button class="btn btn-reject" id="rejectRideBtn"><i class="fas fa-times-circle"></i> Reject</button>
                </div>
            `;
            // Only show the ride request if there's no ongoing ride (important for initial load/refresh)
            console.log(`Displaying ride request for ${rideToShow.id}.`);
            rideRequestSection.style.display = 'block';
            currentStatusCard.style.display = 'none'; // Hide current status card if showing a request


            // Add event listeners for the Accept and Reject buttons
            const acceptBtn = document.getElementById('acceptRideBtn');
            if (acceptBtn) {
                acceptBtn.onclick = () => acceptRide(rideToShow.id); // Assign handler directly
            }

            const rejectBtn = document.getElementById('rejectRideBtn');
            if (rejectBtn) {
                rejectBtn.onclick = () => {
                    selectedRideId = null; // Clear selected ride
                    fetchAvailableRidesActual(); // Re-fetch to potentially show another ride or no bookings
                };
            }

            // List all rides in the 'available-rides-list' for selection
            rides.forEach(ride => {
                const rideItem = document.createElement('div');
                rideItem.className = 'ride-item';
                rideItem.setAttribute('data-id', ride.id);

                // Add 'selected' class if this is the currently displayed ride request
                if (ride.id === rideToShow.id) {
                    rideItem.classList.add('selected');
                }

                rideItem.innerHTML = `
                    <div class="ride-item-header">
                        <h3>Pickup: ${ride.pickupAddress || 'Unknown'}</h3>
                        <span>ETA: ${ride.eta || 'N/A'}</span>
                    </div>
                    <p>Drop-off: ${ride.destinationAddress || 'Unknown'}</p>
                    <p>Est. Fare: ₹ ${ride.actualFare || 'N/A'}</p>
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
            currentStatusCard.style.display = 'block'; // Revert to status card on error
            showSection(document.getElementById('dashboard-section')); // Ensure dashboard section is active
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
        selectedRideId = null; // Clear selected ride from available list
        activeRideId = rideId; // Set this as the active ride
        localStorage.setItem('activeRideId', activeRideId); // Store for persistence
        console.log(`Ride ${rideId} accepted. activeRideId set to ${activeRideId} in localStorage.`);

        // Now, display the ongoing ride section by fetching its details
        fetch(`/ride-details/${activeRideId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to get accepted ride details.');
                return res.json();
            })
            .then(rideData => {
                if (rideData.success && rideData.data) {
                    console.log(`Successfully fetched accepted ride details for ${activeRideId}. Displaying ongoing ride.`);
                    console.log("Ride data:",rideData.data)
                    displayOngoingRide(rideData.data);
                    // displayOngoingRide already handles hiding rideRequestSection and currentStatusCard
                } else {
                    console.error('Failed to display accepted ride details:', rideData.error || 'No data received.');
                    // If accepted but failed to get details, clear active state to prevent stuck UI
                    localStorage.removeItem('activeRideId');
                    activeRideId = null;
                    activeRideDetails = null;
                    showSection(document.getElementById('dashboard-section')); // Fallback to dashboard
                    currentStatusCard.style.display = 'block'; // Show current status card
                    dashboardSectionGrid.classList.remove('has-active-ride'); // Remove active ride styling
                    fetchAvailableRides(); // Re-fetch available rides
                }
            })
            .catch(err => {
                console.error("Error displaying accepted ride after fetching details:", err);
                localStorage.removeItem('activeRideId'); // Clear active ride on error
                activeRideId = null;
                activeRideDetails = null;
                showSection(document.getElementById('dashboard-section'));
                currentStatusCard.style.display = 'block';
                dashboardSectionGrid.classList.remove('has-active-ride');
                fetchAvailableRides(); // Re-fetch available rides
            });

        fetchPreviousRides(); // Refresh previous rides and stats as a new ride has started
    })
    .catch(err => {
        console.error("Error accepting ride:", err);
        alert(`Error accepting ride: ${err.message}`); // Keep alert for actual errors
    });
}

// --- Function to Update Ride Status (e.g., Picked Up) ---
function updateRideStatus(rideId, status) {
    console.log(`Updating ride ${rideId} status to: ${status}`);
    fetch(`/update-ride-status/${rideId}`, {
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
        
        console.log(`Ride ${rideId} status successfully updated to ${status}.`);
        // If the ride was CANCELLED, immediately clear activeRideId and refresh
        if (status === 'CANCELLED') {
            alert('Ride has been cancelled.'); // Inform user immediately
            localStorage.removeItem('activeRideId');
            activeRideId = null;
            activeRideDetails = null;
            clearInterval(currentRideTimer);
            showSection(document.getElementById('dashboard-section')); // Go back to dashboard
            currentStatusCard.style.display = 'block';
            dashboardSectionGrid.classList.remove('has-active-ride');
            fetchAvailableRides(); // Fetch new available rides after cancellation
            fetchPreviousRides(); // Update stats
            return; // Exit here as the ride is no longer ongoing
        }
        if (status === 'IN_PROGRESS') {
            document.getElementById('pickedUpBtn').style.display='none';
            document.getElementById('endRideBtn').style.display='block';
        }
        if (status === 'ACCEPTED') {
            document.getElementById('endRideBtn').style.display='none';
        }
        if (status === 'COMPLETED') {
            alert('Ride completed sucessfully.'); // Inform user immediately
            localStorage.removeItem('activeRideId');
            activeRideId = null;
            activeRideDetails = null;
            clearInterval(currentRideTimer);
            showSection(document.getElementById('dashboard-section')); // Go back to dashboard
            currentStatusCard.style.display = 'block';
            dashboardSectionGrid.classList.remove('has-active-ride');
            fetchAvailableRides(); // Fetch new available rides after cancellation
            fetchPreviousRides(); // Update stats
            return; // Exit here as the ride is no longer ongoing
        }
        // Re-fetch active ride details to update the ongoing section with new button states
        fetch(`/ride-details/${activeRideId}`)
            .then(res => res.json())
            .then(rideData => {
                if (rideData.success && rideData.data) {
                    console.log(`Re-displaying ongoing ride ${activeRideId} with new status: ${rideData.data.status}`);
                    displayOngoingRide(rideData.data); // Re-render with new status
                } else {
                    // If ride is no longer found or valid after status update, clear it.
                    console.warn(`Ride ${activeRideId} not found or invalid after status update to ${status}. Clearing active ride.`);
                    localStorage.removeItem('activeRideId');
                    activeRideId = null;
                    activeRideDetails = null;
                    clearInterval(currentRideTimer);
                    showSection(document.getElementById('dashboard-section'));
                    currentStatusCard.style.display = 'block';
                    dashboardSectionGrid.classList.remove('has-active-ride');
                    fetchAvailableRides(); // Fetch new available rides
                    fetchPreviousRides(); // Update stats
                }
            })
            .catch(err => {
                console.error('Error re-displaying ongoing ride after status update. Clearing active ride as fallback:', err);
                // On error fetching updated ride details, clear active ride as a fallback
                localStorage.removeItem('activeRideId');
                activeRideId = null;
                activeRideDetails = null;
                clearInterval(currentRideTimer);
                showSection(document.getElementById('dashboard-section'));
                currentStatusCard.style.display = 'block';
                dashboardSectionGrid.classList.remove('has-active-ride');
                fetchAvailableRides(); // Fetch new available rides
                fetchPreviousRides(); // Update stats
            });
    })
    .catch(err => {
        console.error("Error updating ride status:", err);
        alert(`Error updating ride status: ${err.message}`);
    });
}


// --- Ride Timer Function ---
function updateRideTimer() {
    const timeLeftSpan = document.getElementById('time-left');
    if (!timeLeftSpan || !countdownEndTime) return;

    const now = Date.now();
    const timeLeftMillis = countdownEndTime - now;

    if (timeLeftMillis <= 0) {
        clearInterval(currentRideTimer);
        timeLeftSpan.textContent = 'Arrived!';
    } else {
        const totalSeconds = Math.floor(timeLeftMillis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timeLeftSpan.textContent = `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;
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
            if (previousRidesList) {
                previousRidesList.innerHTML = '';
            }

            let totalRidesCount = 0;
            let totalFare = 0;
            let totalRating = 0;
            let ratedRidesCount = 0;
            let acceptedRides = 0;
            let totalRequests = 0; // This needs to come from backend for accuracy

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
                            <span class="status-completed">${ride.status ? ride.status.replace(/_/g, ' ') : 'Completed'}</span>
                        </div>
                        <p><i class="fas fa-calendar-alt"></i> Date: ${new Date(ride.endTime).toLocaleDateString('en-IN')} |
                           <i class="fas fa-rupee-sign"></i> Fare: ₹ ${parseFloat(ride.actualFare).toLocaleString('en-IN') || 'N/A'}</p>
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
                    const fare = parseFloat(ride.actualFare);
                    if (!isNaN(fare)) {
                        totalFare += fare;
                    }
                    if (ride.driverRating && !isNaN(ride.driverRating)) {
                        totalRating += ride.driverRating;
                        ratedRidesCount++;
                    }
                    acceptedRides++; // Assuming previous rides imply accepted
                    totalRequests++; // Simplistic: counting each previous ride as a request
                });
            }

            // // Update dashboard status indicators (Assuming these elements exist)
            // if (ridesTodayElement) {
            //     ridesTodayElement.textContent = totalRidesCount;
            // }
            // if (earningsTodayElement) {
            //     earningsTodayElement.textContent = `₹ ${totalFare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            // }
            // if (totalRidesStat) {
            //     totalRidesStat.textContent = totalRidesCount;
            // }
            // if (avgRatingStat) {
            //     avgRatingStat.textContent = ratedRidesCount > 0 ? (totalRating / ratedRidesCount).toFixed(1) : 'N/A';
            // }
            // // For acceptance rate, you'd ideally need 'total requests received' from the backend.
            // // For now, it's a placeholder or based on `acceptedRides / totalRequests` if `totalRequests` is accurate.
            // if (acceptanceRateStat) {
            //     acceptanceRateStat.textContent = totalRequests > 0 ? `${((acceptedRides / totalRequests) * 100).toFixed(1)}%` : 'N/A';
            // }
            // if (insightTextElement) {
            //     if (totalRidesCount > 5) {
            //         insightTextElement.textContent = "Great work! Keep up the momentum.";
            //     } else if (totalRidesCount > 0) {
            //         insightTextElement.textContent = "A good start! Aim for more rides.";
            //     } else {
            //         insightTextElement.textContent = "No rides yet. Go online and accept a request!";
            //     }
            // }
        })
        .catch(err => {
            console.error("Error fetching previous rides or calculating stats:", err);
            if (previousRidesList) {
                previousRidesList.innerHTML = `<p class="error-message">Error loading previous rides: ${err.message}</p>`;
            }
            // Clear stats or show error
            if (ridesTodayElement) ridesTodayElement.textContent = 'N/A';
            if (earningsTodayElement) earningsTodayElement.textContent = 'N/A';
            if (totalRidesStat) totalRidesStat.textContent = 'N/A';
            if (avgRatingStat) avgRatingStat.textContent = 'N/A';
            if (acceptanceRateStat) acceptanceRateStat.textContent = 'N/A';
            if (insightTextElement) insightTextElement.textContent = "Could not load performance insights.";
        });
}

// --- Initializations on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: In a real application, driverID MUST be set from a secure session or authentication mechanism
    // before any ride fetching logic runs. This is a placeholder for demonstration.
    driverID = 'driver123';
    console.log(`DOMContentLoaded: Initializing with activeRideId from localStorage: ${activeRideId}, driverID: ${driverID}`);

    // Initial status update based on toggle state.
    // This function will intelligently decide whether to restore an active ride or fetch new ones.
    updateDriverStatus();

    // Fetch previous rides and stats on load
    fetchPreviousRides();
});