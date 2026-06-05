import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client };

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const COLLECTION_DECKS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_DECKS!;
export const COLLECTION_CARDS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_CARDS!;
export const COLLECTION_REVIEWS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_REVIEWS!;
export const COLLECTION_USER_STATS = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER_STATS!;
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET!;
