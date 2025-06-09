// Data for locations (unchanged - ensure it has lat/lng for each location)
const locations = {
    "Indiranagar": { lat: 12.9734, lng: 77.6409 },
    "Koramangala": { lat: 12.9345, lng: 77.6186 },
    "Electronic City": { lat: 12.8407, lng: 77.6785 },
    "HSR Layout": { lat: 12.9116, lng: 77.6387 },
    "Marathahalli": { lat: 12.9553, lng: 77.7011 },
    "BTM Layout": { lat: 12.9165, lng: 77.6101 },
    "Jayanagar": { lat: 12.9293, lng: 77.5845 },
    "Whitefield": { lat: 12.9699, lng: 77.7499 },
    "Malleshwaram": { lat: 13.0039, lng: 77.5684 },
    "Basavanagudi": { lat: 12.9416, lng: 77.5755 }
};

// Function to populate select dropdowns (unchanged)
function populateLocationDropdown(selectId, locationsList) {
    const selectElement = document.getElementById(selectId);
    let defaultOption = selectElement.querySelector('option[value=""]');
    if (!defaultOption) {
        defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = `Select ${selectId} location`;
        selectElement.prepend(defaultOption);
    }
    selectElement.innerHTML = '';
    selectElement.appendChild(defaultOption);

    const sortedLocations = Object.keys(locationsList).sort();

    sortedLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        selectElement.appendChild(option);
    });
}

// Function to calculate a dummy distance (unchanged, still useful if needed for display or initial validation)
function calculateDummyDistance(pickupLocation, dropoffLocation) {
    const pickupCoords = locations[pickupLocation];
    const dropoffCoords = locations[dropoffLocation];

    if (!pickupCoords || !dropoffCoords) {
        return 0;
    }

    const R = 6371; // Radius of Earth in kilometers
    const dLat = (dropoffCoords.lat - pickupCoords.lat) * Math.PI / 180;
    const dLon = (dropoffCoords.lng - pickupCoords.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(dropoffCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance.toFixed(2); // Format to 2 decimal places
}

document.addEventListener('DOMContentLoaded', () => {
    populateLocationDropdown('pickup', locations);
    populateLocationDropdown('dropoff', locations);

    const pickupSelect = document.getElementById('pickup');
    const dropoffSelect = document.getElementById('dropoff');
    const bookRideButton = document.getElementById('bookRideButton');

    bookRideButton.disabled = true;

    function checkLocationsAndEnableButton() {
        const pickup = pickupSelect.value;
        const dropoff = dropoffSelect.value;

        if (pickup && dropoff && pickup !== dropoff) {
            bookRideButton.disabled = false;
            bookRideButton.textContent = 'Book Your Ride';
        } else {
            bookRideButton.disabled = true;
            bookRideButton.textContent = 'Select locations to book';
        }
    }

    pickupSelect.addEventListener('change', checkLocationsAndEnableButton);
    dropoffSelect.addEventListener('change', checkLocationsAndEnableButton);

    // Event listener for the "Book Ride" button
    bookRideButton.addEventListener('click', async () => {
        const pickupAddress = pickupSelect.value;
        const destinationAddress = dropoffSelect.value;

        if (!pickupAddress || !destinationAddress) {
            alert('Please select valid pickup and dropoff locations.');
            return;
        }

        if (pickupAddress === destinationAddress) {
            alert('Pickup and Dropoff locations cannot be the same.');
            return;
        }

        // Get coordinates from the 'locations' object using the selected addresses
        const pickupCoords = locations[pickupAddress];
        const destinationCoords = locations[destinationAddress];

        if (!pickupCoords || !destinationCoords) {
            alert('Could not find coordinates for selected locations. Please select from the list.');
            return;
        }

        // Disable button to prevent multiple clicks
        bookRideButton.disabled = true;
        bookRideButton.textContent = 'Booking...';

        try {
            // Construct the payload matching your RideRequestDTO
            const rideRequestPayload = {
                pickupLat: pickupCoords.lat,
                pickupLon: pickupCoords.lng,
                destinationLat: destinationCoords.lat,
                destinationLon: destinationCoords.lng,
                pickupAddress: pickupAddress,
                destinationAddress: destinationAddress,
            };

            // Send data to your Node.js proxy server
            // Changed proxy endpoint to /bookride
            const response = await fetch('/bookride', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rideRequestPayload),
            });

            const data = await response.json();

            if (response.ok) {
                // Assuming backend returns success message and potentially estimated fare/ride ID
                alert(`Ride from ${pickupAddress} to ${destinationAddress} booked! Estimated Fare: ₹${data.data?.estimatedFare || 'N/A'}. Notifying captains...`);
                // Optionally, clear selections after successful booking
                pickupSelect.value = "";
                dropoffSelect.value = "";
                checkLocationsAndEnableButton(); // Re-disable the button
            } else {
                alert(`Booking failed: ${data.message || 'Something went wrong.'}`);
            }
        } catch (error) {
            console.error('Error booking ride:', error);
            alert('An error occurred while trying to book your ride. Please try again.');
        } finally {
            checkLocationsAndEnableButton();
        }
    });

    // --- Slideshow Functionality (unchanged) ---
    let slideIndex = 1;
    let slideshowInterval;
    const slides = document.querySelectorAll('.mySlides');
    const dots = document.querySelectorAll('.dot');

    if (slides.length > 0) {
        showSlides(slideIndex);
        startAutomaticSlideshow();
    } else {
        console.warn("No slides found with class 'mySlides'. Slideshow will not run.");
    }

    window.plusSlides = function(n) {
        resetAutomaticSlideshow();
        showSlides(slideIndex += n);
    }

    window.currentSlide = function(n) {
        resetAutomaticSlideshow();
        showSlides(slideIndex = n);
    }

    function showSlides(n) {
        if (n > slides.length) { slideIndex = 1; }
        if (n < 1) { slideIndex = slides.length; }

        slides.forEach(slide => {
            slide.style.display = "none";
            slide.classList.remove('active');
        });

        dots.forEach(dot => {
            dot.className = dot.className.replace(" active", "");
        });

        slides[slideIndex - 1].style.display = "block";
        slides[slideIndex - 1].classList.add('active');

        if (dots.length > 0) {
            dots[slideIndex - 1].className += " active";
        }
    }

    function startAutomaticSlideshow() {
        clearInterval(slideshowInterval);
        slideshowInterval = setInterval(() => {
            plusSlides(1);
        }, 4000); // 4 seconds per slide
    }

    function resetAutomaticSlideshow() {
        clearInterval(slideshowInterval);
        startAutomaticSlideshow();
    }

    // --- Logout Functionality (unchanged) ---
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