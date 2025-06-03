# Cabsy Frontend

This repository contains the frontend application for the Cabsy project, built using Node.js with Express to serve static HTML, CSS, and JavaScript files. It acts as a client-side interface for users (Riders) and drivers (Captains) to interact with the Cabsy backend API.

## Features

* **User Authentication:**
    * Rider and Captain login.
    * Rider and Captain registration.
    * Basic "Forgot Password" flow (client-side simulation).
* **Role-Based Navigation:** Redirects users to `riderhome` or `captainhome` based on their login role.
* **Static File Serving:** Serves all necessary HTML, CSS, and JavaScript assets.
* **Backend Proxying:** Forwards authentication requests (login, registration) to the Spring Boot backend API.
* **Session Management:** Uses `express-session` to maintain user login state on the server-side.

## Technologies Used

* **Node.js:** JavaScript runtime.
* **Express.js:** Web framework for Node.js, used for routing and serving static files.
* **HTML5, CSS3, JavaScript (ES Modules):** For the core frontend user interface.
* **Axios:** Promise-based HTTP client for making API requests from Express to the Spring Boot backend.
* **`express-session`:** Middleware for managing user sessions.
* **`body-parser`:** Middleware for parsing incoming request bodies.
* **`dotenv`:** For loading environment variables.

## Prerequisites

Before you begin, ensure you have the following installed:

* [Node.js](https://nodejs.org/en/download/) (LTS version recommended, e.g., 18.x or 20.x)
* [npm](https://www.npmjs.com/) (Node Package Manager, comes with Node.js)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd cabsy-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    In the root directory of the `cabsy-frontend` project (next to `app.js` and `package.json`), create a file named `.env` and add the following:

    ```
    BACKEND_API_URL=http://localhost:8080/api
    SESSION_SECRET=YOUR_SUPER_SECRET_KEY_FOR_SESSION_SIGNING_12345
    ```
    **Important:**
    * Replace `http://localhost:8080/api` with the actual URL of your Spring Boot backend API if it's different.
    * **Change `YOUR_SUPER_SECRET_KEY_FOR_SESSION_SIGNING_12345` to a long, random, and strong string for production environments.** This is crucial for session security.

## Usage

1.  **Start the Spring Boot Backend:**
    Ensure your Spring Boot backend application is running and accessible at the `BACKEND_API_URL` specified in your `.env` file (e.g., `http://localhost:8080`).

2.  **Start the Frontend Server:**
    ```bash
    npm start
    ```
    This will start the Express server, typically on `http://localhost:3000`.

3.  **Access the Application:**
    Open your web browser and navigate to `http://localhost:3000`.

## Project Structure (Frontend)
