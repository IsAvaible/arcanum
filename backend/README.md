README

Prerequisites
Node.js (version 16.14.2 or higher)
npm (version 9.6.2 or higher)
PostgreSQL (version 17 or higher)


Installation and Starting the Backend

1. Navigate to the backend directory:
cd backend

2. Install dependencies:
npm install

3. run Migrations:
npx sequelize-cli db:migrate --config ./configs/config.js

(npx sequelize-cli db:migrate:undo --config ./configs/config.js)

4. Start the backend:
npm run start-backend


    Install dependencies: npm install




Test the application:
http://localhost:3000 → Should display "Hello World!".



Test the application: http://localhost:3000 → Should display "Hello World!". http://localhost:3000/example → Should display "Hello Example!".

Backend Directory Structure backend/ ├── config/ # Contains configuration files and settings ├── controllers/ # Controller logic for handling requests and business logic ├── middleware/ # Middleware such as authentication, validation, and logging ├── models/ # Data models and schema definitions ├── routes/ # Defines routes and maps them to corresponding controllers ├── index.js # Main Express application file ├── package.json # Project dependencies and scripts ├── package-lock.json # Exact version information of installed packages └── .env # Environment variables (not included in version control) Note on the .env file:

The application uses a .env file in combination with dotenv to securely manage environment variables. For security reasons, the .env file is stored locally and not included in the version control system (e.g., GitHub). This keeps sensitive information like API keys and passwords protected. The variables from the .env file are only accessible within the application and cannot be directly retrieved from outside.


.env should be configured like this: 
POSTGRES_NAME=cases
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=...
POSTGRES_USER=...
POSTGRES_DIALECT=postgres
POSTGRES_PORT=...

AZURE_API_KEY= 123
AZURE_URL= 123


NEXTCLOUD_USERNAME = FH-Kennung@fh-aachen.de
NEXTCLOUD_PASSWORD = ....
NEXTCLOUD_URL = https://fh-aachen.sciebo.de/remote.php/webdav/
