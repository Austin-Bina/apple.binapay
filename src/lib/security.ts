import * as SecureStore from 'expo-secure-store';

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync("auth_token");
};

export const saveAuthToken = async (token: string) => {
  return await SecureStore.setItemAsync("auth_token", token);
};

export const removeAuthToken = async () => {
  return await SecureStore.deleteItemAsync("auth_token");
};
