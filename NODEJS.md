# Node.js:

## Quick request data summary

In Express, the request object contains different kinds of input data:

```js
req.params; // URL path: /tours/:id
req.query; // query string: /tours?difficulty=easy
req.body; // request content: POST, PATCH, or PUT data
```

Examples:

```js
// URL: /api/v1/tours/5
req.params; // { id: '5' }

// URL: /api/v1/tours?difficulty=easy&sort=price
req.query; // { difficulty: 'easy', sort: 'price' }

// POST body
req.body; // { name: 'Forest Hike', duration: 5, price: 499 }
```

- `req.params` = values from the route path
- `req.query` = values from the URL after `?`
- `req.body` = JSON data sent in the request body

Why do we need `app.use(express.json())`?

```js
app.use(express.json());
```

This middleware reads incoming JSON data from the request and converts it into a JavaScript object, so we can use it as `req.body` in our route handlers.

Without it, Express does not parse JSON automatically and `req.body` will usually be `undefined`.

Example:

```js
app.use(express.json());

app.post('/api/v1/tours', (req, res) => {
  console.log(req.body); // { name: 'Forest Hike', price: 499 }
  res.send('ok');
});
```

## Environment variables\*\*: key/value pairs provided to a process from the OS or runtime. They are accessed in Node.js via `process.env.VAR_NAME` and commonly hold configuration like `PORT`, `NODE_ENV`, database connection strings, API keys, and secrets.

- `process.env` is the Node process' environment map. Access individual values with `process.env.MY_VAR` or inspect all variables with `console.log(process.env)` (be cautious — this may reveal secrets).

- In an Express app you can read the current environment with `app.get('env')` (it returns the value of `NODE_ENV` or `'development'` by default):

```js
console.log(app.get('env'));
```

- To set `NODE_ENV` when running your app:

  - macOS / Linux (bash/zsh): `export NODE_ENV=production && node server.js`
  - Windows PowerShell: `$env:NODE_ENV = 'production'; node server.js`
  - In npm scripts, use `cross-env NODE_ENV=production` for cross-platform compatibility.

- Use environment variables to select different resources per environment (for example different database URIs for development, test and production). Store sensitive data (passwords, API keys) in environment variables rather than source code.

- **Why use them**: keep configuration out of source code, enable different settings for development/staging/production, and avoid committing secrets to version control.

## `.env` file

- Purpose: a simple file used during development to set environment variables locally. The file format is plain `KEY=VALUE` lines.

Example `.env` contents:

```
PORT=3000
NODE_ENV=development
DATABASE=mongodb://localhost:27017/natours
JWT_SECRET=replace_this_with_a_real_secret
```

- Usage with `dotenv`: It’s how the `dotenv` package loads key/value pairs from a `.env` (or other) file into `process.env` so your app can read them.

- Install:

```bash
npm install dotenv
```

## `config.env` (or other filenames)

- `config.env` is just a filename — functionally identical to `.env`. Some projects use `config.env` for clarity or to avoid tooling that expects `.env`.

- To load a non-default filename with `dotenv`:

```js
require('dotenv').config({ path: './config.env' });
```

- Example `config.env`:

```
PORT=4000
NODE_ENV=production
DATABASE=mongodb+srv://user:pass@cluster.example/mydb
```

## PostgreSQL setup for this project

This project uses the `pg` package to connect to a PostgreSQL database.

### 1) Install the PostgreSQL client package

```bash
npm install pg
```

### 2) Create a database connection file

Create a file named `database.js` in the project root with a connection pool:

```js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

module.exports = pool;
```

### 3) Add database variables to `config.env`

Example:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=natours
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4) Load environment variables before using the database

Make sure `dotenv` is loaded before requiring the database module:

```js
require('dotenv').config({ path: './config.env' });
const pool = require('./database');
```

### 5) Create a PostgreSQL database locally

If PostgreSQL is installed locally, you can create a database like this:

```bash
createdb natours
```

Or with `psql`:

```bash
psql -U postgres
CREATE DATABASE natours;
```

### 6) Optional: create a dedicated database user

```bash
psql -U postgres
CREATE USER natours_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE natours TO natours_user;
```

## Best practices

- Never commit files containing secrets. Commit only `.env.example` with keys but no secrets.
- For production, set real environment variables via the hosting environment (systemd, Docker, cloud provider dashboard, CI/CD secrets) rather than relying on a file.
- Keep loading of `dotenv` at the very top of the application so `process.env` is populated before other modules read it.
- Treat `process.env` values as untrusted input — validate and coerce types as needed.

## Quick checklist

1. Create `config.env` (or `.env`) with required keys (e.g. `PORT`, `NODE_ENV`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
2. Add `config.env` to `.gitignore` and commit `config.env.example` with keys only (no secrets).
3. Install `dotenv` (`npm install dotenv`) and load it at the very top of your entry file (e.g., `server.js`):

`require('dotenv').config({ path: './config.env' })`. In production, prefer platform-provided environment variables instead of files.
