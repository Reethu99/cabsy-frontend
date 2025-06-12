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
const finalFareSpan = document.getElementById('finalFare'); // Get the span for final fare
const paymentProcessingOverlay = document.getElementById('paymentProcessingOverlay'); // NEW: Processing overlay
const transactionIdValueSpan = document.getElementById('transactionIdValue'); // NEW: Transaction ID span

let currentRideId = null;
let rideStatusInterval = null;
let simulateRideProgressionTimeout = null;
let paymentInitiatedForCurrentRide = false; // Flag to prevent duplicate payment requests for the same ride

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
        bookRideButton.textContent = "Book Ride";
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
    currentStatusSpan.style.color='green';
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
        transactionIdValueSpan.textContent = 'N/A'; // Reset transaction ID display

        // Explicitly ensure payment processing overlay is hidden
        paymentProcessingOverlay.style.display = 'none';
        paymentInitiatedForCurrentRide = false; // Reset the payment flag for a new ride

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
                    rideStatusDiv.textContent = 'Captain accepted your ride! On the way';
                } else if (ride.status === 'IN_PROGRESS') {
                    rideStatusDiv.textContent = 'Picked up, Your ride is started!';
                } else if (ride.status === 'COMPLETED') {
                    // Only initiate payment if it hasn't been initiated for this ride yet
                    rideStatusDiv.textContent = 'Destination reached, ride completed';
                    if (!paymentInitiatedForCurrentRide) {
                        paymentInitiatedForCurrentRide = true; // Set the flag to true
                        // No alert here, it will be in showRideCompletedPopup after payment processing

                        paymentProcessingOverlay.style.display = 'flex'; // Show processing overlay
                        transactionIdValueSpan.textContent = "Processing..."; // Set initial text
                        
                        await initiatePayment(currentRideId, ride.actualFare, "Cash");
                        // The rest of the cleanup and popup display is handled within initiatePayment's finally block
                    }
                    // Stop polling immediately if payment was handled or if the ride is already completed
                    if (paymentInitiatedForCurrentRide && rideStatusInterval) {
                         clearInterval(rideStatusInterval);
                    }
                    clearCurrentRide();
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

// showRideCompletedPopup now accepts the transactionId
function showRideCompletedPopup(fare = 'N/A', transactionId = 'N/A') {
    // Moved the "Ride completed!" alert here, so it only fires once after payment.
    alert('Ride completed!'); // Now it fires after payment processing

    if (finalFareSpan) {
        finalFareSpan.textContent = `${fare.toFixed(2)}`; // Display formatted fare
    }
    transactionIdValueSpan.textContent = transactionId; // Display actual transaction ID

    rideCompletedPopup.classList.add('show'); // Add class for fade-in effect
    rideCompletedPopup.style.display = 'block'; // Make it visible

    // Hide the ride completed popup after a short delay
    setTimeout(() => {
        rideCompletedPopup.classList.remove('show'); // Start fade-out
        setTimeout(() => {
            rideCompletedPopup.style.display = 'none';
            clearCurrentRide(); // Clear ride details and reset UI after all is done
        }, 300); // Should match CSS transition duration
    }, 3000); // Popup stays visible for 3 seconds after details are set
}

// Function to initiate payment
async function initiatePayment(rideId, amount, paymentMethod) {
    console.log(`Initiating payment for Ride ID: ${rideId}, Amount: ${amount}, Method: ${paymentMethod}`);
    let actualTransactionId = 'N/A'; // Default in case of failure

    // Add a small delay BEFORE the fetch to ensure the spinner is visible for a moment
    // even on very fast local network requests.
    await new Promise(resolve => setTimeout(resolve, 500)); // Show spinner for at least 0.5 seconds

    try {
        const response = await fetch('/process-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rideId: rideId,
                amount: amount,
                paymentMethod: paymentMethod // e.g., "Cash", "Card", "Wallet"
            })
        });

        const result = await response.json();

        if (result.success && result.data && result.data.transactionId) {
            console.log('Payment recorded successfully:', result.data);
            actualTransactionId = result.data.transactionId; // Get actual transaction ID
        } else {
            console.error('Payment failed:', result.message || 'No transaction ID received.');
            actualTransactionId = "Failed"; // Indicate failure
            // No alert here, it will be handled by showRideCompletedPopup (if general error)
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        actualTransactionId = "Error"; // Indicate error
        // No alert here, it will be handled by showRideCompletedPopup (if general error)
    } finally {
        // Hide processing overlay after payment attempt (success or failure)
        paymentProcessingOverlay.style.display = 'none';
        
        // Now show the ride completed popup with the final fare and transaction ID
        // The showRideCompletedPopup function now handles hiding itself and calling clearCurrentRide()
        showRideCompletedPopup(amount, actualTransactionId);
    }
}

// --- Initialize on Page Load ---

document.addEventListener('DOMContentLoaded', () => {
    // Explicitly hide the payment processing overlay on initial load
    // This addresses potential rendering issues where it might briefly appear before JS takes over.
    if (paymentProcessingOverlay) {
        paymentProcessingOverlay.style.display = 'none';
    }

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
                if (result.success && result.data) {
                    const ride = result.data;
                    if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
                        // If ride is already completed or cancelled on load, just show the final popup briefly
                        // and clear the ride. No need to re-process payment or poll for active status.
                        console.log('Restored inactive ride. Displaying final status.');
                        // Check if actualFare exists, if not, fallback to estimatedFare
                        const fareToShow = ride.actualFare || ride.estimatedFare || 'N/A';
                        // Also, initialize paymentInitiatedForCurrentRide to true if the ride was already completed.
                        paymentInitiatedForCurrentRide = true; 
                        // If the backend `ride` object includes `payment` nested within it, extract transactionId
                        // Otherwise, it might need to be retrieved differently or is simply 'N/A' for old rides.
                        const transactionIdToShow = (ride.payment && ride.payment.transactionId) ? ride.payment.transactionId : 'N/A';
                        showRideCompletedPopup(fareToShow, transactionIdToShow); // Show immediately
                        // The showRideCompletedPopup already handles hiding itself and clearing the ride
                    } else {
                        // If ride is still active (REQUESTED, ACCEPTED, IN_PROGRESS)
                        displayCurrentRide(ride);
                        startRideStatusPolling();
                        console.log('Restored active ride:', ride.id);
                        paymentInitiatedForCurrentRide = false; // Ensure it's false for an ongoing ride
                    }
                } else {
                    console.log('No active ride to restore or ride already completed/cancelled per backend.');
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
