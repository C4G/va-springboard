# VA Springboard

## Introduction

VA Springboard is a case-management application for Vision Aid. It includes:

- Google authentication and role-based access
- Student, beneficiary, device, school, grant, and training management
- Reporting and bulk import workflows
- Automated staging and production deployments through Coolify

## Getting Started

1. Make sure you have the following setup and configured on your computer:
   - [git](https://docs.github.com/en/get-started/getting-started-with-git/set-up-git) or [Github Desktop](https://desktop.github.com/download/)
   - [Node.js 24+](https://nodejs.org/en/download)
   - [pnpm 10+](https://pnpm.io/installation)
   - [Docker](https://www.docker.com/get-started/)
2. Clone the repo using either SSH, HTTPS, or Github Desktop

   SSH

   ```bash
   git clone git@github.com:C4G/va-springboard.git
   ```

   HTTPS

   ```bash
   git clone https://github.com/C4G/va-springboard.git
   ```

3. Copy `.env.example` to `.env` and replace its placeholder credentials.
4. Install all of the node dependencies with the following command

   ```bash
   pnpm install
   ```

5. Make sure you have docker running and run the following command to initialize the database, apply all database schema, and seed some test users:

   ```bash
   pnpm run init
   ```

   Troubleshooting tips:
   User's have had success updating the following components in the docker-compose.yml file, within the va-springboard-db section:
   ports: - "${DATABASE_PORT:-5432}:5432"
   volumes: - va-springboard-db-data:/var/lib/postgresql

6. If all is well up to this point your terminal should look like this:
   ![Initialization Successful](/documentation/init_success.png?raw=true 'Initialization Successful')
7. Next, run the development server

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

8. Ask a C4G administrator to add your Google account to the application before signing in. See the section below if you are configuring a development account manually.

9. To access the database you can run the following command in a new terminal:

   ```bash
   pnpm exec prisma studio
   ```

   It should open the browser automatically or you can open [http://localhost:5555/](http://localhost:5555/) to see the database tables.

   You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

   This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Use Your Own Gmail Account to Log In

---

#### Step 1: Create a User Record

1. Go to the **User** table using prisma studio.
2. Click **Add Record**.
3. Fill in the following fields:
   - **id** – Enter a unique ID.
   - **name** – Enter a name for the user.
   - **email** – Enter your Google (Gmail) email address.
   - **emailVerified** – Copy a value from an existing record.
   - **role** – Copy a value from an existing record.
4. Copy the **id** you created (you’ll need it for the next step).
5. Save the record.

#### Step 2: Create an Account Record

1. Go to the **Account** table using prisma studio.
2. Click **Add Record**.
3. Fill in the following fields:

   - **userId** – Paste the `id` from the User table.
   - **id** – Create a new unique ID.
   - **type** – Copy from an existing record.
   - **provider** – Copy from an existing record.
   - **token_type** – Copy from an existing record.
   - **scope** – Copy from an existing record.
   - **expires_at** – Copy from an existing record.

4. Leave the following fields blank for now:
   - **providerAccountId**
   - **access_token**

These will be populated using the Google OAuth Playground.

#### Step 3: Generate OAuth Credentials / Sign in

1. Go to the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Under **Google OAuth2 API v2**, check the following scopes:
   - `email`
   - `profile`
3. Click **Authorize APIs** and log in with your Gmail account.
4. Click **Exchange authorization code for tokens**.
5. In the right-hand panel:

   - Copy the **access_token**.
   - Paste it into the `access_token` field in the **Account** table.

6. In the **Request URI** field, enter: https://www.googleapis.com/oauth2/v2/userinfo
7. Click **Send the Request**.
8. In the response panel, locate the `id` field:

   - Copy this value.
   - Paste it into the `providerAccountId` field in the **Account** table.

9. Save the record.
10. Go back to the main application page and sign in again

## Deployment

This project uses trunk-based development. `main` is the only long-lived branch; work is merged through short-lived pull request branches.

Every push to `main` publishes two references for the same image:

- `ghcr.io/c4g/va-springboard:latest`
- `ghcr.io/c4g/va-springboard:<commit-sha>`

After the immutable image passes its smoke test, GitHub Actions automatically deploys `latest` to staging at `https://va-springboard-staging.c4g.dev`. Production is never triggered by GitHub Actions. To promote a tested build, set production's `IMAGE_TAG` to that build's commit SHA in Coolify and deploy it manually. This keeps promotion and rollback explicit without maintaining a release branch.

Staging and production must remain separate Coolify resources with separate databases, volumes, credentials, and OAuth callback URLs.

### GitHub configuration

Create a `staging` environment in the public `C4G/va-springboard` repository and configure it with:

- Secret `COOLIFY_TOKEN`: a Coolify API token (this may instead be an organization or repository secret).
- Variable `COOLIFY_APP_UUID`: the UUID of the staging Coolify Compose resource.

Give GitHub Actions read/write package permission. The package is published publicly with this repository, allowing Coolify to pull it without registry credentials. Protect `main` and require the pull-request validation workflow before merging.

### Coolify configuration

Create two Docker Compose resources from this repository and set `COMPOSE_PROFILES=production` on each. Configure these values independently:

- `IMAGE_TAG`: use `latest` for staging; use the promoted commit SHA for production
- `DATABASE_PW`, `DATABASE_USER`, and `DATABASE_NAME`
- `DATABASE_PORT`: leave empty unless the database must be exposed on the host
- `APP_PORT`: leave empty when using the Coolify proxy
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and `AUTH_GOOGLE_SECRET`
- `RESEND_API_KEY` if email delivery is enabled
- `AUTH_URL` and `NEXTAUTH_URL`: the environment's public HTTPS URL
- `AUTH_TRUST_HOST=true`
- `BACKUP_MODE=required` and `BACKUP_KEEP=10`

Disable Coolify's Git push auto-deployment for both resources. Staging is triggered through the Coolify API only after the published image passes its smoke test; production can then only be deployed manually.

Point each Coolify domain at port `3000` on `va-springboard-app`. Add both environment callback URLs to the Google OAuth client. The Compose stack takes and verifies a database dump before applying Prisma migrations; the backup volume is local to each environment.

To change this clone's remote after creating the public repository:

```bash
git remote set-url origin git@github.com:C4G/va-springboard.git
```

## Technologies Used

- [Nextjs](https://nextjs.org/) - framework
- [Typescript](https://www.typescriptlang.org/)
- [Tailwind](https://tailwindcss.com/) - css atomic classes
- [Prisma](https://www.prisma.io/) - db type ORM system
- [Prettier](https://prettier.io/) - formatter
- [ESLint](https://eslint.org/) - enforce rules / policies for maintable code
- [Husky](https://typicode.github.io/husky/) - allows for code changes during local commit
- [Lint-Staged](https://github.com/lint-staged/lint-staged) - lints code on only staged files with auto-fix
- [Docker](https://www.docker.com/) - containers
- [Postgres](https://www.postgresql.org/) - database
- [Github Actions](https://github.com/features/actions) - ci/cd process
- [Coolify](https://coolify.io/) - application deployment and routing
- [Shadcn](https://ui.shadcn.com/) - UI component library
- [RadixUI](https://www.radix-ui.com/) - UI component library
- [Lucide-React](https://lucide.dev/guide/packages/lucide-react) - UI icons
- [Next-Auth](https://authjs.dev/) - authentication with google
- [Ag-Grid](https://www.ag-grid.com/) - grid / table component

Use short-lived branches and pull requests for changes to VA Springboard. Keep `main` deployable at all times.
