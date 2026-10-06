// Crea o actualiza un usuario administrador.
//
// Uso (desde la carpeta backend):
//   npm run create:admin -- correo@empresa.cl "Nombre Apellido" "ContraseñaSegura123"
//
// También puedes definir ADMIN_EMAIL, ADMIN_NAME y ADMIN_PASSWORD en el .env.
// Nunca escribas contraseñas reales dentro de este archivo.
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

dotenv.config()

const [argEmail, argName, argPassword] = process.argv.slice(2)

const email = argEmail || process.env.ADMIN_EMAIL
const name = argName || process.env.ADMIN_NAME || 'Administrador'
const password = argPassword || process.env.ADMIN_PASSWORD

async function createAdmin() {
  if (!email || !password) {
    console.error(
      '❌ Falta email o contraseña.\n' +
        '   Uso: npm run create:admin -- correo@empresa.cl "Nombre" "Contraseña"'
    )
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  try {
    await mongoose.connect(process.env.MONGO_URI)

    const hashedPassword = await bcrypt.hash(password, 10)

    await User.findOneAndUpdate(
      { email },
      { name, email, password: hashedPassword, role: 'admin' },
      { upsert: true, new: true }
    )

    console.log(`✅ Administrador listo: ${email}`)
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createAdmin()
