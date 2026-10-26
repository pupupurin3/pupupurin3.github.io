import type { Context } from 'hono'
import type { AppEnv } from '../env'
import { sha256Hex } from './crypto'

/**
 * An anonymous, stable id for the visitor making the request: a salted hash
 * of their IP address. Raw IPs are never stored, and without the salt the
 * hash can't be reversed by trying every address.
 */
export async function visitorId(c: Context<AppEnv>): Promise<string> {
  const cached = c.get('visitor')
  if (cached) return cached
  const ip = c.req.header('cf-connecting-ip') ?? 'unknown'
  const id = await sha256Hex(`${c.env.HASH_SALT ?? 'dev-salt'}:${ip}`)
  c.set('visitor', id)
  return id
}
