# CQI - Continuous Quality Improvement
 
## Run with Docker

## Step 1: Install Docker

Install Docker and Docker Compose.

Check the installation:

```bash
docker --version
docker compose version
```

## Step 2: Open the Project Folder

Go to the folder that contains the Docker Compose file:

```bash
cd CQI
```

## Step 3: Check Docker Permission

Run:

```bash
docker ps
```

If you get a permission error:

```bash
sudo usermod -aG docker $USER
```

Then log out and log in again.

As a temporary solution, you can use:

```bash
sudo docker ps
```

## Step 4: Validate the Docker Compose File

Run:

```bash
docker compose config
```

If there is a YAML error, fix it before continuing.

## Step 5: Build and Start Everything

For the first run:

```bash
docker compose up --build -d
```

This should start the frontend, backend, and MongoDB containers.

## Step 6: Check Running Containers

```bash
docker compose ps
```

All required services should show as running.

## Step 7: Check Logs If Needed

All logs:

```bash
docker compose logs -f
```

Backend logs:

```bash
docker compose logs -f backend
```

Frontend logs:

```bash
docker compose logs -f frontend
```

MongoDB logs:

```bash
docker compose logs -f mongo
```

If your service names are different, use the names shown by:

```bash
docker compose ps
```

## Step 8: Open the Application

Open:

```text
http://localhost:5173
```

The backend should normally be available at:

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/api/health
```

## Step 9: Stop the Project

To stop the containers while keeping database data:

```bash
docker compose down
```

## Step 10: Do Not Delete the Database Volume

If you want to keep MongoDB data, do not run:

```bash
docker compose down -v
```

The `-v` option may remove the Docker volume containing your database.
 