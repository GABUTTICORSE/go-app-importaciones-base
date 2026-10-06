# Cambios de seguridad y estabilidad

## Cómo aplicarlos
1. Copia las carpetas `backend` y `frontend` de este ZIP sobre tu proyecto (reemplaza los archivos).
2. Borra el archivo `backend/src/controllers/auth.controller.js` (no se usaba).
3. Crea tu `backend/.env` a partir de `backend/.env.example` si aún no lo tienes.
4. Cambia la contraseña del administrador:
   `cd backend` y luego `npm run create:admin -- tu-correo@empresa.cl "Tu Nombre" "UnaClaveSegura123"`
5. Reinicia backend y frontend.

## Qué se cambió
- Proveedores: ahora exigen sesión iniciada (`routes/supplier.routes.js`).
- Registro: cerrado por defecto; solo un admin con sesión puede crear cuentas (`routes/auth.routes.js`, `middleware/auth.js`). Contraseñas de mínimo 8 caracteres.
- Script de admin: ya no tiene correo ni contraseña escritos en el código (`scripts/createAdmin.js`).
- Órdenes: editar y eliminar ahora se guardan en la base de datos (`frontend/src/App.jsx`).
- Recordatorios: se guardan en el servidor por usuario (`models/ReminderList.js`, `routes/reminder.routes.js`, `App.jsx`).
- Errores: el servidor ya no se cae ante un error (por ejemplo, número de orden repetido); responde con un mensaje claro (`utils/asyncHandler.js`, `server.js`).
- Búsqueda de órdenes: el texto se trata como texto literal (`controllers/operation.controller.js`).
- Noticias: si una fuente falla las demás siguen funcionando, y se guardan 15 minutos (`routes/news.routes.js`).
- Login: se quitaron los `console.log` que mostraban la contraseña en la consola del navegador.

## Lo que NO se tocó
Toda la lógica de cálculo de importación y costos (`utils/costs.js`, `CreateOrder.jsx`, `OrdersList.jsx`, `UnitCosting.jsx`, `Inventory.jsx`) queda exactamente igual.
