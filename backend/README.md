# README

Prerequisites Node.js (version 16.14.2 or higher) npm (version 9.6.2 or higher)

Installation and Starting the Backend

    Navigate to the backend directory: cd backend

    Install dependencies: npm install

    Start the backend: npm run start-backend

Test the application: http://localhost:3000 → Should display "Hello World!". http://localhost:3000/example → Should display "Hello Example!".

Backend Directory Structure backend/ ├── config/ # Contains configuration files and settings ├── controllers/ # Controller logic for handling requests and business logic ├── middleware/ # Middleware such as authentication, validation, and logging ├── models/ # Data models and schema definitions ├── routes/ # Defines routes and maps them to corresponding controllers ├── index.js # Main Express application file ├── package.json # Project dependencies and scripts ├── package-lock.json # Exact version information of installed packages └── .env # Environment variables (not included in version control) Note on the .env file:

The application uses a .env file in combination with dotenv to securely manage environment variables. For security reasons, the .env file is stored locally and not included in the version control system (e.g., GitHub). This keeps sensitive information like API keys and passwords protected. The variables from the .env file are only accessible within the application and cannot be directly retrieved from outside.
