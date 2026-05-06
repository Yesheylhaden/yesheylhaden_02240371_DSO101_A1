# DSO101 Assignment 1 — Containerization & Deployment

**Student:** Yeshey Lhaden  
**Student ID:** 02240371  
**Repository Folder:** `yesheylhaden_02240371_DSO101_A1`
**git hub link:**  https://github.com/Yesheylhaden/yesheylhaden_02240371_DSO101_A1.git

---

## Table of Contents

- [Step 0 — Prerequisite: Building the Todo App](#step-0--prerequisite-building-the-todo-app)
- [Part A — Deploying a Pre-built Docker Image](#part-a--deploying-a-pre-built-docker-image)
  - [A1. Build & Push Docker Images](#a1-build--push-docker-images)
  - [A2. Deploy on Render.com](#a2-deploy-on-rendercom)
- [Part B — Automated Image Build and Deployment](#part-b--automated-image-build-and-deployment)

---

## Step 0 — Prerequisite: Building the Todo App

A full-stack Todo List web application was built using the following tech stack:

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js + Express |
| Database | PostgreSQL |

### Environment Variables

The backend was configured with a `.env` file containing:

```env
DB_HOST=dpg-d7nose2qqhas7381vaj0-a.singapore-postgres.render.com
DB_USER=todo_db_55ct_user
DB_PASSWORD=Wyvovcc6VZLZf0H0lDmirHVIeYz6QpNF
DB_NAME=todo_db_55ct
DB_PORT=5432
DB_SSL=true
PORT=5000
```

The frontend was configured with:

```env
REACT_APP_API_URL=https://be-todo.onrender.com
```

> `.env` was added to `.gitignore` to ensure credentials were never committed to the repository.

The application was tested locally before proceeding to deployment. The backend logs confirmed a successful connection to PostgreSQL and the tasks table was initialized correctly.

**Screenshot: Backend running locally and connected to PostgreSQL**

![Backend logs showing server running and PostgreSQL connected](backend_logs.png)

---

## Part A — Deploying a Pre-built Docker Image

### A1. Build & Push Docker Images

#### Backend Image

The backend Dockerfile was created at `./backend/Dockerfile`:

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

The image was built using the student ID `02240371` as the tag:

```bash
docker build -t yehsey/be-todo:02240371 .
```

**Screenshot: Backend Docker image build — FINISHED**

![Backend docker build finished successfully](be_push.png)

The image was then pushed to Docker Hub:

```bash
docker push yehsey/be-todo:02240371
```

**Screenshot: Backend image pushed to Docker Hub**

![Backend image pushed successfully with digest](be_push.png)

---

#### Frontend Image

The frontend Dockerfile used a multi-stage build with Node.js to build the React app and Nginx to serve it:

```bash
docker build -t yehsey/fe-todo:02240371 .
```

**Screenshot: Frontend Docker image build — FINISHED**

![Frontend docker build finished with 16 steps](fe_build.png)

The frontend image was then pushed:

```bash
docker push yehsey/fe-todo:02240371
```

**Screenshot: Frontend image pushed to Docker Hub**

![Frontend image pushed successfully with digest](fe_push.png)

---

#### Docker Hub Repositories

Both images were successfully pushed and are publicly visible under the `yehsey` namespace on Docker Hub.

**Screenshot: Docker Hub showing both repositories**

![Docker Hub showing yehsey/fe-todo and yehsey/be-todo repositories](dockerhub_repos.png)

---

### A2. Deploy on Render.com

#### Database — Render PostgreSQL

A managed PostgreSQL database was created on Render with the following configuration:

| Field | Value |
|---|---|
| Name | `todo-db` |
| Database | `todos` |
| Region | Singapore |

**Screenshot: Creating a new PostgreSQL database on Render**

![New Postgres form on Render with name todo-db and database todos](new_postgres.jpeg)

After creation, the connection credentials were retrieved from the Render PostgreSQL dashboard:

| Field | Value |
|---|---|
| Database | `todo_db_55ct` |
| Username | `todo_db_55ct_user` |
| Port | `5432` |

**Screenshot: Render PostgreSQL connection credentials**

![Render database connection details showing hostname, port, database, username and password](db_credentials.png)

---

#### Backend Service

A Web Service was created on Render using the existing Docker Hub image:

- **Image:** `yehsey/be-todo:02240371`
- **Service URL:** `https://be-todo-02240371.onrender.com`

The following environment variables were configured for the backend service:

| Key | Value |
|---|---|
| `DB_HOST` | `dpg-d7nose2qqhas7381vaj0-a.singapore-postgres.render.com` |
| `DB_NAME` | `todo_db_55ct` |
| `DB_USER` | `todo_db_55ct_user` |
| `DB_PASSWORD` | `Wyvovcc6VZLZf0H0lDmirHVIeYz6QpNF` |
| `DB_PORT` | `5432` |
| `DB_SSL` | `true` |
| `PORT` | `5000` |

**Screenshot: Backend environment variables on Render**

![Backend environment variables showing DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_SSL, DB_USER and PORT](be_env_vars.png)

**Screenshot: Backend service deployed successfully on Render**

![Render backend service dashboard showing be-todo:02240371 with Deploy live status](render_be_deploy.png)

---

#### Frontend Service

A Web Service was created for the frontend using the Docker Hub image:

- **Image:** `yehsey/fe-todo:02240371`
- **Service URL:** `https://fe-todo-02240371.onrender.com`

The following environment variable was configured:

| Key | Value |
|---|---|
| `REACT_APP_API_URL` | `https://be-todo-02240371.onrender.com` |

**Screenshot: Frontend environment variable on Render**

![Frontend environment variables showing REACT_APP_API_URL pointing to the live backend URL](fe_env_vars.png)

**Screenshot: Frontend service deployed successfully on Render**

![Render frontend service dashboard showing fe-todo:02240371 with Deploy live status](render_fe_deploy.png)

---

## Part B — Automated Image Build and Deployment

### Repository Structure

The project repository was organized as follows:

```
yehseylhaden_02240371_DSO101_A1/
├── frontend/
│   ├── Dockerfile
│   ├── .env.production
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── .env.production
│   └── server.js
└── render.yaml
```

### render.yaml — Blueprint Configuration

A `render.yaml` file was created at the root of the repository to orchestrate the automated multi-service deployment:

```yaml
services:
  # Backend Service
  - type: web
    name: be-todo
    env: docker
    dockerfilePath: ./backend/Dockerfile
    envVars:
      - key: DB_HOST
        value: dpg-d7nose2qqhas7381vaj0-a.singapore-postgres.render.com
      - key: DB_USER
        value: todo_db_55ct_user
      - key: DB_PASSWORD
        value: your-db-password
      - key: DB_NAME
        value: todo_db_55ct
      - key: DB_PORT
        value: 5432
      - key: DB_SSL
        value: true
      - key: PORT
        value: 5000

  # Frontend Service
  - type: web
    name: fe-todo
    env: docker
    dockerfilePath: ./frontend/Dockerfile
    envVars:
      - key: REACT_APP_API_URL
        value: https://be-todo.onrender.com

databases:
  - name: todo-db
    databaseName: todo
    user: todo_user
```

### How Automated Deployment Works

1. Code changes are pushed to the GitHub repository.
2. Render detects the new commit via the connected GitHub integration.
3. Render automatically builds a new Docker image from the `Dockerfile` in each service directory.
4. The newly built image is deployed, replacing the previous version with zero manual steps.

This means every `git push` to the main branch triggers a fresh build and redeploy of both the frontend and backend services automatically.

---

## Summary

| Task | Status |
|---|---|
| Todo app built (FE + BE + DB) | ✅ Complete |
| `.env` configured and `.gitignore` set | ✅ Complete |
| Backend Docker image built & tagged with student ID | ✅ Complete |
| Frontend Docker image built & tagged with student ID | ✅ Complete |
| Both images pushed to Docker Hub | ✅ Complete |
| Render PostgreSQL database created | ✅ Complete |
| Backend deployed on Render with env vars | ✅ Complete |
| Frontend deployed on Render with env vars | ✅ Complete |
| `render.yaml` blueprint configured | ✅ Complete |
| GitHub connected for automated deployment (Part B) | ✅ Complete |