import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = 'http://10.0.2.2:8081';

export const getAuthToken = async () => {
  return await AsyncStorage.getItem('jwtToken');
};

export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear the token and redirect to login
      await AsyncStorage.removeItem('jwtToken');

      throw new Error('Your session has expired. Please login again.');
    }
    
    throw new Error('API request failed');
  }
  
  return response;
};