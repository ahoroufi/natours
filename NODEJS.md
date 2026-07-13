# Node.js — Environment Variables, `.env` and `config.env`

This document explains environment variables and how to use `.env` or `config.env` files in a Node.js project.

- **Environment variables**: key/value pairs provided to a process from the OS or runtime. They are accessed in Node.js via `process.env.VAR_NAME` and commonly hold configuration like `PORT`, `NODE_ENV`, database connection strings, API keys, and secrets.

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

