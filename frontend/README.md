# Frontend
This is the README file for the frontend of the oculavis ARCANUM project.

## Steps to Set Up and Run the Frontend
1. **Navigate to the Frontend Directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   Run the following command to install all necessary packages and dependencies:
   ```bash
   npm install # Install project dependencies
   npx playwright install # Install browsers for end-to-end tests
   ```

3. **Setup your IDE**
    - Install the recommended extensions (if applicable) for your IDE (e.g., ESLint, Prettier, etc.).
    - Configure the IDE to use the project's ESLint and Prettier settings.
    - Set up the IDE to use the project's TypeScript version.
    - We recommend using [PHPStorm](https://www.jetbrains.com/phpstorm/) or [WebStorm](https://www.jetbrains.com/webstorm/) as IDE for the frontend.

## Frontend Development Workflow

### Running, Hot-Reloading and Changes
  To start the development server and view the application in your browser, run:
    ```bash
    npm run dev
    ```
  > The development server will start under the default URL `http://localhost:5173`.

  The development server supports hot-reloading, so any saved changes in the code will automatically update the browser view.

  **Note**: The default port may vary; check the terminal output to confirm the correct local URL.

### External Libraries
Before adding any external libraries, ensure they are compatible with the project's existing libraries and licenses and do not introduce any security vulnerabilities.
Also consult with the team before adding any new libraries to the project.

### Using environment variables
  To use environment variables in the project, add them to the `.env.development` file and access them in the code using `import.meta.env`.
  See the [Vite documentation](https://vite.dev/guide/env-and-mode) for more information.

### Building for Production
  To build the project for production, run:
    ```bash
    npm run build
    ```
  The production-ready files will be generated in the `dist` directory.

### Before Committing Changes
  Before committing any changes, ensure that the code passes all tests, follows the project's linting rules and is formatted correctly.

    - **Run Tests**
      To run all tests (unit & e2e), use the following command:
      ```bash
      npm test
      ```

    - **Linting**
      To check for any linting issues, run:
      ```bash
      npm run lint
      ```

      To automatically fix any linting issues, run:
      ```bash
      npm run lint:fix
      ```

    - **Code Formatting**
      To format the code according to the project's style guide, run:
      ```bash
      npm run format
      ```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```
