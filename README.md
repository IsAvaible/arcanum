# oculavis ARCANUM


## Table of Contents
- [Project Overview](#project-overview)
- [Tech-Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Develop Locally](#develop-locally)
- [Threat Model](#threat-model)


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
  - **Pinia**: Vue state management library.
  - **Vue Router**: Vue library for routing.
  - **Playwright**: End-to-end testing library.
  - **PrimeVue**: Vue UI component library.
  - **Iconoir**: Icon pack for icons.
  - **Vue-i18n**: Vue internationalization library.
  - **Axios**: Promise-based HTTP client for making API requests.
  - **ESLint**: JavaScript linter for identifying and reporting patterns in code.
  - **Prettier**: Code formatter for maintaining consistent code style.

## Getting Started

### Develop Locally

Follow these steps to set up and run the project locally for development.

#### Prerequisites
- **Node.js** (v14.x or later is recommended)
- **npm** (v6.x or later) or **yarn** (alternative package manager)

> **Note**: Ensure Node and npm are installed on your system. You can check if they are installed by running `node -v` and `npm -v` in your terminal.

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
    

## Threat Model
We have developed a comprehensive threat model to identify and analyse potential security risks across all components of our system. This approach looks at Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service and Elevation of Privilege (STRIDE). Our model was built and visualised using [threatdragon](https://www.threatdragon.com), providing a clear overview of identified vulnerabilities (mapped to relevant CWE entries) and recommended mitigation strategies. Saved as ThreatModel.json.
