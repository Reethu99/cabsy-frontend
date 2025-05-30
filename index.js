import express from "express";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from 'url';

// Get __dirname using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Use body-parser middleware to parse JSON and URL-encoded data
// This is essential for req.body to work with JSON sent from the client
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Define a route for the root URL (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderHome', 'RiderHome.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Login', 'Login.html'));
});

app.get('/registration', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Registration', 'Registration.html'));
});

app.get('/riderprofile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'RiderProfile.html'));
});

app.get('/riderhelp', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderHelp', 'RiderHelp.html'));
});

app.get('/riderabout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderAbout', 'RiderAbout.html'));
});

app.get('/editphone', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditPhone.html'));
});
app.get('/editemail', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditEmail.html'));
});
app.get('/editname', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditName.html'));
});
app.get('/editpwd', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderProfile', 'EditPwd.html'));
});

app.get('/riderprivacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderPrivacy', 'RiderPrivacy.html'));
});

app.get('/rideractivity', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderActivity', 'RiderActivity.html'));
});
app.get('/ridersecurity', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderSecurity', 'RiderSecurity.html'));
});

app.get('/riderpayment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'RiderPayment', 'RiderPayment.html'));
});


// POST route for registration
// body-parser.json() will handle parsing the request body now
app.post('/registration', (req, res) => {
    console.log('Received registration data:', req.body);

    // You can differentiate between Rider and Captain registrations
    // based on the fields present in req.body.
    if (req.body.username) {
        console.log('Rider Registration Attempt:', req.body);
        // Process rider data: save to database, send confirmation, etc.
        res.status(200).json({ message: 'Rider registration data received successfully!', data: req.body });
    } else if (req.body.captainUsername) {
        console.log('Captain Registration Attempt:', req.body);
        // Process captain data: save to database, send confirmation, etc.
        // Remember, file data won't be in req.body with this setup.
        res.status(200).json({ message: 'Captain registration data received successfully!', data: req.body });
    } else {
        res.status(400).json({ message: 'Invalid registration request: Missing required fields.' });
    }
});


// Start the server and listen for requests
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});