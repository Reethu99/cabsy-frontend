// RiderHome/RiderHome.js

// DOM Elements
const pickupSelect = document.getElementById('pickup');
const dropoffSelect = document.getElementById('dropoff');
const bookRideButton = document.getElementById('bookRideButton');
const rideStatusDiv = document.getElementById('rideStatus');
const currentRideContainer = document.getElementById('currentRideContainer');
const currentPickupSpan = document.getElementById('currentPickup');
const currentDropoffSpan = document.getElementById('currentDropoff');
const currentStatusSpan = document.getElementById('currentStatus');
const currentFareSpan = document.getElementById('currentFare');
const rideCompletedPopup = document.getElementById('rideCompletedPopup');

let currentRideId = null;
let rideStatusInterval = null;
let simulateRideProgressionTimeout = null;

// Fixed set of locations for simplicity
// These don't need real coordinates if not using a map, but we'll keep them for consistency
// in the booking DTO that expects lat/lon. You can use dummy values if they are just identifiers.
const locations = [
    { name: 'Chennai Central Railway Station', lat: 13.0827, lon: 80.2785, address: 'Periyamet, Chennai, Tamil Nadu 600003' },
    { name: 'Chennai International Airport (MAA)', lat: 12.9904, lon: 80.1633, address: 'GST Rd, Meenambakkam, Chennai, Tamil Nadu 600027' },
    { name: 'T. Nagar Ranganathan Street', lat: 13.0416, lon: 80.2405, address: 'Ranganathan St, T. Nagar, Chennai, Tamil Nadu 600017' },
    { name: 'Marina Beach', lat: 13.0531, lon: 80.2829, address: 'Marina Beach Road, Chennai, Tamil Nadu' },
    { name: 'Phoenix Market City', lat: 12.9667, lon: 80.2155, address: 'Velachery Main Rd, Velachery, Chennai, Tamil Nadu 600042' },
    { name: 'Anna Nagar Tower Park', lat: 13.0863, lon: 80.2078, address: '3rd Ave, Anna Nagar, Chennai, Tamil Nadu 600040' }
];

// Fare Calculation Configuration
const FARE_PER_KM = 15; // Example: ₹15 per kilometer

// Haversine formula to calculate distance between two lat/lon points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
}

// --- Location Management (No Map) ---

function populateLocationSelects() {
    locations.forEach((loc, index) => {
        const pickupOption = document.createElement('option');
        pickupOption.value = index;
        pickupOption.textContent = loc.name;
        pickupSelect.appendChild(pickupOption);

        const dropoffOption = document.createElement('option');
        dropoffOption.value = index;
        dropoffOption.textContent = loc.name;
        dropoffSelect.appendChild(dropoffOption);
    });
}

function validateLocationsAndToggleBookButton() {
    const pickupIndex = pickupSelect.value;
    const dropoffIndex = dropoffSelect.value;

    const isValidSelection = pickupIndex !== "" && dropoffIndex !== "" && pickupIndex !== dropoffIndex;

    bookRideButton.disabled = !isValidSelection;
    if (pickupIndex === dropoffIndex && pickupIndex !== "") {
        bookRideButton.textContent = 'Pickup and dropoff cannot be same';
    } else if (isValidSelection) {
        // Calculate and display estimated fare
        const pickupLocation = locations[pickupIndex];
        const dropoffLocation = locations[dropoffIndex];
        const distanceKm = calculateDistance(
            pickupLocation.lat, pickupLocation.lon,
            dropoffLocation.lat, dropoffLocation.lon
        );
        const estimatedFare = distanceKm * FARE_PER_KM;
        bookRideButton.textContent = `Book Ride (Est. ₹${estimatedFare.toFixed(2)})`;
    } else {
        bookRideButton.textContent = 'Select locations to book';
    }
}

pickupSelect.addEventListener('change', validateLocationsAndToggleBookButton);
dropoffSelect.addEventListener('change', validateLocationsAndToggleBookButton);


// --- Ride Management ---

async function bookRide() {
    const pickupIndex = pickupSelect.value;
    const dropoffIndex = dropoffSelect.value;

    if (pickupIndex === "" || dropoffIndex === "" || pickupIndex === dropoffIndex) {
        alert('Please select valid and different pickup and dropoff locations.');
        return;
    }

    const pickupLocation = locations[pickupIndex];
    const dropoffLocation = locations[dropoffIndex];

    const distanceKm = calculateDistance(
        pickupLocation.lat, pickupLocation.lon,
        dropoffLocation.lat, dropoffLocation.lon
    );
    const estimatedFare = distanceKm * FARE_PER_KM;

    const rideData = {
        // Even without a map, the backend expects lat/lon. Send the dummy coords or actual if you have them.
        pickupLat: pickupLocation.lat, // Latitude
        pickupLon: pickupLocation.lon, // Longitude
        destinationLat: dropoffLocation.lat,
        destinationLon: dropoffLocation.lon,
        pickupAddress: pickupLocation.address,
        destinationAddress: dropoffLocation.address,
        estimatedFare: estimatedFare // Send estimated fare to backend if it accepts it
    };

    bookRideButton.disabled = true;
    bookRideButton.textContent = 'Booking...';
    rideStatusDiv.textContent = 'Requesting ride...';

    try {
        const response = await fetch('/bookride', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rideData)
        });

        const result = await response.json();

        if (result.success) {
            currentRideId = result.data.id;
            sessionStorage.setItem('currentRideId', currentRideId); // Store ride ID
            displayCurrentRide(result.data);
            rideStatusDiv.textContent = ''; // Clear temporary status
            startRideStatusPolling();
            alert('Ride requested successfully! Waiting for a captain to accept.');
            // Clear selected items after successful booking
            pickupSelect.value = "";
            dropoffSelect.value = "";
            validateLocationsAndToggleBookButton(); // Update button text after clearing
        } else {
            alert('Error booking ride: ' + result.message);
            rideStatusDiv.textContent = 'Booking failed.';
            bookRideButton.disabled = false;
            bookRideButton.textContent = 'Book Ride';
        }
    } catch (error) {
        console.error('Error booking ride:', error);
        alert('An error occurred while booking your ride. Please try again.');
        rideStatusDiv.textContent = 'Booking failed due to network error.';
        bookRideButton.disabled = false;
        bookRideButton.textContent = 'Book Ride';
    }
}

bookRideButton.addEventListener('click', bookRide);

function displayCurrentRide(ride) {
    currentRideContainer.style.opacity = '0'; // Start invisible for transition
    currentRideContainer.style.display = 'block'; // Make it block first

    // Use a small timeout to allow display change to register before opacity change
    setTimeout(() => {
        currentRideContainer.style.opacity = '1'; // Fade in
    }, 50); // Small delay

    currentPickupSpan.textContent = ride.pickupAddress;
    currentDropoffSpan.textContent = ride.destinationAddress;
    currentStatusSpan.textContent = ride.status || "REQUESTED"; // Default to REQUESTED if not set
    currentFareSpan.textContent = ride.estimatedFare ? `₹${ride.estimatedFare.toFixed(2)}` : 'Calculating...';

    // Disable location selection and hide book button while a ride is active
    pickupSelect.disabled = true;
    dropoffSelect.disabled = true;
    bookRideButton.style.display = 'none';
}

function clearCurrentRide() {
    // Start fade out transition
    currentRideContainer.style.opacity = '0';

    setTimeout(() => { // Delay hiding the container until after transition
        currentRideId = null;
        sessionStorage.removeItem('currentRideId');
        clearInterval(rideStatusInterval);
        clearTimeout(simulateRideProgressionTimeout); // Clear any pending simulation
        rideStatusInterval = null;
        simulateRideProgressionTimeout = null;

        currentRideContainer.style.display = 'none'; // Hide after fade out
        currentPickupSpan.textContent = '';
        currentDropoffSpan.textContent = '';
        currentStatusSpan.textContent = '';
        currentFareSpan.textContent = '';
        rideStatusDiv.textContent = ''; // Clear any status messages

        pickupSelect.disabled = false;
        dropoffSelect.disabled = false;
        bookRideButton.style.display = 'block'; // Show the book button
        validateLocationsAndToggleBookButton(); // Re-enable validation for book button text
    }, 500); // Match this timeout to your CSS transition duration
}

// --- Ride Status Polling and Simulation ---

function startRideStatusPolling() {
    if (rideStatusInterval) {
        clearInterval(rideStatusInterval); // Clear any existing interval
    }

    rideStatusInterval = setInterval(async () => {
        if (!currentRideId) {
            clearInterval(rideStatusInterval);
            return;
        }

        try {
            console.log("Polling ride status for ID:", currentRideId);
            const response = await fetch(`/ride-details/${currentRideId}`);
            const result = await response.json();

            if (result.success && result.data) {
                const ride = result.data;
                currentStatusSpan.textContent = ride.status;

                // Update fare if actual fare is available, or use estimated if only that's present
                currentFareSpan.textContent = ride.actualFare ? `₹${ride.actualFare.toFixed(2)}` :
                                              ride.estimatedFare ? `₹${ride.estimatedFare.toFixed(2)}` : 'Calculating...';

                // Logic for ride status progression simulation (frontend only)
                if (ride.status === 'REQUESTED') {
                    rideStatusDiv.textContent = 'Searching for a captain...';
                } else if (ride.status === 'ACCEPTED') {
                    rideStatusDiv.textContent = 'Captain accepted your ride! Getting ready...';
                    // Simulate ride starting after a short delay (e.g., captain arriving at pickup)
                    // If we want to move to IN_PROGRESS, captain or backend must trigger this.
                    // For demo, we'll simulate it for now.
                    if (!simulateRideProgressionTimeout) {
                        simulateRideProgressionTimeout = setTimeout(() => {
                            updateRideStatusOnBackend('IN_PROGRESS'); // Captain starts the ride
                        }, 1000);
                    }
                } else if (ride.status === 'IN_PROGRESS') {
                    rideStatusDiv.textContent = 'Your ride is in progress!';
                    // Clear any previous 'ACCEPTED' timeout if still active
                    if (simulateRideProgressionTimeout) {
                        clearTimeout(simulateRideProgressionTimeout);
                        simulateRideProgressionTimeout = null;
                    }
                    console.log(simulateRideProgressionTimeout)
                    // Simulate ride completion after some time if not already
                    if (!simulateRideProgressionTimeout) {
                        simulateRideProgressionTimeout = setTimeout(() => {
                            updateRideStatusOnBackend('COMPLETED'); // Ride completed by driver
                        }, 2000); // 10 seconds for the "ride" to complete
                    }
                } else if (ride.status === 'COMPLETED') {
                    showRideCompletedPopup(ride.actualFare); // Pass actual fare to popup
                    clearCurrentRide();
                    alert('Ride completed!'); // You can make this a nicer notification
                } else if (ride.status === 'CANCELLED') {
                    alert('Your ride was cancelled.');
                    clearCurrentRide();
                }

            } else {
                console.error('Failed to fetch ride details or ride not found:', result.message);
                // If ride is no longer found on backend, assume it was cancelled or completed externally
                clearCurrentRide();
                alert('Active ride not found or ended. You can book a new ride.');
            }
        } catch (error) {
            console.error('Error during ride status polling:', error);
        }
    }, 3000);
}

async function updateRideStatusOnBackend(status) {
    console.log("update status")
    if (!currentRideId) return;

    try {
        const response = await fetch(`/update-ride-status/${currentRideId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            // The backend expects status as a query parameter (as per your Node.js proxy)
            // So, send an empty body if your Node.js proxy doesn't actually use it.
            // If the Node.js proxy extracts it from the body, then this is fine.
            // Based on your Node.js code: `const { status } = req.body;` then `?status=${status}`
            // this JSON.stringify is technically correct, but the Node.js proxy rewrites it.
            body: JSON.stringify({ status: status }) // Still send it in body as per Node.js expects
        });

        const result = await response.json();
        console.log(result)
        if (result.success) {
            console.log(`Ride status updated to ${status} on backend.`);
            // The polling interval will pick up the status change and update the UI
        } else {
            console.error(`Failed to update ride status to ${status}:`, result.message);
            // alert(`Failed to update ride status to ${status}: ${result.message}`); // Optional: alert on simulation failure
        }
    } catch (error) {
        console.error(`Error updating ride status to ${status}:`, error);
        // alert('An error occurred while trying to update ride status.'); // Optional: alert on simulation failure
    }
}

function showRideCompletedPopup(fare = 'N/A') {
    const finalFareSpan = document.getElementById('finalFare');
    if (finalFareSpan) {
        finalFareSpan.textContent = `₹${fare}`;
    }
    rideCompletedPopup.style.display = 'block';
    setTimeout(() => {
        rideCompletedPopup.style.display = 'none';
    }, 8000); // Hide popup after 5 seconds
}

// --- Initialize on Page Load ---

document.addEventListener('DOMContentLoaded', () => {
    // Initialize slideshow
    let slideIndex = 0;
    const slides = document.getElementsByClassName("mySlides");

    function showSlides() {
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }
        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1; }
        slides[slideIndex - 1].style.display = "block";
        setTimeout(showSlides, 4000); // Change image every 4 seconds
    }
    showSlides(); // Start slideshow

    // Populate location selects
    populateLocationSelects();
    validateLocationsAndToggleBookButton(); // Set initial button state

    // Check for an active ride in session storage on page load
    const storedRideId = sessionStorage.getItem('currentRideId');
    if (storedRideId) {
        currentRideId = storedRideId;
        // Fetch full ride details to restore UI state
        fetch(`/ride-details/${currentRideId}`)
            .then(response => {
                if (!response.ok) {
                    // If the response status is not 2xx, throw an error
                    return response.json().then(errorData => {
                        throw new Error(errorData.message || 'Failed to fetch ride details for restoration');
                    });
                }
                return response.json();
            })
            .then(result => {
                // Ensure the ride is still active (not completed or cancelled) before restoring
                if (result.success && result.data && (result.data.status !== 'COMPLETED' && result.data.status !== 'CANCELLED')) {
                    displayCurrentRide(result.data);
                    console.log("Ride Details:",result.data)
                    startRideStatusPolling();
                    console.log('Restored active ride:', result.data.id);
                } else {
                    console.log('No active ride to restore or ride already completed/cancelled.');
                    clearCurrentRide(); // Clear if stored ride is actually completed/cancelled
                }
            })
            .catch(error => {
                console.error('Error restoring ride details:', error);
                clearCurrentRide(); // Clear if unable to fetch due to network or server error
            });
    } else {
        clearCurrentRide(); // Ensure UI is clean if no stored ride
    }

    // Logout button functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                if (data.success) {
                    alert('Logged out successfully!');
                    window.location.href = data.redirectUrl; // Redirect to homepage
                } else {
                    alert('Logout failed: ' + data.message);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('An error occurred during logout.');
            }
        });
    }
});