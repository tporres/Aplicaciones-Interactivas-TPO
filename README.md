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

Todavía no se implementaron base de datos, autenticación, productos, categorías ni consultas.

## Stack

### Backend actual

- JavaScript.
- Node.js 24.20.0.
- npm 11.
- Express 5.2.1.
- CommonJS.
- `node:test` para pruebas automatizadas.

### Componentes planificados

- PostgreSQL para persistencia.
- Driver `pg` para acceder a PostgreSQL sin ORM.
- React y React Router para el frontend, una vez finalizadas las etapas iniciales del backend.

## Requisitos

- [fnm](https://github.com/Schniz/fnm) o una instalación compatible de Node.js 24.
- npm, incluido con Node.js.

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

## Variables de entorno

| Variable | Descripción | Valor predeterminado |
| --- | --- | --- |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `PORT` | Puerto del servidor HTTP | `3000` |

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

## Estructura actual

```text
backend/
├── src/
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   └── health.controller.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── not-found.middleware.js
│   ├── routes/
│   │   └── health.routes.js
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
| `npm test` | Ejecuta las pruebas una vez. |
| `npm run test:watch` | Ejecuta las pruebas ante cada cambio. |

## Próximas etapas

1. Configurar PostgreSQL y la conexión desde Node.js.
2. Implementar categorías.
3. Implementar productos, búsqueda y filtros.
4. Implementar información institucional.
5. Implementar consultas de contacto.
6. Implementar registro, autenticación, recuperación de contraseña y perfil.
7. Cargar al menos 20 productos y completar la documentación técnica.
