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
const port = 3000;

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
                userType: role, // Store the role directly from the request
                // You might store a JWT token here if your backend issues one:
                // jwtToken: backendResponse.data.data.token
            };

            // Determine redirect URL based on user type
            const redirectUrl = role === 'captain' ? '/captain' : '/riderhome';

            // Send a success response back to the client, indicating where to redirect
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

// --- POST route for Registration (No change needed here, it already differentiates) ---
app.post('/registration', async (req, res) => {
    console.log('Received registration data:', req.body);

    try {
        let backendResponse;
        let registrationData;
        let backendEndpoint;
        const role="";
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

        // Check if the backend registration was successful (assuming it returns a 'success' field)
        if (backendResponse.status === 200 && backendResponse.data.success) 
        {
        
        // Send the backend's response directly back to the client
        // Determine redirect URL based on user type
        const redirectUrl = role === 'captain' ? '/captain' : '/riderhome';

        // Send a success response back to the client, indicating where to redirect
        
        res.status(200).json({
            success: true,
            message: 'Registration successful!',
            redirectUrl: redirectUrl
        });
    }
    else{
        res.status(400).json({
            success: false,
            message: backendResponse.data.message || 'Registration failed.',
            error: backendResponse.data.error || 'Invalid input or user already exists.'
        });        
    }
    } catch (error) {
        // Handle errors from the axios request
        console.error('Error forwarding registration to backend:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            success: false,
            message: 'Registration failed due to backend error.',
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


// Start the server and listen for requests
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
