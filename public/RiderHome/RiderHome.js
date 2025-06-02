// document.getElementById('seePrices').addEventListener('click', () => {
//      const pickup = document.getElementById('pickup').value;
//      const dropoff = document.getElementById('dropoff').value;
//      const date = document.getElementById('date').value;
//      const time = document.getElementById('time').value;

//      alert(`Searching prices from ${pickup} to ${dropoff} on ${date} at ${time}`);
//    });

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

// Dummy data for cab types and their base prices
const cabTypes = [
    // Added averageSpeedKmH for time calculation based on vehicle
    { name: "Mini", icon: "🚗", description: "Compact & economical", basePrice: 100, averageSpeedKmH: 25 },
    { name: "Sedan", icon: "🚘", description: "Comfortable for 4", basePrice: 150, averageSpeedKmH: 30 },
    { name: "Premium", icon: "✨", description: "Luxury ride", basePrice: 250, averageSpeedKmH: 35 },
    { name: "XL", icon: "🚌", description: "Spacious for groups", basePrice: 300, averageSpeedKmH: 22 },
    { name: "Auto", icon: "🛵", description: "Quick & convenient", basePrice: 50, averageSpeedKmH: 20 }
];

// Function to populate select dropdowns
function populateLocationDropdown(selectId, locationsList) {
    const selectElement = document.getElementById(selectId);
    const defaultOption = selectElement.querySelector('option[value=""]');
    selectElement.innerHTML = ''; // Clear all options

    if (defaultOption) {
        selectElement.appendChild(defaultOption);
    } else {
        const newDefaultOption = document.createElement('option');
        newDefaultOption.value = "";
        newDefaultOption.textContent = `Select ${selectId} location`;
        selectElement.appendChild(newDefaultOption);
    }

    const sortedLocations = Object.keys(locationsList).sort();

    sortedLocations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        selectElement.appendChild(option);
    });
}

// Function to calculate a dummy distance, base fare, and travel time based on locations
function calculateDummyRideDetails(pickupLocation, dropoffLocation) {
    const pickupCoords = locations[pickupLocation];
    const dropoffCoords = locations[dropoffLocation];

    if (!pickupCoords || !dropoffCoords) {
        return { distance: 0, baseFare: 0, baseTravelTimeMinutes: 0 };
    }

    // Simple Euclidean distance (not accurate for real roads, just for demonstration)
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (dropoffCoords.lat - pickupCoords.lat) * Math.PI / 180;
    const dLon = (dropoffCoords.lng - pickupCoords.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickupCoords.lat * Math.PI / 180) * Math.cos(dropoffCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    // Basic fare calculation (can be more complex with per-km rates, etc.)
    const minDistance = 5; // km
    const perKmRate = 10; // Rs/km

    let baseFare = 50; // Minimum base fare

    if (distance > minDistance) {
        baseFare += (distance - minDistance) * perKmRate;
    }

    // Calculate a base travel time (e.g., assuming an average city speed of 25 km/h for initial estimate)
    const generalAverageSpeedKmh = 25;
    const baseTravelTimeHours = distance / generalAverageSpeedKmh;
    const baseTravelTimeMinutes = Math.round(baseTravelTimeHours * 60);

    return {
        distance: distance.toFixed(2), // Format to 2 decimal places
        baseFare: Math.round(baseFare / 10) * 10, // Round to nearest 10 for cleaner pricing
        baseTravelTimeMinutes: baseTravelTimeMinutes
    };
}


document.addEventListener('DOMContentLoaded', () => {

    populateLocationDropdown('pickup', locations);
    populateLocationDropdown('dropoff', locations);

    const seePricesButton = document.getElementById('seePrices');
    const cabSelectionModal = document.getElementById('cabSelectionModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const cabOptionsList = document.getElementById('cabOptionsList');
    const routeSummary = document.getElementById('routeSummary');

    let selectedCabPrice = 0; // To store the price of the selected cab
    let selectedCabName = ""; // To store the name of the selected cab

    seePricesButton.addEventListener('click', () => {
        const pickup = document.getElementById('pickup').value;
        const dropoff = document.getElementById('dropoff').value;

        if (!pickup || !dropoff) {
            alert('Please select pickup and dropoff locations to see prices.');
            return;
        }

        if (pickup === dropoff) {
            alert('Pickup and Dropoff locations cannot be the same.');
            return;
        }

        const { distance, baseFare, baseTravelTimeMinutes } = calculateDummyRideDetails(pickup, dropoff);

        // Populate route summary with general estimated time
        routeSummary.textContent = `Ride from ${pickup} to ${dropoff} (${distance} km)`; // Time will be added per cab type

        // Clear previous cab options
        cabOptionsList.innerHTML = '';

        // Dynamically add cab options
        cabTypes.forEach(cab => {
            const finalPrice = baseFare + cab.basePrice; // Add cab's base price to route base fare

            // Calculate cab-specific travel time based on its average speed
            // If distance is 0, time is 0. Otherwise, calculate based on cab's speed.
            let cabTravelTimeMinutes = 0;
            if (distance > 0 && cab.averageSpeedKmH > 0) {
                cabTravelTimeMinutes = Math.round((parseFloat(distance) / cab.averageSpeedKmH) * 60);
            }
            // Ensure minimum time for very short distances
            if (cabTravelTimeMinutes === 0 && parseFloat(distance) > 0) {
                cabTravelTimeMinutes = 5; // A minimum time for any ride
            }


            const cabOptionDiv = document.createElement('div');
            cabOptionDiv.classList.add('cab-option');
            cabOptionDiv.innerHTML = `
                <span class="cab-icon">${cab.icon}</span>
                <div class="cab-details">
                    <h3>${cab.name}</h3>
                    <p>${cab.description}</p>
                    <p class="cab-time">Est. Time: ${cabTravelTimeMinutes} mins</p>
                </div>
                <span class="cab-price">₹${finalPrice}</span>
            `;
            cabOptionDiv.addEventListener('click', () => {
                // Remove 'selected' class from all other options
                document.querySelectorAll('.cab-option').forEach(option => {
                    option.classList.remove('selected');
                });
                // Add 'selected' class to the clicked option
                cabOptionDiv.classList.add('selected');
                selectedCabPrice = finalPrice;
                selectedCabName = cab.name;
                // Update the button text to show selected cab and price
                document.getElementById('bookRideButton').textContent = `Book ${selectedCabName} (₹${selectedCabPrice})`;
                document.getElementById('bookRideButton').disabled = false; // Enable button
            });
            cabOptionsList.appendChild(cabOptionDiv);
        });

        // Add the book ride button below the cab options
        const bookRideContainer = document.createElement('div');
        bookRideContainer.classList.add('book-ride-container');
        bookRideContainer.innerHTML = `
            <button id="bookRideButton" class="book-ride-button" disabled>Select a Cab to Book</button>
        `;
        cabOptionsList.appendChild(bookRideContainer);

        document.getElementById('bookRideButton').addEventListener('click', () => {
            if (selectedCabPrice > 0) {
                window.location.href = '/riderpayment';
                hideModal();
            } else {
                alert('Please select a cab first.');
            }
        });

        // Show the modal
        cabSelectionModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling of background
    });

    closeModalButton.addEventListener('click', hideModal);
    cabSelectionModal.addEventListener('click', (e) => {
        // Close modal if clicked outside modal-content
        if (e.target === cabSelectionModal) {
            hideModal();
        }
    });

    function hideModal() {
        cabSelectionModal.classList.remove('show');
        document.body.style.overflow = 'auto'; // Allow scrolling again
        selectedCabPrice = 0; // Reset selected cab details
        selectedCabName = "";
    }
});


// Global variables for the slideshow
let slideIndex = 1; // Start with the first slide
let slideshowInterval; // Variable to hold the interval ID

document.addEventListener('DOMContentLoaded', () => {
    // Event listener for the "Book Ride" button (from your original code)
    document.getElementById('seePrices').addEventListener('click', () => {
        const pickup = document.getElementById('pickup').value;
        const dropoff = document.getElementById('dropoff').value;
        // Removed date and time from the alert
    });

    // Slideshow functionality
    const slides = document.querySelectorAll('.mySlides');
    const dots = document.querySelectorAll('.dot'); // Get all dot elements

    // Exit if no slides are found
    if (slides.length === 0) {
        console.warn("No slides found with class 'mySlides'. Slideshow will not run.");
        return;
    }

    // Initialize the slideshow
    // Show the first slide immediately when the page loads
    showSlides(slideIndex);
    // Start the automatic slideshow
    startAutomaticSlideshow();

    // --- Slideshow Helper Functions ---
    // These functions are made globally accessible if your HTML uses onclick directly
    // If you're using JavaScript to attach event listeners, you wouldn't need `window.`
    window.plusSlides = function(n) {
        resetAutomaticSlideshow(); // Reset timer on manual navigation
        showSlides(slideIndex += n);
    }

    window.currentSlide = function(n) {
        resetAutomaticSlideshow(); // Reset timer on manual navigation
        showSlides(slideIndex = n);
    }

    function showSlides(n) {
        // Handle looping of slide index
        if (n > slides.length) {
            slideIndex = 1;
        }
        if (n < 1) {
            slideIndex = slides.length;
        }

        // Hide all slides and remove 'active' class
        slides.forEach(slide => {
            slide.style.display = "none";
            slide.classList.remove('active'); // Remove active class for fade out
        });

        // Deactivate all dots
        dots.forEach(dot => {
            dot.className = dot.className.replace(" active", "");
        });

        // Display the current slide and add 'active' class for fade in
        slides[slideIndex - 1].style.display = "block";
        slides[slideIndex - 1].classList.add('active'); // Add active class for fade in

        // Activate the corresponding dot, if dots exist
        if (dots.length > 0) {
            dots[slideIndex - 1].className += " active";
        }
    }

    function startAutomaticSlideshow() {
        // Clear any existing interval to prevent multiple intervals running simultaneously
        clearInterval(slideshowInterval);

        // Set a new interval to advance the slide every 10 seconds
        slideshowInterval = setInterval(() => {
            plusSlides(1); // Move to the next slide automatically
        }, 4000); // 10000 milliseconds = 10 seconds
    }

    // Function to reset and restart the slideshow timer
    // This is useful if you had manual navigation buttons, to ensure auto-play resumes after a click
    function resetAutomaticSlideshow() {
        clearInterval(slideshowInterval); // Clear the current timer
        startAutomaticSlideshow(); // Start a new timer
    }
});