import { account } from './appwrite';
import { ID } from 'appwrite';

export async function register(name: string, email: string, password: string) {
  await account.create(ID.unique(), email, password, name);
  return login(email, password);
}

export async function login(email: string, password: string) {
  return account.createEmailPasswordSession(email, password);
}

export async function logout() {
  return account.deleteSession('current');
}

export async function getMe() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

export async function sendPasswordReset(email: string) {
  const url = `${window.location.origin}/reset-password`;
  return account.createRecovery(email, url);
}

export async function confirmPasswordReset(userId: string, secret: string, password: string) {
  return account.updateRecovery(userId, secret, password);
}
