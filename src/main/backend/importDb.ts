import Database from 'better-sqlite3'
import { decryptPrivateKey } from './crypto'

export type ExternalWalletRow = {
  name: string
  address: string
  pk: string
  salt: string
  last_balance: string | null
}

/**
 * Opens a Wartlock-compatible sqlite file and returns its wallet rows
 * without decrypting them. Callers decrypt per-row with the user's password.
 */
export function readExternalWallets(dbPath: string): ExternalWalletRow[] {
  const external = new Database(dbPath, { readonly: true, fileMustExist: true })
  try {
    const rows = external
      .prepare(
        'SELECT name, address, pk, salt, last_balance FROM wallets WHERE pk IS NOT NULL AND salt IS NOT NULL;',
      )
      .all() as ExternalWalletRow[]
    return rows
  } finally {
    external.close()
  }
}

/**
 * Tries to decrypt every row with `password`. Returns only rows that decrypted
 * successfully (with the plaintext pk attached), so the caller can re-encrypt
 * under the user's local password before insertion.
 */
export function decryptExternalWallets(
  rows: ExternalWalletRow[],
  password: string,
): Array<ExternalWalletRow & { plaintextPk: string }> {
  const out: Array<ExternalWalletRow & { plaintextPk: string }> = []
  for (const row of rows) {
    const pk = decryptPrivateKey(row.pk, password, row.salt)
    if (pk) out.push({ ...row, plaintextPk: pk })
  }
  return out
}
