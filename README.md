# oculavis ARCANUM


## Table of Contents
- [Project Overview](#project-overview)
- [Tech-Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Develop Locally](#develop-locally)
- [About](#about)
  - [Contributors](#contributors)

## Project Overview
This is the repository for the oculavis ARCANUM project. The project is a web application that provides a platform for users to create and manage cases.
It incorporates a feature-rich AI-powered chatbot that assists users in creating cases from unstructured data, like text, images, and videos.

## Tech-Stack
The project uses the following technologies:
- **Frontend**:
  - **Vue**: JavaScript library for building user interfaces.
  - **Vite**: Frontend build tool for fast development.
  - **Tailwind CSS**: Utility-first CSS framework for styling.
  - **TypeScript**: Typed JavaScript superset for static type-checking.
  - **Pinia**: Vue state management library. (*)
  - **Vue Router**: Vue library for routing.
  - **OpenAPI Generator**: API client generator.
  - **Axios**: Promise-based HTTP client for making API requests.
  - **Socket.io**: Real-time bidirectional event-based communication.
  - **PrimeVue**: Vue UI component library.
  - **Iconoir**: Icon pack for icons.
  - **Zod**: TypeScript-first schema declaration and validation library.
  - **Vitest**: Unit testing library. (*)
  - **Playwright**: End-to-end testing library. (*)
  - **Prettier**: Code formatter for maintaining consistent code style.
  - **ESLint**: JavaScript linter for identifying and reporting patterns in code.
  - **Stylelint**: CSS linter for identifying and reporting patterns in stylesheets.
  - **Commitlint**: Linting tool for enforcing commit message conventions.
  - **Husky**: Git hooks library for running tasks before committing.

(*) - These libraries are included in the project but are not (yet) integrated.

- **Backend**:
  - **Node.js**: JavaScript runtime for building server-side applications.
  - **JavaScript**: Lightweight interpreted programming language with first-class functions.
  - **Express**: Web framework for building APIs and web applications.
  - **Sequelize**: ORM for interacting with relational databases.
  - **PostgreSQL**: Relational database supported by `pg` and `pg-hstore`.
  - **Socket.IO**: Real-time, bidirectional communication library.
  - **Multer**: Middleware for handling file uploads.
  - **dotenv**: Environment variable management.
  - **Axios**: Promise-based HTTP client for making API requests.
  - **Socket.io**: Real-time bidirectional event-based communication.
  - **WebDAV**: Library for interacting with WebDAV servers.
  - **Nextcloud Node Client**: Library for integrating with Nextcloud services.
  - **Zod**: Schema validation library for data parsing and validation.
  - **Sanitize-filename**: Utility for cleaning up filenames.
  - **ESLint**: JavaScript linter for identifying and reporting patterns in code. (using `eslint-config-airbnb-base`)
  - **Prettier**: Code formatter for maintaining consistent code style.
  - **Jest**: Testing framework for writing unit tests.


- **LLM Backend**:
  - **Flask**: Lightweight Python web framework for building APIs and web applications.
  - **LangChain**: Framework for building applications with large language models.
  - **OpenAI API**: Interface for interacting with OpenAI's models like GPT.
  - **Qdrant Client**: Library for interacting with Qdrant, a vector search database.
  - **Beautiful Soup**: HTML and XML parsing library.
  - **EasyWebDAV2**: Library for interacting with WebDAV servers.
  - **OpenCV**: Library for computer vision tasks.
  - **PDFPlumber**: Tool for extracting structured text from PDFs.
  - **PDF2Image**: Library for converting PDF files to image formats.
  - **PyTesseract**: Python wrapper for Google's Tesseract-OCR engine.
  - **Pydub**: Library for audio processing and manipulation.
  - **Pydantic**: Library for data validation and settings management using Python types.
  - **python-dotenv**: Tool for managing environment variables in `.env` files.
  - **Python Socket.IO**: Library for real-time bidirectional communication over WebSockets.
  - **Ruff**: Code formatter and linter for maintaining consistent code style.

## Getting Started

### Develop Locally

Follow these steps to set up and run the project locally for development.

#### Prerequisites
- **Docker** (v20.x or later)

#### Steps to Set Up and Run the Project
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the Project Directory**
   ```bash
   cd <project-directory>
   ```

3. **Setup your IDE**
    - If your IDE integrates a Git client, authorize it to be able to push and pull changes from the repository.

4. **Set Up Environment Variables for a Subproject**
    - Duplicate the `.env.development.example` file in the respective directory and rename it to `.env.development`.
    - Update the `.env.development` file with any required environment-specific variables (such as API URLs, keys, etc.).
   > Note: Ensure you don’t commit any sensitive information to version control by adding `.env.development` to your `.gitignore` file if it’s not already there.

#### Setting up docker 
1. Install Docker from the Docker Website
2. Check the README files  [frontend](frontend/README.md), [backend](backend/README.md), and [api](api/README.md) to set up the env. variables
3. Build the Docker Images
    - docker-compose build
4. Start the container
   -  docker-compose up
5. Stop the Containers
    - docker-compose down

After changing any POSTGRES_* envrionment variables, you need to delete the associated volume to apply the changes.
```bash
docker-compose down
docker volume ls
docker volume rm <volume-name>
docker-compose up
```

#### Setting up the Frontend / Backend / API projects

Please consult the respective README files in the [frontend](frontend/README.md), [backend](backend/README.md), and [api](api/README.md) directories for instructions on setting up the frontend, backend, and API projects.
    

## About
This project was created by students of the FH Aachen, Germany, as an interdisciplinary project. 
The students worked together in a team of 10 people, using the Agile methodology to develop the project.
The project was developed in collaboration with the company oculavis GmbH, which provided the project requirements and guidance.
Prof. Dr. rer. nat. Georg Neugebauer supervised and supported the project as the project advisor.

### Contributors
The following students contributed to the project:
- **Frontend Team**:
  - Simon Conrad: [GitHub](https://github.com/IsAvaible), [LinkedIn](https://www.linkedin.com/in/simon-conrad-sfc/)
  - Alex Djomo (?): [GitHub](https://github.com/Dragnee1Natsu)
  - Jason Nicholass: [GitHub](https://github.com/jasonicholass)
  - Emre ...: [GitHub](https://github.com/emre440)
- **Backend Team**:
  - Franz Blömer: [GitHub](https://github.com/FlachbandkabelPeter)
  - Max ...: [GitHub](https://github.com/maxGCode)
  - Mario Opatz: [GitHub](https://github.com/MarioOpatz)
  - Oussama ...: [GitHub](https://github.com/oussama8320)
- **LLM Team**:
  - Timur ...: [GitHub](https://github.com/TimurFHAachen)
  - Justin ...: [GitHub](https://github.com/justins03)


