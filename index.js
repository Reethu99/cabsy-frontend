import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';
import session from 'express-session'; // Import express-session
import axios from 'axios'; // Import axios for making HTTP requests
import dotenv from 'dotenv'; // Import dotenv for environment variables

dotenv.config(); // Load environment variables from .env file

// Get __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


// --- Backend API Base URL ---
// Use process.env.BACKEND_API_URL, defaulting to localhost if not set
const BACKEND_API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api';
console.log(`Backend API Base URL: ${BACKEND_API_BASE_URL}`);

// --- Session Configuration ---
// This middleware manages user session
app.use(session({
    secret: process.env.SESSION_SECRET || 'YOUR_SUPER_SECRET_KEY_FOR_SESSION_SIGNING_12345', // !!! IMPORTANT: Use a strong, random key from env !!!
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        maxAge: 1000 * 60 * 60 * 24 // Session lasts 24 hours (in milliseconds)
    }
}));
// --- End Session Configuration ---

// Use body-parser middleware to parse JSON and URL-encoded data
// This is essential for req.body to work with JSON sent from the client
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Middleware ---
// This middleware checks if a user is logged in before allowing access to certain routes.
function isAuthenticated(req, res, next) {
    if (req.session.user) { // Check if user data exists in the session
        next(); // User is authenticated, proceed to the next route handler
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect('/login');
    }
}
// --- End Authentication Middleware ---


// --- Route Definitions ---

// Define a route for the root URL (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Home', 'Home.html'));
});

// Public routes (no authentication required)
app.get('/login', (req, res) => {
    if (req.session.user) { // If already logged in, redirect to home
        // Determine redirect URL based on user type in session
        const redirectUrl = req.session.user.userType === 'driver' ? '/captain' : '/riderhome';
        return res.redirect(redirectUrl);
    }
    res.sendFile(path.join(__dirname, 'public', 'Login', 'Login.html'));
});

app.get('/registration', (req, res) => {
    if(req.session.user) res.redirect(req.session.user.userType == 'captain'?"/captain":"/riderhome")
    res.sendFile(path.join(__dirname, 'public', 'Registration', 'Registration.html'));
});

// Rider routes (protected by isAuthenticated middleware)
app.get('/riderhome', isAuthenticated, (req, res) => {
    // If we reach here, req.session.user contains the logged-in user's data
    console.log('User accessing rider home:', req.session.user.email);
    res.sendFile(path.join(__dirname, 'public', 'RiderHome', 'RiderHome.html'));
});

app.get('/riderprofile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'RiderProfile.html'));
});

app.get('/riderhelp', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderHelp', 'RiderHelp.html'));
});

app.get('/riderabout', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderAbout', 'RiderAbout.html'));
});


app.get('/riderprivacy', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderPrivacy', 'RiderPrivacy.html'));
});

app.get('/rideractivity', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderActivity', 'RiderActivity.html'));
});
app.get('/ridersecurity', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderSecurity', 'RiderSecurity.html'));
});

app.get('/riderpayment', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderPayment', 'RiderPayment.html'));
});

// Captain routes (protected by isAuthenticated middleware)
app.get('/captain', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Captain', 'captain.html'));
});

app.get('/captainaboutus', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'CaptainAboutUs', 'CaptainAboutUS.html'));
});

app.get('/captainhelp', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'CaptainHelp', 'help.html'));
});

app.get('/editcaptainprofile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'EditCaptainProfile', 'editcaptainprofile.html'));
});

// --- POST route for Login (MODIFIED) ---
app.post('/login', async (req, res) => {
    const { email, password, role } = req.body; // Receive 'role' from frontend
    console.log(`Login attempt for ${role}:`, email);

    let backendLoginEndpoint;
    if (role === 'rider') {
        backendLoginEndpoint = `${BACKEND_API_BASE_URL}/auth/user/login`;
    } else if (role === 'captain') {
        backendLoginEndpoint = `${BACKEND_API_BASE_URL}/auth/driver/login`;
    } else {
        return res.status(400).json({
            success: false,
            message: 'Login failed: Invalid role specified.',
            error: 'Role must be "rider" or "captain".'
        });
    }

    try {
        // Make a POST request to the specific Spring Boot backend's login endpoint
        let backendResponse = await axios.post(backendLoginEndpoint, {
            email: email,
            password: password
        });

        // Check if the backend login was successful (assuming it returns a 'success' field)
        if ((backendResponse.status === 200 || backendResponse.status === 201) && backendResponse.data.success) {
            // Login successful: Store relevant user data in the session
            // IMPORTANT: Only store non-sensitive data, or data needed for subsequent requests.
            // Removed localStorage.setItem as it's for browser, not Node.js server.
            console.log('Backend Response Data:', backendResponse.data.data);

            req.session.user = {
                id: backendResponse.data.data.id,
                email: backendResponse.data.data.email,
                name: backendResponse.data.data.name,
                phoneNumber: backendResponse.data.data.phoneNumber,
                // These fields might only exist for drivers, conditionally add them
                licenseNumber: backendResponse.data.data.licenseNumber || null,
                status: backendResponse.data.data.status || null,
                rating: backendResponse.data.data.rating || null,
                userType: role, // Store the role directly from the request
                // You might store a JWT token here if your backend issues one:
                // jwtToken: backendResponse.data.data.token
            };

            console.log('Session User Data:', req.session.user)
            // Determine redirect URL based on user type
            const redirectUrl = role === 'captain' ? '/captain' : '/riderhome'; // Changed to captainhome based on usage above

            res.status(200).json({
                success: true,
                message: 'Login successful!',
                redirectUrl: redirectUrl
            });
        } else {
            // Backend indicated login failure
            res.status(401).json({
                success: false,
                message: backendResponse.data.message || 'Login failed: Invalid credentials.',
                error: backendResponse.data.error || 'Authentication failed.'
            });
        }
    } catch (error) {
        // Handle errors from the axios request (e.g., network issues, backend not reachable, 4xx/5xx responses)
        console.error('Error during login request to backend:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            success: false,
            message: error.response ? error.response.data : error.message,
            error: error.response ? error.response.data : error.message
        });
    }
});

app.get('/session-user',isAuthenticated, (req, res) => {
    console.log("Session data requested....")
    res.send(req.session.user);
});

// --- POST route for Registration (Fixed duplicate try block) ---
app.post('/registration', async (req, res) => {
    console.log('Received registration data:', req.body);
    
    try {
        let backendResponse;
        let registrationData;
        let backendEndpoint;
        let role = "";
        // Differentiate between Rider and Captain registrations based on expected fields
        if (req.body.username && req.body.email && req.body.phone && req.body.password) {
            console.log('Rider Registration Attempt:');
            role = "rider";
            registrationData = {
                name: req.body.username,
                email: req.body.email,
                phoneNumber: req.body.phone,
                password: req.body.password
            };
            backendEndpoint = `${BACKEND_API_BASE_URL}/auth/user/register`;
        } else if (req.body.captainUsername && req.body.captainEmail && req.body.captainPhone && req.body.captainLicense && req.body.captainPassword) {
            console.log('Captain Registration Attempt:');
            role = "captain";
            registrationData = {
                name: req.body.captainUsername,
                email: req.body.captainEmail,
                phoneNumber: req.body.captainPhone,
                licenseNumber: req.body.captainLicense,
                password: req.body.captainPassword
            };
            backendEndpoint = `${BACKEND_API_BASE_URL}/auth/driver/register`;
        } else {
            // If neither type of registration data is complete
            return res.status(400).json({
                success: false,
                message: 'Invalid registration request: Missing required fields.',
                error: 'Incomplete registration data.'
            });
        }

        // Forward the registration data to the appropriate Spring Boot backend endpoint
        backendResponse = await axios.post(backendEndpoint, registrationData);
        console.log(backendResponse);

        // Check if the backend registration was successful (assuming it returns a 'success' field)
        if ((backendResponse.status === 200 || backendResponse.status === 201) && backendResponse.data.success) {
            // Send the backend's response directly back to the client
            // Determine redirect URL based on user type
            const redirectUrl = role === 'captain' ? '/captain' : '/riderhome';
            console.log("Registration Sucessfull")
            // Send a success response back to the client, indicating where to redirect

            res.redirect(redirectUrl);
        } else {
            // Backend indicated registration failure
            res.status(backendResponse.status || 400).json({ // Use backend's status if available
                success: false,
                message: backendResponse.data.message || 'Registration failed.',
                error: backendResponse.data.error || 'Invalid input or user already exists.'
            });
        }
    }
    catch (error) {
        // Handle errors from the axios request
        console.error('Error forwarding registration to backend:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            success: false,
            message: 'Registration failed due to backend error.',
            error: error.response ? error.response.data : error.message
        });
    }
});


app.put('/rider/:field/:id', isAuthenticated, async (req, res) => {
    const riderId = req.params.id;
    const field = req.params.field;
    const requestBody = req.body;

    console.log('--- Rider Profile Update Request ---');
    console.log('Received riderId:', riderId);
    console.log('Received field:', field);
    console.log('Received requestBody:', requestBody);
    console.log('Is field supported?', ['name', 'email', 'phone', 'password'].includes(field));

    if (!riderId || !field || !['name', 'email', 'phone', 'password'].includes(field)) {
        console.error('Validation failed for rider update:', { riderId, field, isFieldSupported: ['name', 'email', 'phone', 'password'].includes(field) });
        return res.status(400).json({ success: false, message: 'Invalid request: Missing rider ID or unsupported field.' });
    }
    // ... rest of the code (your existing validation for password/other fields)
    const newValue = requestBody[field]; // This line should be present

    if (field !== 'password' && (!newValue || newValue.trim() === '')) { // <-- Ensure this is correctly fixed
        console.error(`Validation failed: ${field} cannot be empty.`);
        return res.status(400).json({ success: false, message: `${field} cannot be empty.` });
    }

    if (req.session.user.userType !== 'rider' || String(req.session.user.id) !== String(riderId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this profile.' });
    }

    // Client-side validation is already done in RiderProfile.js before the fetch.
    // However, you can add server-side re-validation here in Node.js if desired,
    // though the primary validation will be done by the Spring Boot backend.
    // For example, for 'password':
    if (field === 'password') {
        const { oldPassword, newPassword } = requestBody;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });
        }
        if (newPassword.length < 8) { // Matches client-side validation
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
        }
    } else {
        const newValue = requestBody[field];
        if (!newValue || newValue.trim() === '') {
            return res.status(400).json({ success: false, message: `${field} cannot be empty.` });
        }
        // Add more specific validation for email/phone if desired, mirroring frontend
    }


    try {
        const backendUpdateEndpoint = `${BACKEND_API_BASE_URL}/auth/user/${field}/${riderId}`;
        console.log(`Forwarding PUT request to: ${backendUpdateEndpoint} with data: ${JSON.stringify(requestBody)}`);

        // Important: Send the entire 'requestBody' directly to Spring Boot
        const backendResponse = await axios.put(backendUpdateEndpoint, requestBody);

        if (backendResponse.status === 200 && backendResponse.data.success) {
            // Update session data based on the field updated, but NOT for password
            if (field === 'name') {
                req.session.user.name = requestBody.name;
            } else if (field === 'email') {
                req.session.user.email = requestBody.email;
            } else if (field === 'phone') {
                req.session.user.phoneNumber = requestBody.phone;
            }
            // No session update for password

            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session after update:', err);
                    return res.status(500).json({ success: false, message: `Updated, but failed to update session for ${field}.` });
                }
                console.log('Session updated successfully for user:', req.session.user.email);
                res.status(200).json({
                    success: true,
                    message: backendResponse.data.message || `Rider ${field} updated successfully!`,
                    updatedUser: (field === 'password' ? null : req.session.user) // Don't send user DTO for password update
                });
            });

        } else {
            res.status(backendResponse.status || 400).json({
                success: false,
                message: backendResponse.data.message || `Failed to update rider ${field}.`,
                error: backendResponse.data.error || 'Unknown backend error.'
            });
        }
    } catch (error) {
        console.error(`Error during rider ${field} update:`, error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            success: false,
            message: `Failed to update rider ${field} due to server error.`,
            error: error.response ? error.response.data : error.message
        });
    }
});

// --- POST route for Logout ---
app.post('/logout', (req, res) => {
    // Destroy the session on the server side
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Logout failed.' });
        }
        // Clear the session cookie from the client's browser
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: 'Logged out successfully!', redirectUrl: '/' });
    });
});

//Change Password
app.put('/forgotPassword', async (req, res) => {

    const password = req.body.password;
    const email = req.body.email;
    const userType = req.body.userType;
    console.log("Requested to update password:", req.body);



    try {
        
        console.log("Attempted to reset password of user:" + email)
        const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/change-password`, {
            email,
            password,
            userType
        });
    
        if (response.data.success) { // Check for backend's success flag explicitly
            console.log('Password updated successfully.')
            res.status(200).json({
                success: true,
                message: 'Password updated successfully.',
                redirectUrl: "/login", 
            });
        } else {
            return res.status(400).json({ error: response.data.message || 'Password update failed.' });
        }
    } catch (error) {
        console.error('Error updating password:', error.response ? error.response.data : error.message); // Log full error response
        return res.status(error.response ? error.response.status : 500).json({ error: error.response ? error.response.data : 'Internal server error. Please try again later.' });
    }

})

// PUT endpoint to update a driver
app.post('/edit-profile',isAuthenticated, async (req, res) => {
    try {

        let updateData = {
            name: req.body.name,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            licenseNumber: req.body.licenseNumber
        }
        console.log("Rquested to update profile:", updateData);
        let id = req.session.user.id;
        let backendResponse = await axios.post(`${BACKEND_API_BASE_URL}/auth/driver/${id}`, updateData);
        console.log('Profile updated successfully:', backendResponse.data)
        if (backendResponse.status === 200) {
            // res.status(200).json({
            //     success: true,
            //     message: 'Profile updated successfully.',
            //     redirectUrl: '/captain'
            // });
            req.session.user = {
                id: backendResponse.data.id,
                email: backendResponse.data.email,
                name: backendResponse.data.name,
                phoneNumber: backendResponse.data.phoneNumber,
                licenseNumber: backendResponse.data.licenseNumber,
                status: backendResponse.data.status,

                // Store the role directly from the request
                // You might store a JWT token here if your backend issues one:
                // jwtToken: backendResponse.data.data.token
            };
            res.redirect('/captain');
        } else {
            return res.status(400).json({ error: response.data.message || 'Profile update failed.' });
        }
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/available-rides',isAuthenticated, async (req, res) => {
    console.log('Requested to get available rides for driver:')
    try {
        const response = await axios.get(`${BACKEND_API_BASE_URL}/rides`);
        req.session.availableRides = response.data;
        console.log("Available rides:", response.data)
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Available rides-Backend Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch available rides' });
    }
});


app.get('/previous-rides',isAuthenticated, async (req, res) => {

    let driverId = req.session.user.id;
    console.log('Requested to get previous rides of driver:', driverId)
    try {
        const response = await axios.get(`${BACKEND_API_BASE_URL}/rides/driver/${driverId}`);
        req.session.previousRides = response.data;
        console.log("Fetching Previous rides...")
        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('Previous rides-Backend Error:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch previous rides' });
    }
});


app.put(`/accept-ride/:rideId`,isAuthenticated, async (req, res) => {
    try {
        console.log("Attempted to assign ride:")
        let { rideId } = req.params;
        let driverId = req.session.user.id; // assuming session middleware is used
        console.log(rideId, driverId)
        let response = await axios.put(
            `${BACKEND_API_BASE_URL}/rides/${rideId}/assign`,
            {}, // no body
            {
                params: { driverId },
                withCredentials: true,
            }
        );

        console.log("Ride accept Status:", response.data)
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            message: 'Failed to assign driver/cab',
            error: error.message,
        });
    }
});
app.get("/checkEmail",(res,req)=>{
    email = req.body.email;
    userType = req.body.userType;
    if(axios.get(`${backendEndpoint}/auth/user/checkEmail`,{email,userType}))
        return 1;
    return 0;
})

app.post('/bookride', isAuthenticated, async (req, res) => { // Changed endpoint name to /bookride
    // Ensure the user booking the ride is a rider and has an ID in session
    if (req.session.user.userType !== 'rider' || !req.session.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Only logged-in riders can book rides.' });
    }

    const rideRequestData = req.body; // This already contains pickupLat, pickupLon, etc. from frontend
    const riderId = req.session.user.id; // Get the ID of the logged-in rider from the session

    console.log(`Forwarding ride booking request for Rider ID: ${riderId}`);
    console.log('Ride Request Payload:', rideRequestData);

    try {
        // Forward the request to your Spring Boot backend's ride booking endpoint
        // Appending userId to the URL as per your backend's @PathVariable
        const backendResponse = await axios.post(`${BACKEND_API_BASE_URL}/rides/request/${riderId}`, rideRequestData, {
            headers: {
                'Content-Type': 'application/json',
                // If your Spring Boot backend uses JWTs, pass the JWT token from `req.session.user.jwtToken` here:
                // 'Authorization': `Bearer ${req.session.user.jwtToken}`,
            },
            // If the backend needs session cookies, ensure axios sends them with credentials
            // withCredentials: true
        });

        // Forward the backend's response (success/failure, estimated fare, etc.) back to the frontend
        res.status(backendResponse.status).json(backendResponse.data);

    } catch (error) {
        console.error('Error forwarding ride booking to backend:', error.response ? error.response.data : error.message);

        // Customize error response based on backend's response structure (ApiResponse)
        const errorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'An unexpected error occurred while booking the ride.';
        const errorStatus = error.response ? error.response.status : 500;

        res.status(errorStatus).json({
            success: false,
            message: errorMessage,
            error: error.response ? error.response.data : error.message // Include backend error details for debugging
        });
    }
});

//GET endpoint to fetch a specific ride's details by ID (for restoring active ride or current status)
app.get('/ride-details/:rideId', isAuthenticated, async (req, res) => {
    const { rideId } = req.params;
    const currentId = req.session.user.id; 
    console.log('ride in progress:', rideId)
    try {
        const backendResponse = await axios.get(`${BACKEND_API_BASE_URL}/rides/${rideId}`);
        const id = req.session.user.userType=="captain"? backendResponse.data.data.driverId:backendResponse.data.data.userId;
        // IMPORTANT SECURITY CHECK: Ensure the ride belongs to the logged-in user
        // Assuming backendResponse.data.data will contain the ride details and a userId field
        if (backendResponse.data.success && id !== currentId) {
            console.log(backendResponse.data.data)
            console.log(req.session.user.userType)
            console.warn(`Security alert: Driver ${currentId} attempted to access ride ${rideId} belonging to another Driver.`);
            return res.status(403).json({ success: false, message: 'Unauthorized access to ride details.' });
        }

        res.status(backendResponse.status).json(backendResponse.data);
    } catch (error) {
        console.error('Error fetching ride details from backend:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch ride details.',
            error: error.response?.data?.error || error.message
        });
    }
});

// NEW: PUT endpoint to update a ride's status (used by rider to signal completion or cancellation)
app.put('/update-ride-status/:rideId', isAuthenticated, async (req, res) => {
    const { rideId } = req.params;
    const { status } = req.body; // Expecting status to be sent in the request body, e.g., { status: "COMPLETED" }
    const currentId = req.session.user.id; // Get logged-in user's ID from session

    if (!status) {
        return res.status(400).json({ success: false, message: 'Missing ride status in request body.' });
    }

    try {
        // First, optionally fetch the ride to ensure it belongs to the user
        // This is a crucial security step to prevent one user from updating another's ride
        const rideCheckResponse = await axios.get(`${BACKEND_API_BASE_URL}/rides/${rideId}`);
        const id = req.session.user.userType=="captain"? rideCheckResponse.data.data.driverId:rideCheckResponse.data.data.userId;
        if (!rideCheckResponse.data.success || id !== currentId) {
            console.warn(`Security alert: driver ${currentId} attempted to update status of ride ${currentId} belonging to another user.`);
            return res.status(403).json({ success: false, message: 'Unauthorized to update this ride status.' });
        }

        // Forward the request to the Spring Boot backend
        // Note: Spring Boot's @RequestParam for status means it expects it in query params
        const backendResponse = await axios.put(`${BACKEND_API_BASE_URL}/rides/${rideId}/status?status=${status}`);

        res.status(backendResponse.status).json(backendResponse.data);
    } catch (error) {
        console.error('Error updating ride status on backend:', error.response ? error.response.data : error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to update ride status.',
            error: error.response?.data?.error || error.message
        });
    }
});

// NEW: POST endpoint to process payments
app.post('/process-payment', isAuthenticated, async (req, res) => {
    // Ensure the user initiating the payment is a rider
    if (req.session.user.userType !== 'rider') {
        return res.status(403).json({ success: false, message: 'Unauthorized: Only riders can process payments.' });
    }

    const { rideId, amount, paymentMethod } = req.body;

    if (!rideId || typeof amount !== 'number' || !paymentMethod) {
        return res.status(400).json({ success: false, message: 'Invalid payment data: rideId, amount, and paymentMethod are required.' });
    }

    console.log(`Processing payment for Ride ID: ${rideId}, Amount: ${amount}, Method: ${paymentMethod}`);

    try {
        // Forward the payment details to the Spring Boot backend's payment endpoint
        const backendResponse = await axios.post(`${BACKEND_API_BASE_URL}/payments`, {
            rideId,
            amount,
            paymentMethod
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Forward the backend's response back to the frontend
        res.status(backendResponse.status).json(backendResponse.data);

    } catch (error) {
        console.error('Error forwarding payment to backend:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'An unexpected error occurred while processing payment.';
        const errorStatus = error.response ? error.response.status : 500;

        res.status(errorStatus).json({
            success: false,
            message: errorMessage,
            error: error.response ? error.response.data : error.message
        });
    }
});


app.get('/ride-activity',isAuthenticated, async (req, res) => {
    console.log("Rides Activity - Request received.");
    
    const userId = req.session.user ? req.session.user.id : null;

    if (!userId) {
        console.error('Ride Activity: User ID not found in session.');
        return res.status(401).json({ success: false, error: 'User not authenticated or ID not found.' });
    }

    try {
        console.log(`Attempting to fetch user rides from: ${BACKEND_API_BASE_URL}/rides/user/${userId}`);
        const response = await axios.get(`${BACKEND_API_BASE_URL}/rides/user/${userId}`);

        // Your Java backend's ApiResponse structure: { message: "...", data: [...] }
        // So, the actual list of rides is in response.data.data
        const rawRidesData = response.data.data; // Access the nested 'data' property

        // Ensure rawRidesData is always an array
        const allRidesFromCoreAPI = Array.isArray(rawRidesData) ? rawRidesData : [];

        console.log("Rides data from Core API for /ride-activity:", allRidesFromCoreAPI);
        res.json({ success: true, data: allRidesFromCoreAPI }); // Send the guaranteed array
    } catch (error) {
        console.error('Backend Error (ride-activity): ', error.message);
        if (error.response) {
            console.error('Backend Error Response Status:', error.response.status);
            console.error('Backend Error Response Data:', error.response.data);
        }
        res.status(500).json({ success: false, error: 'Failed to fetch user ride activity' });
    }
});


app.listen(process.env.port, (err) => {
    if (err) {
        console.error('Server failed to start due to an app.listen error:', err);
        return;
    }
    console.log(`Server is running on http://localhost:${process.env.port}`);
});
