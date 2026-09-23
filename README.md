# Aplicaciones Interactivas - TPO

API REST para una plataforma promocional de componentes para videojuegos, desarrollada como Trabajo Práctico Obligatorio de Aplicaciones Interactivas.

La [consigna del TPO](./TPO%20Segundo%20Cuatrimestre%202026.pdf) es la fuente de verdad. Este repositorio implementa únicamente el servidor; no incluye interfaz web, carrito, pagos ni envíos.

## Estado

El alcance obligatorio del servidor está implementado:

- API REST con Node.js y Express.
- PostgreSQL mediante `pg`, sin ORM.
- Migraciones SQL y carga inicial idempotente.
- Registro, inicio y cierre de sesión.
- Recuperación de contraseña y perfil del administrador.
- Autenticación y autorización mediante JWT con sesiones revocables.
- Información institucional pública y administrable.
- CRUD de categorías.
- Catálogo y CRUD de productos.
- Activación, desactivación y disponibilidad de productos.
- Búsqueda, filtro por categoría, orden y paginación.
- Formulario público y gestión administrativa de consultas.
- 20 productos precargados.
- Validaciones y respuestas de error JSON.
- Pruebas automatizadas e integración real con PostgreSQL.

## Tecnologías

- JavaScript con módulos CommonJS.
- Node.js 24.20.0 y npm 11.
- Express 5.2.1.
- PostgreSQL 17.
- `pg` sin ORM.
- Zod para validación.
- `bcryptjs` para contraseñas.
- Tokens JWT para autenticación.
- `node:test` para pruebas.

## Inicio rápido con Docker

Requisitos:

- Node.js 24.20.0, preferentemente mediante `fnm`.
- Docker con Compose.

Desde la raíz del repositorio:

```bash
fnm install
fnm use
docker compose up -d postgres
```

Desde el directorio `backend/`:

```bash
npm ci
cp .env.example .env
npm run db:setup
npm run dev
```

La API queda disponible en `http://localhost:3000`. Comprobarla con:

```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/health/ready
```

Para detener PostgreSQL:

```bash
docker compose down
```

Los datos permanecen en el volumen `postgres_data`. Usar `docker compose down -v` solamente cuando se desee eliminar toda la base local.

## Variables de entorno

| Variable | Descripción | Valor de desarrollo |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto HTTP | `3000` |
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://postgres:postgres@localhost:5432/gamer_store` |
| `DATABASE_SSL` | Habilita TLS para PostgreSQL | `false` |
| `DATABASE_POOL_MAX` | Máximo de conexiones | `10` |
| `JWT_SECRET` | Firma de tokens; mínimo 32 caracteres | Cambiar antes de producción |
| `JWT_EXPIRES_SECONDS` | Duración de sesión | `28800` |
| `PASSWORD_RESET_EXPIRES_MINUTES` | Duración del token de recuperación | `30` |
| `BCRYPT_ROUNDS` | Costo del resumen criptográfico de contraseña | `10` |

En producción, `JWT_SECRET` es obligatorio. El archivo `.env` está excluido de Git.

## Rutas de la API

Las rutas marcadas como **Administrador** requieren:

```http
Authorization: Bearer <token>
```

### Salud

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Público | Estado del proceso HTTP. |
| `GET` | `/api/v1/health/ready` | Público | Estado de PostgreSQL. |

### Autenticación y perfil

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Registra un administrador e inicia sesión. |
| `POST` | `/api/v1/auth/login` | Público | Inicia sesión. |
| `POST` | `/api/v1/auth/logout` | Administrador | Revoca la sesión actual. |
| `POST` | `/api/v1/auth/forgot-password` | Público | Genera un token de recuperación. |
| `POST` | `/api/v1/auth/reset-password` | Público | Cambia la contraseña y revoca sesiones previas. |
| `GET` | `/api/v1/profile` | Administrador | Obtiene el perfil. |
| `PATCH` | `/api/v1/profile` | Administrador | Modifica nombre, apellido, correo o teléfono. |

En desarrollo y pruebas, `forgot-password` devuelve `resetToken` para poder probar el flujo con Postman. En producción no lo expone; allí debe entregarse por un canal externo.

### Información institucional

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/v1/store` | Público | Consulta los datos del comercio. |
| `PUT` | `/api/v1/store` | Administrador | Crea o reemplaza los datos del comercio. |

### Categorías

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/v1/categories` | Público |
| `GET` | `/api/v1/categories/:id` | Público |
| `POST` | `/api/v1/categories` | Administrador |
| `PATCH` | `/api/v1/categories/:id` | Administrador |
| `DELETE` | `/api/v1/categories/:id` | Administrador |

Una categoría con productos asociados no puede eliminarse.

### Productos públicos

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/v1/products` | Público |
| `GET` | `/api/v1/products/:id` | Público |

Parámetros del listado:

| Parámetro | Valores |
| --- | --- |
| `q` | Texto de búsqueda. |
| `categoryId` | Identificador positivo. |
| `availability` | `in_stock`, `out_of_stock`, `preorder`. |
| `sort` | `newest`, `name`, `price_asc`, `price_desc`. |
| `page` | Página, desde 1. |
| `limit` | Entre 1 y 100. |

Las rutas públicas nunca devuelven productos desactivados.

### Administración de productos

| Método | Ruta | Acceso |
| --- | --- | --- |
| `GET` | `/api/v1/admin/products` | Administrador |
| `GET` | `/api/v1/admin/products/:id` | Administrador |
| `POST` | `/api/v1/admin/products` | Administrador |
| `PATCH` | `/api/v1/admin/products/:id` | Administrador |
| `DELETE` | `/api/v1/admin/products/:id` | Administrador |

El listado administrativo acepta los filtros públicos y `isActive=true|false`.

### Consultas

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/v1/inquiries` | Público | Envía una consulta. |
| `GET` | `/api/v1/inquiries` | Administrador | Lista consultas. |
| `GET` | `/api/v1/inquiries/:id` | Administrador | Obtiene una consulta. |
| `PATCH` | `/api/v1/inquiries/:id/status` | Administrador | Cambia su estado. |
| `DELETE` | `/api/v1/inquiries/:id` | Administrador | Elimina una consulta. |

El listado acepta `status`, `page` y `limit`. Los estados son `pending`, `read` y `answered`.

## Base de datos

Preparar esquema y datos:

```bash
npm run db:setup
```

Los comandos también pueden ejecutarse por separado:

```bash
npm run db:migrate
npm run db:seed
```

Las migraciones se encuentran en `backend/src/db/migrations/`. La carga inicial puede ejecutarse varias veces sin duplicar categorías ni productos.

El modelo completo y las consultas de inspección están en [backend/docs/BASE_DE_DATOS.md](backend/docs/BASE_DE_DATOS.md).

## Pruebas con Postman

La guía paso a paso y las consultas SQL para verificar cada cambio están en [backend/docs/PRUEBAS_CON_POSTMAN.md](backend/docs/PRUEBAS_CON_POSTMAN.md).

También se incluye una colección importable:

```text
backend/postman/API de Componentes para Videojuegos.postman_collection.json
```

## Pruebas automatizadas

Conjunto de pruebas rápidas, sin depender de PostgreSQL:

```bash
npm test
```

Las pruebas de integración eliminan datos de sus tablas. Usar exclusivamente una base de pruebas:

```bash
createdb gamer_store_test
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamer_store_test \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gamer_store_test \
NODE_ENV=test \
npm run test:integration
```

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia la API. |
| `npm run dev` | Inicia con reinicio automático. |
| `npm run db:check` | Comprueba PostgreSQL. |
| `npm run db:migrate` | Aplica migraciones pendientes. |
| `npm run db:seed` | Carga seis categorías y 20 productos. |
| `npm run db:setup` | Ejecuta las migraciones y la carga inicial. |
| `npm test` | Ejecuta pruebas rápidas. |
| `npm run test:integration` | Ejecuta pruebas reales contra PostgreSQL. |
| `npm run test:watch` | Ejecuta pruebas en modo observación. |

## Decisiones de alcance

- Una publicación guarda una URL de imagen obligatoria. La gestión de múltiples imágenes figura como funcionalidad adicional en la consigna.
- El envío real de correos también es una funcionalidad adicional. El flujo de recuperación está implementado, pero requiere integrar un proveedor de correo para producción.
- No se implementó una interfaz web por decisión expresa del proyecto.
- No se implementaron carrito, pagos ni envíos porque no forman parte de la consigna.
