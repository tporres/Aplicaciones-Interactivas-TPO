# Aplicaciones Interactivas - TPO

Plataforma web para un pequeño comercio de hardware gamer, desarrollada como Trabajo Práctico Obligatorio de Aplicaciones Interactivas.

El sistema permitirá publicar y administrar un catálogo de productos, organizarlo por categorías, ofrecer información institucional y recibir consultas de visitantes. No se plantea como un e-commerce transaccional: el alcance obligatorio no incluye carrito, pagos ni envíos.

La [consigna del TPO](./TPO%20Segundo%20Cuatrimestre%202026.pdf) es la fuente de verdad para los requisitos del proyecto.

## Estado actual

El proyecto se encuentra en desarrollo y, por el momento, se trabaja exclusivamente sobre el backend.

La primera etapa incluye:

- Servidor HTTP con Express.
- Configuración mediante variables de entorno.
- Endpoint de estado de la API.
- Manejo centralizado de errores.
- Respuestas JSON para rutas inexistentes y cuerpos inválidos.
- Pruebas automatizadas con las herramientas incorporadas en Node.js.
- Conexión a PostgreSQL mediante `pg`.
- Migraciones SQL versionadas.
- Verificación de disponibilidad de la base de datos.
- CRUD completo de categorías con validaciones.
- Registro, sesión, cierre de sesión y recuperación de contraseña.
- Perfil protegido del administrador.

Todavía no se implementaron productos ni consultas.

## Stack

### Backend actual

- JavaScript.
- Node.js 24.20.0.
- npm 11.
- Express 5.2.1.
- PostgreSQL 17.
- `pg` sin ORM.
- Zod para validaciones.
- CommonJS.
- `node:test` para pruebas automatizadas.

### Componentes planificados

- React y React Router para el frontend, una vez finalizadas las etapas iniciales del backend.

## Requisitos

- [fnm](https://github.com/Schniz/fnm) o una instalación compatible de Node.js 24.
- npm, incluido con Node.js.
- Docker con Compose, o una instalación local compatible de PostgreSQL 17.

El repositorio contiene un archivo `.node-version`, por lo que `fnm` puede seleccionar automáticamente la versión correcta.

## Instalación

Clonar el repositorio:

```bash
git clone git@github.com:matiasalek/Aplicaciones-Interactivas-TPO.git
cd Aplicaciones-Interactivas-TPO
```

Instalar y activar la versión de Node.js:

```bash
fnm install
fnm use
```

Instalar las dependencias del backend:

```bash
cd backend
npm install
```

Crear la configuración local:

```bash
cp .env.example .env
```

Iniciar PostgreSQL desde la raíz del repositorio:

```bash
docker compose up -d postgres
```

Aplicar las migraciones desde `backend/`:

```bash
npm run db:migrate
```

## Variables de entorno

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor HTTP | `3000` |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://postgres:postgres@localhost:5432/gamer_store` |
| `DATABASE_SSL` | Activa TLS para PostgreSQL | `false` |
| `DATABASE_POOL_MAX` | Máximo de conexiones del pool | `10` |

El archivo `.env` es local y no debe subirse al repositorio. Los valores de referencia se encuentran en `backend/.env.example`.

## Ejecución

Desde `backend/`:

```bash
npm run dev
```

El modo de desarrollo reinicia el servidor automáticamente cuando cambia el código.

Para una ejecución normal:

```bash
npm start
```

La API estará disponible por defecto en `http://localhost:3000`.

## Endpoint disponible

### Estado de la API

```http
GET /api/v1/health
```

Respuesta exitosa:

```json
{
  "status": "ok"
}
```

### Disponibilidad de la API

```http
GET /api/v1/health/ready
```

Devuelve `200` cuando PostgreSQL está disponible y `503` cuando la API no puede conectarse a la base de datos.

### Categorías

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/categories` | Lista las categorías. |
| `GET` | `/api/v1/categories/:id` | Obtiene una categoría. |
| `POST` | `/api/v1/categories` | Crea una categoría. |
| `PATCH` | `/api/v1/categories/:id` | Modifica una categoría. |
| `DELETE` | `/api/v1/categories/:id` | Elimina una categoría. |

Ejemplo de creación:

```json
{
  "name": "Graphics Cards",
  "description": "Dedicated GPUs"
}
```

### Autenticación y perfil

| Método | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público |
| `POST` | `/api/v1/auth/login` | Público |
| `POST` | `/api/v1/auth/logout` | Administrador |
| `POST` | `/api/v1/auth/forgot-password` | Público |
| `POST` | `/api/v1/auth/reset-password` | Público |
| `GET` | `/api/v1/profile` | Administrador |
| `PATCH` | `/api/v1/profile` | Administrador |

Las rutas administrativas requieren `Authorization: Bearer <token>`. En desarrollo, la solicitud de recuperación devuelve el token en la respuesta para facilitar las pruebas con Postman. En producción deberá enviarse por correo.

Ejemplo con `curl`:

```bash
curl http://localhost:3000/api/v1/health
```

## Pruebas

Ejecutar toda la suite:

```bash
npm test
```

Ejecutar las pruebas en modo observación:

```bash
npm run test:watch
```

La suite actual verifica:

- Respuesta correcta del endpoint de salud.
- Respuesta JSON `404` para rutas inexistentes.
- Respuesta JSON `400` para cuerpos JSON inválidos.
- Validación de la variable de entorno `PORT`.
- Validaciones y manejo de errores de categorías.

Las pruebas de integración requieren una base de datos exclusiva para pruebas:

```bash
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamer_store_test \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamer_store_test \
npm run test:integration
```

La suite trunca sus tablas y nunca debe apuntar a una base con datos importantes.

## Estructura actual

```text
backend/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   ├── categories.controller.js
│   │   └── health.controller.js
│   ├── db/
│   │   ├── migrations/
│   │   │   └── 001_create_categories.sql
│   │   ├── check.js
│   │   ├── database.js
│   │   └── migrate.js
│   ├── errors/
│   │   └── app-error.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   ├── not-found.middleware.js
│   │   └── validate.middleware.js
│   ├── repositories/
│   │   └── categories.repository.js
│   ├── routes/
│   │   ├── categories.routes.js
│   │   └── health.routes.js
│   ├── services/
│   │   └── categories.service.js
│   ├── validators/
│   │   └── category.schemas.js
│   ├── app.js
│   └── server.js
├── tests/
│   ├── app.test.js
│   └── env.test.js
├── .env.example
├── package.json
└── package-lock.json
```

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor. |
| `npm run dev` | Inicia el servidor con reinicio automático. |
| `npm run db:check` | Verifica la conexión a PostgreSQL. |
| `npm run db:migrate` | Aplica migraciones SQL pendientes. |
| `npm test` | Ejecuta las pruebas una vez. |
| `npm run test:integration` | Ejecuta pruebas contra PostgreSQL. |
| `npm run test:watch` | Ejecuta las pruebas ante cada cambio. |

## Próximas etapas

1. Implementar productos, búsqueda y filtros.
2. Implementar información institucional.
3. Implementar consultas de contacto.
4. Implementar registro, autenticación, recuperación de contraseña y perfil.
5. Cargar al menos 20 productos y completar la documentación técnica.
