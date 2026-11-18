# Deploying VoltroAPI to IIS (voltroapi.voltromotors.com)

## 1. Prerequisites on the server
- Windows Server with IIS.
- **HttpPlatformHandler** IIS module: https://www.iis.net/downloads/microsoft/httpplatformhandler
- Node.js LTS at `C:\Program Files\nodejs\node.exe` (edit `web.config` if it is installed elsewhere).
- Network access from the server to SQL Server at `192.250.231.32:1433`.

## 2. Copy the app
Copy the project folder to `C:\inetpub\voltroapi` (skip `node_modules`; it is reinstalled below).

```powershell
cd C:\inetpub\voltroapi
npm ci --omit=dev
New-Item -ItemType Directory -Force C:\inetpub\voltroapi\logs
```

## 3. Configure environment
Edit `C:\inetpub\voltroapi\.env`:
- `NODE_ENV=production`
- `API_BASE_URL=https://voltroapi.voltromotors.com`
- `CORS_ORIGINS=` the real frontend origins, comma-separated
- `JWT_SECRET=` a strong random value. A generated one is already in `.env`; keep it private.

`web.config` blocks `.env` from being served, but also restrict its NTFS permissions.

## 4. Create the IIS site
1. IIS Manager > Sites > Add Website
   - Site name: `VoltroAPI`
   - Physical path: `C:\inetpub\voltroapi`
   - Binding: `https`, port 443, host name `voltroapi.voltromotors.com`, SSL certificate selected
2. Application pool: **No Managed Code** (Node runs as a child process under HttpPlatformHandler).
3. Give the app pool identity read access to the folder and write access to `logs`.

## 5. DNS
Create an `A` record for `voltroapi.voltromotors.com` pointing to the IIS server's public IP (or a `CNAME` to its host name).

## 6. Database
Run the seed once if the database is empty:

```powershell
cd C:\inetpub\voltroapi
npm run seed
```

## 7. Verify
- `https://voltroapi.voltromotors.com/api/health` returns 200
- `https://voltroapi.voltromotors.com/api-docs` shows Swagger UI, with servers pointing at the production URL

## Updating
```powershell
cd C:\inetpub\voltroapi
npm ci --omit=dev
Restart-WebAppPool -Name VoltroAPI
```

## Troubleshooting
- Check `logs\node-stdout.log` for Node startup errors.
- 500/502 from IIS with no log: confirm the `node.exe` path in `web.config` and that HttpPlatformHandler is installed.
- Database errors: confirm SQL Server accepts connections from the IIS server and the `DB_*` values in `.env` are correct.
