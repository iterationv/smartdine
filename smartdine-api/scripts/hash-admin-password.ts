import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import bcrypt from 'bcrypt'

const MIN_BCRYPT_COST = 10

function getBcryptCost(): number {
  const rawValue = process.env.BCRYPT_COST ?? ''
  const parsedValue = Number.parseInt(rawValue, 10)

  return Number.isFinite(parsedValue) && parsedValue >= MIN_BCRYPT_COST
    ? parsedValue
    : MIN_BCRYPT_COST
}

async function readPassword(): Promise<string> {
  const argumentPassword = process.argv.slice(2).join(' ')

  if (argumentPassword) {
    return argumentPassword
  }

  const readline = createInterface({ input, output })

  try {
    return await readline.question('Admin password: ')
  } finally {
    readline.close()
  }
}

const password = await readPassword()

if (!password) {
  throw new Error('Admin password is required.')
}

const passwordHash = await bcrypt.hash(password, getBcryptCost())

console.log(passwordHash)
