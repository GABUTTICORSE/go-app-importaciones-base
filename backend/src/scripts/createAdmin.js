import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

dotenv.config()

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    const email = 'jseverin@gabutticorse.cl'
    const password = '1234'

    const hashedPassword = await bcrypt.hash(password, 10)

    await User.findOneAndUpdate(
      { email },
      {
        name: 'Jose Severin',
        email,
        password: hashedPassword,
        role: 'admin',
      },
      {
        upsert: true,
        new: true,
      }
    )

    console.log('✅ Usuario administrador creado')
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

createAdmin()