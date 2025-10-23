import { clientPromise, dbName } from './mongodb'
import { Collection, Document } from 'mongodb'

export async function getCollection<T extends { _id?: any }>(collectionName: string): Promise<Collection<T>> {
  const client = await clientPromise
  const db = client.db(dbName)
  return db.collection<T>(collectionName)
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function handleApiError(error: unknown) {
  console.error('API Error:', error)
  if (error instanceof ApiError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })
}