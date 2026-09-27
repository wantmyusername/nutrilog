# NutriLog

Gestor de pacientes para nutriólogo: login de administrador, alta de pacientes y
registro de citas con seguimiento de medidas (peso, composición corporal, etc.).

- **Frontend:** React + TypeScript + Vite
- **Backend:** PHP (API REST en `/api`)
- **Base de datos:** SQLite para pruebas locales, MySQL/MariaDB en hosting compartido

## Requisitos

- Node.js 20+
- PHP 8.1+ (con extensión `pdo_sqlite` para pruebas o `pdo_mysql` para producción)

## Desarrollo local

```bash
npm install

# Opción A: web + API juntos
npm run dev:all

# Opción B: dos terminales
npm run dev:api   # PHP en http://127.0.0.1:8000
npm run dev       # Vite en http://localhost:5173
```

Abre http://localhost:5173. Vite hace proxy de `/api` hacia PHP, así que la sesión
(cookie) funciona igual que en producción.

### Credenciales por defecto

- Usuario: `admin`
- Contraseña: `admin123`

Se crean automáticamente la primera vez. Cámbialas antes de publicar (ver abajo).

## API

Todas las rutas (salvo `auth/login`) requieren sesión activa.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/stats` | Métricas del panel (totales, citas por mes, últimas citas) |
| GET | `/api/patients` | Listar pacientes (con resumen) |
| POST | `/api/patients` | Crear paciente |
| GET | `/api/patients/{id}` | Detalle + citas |
| PUT | `/api/patients/{id}` | Actualizar paciente |
| DELETE | `/api/patients/{id}` | Eliminar paciente (y sus citas) |
| POST | `/api/patients/{id}/appointments` | Registrar visita |
| PUT | `/api/appointments/{id}` | Actualizar visita (datos o plan) |
| DELETE | `/api/appointments/{id}` | Eliminar visita |

## Configuración

La configuración vive en `api/config.php` y acepta variables de entorno:

| Variable | Default | Descripción |
| --- | --- | --- |
| `DB_DRIVER` | `sqlite` | `sqlite` o `mysql` |
| `DB_SQLITE_PATH` | `api/data/nutriolog.sqlite` | Ruta del archivo SQLite |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Servidor MySQL |
| `DB_NAME` | `nutriolog` | Base de datos |
| `DB_USER` / `DB_PASS` | `root` / — | Credenciales MySQL |
| `ADMIN_USER` / `ADMIN_PASS` | `admin` / `admin123` | Admin inicial (solo primer arranque) |
| `SESSION_NAME` | `nutriolog_sid` | Nombre de la cookie de sesión |

Puedes sobreescribir cualquiera de estos valores en el servidor con
`api/config.local.php` (copia `api/config.sample.php`). Ese archivo está en `.gitignore`
y **no se sobreescribe** en los deploys.

## Despliegue automático (GitHub → cPanel)

Al hacer `push` a `main`, **GitHub Actions compila el frontend y sube `dist/` + `api/`
a tu hosting por FTP**. No necesitas entrar al cPanel cada vez: lo que está en GitHub
es lo que se ve en el sitio.

### 1. Subir el proyecto a GitHub

```bash
git init
git add .
git commit -m "NutriLog MVP"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nutrilog.git
git push -u origin main
```

### 2. Secrets en GitHub

En el repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Ejemplo | Descripción |
| --- | --- | --- |
| `FTP_SERVER` | `ftp.tudominio.com` | Servidor FTP |
| `FTP_USERNAME` | `usuario@tudominio.com` | Usuario FTP |
| `FTP_PASSWORD` | `••••••` | Contraseña FTP |
| `FTP_SERVER_DIR` | `public_html/nutriologa/` | Carpeta destino (subcarpeta del dominio) |

> Usa una carpeta o subdominio **dedicado** (p. ej. `nutrilog.tudominio.com`). El paso de
> deploy sincroniza y **borra en esa carpeta** lo que no esté en el repo, así que no
> apuntes a una carpeta que tenga otro sitio (WordPress, etc.).

### 3. Config del servidor (una sola vez)

Crea `api/config.local.php` en el servidor copiando `api/config.sample.php` y pon tus
datos de MySQL y una contraseña segura. **No se sube a git ni se sobreescribe** en cada deploy.

### 4. Fin

Cada `git push` actualiza el sitio. También puedes lanzarlo manual desde **Actions →
Deploy a cPanel → Run workflow**.

### Alternativa manual

`npm run build` y sube el contenido de `dist/` a la raíz pública más la carpeta `api/`
dentro de `public_html/api/`. Los `.htaccess` ya incluyen el fallback de la SPA y el
enrutado de la API.

### Subcarpeta (ej. `/nutriologa`)

El proyecto se despliega en la subcarpeta `nutriologa` del dominio. Para eso:

- El workflow compila con `VITE_BASE=/nutriologa/` (assets y API bajo esa ruta).
- `public/.htaccess` tiene `RewriteBase /nutriologa/`.
- `FTP_SERVER_DIR` apunta a `public_html/nutriologa/`.

Si cambias la subcarpeta, actualiza esos tres valores.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Vite (frontend) |
| `npm run dev:api` | Servidor PHP (API) |
| `npm run dev:all` | Ambos a la vez |
| `npm run build` | Compila a `dist/` |
| `npm run lint` | Oxlint |
