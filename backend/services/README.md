
How to Setup Mocker 


LLM Mocker: A simulated language model server that sends token streams (via Socket.io) back to the Backend whenever /generate_case or /generate is called.
Frontend Mocker: A script that simulates a frontend client by calling the Backend endpoints, uploading files, and receiving real-time responses.

1. Starting the Backend
Navigate to the backend directory:
cd backend

Install dependencies (if you haven’t already):
npm install

Postgres must run locally and migration up to date: npx sequelize-cli db:migrate --config ./configs/config.js


Run the backend:
npm run start-backend

2. Starting the LLM Mocker
Open a new terminal and go to the services directory:
cd backend/services

Run the LLM mocker:
node llmMocker.js

3. Starting the Frontend Mocker
Open another terminal and navigate to the services directory:
cd backend/services

Run the Frontend mocker:
node frontendMocker.js

This will start a simple Express server (often on http://localhost:8080) and, after a short delay, it will automatically perform multiple test requests against the Backend. 

Frontend Mocker calls the Backend (e.g., create a chat, send messages, upload files).
Backend stores data (chats, messages) and, if needed, calls the LLM Mocker to generate a response (/generate_case).
LLM Mocker sends back a token stream via Socket.io and a final JSON response containing cases or messages.
Backend relays the messages back to the Frontend Mocker (via Socket.io or HTTP) so you see how a full cycle might look in production.
