# Backend Setup  

## Prerequisites

Before running the backend server, make sure the following are installed:

* Python 3.10+ (recommended)
* pip (Python Package Manager)
* Git

---

## Clone the Repository

```bash
git clone <repository-url>
cd backend
```

---

## Create a Virtual Environment

```bash
python3 -m venv venv
```

---

## Activate the Virtual Environment

### Linux / macOS

```bash
source venv/bin/activate
```

### Windows

```bash
venv\Scripts\activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run the Development Server

```bash
python manage.py runserver
```

The server will start at:

```text
http://127.0.0.1:8000/
```

---

## Notes

* Always activate the virtual environment before running the server.
* Install any new package inside the virtual environment.
* Update `requirements.txt` after installing new packages:

```bash
pip freeze > requirements.txt
```

