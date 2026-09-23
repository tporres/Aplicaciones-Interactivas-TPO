# Guía de pruebas manuales con Postman

## Preparación

1. Iniciar PostgreSQL y preparar la base:

   ```bash
   docker compose up -d postgres
   cd backend
   npm ci
   cp .env.example .env
   npm run db:setup
   npm run dev
   ```

2. Importar `postman/API de Componentes para Videojuegos.postman_collection.json` en Postman.
3. Confirmar que la variable de colección `baseUrl` tenga el valor `http://localhost:3000`.
4. Ejecutar las solicitudes en el orden indicado. La colección guarda automáticamente `token`, `categoryId`, `productId`, `inquiryId` y `resetToken` cuando corresponde.

No ejecutar toda la colección automáticamente en el primer recorrido: las solicitudes de recuperación, cierre de sesión y eliminación invalidan datos que usan las demás. Probarlas manualmente siguiendo este flujo.

## Flujo recomendado

### 1. Salud

- `Salud / Estado general` debe responder `200` con `{ "status": "ok" }`.
- `Salud / Disponibilidad` debe responder `200` e indicar `database: "connected"`.

### 2. Administrador

- Ejecutar `Autenticación / Registrar administrador` una sola vez. Guarda el token JWT.
- Ejecutar `Autenticación / Consultar perfil`.
- Ejecutar `Autenticación / Modificar perfil` y comprobar el nuevo teléfono.
- Volver a registrar el mismo correo debe responder `409 EMAIL_CONFLICT`.

Comprobar la base:

```sql
SELECT id, first_name, last_name, email, phone
FROM administrators;
```

### 3. Información institucional

- Ejecutar `Comercio / Crear o reemplazar información institucional`.
- Ejecutar `Comercio / Consultar información institucional` sin autenticación.

Comprobar:

```sql
SELECT name, address, phone, social_links, opening_hours
FROM store_information;
```

### 4. Categoría

- Ejecutar `Categorías / Crear categoría`. Guarda `categoryId`.
- Ejecutar `Categorías / Listar categorías`.
- Ejecutar `Categorías / Modificar categoría`.

Comprobar:

```sql
SELECT * FROM categories WHERE id = <categoryId>;
```

### 5. Producto

- Ejecutar `Administración de productos / Crear producto`. Guarda `productId`.
- Ejecutar `Productos públicos / Buscar y filtrar productos`.
- Ejecutar `Administración de productos / Desactivar producto`.
- Repetir `Productos públicos / Consultar producto`: debe responder `404` porque está desactivado.
- Ejecutar `Administración de productos / Listar productos inactivos`: debe mostrarlo.
- Activarlo nuevamente con `Administración de productos / Activar producto`.

Comprobar:

```sql
SELECT id, name, category_id, price, availability, is_active
FROM products
WHERE id = <productId>;
```

Intentar eliminar su categoría mientras el producto existe debe responder `409 CATEGORY_IN_USE`.

### 6. Consulta de visitante

- Ejecutar `Consultas / Enviar consulta` sin autenticación. Guarda `inquiryId`.
- Ejecutar `Consultas / Listar consultas pendientes` con autenticación.
- Ejecutar `Consultas / Marcar consulta como respondida`.

Comprobar:

```sql
SELECT id, name, email, subject, status
FROM inquiries
WHERE id = <inquiryId>;
```

### 7. Recuperación de contraseña

- Ejecutar `Autenticación / Solicitar recuperación de contraseña`. En desarrollo guarda `resetToken`.
- Ejecutar `Autenticación / Restablecer contraseña`.
- El token JWT anterior queda revocado.
- Ejecutar `Autenticación / Iniciar sesión con la contraseña nueva` para guardar un token nuevo.

Comprobar que el token fue utilizado y las sesiones anteriores revocadas:

```sql
SELECT administrator_id, expires_at, used_at
FROM password_reset_tokens;

SELECT id, administrator_id, revoked_at
FROM auth_sessions
ORDER BY created_at DESC;
```

### 8. Eliminaciones

- Eliminar primero el producto.
- Eliminar después la categoría.
- Eliminar la consulta.
- Verificar que los `GET` correspondientes respondan `404`.

### 9. Cierre de sesión

- Ejecutar `Autenticación / Cerrar sesión`.
- `Autenticación / Consultar perfil` debe responder `401` usando el token revocado.

## Estados esperados

| Caso | Estado |
| --- | --- |
| Lectura o modificación exitosa | `200` |
| Creación exitosa | `201` |
| Solicitud de recuperación aceptada | `202` |
| Eliminación o cierre de sesión exitoso | `204` |
| Validación inválida | `400` |
| Token ausente, inválido o revocado | `401` |
| Recurso inexistente | `404` |
| Duplicado o categoría en uso | `409` |
