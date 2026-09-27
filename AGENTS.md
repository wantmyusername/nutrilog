# AGENTS.md — NutriLog

Documentación completa para que cualquier agente (humano o IA) entienda, ejecute y
mantenga este proyecto. **Léelo completo antes de tocar código.**

---

## 1. Qué es

**NutriLog** es un gestor para nutriólogos: un administrador inicia sesión, registra
pacientes, da seguimiento a sus medidas por visita, arma el **plan alimenticio** de cada
visita con un editor WYSIWYG, y puede **imprimirlo / guardarlo en PDF** con una
comparativa vs. la visita anterior. Incluye un panel con métricas y una agenda de
próximas citas.

- **UI en español.**
- **Término de UI: "visita"** (no "cita"). En el backend el recurso sigue llamándose
  `appointments` — no lo renombres sin migrar la base.

---

## 2. Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + react-router-dom 7 + lucide-react |
| Backend | PHP 8 (API REST en `/api`) |
| Base de datos | SQLite (local) / MySQL-MariaDB (producción) vía PDO |
| Avatares | DiceBear `voxel-art` (v10, API externa) |
| Lint | oxlint |

Rutas/scripts en `package.json`:

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Vite en `http://localhost:5173` |
| `npm run dev:api` | PHP en `http://127.0.0.1:8000` |
| `npm run dev:all` | Ambos a la vez (concurrently) |
| `npm run build` | `tsc -b && vite build` → `dist/` |
| `npm run lint` | oxlint |

---

## 3. Estructura

```
NutriLogApp/
├── api/                          # Backend PHP
│   ├── index.php                 # Punto de entrada / router
│   ├── config.php                # Config por env + override config.local.php
│   ├── config.sample.php         # Plantilla para el config.local.php del servidor
│   ├── .htaccess                 # Reescribe todo a index.php
│   ├── lib/
│   │   ├── http.php              # json_response/json_error/json_body, casts
│   │   ├── db.php                # PDO + migraciones + seed admin
│   │   └── auth.php              # Sesión, current_user, require_auth
│   ├── routes/
│   │   ├── auth.php              # login / logout / me
│   │   ├── patients.php          # CRUD pacientes
│   │   ├── appointments.php      # CRUD visitas
│   │   └── stats.php             # métricas del panel
│   └── data/                     # SQLite local (gitignored, salvo .gitignore)
├── src/                          # Frontend
│   ├── api/{client,endpoints,types}.ts
│   ├── auth/{AuthContext.tsx,context.ts}
│   ├── components/
│   │   ├── AppShell.tsx          # Navbar superior + layout
│   │   ├── Toast.tsx             # ToastProvider + useToast()
│   │   ├── ConfirmDialog.tsx     # Diálogo de confirmación
│   │   ├── DeleteDialog.tsx      # Doble confirmación al eliminar
│   │   ├── Avatar.tsx            # Avatar DiceBear voxel-art
│   │   ├── LineChart.tsx         # Gráfica SVG (deltas incluidos) + Sparkline
│   │   ├── RichTextEditor.tsx    # Editor WYSIWYG (contentEditable + execCommand)
│   │   ├── PatientForm.tsx       # Formulario de paciente (página)
│   │   ├── AppointmentForm.tsx   # Formulario de visita (página)
│   │   ├── ui.tsx                # Button, Field
│   │   └── styles.ts             # cx(), inputClass, textareaClass
│   ├── lib/
│   │   ├── format.ts             # fechas, edad, IMC, deltas relativos, badges
│   │   ├── measurements.ts       # METRICS[] + deltaTone/deltaColor/formatDelta
│   │   └── richText.ts           # isHtml/plainToHtml/planToHtml
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx         # / (métricas + gráfica + tabla)
│   │   ├── Patients.tsx          # /patients
│   │   ├── PatientEditor.tsx     # /patients/new y /patients/:id/edit
│   │   ├── PatientDetail.tsx     # /patients/:id (pestañas)
│   │   ├── VisitEditor.tsx       # /patients/:id/visits/new y .../:visitId/edit
│   │   ├── VisitView.tsx         # /patients/:id/visits/:visitId (datos + plan)
│   │   ├── PrintView.tsx         # /patients/:id/visits/:visitId/print
│   │   └── Agenda.tsx            # /agenda
│   ├── App.tsx                   # Rutas + basename + providers
│   ├── main.tsx
│   └── index.css                 # Tailwind + tokens @theme
├── public/{.htaccess,favicon.svg}
├── .github/workflows/deploy.yml  # CI: build + FTP a cPanel
├── vite.config.ts
├── DATOS/                        # PDFs de planes y export .sql (gitignored)
└── README.md
```

---

## 4. Desarrollo local

```bash
npm install
npm run dev:all       # web en :5173 + API en :8000
```

- Vite hace **proxy de `/api` → `http://127.0.0.1:8000`**.
- Credenciales por defecto: **`admin` / `admin123`** (se crean al primer arranque en SQLite).
- Base local: `api/data/nutriolog.sqlite` (gitignored).

---

## 5. Modelo de datos

**`users`**: `id, username (único), password_hash, created_at`

**`patients`**: `id, full_name, birth_date, sex, height_cm, phone, email, objective,
activity_level, activity_type, daily_calories, protein_g, carbs_g, fats_g, water_l,
allergies, supplements, notes, next_visit_date, created_at, updated_at`

**`appointments`** (visitas): `id, patient_id, appointment_date, weight_kg, body_fat_pct,
muscle_kg, waist_cm, hip_cm, chest_cm, arm_cm, thigh_cm, blood_pressure, glucose, notes,
meal_plan, created_at`
- `meal_plan` guarda **HTML** (del editor WYSIWYG).
- FK `patient_id → patients(id) ON DELETE CASCADE`.

**Migraciones automáticas:** en cada petición, `db_migrate()` crea tablas si no existen y
`db_ensure_column()` agrega columnas nuevas que falten (`activity_type`, `next_visit_date`,
`meal_plan`). **No hace falta SQL manual al agregar columnas.**

---

## 6. API

Todas requieren sesión salvo `auth/login`. Base: `/api`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual (401 si no hay sesión) |
| GET | `/api/stats` | Totales, citas por mes (6), últimas visitas con delta de peso |
| GET | `/api/patients` | Lista con `appointments_count`, `last_appointment_date`, `last_weight_kg` |
| POST | `/api/patients` | Crear paciente |
| GET | `/api/patients/{id}` | `{ patient, appointments }` |
| PUT | `/api/patients/{id}` | Actualizar (parcial) |
| DELETE | `/api/patients/{id}` | Eliminar (cascada visitas) |
| POST | `/api/patients/{id}/appointments` | Registrar visita |
| PUT | `/api/appointments/{id}` | Actualizar visita (datos **o** `meal_plan`) |
| DELETE | `/api/appointments/{id}` | Eliminar visita |

- Sesión por **cookie PHP** (`nutriolog_sid`). El frontend usa `credentials: 'same-origin'`.
- Contraseñas con `password_hash` / `password_verify`.
- Admin inicial desde `admin_user` / `admin_pass` de la config (solo primer arranque).

---

## 7. Frontend

**Base del API y del router** se derivan del deploy para soportar subcarpeta:

```ts
// src/api/client.ts
const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/api`
// src/App.tsx
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'
```

**Rutas** (`App.tsx`): `/login`, `/` (Dashboard), `/patients`, `/patients/new`,
`/patients/:id`, `/patients/:id/edit`, `/patients/:id/visits/new`,
`/patients/:id/visits/:visitId`, `/patients/:id/visits/:visitId/edit`,
`/patients/:id/visits/:visitId/print`, `/agenda`. Todo va dentro de `AppShell` salvo
Login y PrintView. `ProtectedRoute` redirige a `/login` si no hay sesión.

**Estado/UI:**
- `AuthProvider` (llama `/auth/me` al montar) y `ToastProvider` (global).
- Perfil del paciente con **pestañas**: Resumen · Visitas (con contador) · Progreso.
  La pestaña inicial acepta `?tab=visitas`.
- **Evolución**: selector de métrica (peso, grasa, músculo, cintura, cadera, pecho,
  brazo, muslo, glucosa) con deltas por punto.
- **Cambios vs. visita anterior**: tarjeta con `anterior → actual` + delta coloreado.
- **Ver visita**: datos + editor WYSIWYG del plan (guardar con `PUT /appointments/:id`).
- **Imprimir**: `window.print()` (sin librería PDF), con comparativa y mensaje motivacional.
- Eliminar siempre con **doble confirmación** (`DeleteDialog`).
- Mensajes de éxito/error con **toasts**.

**Convenciones de diseño** (estilo heredado de `babyblisspv-app`):
- Tokens en `src/index.css` (`@theme`): `paper, surface, ink, muted, faint, line, primary
  (índigo #4f46e5), accent, warm, danger`.
- Tarjetas: `rounded-2xl bg-white shadow-sm ring-1 ring-black/5`.
- Tablas: `divide-y divide-line`, `thead bg-gray-50`, encabezados
  `text-xs font-bold uppercase tracking-wider text-muted`, hover `bg-gray-50`.
- Botones: `rounded-lg` (ver `src/components/ui.tsx`); inputs en `styles.ts`.
- Fuente del sistema (`Segoe UI, Tahoma, …`). **No agregar fuentes externas.**

---

## 8. Despliegue (GitHub → cPanel)

**Repo privado:** `github.com/wantmyusername/nutrilog`.
**Producción:** `https://appsengine.us/nutriologa/` (subcarpeta).

Cada `git push` a `main` dispara `.github/workflows/deploy.yml`, que:
1. `npm ci`
2. `npm run build` con `VITE_BASE=/nutriologa/`
3. Arma `deploy/` = `dist/` + `api/` (excluye `api/data` y `api/config.local.php`)
4. Sube por **FTP** (acción `SamKirkland/FTP-Deploy-Action`)

**Secrets de GitHub:**
| Secret | Valor |
| --- | --- |
| `FTP_SERVER` | `50.31.188.8` (IP del servidor) |
| `FTP_USERNAME` | `nutri@appsengine.us` |
| `FTP_PASSWORD` | contraseña FTP |
| `FTP_SERVER_DIR` | `/` (la cuenta FTP ya está encerrada en la carpeta del sitio) |

**En el servidor (una sola vez):**
- PHP **8.2** para `appsengine.us` (cPanel → MultiPHP Manager).
- Base **MySQL** creada y usuario con ALL PRIVILEGES.
- `api/config.local.php` con credenciales MySQL y `admin_pass` seguro.
  (Está en `.gitignore` y **excluido del deploy**: nunca se sobreescribe.)

**Subcarpeta:** si cambia, actualiza los 3 lugares:
`VITE_BASE` (workflow), `RewriteBase` en `public/.htaccess`, y `FTP_SERVER_DIR`.

### Pasar datos locales → producción
La base **no** se despliega. Para migrar datos, exporta SQLite a `.sql` (INSERTs) e
impórtalo en **phpMyAdmin**. Si lo automatizas, genera un script similar a:

```python
import sqlite3
# lee api/data/nutriolog.sqlite y emite INSERTs (pacientes y visitas con meal_plan HTML)
```

Incluye `SET FOREIGN_KEY_CHECKS=0; DELETE FROM appointments; DELETE FROM patients; ...; SET FOREIGN_KEY_CHECKS=1;`
(usar `DELETE`, no `TRUNCATE` — ver gotchas).

---

## 9. Gotchas (importante)

- **PHP 8 obligatorio** (se usa `match`, `mixed`). El hosting venía con 7.4 → 500 vacío.
- **MariaDB:** no acepta placeholders en `SHOW COLUMNS ... LIKE ?`; y **no permite
  `TRUNCATE`** en una tabla referenciada por FK (usa `DELETE`).
- **Subcarpeta:** sin `VITE_BASE`/`basename`/`RewriteBase` correctos, los assets, la API y
  el router fallan (404/500).
- **Avatares DiceBear** (`api.dicebear.com`, estilo `voxel-art` v10) requieren internet.
- **PrintView** usa `window.print()` (guardar como PDF desde el diálogo). No hay librería
  de PDF.
- **No se suben a git:** `node_modules`, `dist`, `DATOS/`, `api/data/*.sqlite`,
  `api/config.local.php`, `deploy/`, `.env`.
- El deploy FTP hace **sincronización con borrado** dentro de `FTP_SERVER_DIR`: no apuntes
  a una carpeta con otro sitio.

---

## 10. Pendientes / ideas (no implementado)

- **#4** Filtros y orden en Pacientes (por objetivo, última visita, "sin visita reciente").
- **#5** Cambiar contraseña del admin desde la app + credenciales por variables de entorno.
- Enviar plan por WhatsApp (requiere share sheet / PDF en cliente; se decidió **no** por
  ahora para no sobrecargar).
- Convertir tablas a tarjetas apiladas en móvil (hoy hacen scroll horizontal).

---

## 11. Checklist al hacer cambios

1. `npm run build` y `npm run lint` deben pasar.
2. Probar en `http://localhost:5173` (login `admin`/`admin123` en local).
3. Solo commit cuando se pida; el `git push` a `main` publica automáticamente.
4. Si agregas columnas, usa `db_ensure_column()` (migración automática).
5. Mantén la UI en español y el término **"visita"**.
