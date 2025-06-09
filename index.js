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
        const redirectUrl = req.session.user.userType === 'driver' ? '/captainhome' : '/riderhome';
        return res.redirect(redirectUrl);
    }
    res.sendFile(path.join(__dirname, 'public', 'Login', 'Login.html'));
});

app.get('/registration', (req, res) => {
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

app.get('/editphone', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditPhone.html'));
});
app.get('/editemail', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditEmail.html'));
});
app.get('/editname', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditName.html'));
});
app.get('/editpwd', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditPwd.html'));
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

app.get('/captainhome', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'CaptainHome', 'captainhome.html'));
});

app.get('/captainsecurity', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'CaptainSecurity', 'CaptainSecurity.html'));
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
        const backendResponse = await axios.post(backendLoginEndpoint, {
            email: email,
            password: password
        });
        
        // Check if the backend login was successful (assuming it returns a 'success' field)
        if (backendResponse.status === 200 && backendResponse.data.success) {
            // Login successful: Store relevant user data in the session
            // IMPORTANT: Only store non-sensitive data, or data needed for subsequent requests.
            req.session.user = {
                id: backendResponse.data.data.id,
                email: backendResponse.data.data.email,
                name: backendResponse.data.data.name,
                phoneNumber:backendResponse.data.data.phoneNumber,
                licenseNumber:backendResponse.data.data.licenseNumber,
                status:backendResponse.data.data.status,
                rating:backendResponse.data.data.rating,
                userType: role,
                 // Store the role directly from the request
                // You might store a JWT token here if your backend issues one:
                // jwtToken: backendResponse.data.data.token
            };
       
            console.log('Backend Response:',req.session.user)
            // Determine redirect URL based on user type
            const redirectUrl = role === 'captain' ? '/captain' : '/riderhome';
  
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
            message: 'Login failed due to server error.',
            error: error.response ? error.response.data : error.message
        });
    }
});

app.get('/session-user',(req,res)=>{
    res.send(req.session.user);
    console.log("Session data requested....")
});

// --- POST route for Registration (No change needed here, it already differentiates) ---
app.post('/registration', async (req, res) => {
    console.log('Received registration data:', req.body);
    try{
    let backendResponse;
    let registrationData;
    let backendEndpoint;
    let role="";
    // Differentiate between Rider and Captain registrations based on expected fields
    if (req.body.username && req.body.email && req.body.phone && req.body.password) {
        console.log('Rider Registration Attempt:');
        role="rider";
        registrationData = {
            name: req.body.username,
            email: req.body.email,
            phoneNumber: req.body.phone,
            password: req.body.password
        };
        backendEndpoint = `${BACKEND_API_BASE_URL}/auth/user/register`;
    } else if (req.body.captainUsername && req.body.captainEmail && req.body.captainPhone && req.body.captainLicense && req.body.captainPassword) {
        console.log('Captain Registration Attempt:');
        role="captain";
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
        if ((backendResponse.status === 200  || backendResponse.status === 201 )&& backendResponse.data.success) {

            // Send the backend's response directly back to the client
            // Determine redirect URL based on user type
            const redirectUrl = role === 'captain' ? '/captain' : '/riderhome';
            console.log("Registration Sucessfull")
            // Send a success response back to the client, indicating where to redirect
            res.redirect(redirectUrl)
           
        }
        else {
            res.status(400).json({
                success: false,
                message: backendResponse.data.message || 'Registration failed.',
                error: backendResponse.data.error || 'Invalid input or user already exists.'
            });
        }
    } catch (error) {
        // Handle errors from the axios request
        console.error('Error forwarding registration to backend:', error);
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
    // Remember the previous fix for newValue.trim().isEmpty() should already be applied here.
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


// Start the server and listen for requests
app.listen(process.env.port, () => {
    console.log(`Server is running on http://localhost:${process.env.port}`);
});
