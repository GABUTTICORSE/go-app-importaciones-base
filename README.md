# Import CRUD MVP - React + Node Express + MongoDB

MVP para gestionar cotizaciones de importación, cálculo de CIF/impuestos/costos, historial de operaciones y tracking manual.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Base de datos: MongoDB
- Autenticación: JWT simple
- Deploy futuro: Render/Railway/Fly.io + MongoDB Atlas Free Tier

## Requisitos locales
- Node.js 20+
- npm 10+
- MongoDB local o MongoDB Atlas

## 1) Configurar backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Edita `backend/.env` si usas MongoDB Atlas o un puerto distinto.

## 2) Configurar frontend
En otra terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre: http://localhost:5173

## Usuario inicial
Puedes registrarte desde la pantalla de login. La app usa JWT y guarda el token en localStorage.

## Funcionalidades incluidas
- Login / registro
- Dashboard simple
- CRUD de operaciones
- CRUD de productos
- CRUD de proveedores
- Calculadora de importación con fórmulas:
  - CIF = producto + flete + seguro
  - Ad Valorem = CIF x 6%
  - IVA = (CIF + Ad Valorem) x 19%
  - Costo Total = producto + flete + seguro + impuestos + gastos locales
- Tracking manual por estado
- Adjuntos documentales como metadata inicial: nombre, tipo, URL opcional

## Estados de operación
Solicitud, Cotización, Aprobado, Pagado, En tránsito, Aduana, Liberado, Entregado, Cerrado.

## Deploy futuro recomendado
### Base de datos
1. Crear cluster gratuito en MongoDB Atlas.
2. Crear usuario de base de datos.
3. Permitir IPs del servicio cloud o `0.0.0.0/0` para pruebas.
4. Copiar connection string a `MONGO_URI`.

### Backend
Servicios simples: Render, Railway o Fly.io.
Variables requeridas:
```env
NODE_ENV=production
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=una_clave_larga_segura
CLIENT_URL=https://tu-frontend.com
```
Build/start:
```bash
npm install
npm start
```

### Frontend
Puede alojarse en Vercel, Netlify o Render Static Site.
Variable:
```env
VITE_API_URL=https://tu-backend.com/api
```
Build:
```bash
npm install
npm run build
```
Carpeta de publicación: `dist`.

## Estructura
```text
backend/
  src/
    controllers/
    middleware/
    models/
    routes/
    utils/
frontend/
  src/
    api/
    components/
    pages/
```

## Nota de alcance MVP
No incluye ERP, IA avanzada, automatización bancaria ni carga física de archivos. Los documentos se guardan como metadata/URL para que luego se conecte S3, Cloudinary, Google Drive o storage propio.
