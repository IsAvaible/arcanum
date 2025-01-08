How to Setup Mocker



Starting the Backend Navigate to the backend directory: cd backend
Install dependencies (if you haven’t already): npm install

Postgres must run locally and migration up to date: npx sequelize-cli db:migrate --config ./configs/config.js

Run the backend: npm run start-backend

Starting the LLM Mocker Open a new terminal and go to the services directory: cd backend/services
Run the LLM mocker: node llmMocker.js

Starting the Frontend Mocker Open another terminal and navigate to the services directory: cd backend/services
Run the Frontend mocker: node frontendMocker.js

This will start a simple Express server (often on http://localhost:8080) and, after a short delay, it will automatically perform multiple test requests against the Backend.