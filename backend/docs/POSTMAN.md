# Pruebas manuales con Postman

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

2. Importar `postman/Hardware Gamer API.postman_collection.json` en Postman.
3. Confirmar que la variable de colección `baseUrl` vale `http://localhost:3000`.
4. Ejecutar las peticiones en el orden indicado. La colección guarda automáticamente `token`, `categoryId`, `productId`, `inquiryId` y `resetToken` cuando corresponde.

No ejecutar toda la colección automáticamente en el primer recorrido: las peticiones de recuperación, logout y eliminación invalidan datos que usan las demás. Probarlas manualmente siguiendo este flujo.

## Flujo recomendado

### 1. Salud

- `Health / Liveness` debe responder `200` con `{ "status": "ok" }`.
- `Health / Readiness` debe responder `200` e indicar `database: "connected"`.

### 2. Administrador

- Ejecutar `Auth / Register` una sola vez. Guarda el Bearer token.
- Ejecutar `Auth / Get profile`.
- Ejecutar `Auth / Update profile` y comprobar el nuevo teléfono.
- Volver a registrar el mismo correo debe responder `409 EMAIL_CONFLICT`.

Comprobar la base:

```sql
SELECT id, first_name, last_name, email, phone
FROM administrators;
```

### 3. Información institucional

- Ejecutar `Store / Upsert store information`.
- Ejecutar `Store / Get store information` sin autenticación.

Comprobar:

```sql
SELECT name, address, phone, social_links, opening_hours
FROM store_information;
```

### 4. Categoría

- Ejecutar `Categories / Create category`. Guarda `categoryId`.
- Ejecutar `Categories / List categories`.
- Ejecutar `Categories / Update category`.

Comprobar:

```sql
SELECT * FROM categories WHERE id = <categoryId>;
```

### 5. Producto

- Ejecutar `Products admin / Create product`. Guarda `productId`.
- Ejecutar `Products public / Search and filter products`.
- Ejecutar `Products admin / Deactivate product`.
- Repetir `Products public / Get product`: debe responder `404` porque está desactivado.
- Ejecutar `Products admin / List inactive products`: debe mostrarlo.
- Activarlo nuevamente con `Products admin / Activate product`.

Comprobar:

```sql
SELECT id, name, category_id, price, availability, is_active
FROM products
WHERE id = <productId>;
```

Intentar eliminar su categoría mientras el producto existe debe responder `409 CATEGORY_IN_USE`.

### 6. Consulta de visitante

- Ejecutar `Inquiries / Submit inquiry` sin autenticación. Guarda `inquiryId`.
- Ejecutar `Inquiries / List pending inquiries` con autenticación.
- Ejecutar `Inquiries / Mark inquiry as answered`.

Comprobar:

```sql
SELECT id, name, email, subject, status
FROM inquiries
WHERE id = <inquiryId>;
```

### 7. Recuperación de contraseña

- Ejecutar `Auth / Forgot password`. En desarrollo guarda `resetToken`.
- Ejecutar `Auth / Reset password`.
- El token Bearer anterior queda revocado.
- Ejecutar `Auth / Login with new password` para guardar un token nuevo.

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

- Ejecutar `Auth / Logout`.
- `Auth / Get profile` debe responder `401` usando el token revocado.

## Estados esperados

| Caso | Estado |
| --- | --- |
| Lectura o modificación exitosa | `200` |
| Creación exitosa | `201` |
| Solicitud de recuperación aceptada | `202` |
| Eliminación o logout exitoso | `204` |
| Validación inválida | `400` |
| Token ausente, inválido o revocado | `401` |
| Recurso inexistente | `404` |
| Duplicado o categoría en uso | `409` |
