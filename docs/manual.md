# Manual del sistema E-commerce Multitienda

## 1. Visión general

Este proyecto usa una arquitectura híbrida:

- PostgreSQL para los datos relacionales y transaccionales.
- MongoDB para el catálogo de productos, carritos y preferencias.
- Frontend en React + Vite para mostrar el catálogo y el carrito.
- Backend en Node.js + Express como capa de integración entre ambas bases.

La idea central es que cada base resuelve una parte distinta del problema:

- PostgreSQL maneja clientes, roles, órdenes y datos sensibles cifrados.
- MongoDB maneja productos, imágenes, atributos dinámicos, reportes y carritos.

## 2. Dónde está cada base de datos

Las bases se levantan con Docker desde [docker-compose.yml](../docker-compose.yml).

### PostgreSQL

- Contenedor: `football_postgres`
- Puerto: `5432`
- Base de datos: `football_store`
- Usuario: `postgres`
- Contraseña: `postgres`

El script de inicialización está en [backend/db/init.sql](../backend/db/init.sql).

### MongoDB

- Contenedor: `football_mongodb`
- Puerto expuesto: `27018`
- Base de datos: `football_store`
- Usuario: `ecom_admin`
- Contraseña: `holamundo`

Mongo Express está disponible en `http://localhost:8082`.

## 3. Cómo se conectan

El backend conecta ambas bases al arrancar:

- PostgreSQL se conecta desde [backend/src/config/pg.js](../backend/src/config/pg.js).
- MongoDB se conecta desde [backend/src/config/db.js](../backend/src/config/db.js).
- El arranque del servidor está en [backend/src/server.js](../backend/src/server.js).

Flujo de arranque:

1. Se leen las variables de entorno.
2. Se conecta MongoDB.
3. Se conecta PostgreSQL.
4. PostgreSQL ejecuta el contenido de `backend/db/init.sql`.
5. Se re-semilla el catálogo de productos en MongoDB.
6. El servidor expone la API en `http://localhost:4000`.

## 4. Cómo funciona la aplicación

### Frontend

El frontend está en [frontend/src/App.jsx](../frontend/src/App.jsx).

Su funcionamiento es este:

- Carga productos desde `/api/products`.
- Si el proxy no responde, prueba `http://localhost:4000/api/products`.
- Usa imágenes desde `/products/...`, que son archivos estáticos servidos por Vite.
- Inicializa el carrito en vacío, por eso comienza en 0.

### Backend

El backend expone estas rutas principales:

- `GET /api/health`
- `GET /api/products`
- `POST /api/products/search`
- `POST /api/customers`
- `GET /api/customers/:id`
- `GET /api/customers/:id/full`
- `POST /api/preferences/:customerId`
- `POST /api/cart/:customerId`
- `GET /api/reports/compare-brands`
- `GET /api/reports/price-summary`

## 5. Cómo funciona el módulo relacional

PostgreSQL guarda:

- `roles`
- `customers`
- `orders`
- `order_items`

Además, el campo `encrypted_card` guarda la tarjeta cifrada para no exponer datos sensibles.

El cliente se crea con UUID y las consultas usan parámetros, lo que reduce el riesgo de SQL Injection.

La unión entre cliente y datos de Mongo se hace en la ruta `GET /api/customers/:id/full`, donde el backend consulta:

- el cliente en PostgreSQL
- el carrito en MongoDB
- las preferencias en MongoDB

## 6. Cómo funciona el módulo NoSQL

MongoDB guarda el catálogo de productos con esquemas flexibles.

Cada producto incluye:

- nombre en español
- categoría
- precio
- imagen
- atributos dinámicos en `attributes`
- arreglos como `tags` y `variants`
- marca
- slug único

Esto permite tener productos distintos por categoría sin forzar una estructura rígida.

Los reportes usan agregaciones y consultas comparativas para evaluar precios y marcas.

## 7. Cómo se guardan las imágenes

Las imágenes no se guardan como binarios dentro de la base de datos.

Lo que se guarda es la ruta del archivo, por ejemplo:

- `/products/footwear/Adidas-Copa-Pure.avif`
- `/products/equipment/Puma-Ultra-Ultimate-Gloves.jpg`

El archivo físico está en [frontend/public/products](../frontend/public/products).

El catálogo en MongoDB solo guarda la referencia `image` con la ruta.

## 8. Cómo comprobar que todo funciona

### 8.1 Levantar el proyecto

```bash
docker compose up -d
cd backend
npm.cmd run dev
cd frontend
npm.cmd run dev
```

### 8.2 Validar PostgreSQL

Haz una petición a `POST /api/customers`.

Debes comprobar que:

- el cliente devuelve un `id` UUID
- la base guarda el registro en `customers`
- el campo `encrypted_card` se llena con valor cifrado

### 8.3 Validar MongoDB

Haz una petición a `GET /api/products`.

Debes comprobar que:

- aparecen 34 productos
- los nombres están en español
- las imágenes apuntan a `/products/...`
- las categorías son `footwear`, `equipment`, `apparel` y `training`

### 8.4 Validar la integración

Haz estas llamadas en orden:

1. `POST /api/customers`
2. `POST /api/preferences/:customerId`
3. `POST /api/cart/:customerId`
4. `GET /api/customers/:id/full`

Debes ver el cliente de PostgreSQL junto con sus preferencias y carrito en MongoDB.

## 9. ¿Se puede borrar la carpeta Productos?

Sí, pero con una condición importante:

- **No**, las fotos no están guardadas dentro de la base de datos.
- **Sí**, la app ya usa las copias que están en [frontend/public/products](../frontend/public/products).
- Por eso, si borras `Productos`, la aplicación seguirá funcionando.

Sin embargo, te recomiendo no borrarla todavía si quieres conservar el material original, porque esa carpeta funciona como fuente de respaldo.

Si la borras, asegúrate de que:

1. Las imágenes estén completas en `frontend/public/products`.
2. El backend ya haya sido resembrado con los productos.
3. Verifiques que `GET /api/products` siga devolviendo todos los productos.

## 10. Resumen corto

- PostgreSQL guarda clientes, órdenes y cifrado.
- MongoDB guarda catálogo, carrito y preferencias.
- El backend une ambas bases por `customerId`.
- Las fotos se sirven como archivos estáticos, no como datos binarios en la base.
- La carpeta `Productos` es opcional para ejecución, pero útil como respaldo.