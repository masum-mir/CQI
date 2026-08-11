# CQI Backend  

## Step 1: Open a Terminal

Go to the backend folder:

```bash
cd backend
```

## Step 2: Create a Virtual Environment

For the first run:

```bash
python3 -m venv venv
```

## Step 3: Activate the Virtual Environment

Linux/macOS:

```bash
source venv/bin/activate
```

Windows:

```powershell
venv\Scripts\activate
```

## Step 4: Install Python Dependencies

For the first run:

```bash
pip install -r requirements.txt
```

## Step 5: Create the `.env` File

Create a `.env` file inside the `backend` folder:

```env
DEBUG=True

SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

ALLOWED_HOSTS=localhost,127.0.0.1

MONGO_DB=cqi_db
MONGO_URI=mongodb://127.0.0.1:27017

FRONTEND_URL=http://localhost:5173

JWT_ACCESS_MINUTES=15
JWT_REFRESH_DAYS=7

JWT_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

## Step 6: Start MongoDB

On Linux:

```bash
sudo systemctl start mongod
```

Check whether MongoDB is running:

```bash
sudo systemctl status mongod
```

## Step 7: Start the Django Backend

```bash
python manage.py runserver
```

## Step 8: Check the Backend

Open:

```text
http://localhost:8000/api/health
```
  