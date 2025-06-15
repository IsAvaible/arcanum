# Backend

## Prerequisites

Ensure the following are installed on your system:

* **Node.js** v16.14.2 or higher
* **npm** v9.6.2 or higher
* **PostgreSQL** v17 or higher

---

## Environment Variables

This project uses a `.env` file to securely manage environment variables such as database credentials and API keys.

* The `.env` file is **excluded from version control** to protect sensitive information.
* Copy and customize `.env.example` to create your own `.env` file.

---

## Installation & Startup Instructions

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run database migrations

```bash
npx sequelize-cli db:migrate --config ./configs/config.js
```

> To undo the last migration:

```bash
npx sequelize-cli db:migrate:undo --config ./configs/config.js
```

### 4. Start the backend server

```bash
npm run start-backend
```

---

## Testing the Application

After starting the backend, visit the following URL in your browser:

**[http://localhost:3000](http://localhost:3000)**
You should see: `"Hello World!"`

---

## Backend Directory Structure

```
backend/
├── certs/           # SSH certificates for the application
├── config/          # Configuration files and settings
├── configs/         # Environment-specific configs (dev/test/prod) and multer config
├── controllers/     # Request handlers and business logic
├── db/              # Dockerfile and related resources for the database
├── middleware/      # Middleware (e.g., auth, validation, logging)
├── migrations/      # Sequelize migration files
├── models/          # Sequelize models and database schema definitions
├── routes/          # API routes mapped to controllers
├── schemas/         # Zod schemas for validation
├── services/        # Service layer used by controllers (business logic implementations)
├── index.js         # Entry point for the Express application
├── package.json     # Project metadata and dependencies
└── .env             # Environment variables (excluded from version control)
```