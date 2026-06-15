# Práctica Final: Sistema E-commerce Multitienda

Proyecto de e-commerce con arquitectura híbrida SQL + NoSQL para clientes, carritos, preferencias, catálogo y reportes.

## Levantar el proyecto

1. Inicia las bases de datos.

```bash
docker compose up -d
```

2. Arranca el backend.

```bash
cd backend
npm.cmd run dev
```

3. Arranca el frontend en otra terminal.

```bash
cd frontend
npm.cmd run dev
```

URLs locales:

- Backend: http://localhost:4000
- Frontend: http://localhost:5173
- Mongo Express: http://localhost:8082

## Qué comprobar

### Salud del sistema

```bash
GET /api/health
```

Debe responder con `status: ok`.

### Módulo relacional

Verifica PostgreSQL con la inicialización en `backend/db/init.sql`.

```bash
POST /api/customers
GET /api/customers/:id
GET /api/customers/:id/full
```

Qué validar:

- que el cliente se crea con un UUID
- que el correo queda en PostgreSQL
- que `encrypted_card` existe y se guarda cifrado
- que `GET /api/customers/:id/full` junta cliente de PostgreSQL con preferencias y carrito de MongoDB

También puedes revisar el esquema en PostgreSQL y confirmar tablas como `roles`, `customers`, `orders` y `order_items`.

### Módulo NoSQL

```bash
GET /api/products
POST /api/products/search
GET /api/reports/compare-brands
GET /api/reports/price-summary
```

Qué validar:

- que los productos tienen campos flexibles en `attributes`
- que existen arreglos en `tags` y `variants`
- que la búsqueda acepta operadores como `$gt`, `$lt`, `$and` y `$or`
- que los reportes comparan marcas y agregan precios

### Integración entre bases

```bash
POST /api/preferences/:customerId
POST /api/cart/:customerId
GET /api/customers/:id/full
```

Qué validar:

- que `customerId` conecta PostgreSQL con MongoDB
- que preferencias y carrito se guardan en MongoDB
- que la vista completa devuelve un documento integrado

## Ejemplo rápido de prueba

1. Crear un cliente con `POST /api/customers`.
2. Tomar el `id` devuelto.
3. Crear preferencias con `POST /api/preferences/:customerId`.
4. Consultar un producto desde `GET /api/products` y usar su `id` real de Mongo para `POST /api/cart/:customerId`.
5. Confirmar la unión con `GET /api/customers/:id/full`.

## Observaciones

- El backend ejecuta `backend/db/init.sql` al arrancar para mantener PostgreSQL sincronizado.
- La API de productos usa IDs reales de MongoDB en `id`.
- El frontend consulta `/api/products` a través del proxy de Vite.