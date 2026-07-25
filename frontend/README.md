# Frontend Setup  

## Prerequisites

Before running the frontend application, make sure the following are installed:

* Node.js (v18+ recommended)
* npm (comes with Node.js)

---

## Navigate to the Frontend Directory

```bash
cd frontend
```

---

## Install Dependencies

```bash
npm install
```

This command will install all required packages listed in `package.json`.

---

## Start the Development Server

```bash
npm run dev
```

The development server will start successfully and display a local URL in the terminal.

---

## Open in Browser

Visit the following URL:

```text
http://localhost:5173/
```

---
 
### Node Modules Issue

If dependencies are corrupted or missing:

```bash
rm -rf node_modules
npm install
```

### Port Already in Use

If port `5173` is occupied, Vite will automatically use another available port. Check the terminal output for the correct URL.

---

## Notes

* Ensure the backend server is running before using frontend features that require API access.
* Install any new package using:

```bash
npm install <package-name>
```

* Keep dependencies up to date:

```bash
npm update
```

*google auth
pip install google-auth

npm install @react-oauth/google



