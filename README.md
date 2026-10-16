# Blood Bowl Tournament Manager

A web-based tournament management application for **Blood Bowl**, designed to help organize competitions and manage the information surrounding them.

**[Live Demo](https://blood-bowl-tm-2025.web.app/)** · **[Source Code](https://github.com/aronbarnkopf/Blood-Bowl-Tournament-Manager)**

## Overview

Blood Boowl Tournament Manager is a web applicatin built to make managing Blood Bowl competitions easier. It provides a centralized interface for organizing tournament-related information and managing the data associated with teams and players.

The project combines a React frontend with Firebase services, offering a modern web application that can be accessed through a browser.

## Features

- **Tournament management** — Organize and manage tournament-related information.
- **Team and player management** — Work with team rosters and player data.
- **Player advancement** — Manage player development and advancement workflows.
- **Interactive interface** — A component-based UI with animated interactions.
- **Cloud integration** — Firebase integration for application services and data persistence.
- **Web-based access** — Use the application directly in a browser without installing a desktop application.

## Tech Stack

| Technology     | Purpose                                 |
| -------------- | --------------------------------------- |
| React 19       | Component-based user interface          |
| Vite 7         | Development server and production build |
| Firebase       | Backend services and cloud integration  |
| React Router 7 | Client-side navigation                  |
| Framer Motion  | UI animations and transitions           |
| Lucide React   | Interface icons                         |
| Vitest         | Automated testing                       |
| ESLint         | Code quality and linting                |

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — A current version compatible with Vite 7
- npm — Included with Node.js
- A [Firebase](https://firebase.google.com/) project with the services required by the application configured

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/aronbarnkopf/Blood-Bowl-Tournament-Manager.git
   cd Blood-Bowl-Tournament-Manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your Firebase environment variables.

   Create a `.env.local` file in the project root using `.env.example` as a template:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

   Replace the placeholder values with the configuration for your Firebase project.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in the terminal, typically `http://localhost:5173`.

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Create a production build            |
| `npm run preview` | Preview the production build locally |
| `npm test`        | Run the Vitest test suite            |
| `npm run lint`    | Run ESLint                           |

## Firebase Configuration

The application uses Firebase for cloud integration. The repository includes Firebase configuration files, including Firestore security rules, Storage security rules, and index configuration.

When setting up your own instance:

1. Create or select a Firebase project.
2. Configure the required Firebase services.
3. Set the appropriate environment variables in `.env.local`.
4. Review the Firestore and Storage security rules before deploying.
5. Configure the Firebase project and deployment settings for your environment.

**Security note:** Never commit private credentials or service-account keys to version control. Variables prefixed with `VITE_` are exposed to the client-side application, so they must not contain secrets. Firebase API keys are not substitutes for appropriate authentication, authorization, and security rules.

## Project Structure

The repository is organized around a Vite application, with the following top-level structure:

```text
Blood-Bowl-Tournament-Manager/
├── public/                 # Static assets
├── src/                    # Application source code
├── .env.example            # Firebase environment template
├── .firebaserc             # Firebase project configuration
├── firebase.json           # Firebase deployment configuration
├── firestore.indexes.json  # Firestore index definitions
├── firestore.rules         # Firestore security rules
├── storage.rules           # Firebase Storage security rules
├── index.html              # Application entry HTML
├── package.json            # Dependencies and npm scripts
├── vite.config.js          # Vite configuration
└── eslint.config.js         # ESLint configuration
```

---

Developed by [aronbarnkopf](https://github.com/aronbarnkopf).

