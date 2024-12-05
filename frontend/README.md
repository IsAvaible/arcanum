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
   - We recommend using [PHPStorm](https://www.jetbrains.com/phpstorm/) or [WebStorm](https://www.jetbrains.com/webstorm/) as IDE for the frontend.
   - If you want to use another IDE like VSCode you need to install necessary extensions like ESLint, Prettier, Vue etc.
   - Configure the IDE to use the project's ESLint and Prettier settings.
   - Set up the IDE to use the project's TypeScript version.

## Frontend Development Workflow

### Running, Hot-Reloading and Changes

To start the development server and view the application in your browser, run:
`bash
    npm run dev
    `

> The development server will start under the default URL `http://localhost:5173`.

The development server supports hot-reloading, so any saved changes in the code will automatically update the browser view.

**Note**: The default port may vary; check the terminal output to confirm the correct local URL.

### Continuous Unit Testing

To run the unit tests in watch mode, use the following command:

```bash
npm run test:unit:watch
```

This will run the unit tests in watch mode, so any changes in the code will trigger the tests to run automatically.

### External Libraries

Before adding any external libraries, ensure they are compatible with the project's existing libraries and licenses and do not introduce any security vulnerabilities.
Also consult with the team before adding any new libraries to the project.

### Using environment variables

To use environment variables in the project, add them to the `.env.development` file and access them in the code using `import.meta.env`.
See the [Vite documentation](https://vite.dev/guide/env-and-mode) for more information.

### Using the API

The API uses a self-signed https certificate. To use the API in development, you need to trust the certificate by visiting
`https://localhost:3000` in your browser and accepting the certificate (Advanced -> Proceed to localhost).

The API can be accessed by using the composable useAPI() from the `@/composable` folder.

```ts
import { useAPI } from '@/composables/useAPI'

const api = useAPI()
```

You can find the [OpenAPI specification](src/api/OpenAPI.yaml) in the `api` folder.

To edit the specification, use the Swagger Editor or any other OpenAPI editor.
You can run the Swagger Editor locally by running the following command:

```bash
npm run swagger-editor
```

The editor will be available at `http://localhost:5174`.

The API client is generated from this specification.
To regenerate the API client after changes to the specification, run the following command:

```bash
npm run generate:api
```

This command requires Java Runtime Environment (JRE) v.55.0^ to be installed on your machine.

### Building for Production

To build the project for production, run:

```bash
npm run build
```

The production-ready files will be generated in the `dist` directory.

### Before Committing Changes

Before committing any changes, ensure that the code passes all tests, follows the project's linting rules and is formatted correctly.

#### Husky

The project uses Husky to run pre-commit hooks that check for linting errors and run tests before committing changes.
If there are any issues, Husky will prevent the commit and display the errors in the terminal.

To bypass the pre-commit hooks and commit changes, use the `--no-verify` flag with the `git commit` command.

When commiting via a JetBrains IDE, the IDE will display the errors in a dialog box. You can see the full run under `Git` > `Console`.

#### Commit Message Convention

Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#specification) specification.
This helps in generating a changelog and versioning the project.

#### Run Tests

To run all tests (unit & e2e), use the following command:

```bash
npm test
```

#### Linting

To check for any linting issues, run:

```bash
npm run lint
```

To automatically fix any linting issues, run:

```bash
npm run lint:fix
```

#### Code Formatting

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
