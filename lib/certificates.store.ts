import AsyncStorage from '@react-native-async-storage/async-storage';
import { Certificate } from '@/types/api';

const STORAGE_KEY = 'certs:';

export const certificatesStore = {
  async listCertificates(): Promise<Certificate[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const certKeys = keys.filter(key => key.startsWith(STORAGE_KEY));
      
      if (certKeys.length === 0) {
        return [];
      }
      
      const certificates = await AsyncStorage.multiGet(certKeys);
      return certificates
        .map(([_, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean)
        .sort((a, b) => new Date(b.completedAtUTC).getTime() - new Date(a.completedAtUTC).getTime());
    } catch (error) {
      console.error('Error listing certificates:', error);
      return [];
    }
  },

  async addOrUpdateCertificate(certificate: Certificate): Promise<void> {
    try {
      const key = `${STORAGE_KEY}${certificate.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(certificate));
    } catch (error) {
      console.error('Error saving certificate:', error);
      throw error;
    }
  },

  async getCertificateById(id: string): Promise<Certificate | null> {
    try {
      const key = `${STORAGE_KEY}${id}`;
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting certificate:', error);
      return null;
    }
  },

  async deleteCertificate(id: string): Promise<void> {
    try {
      const key = `${STORAGE_KEY}${id}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  },

  async findCertificateByUserAndCourse(userName: string, courseId: string): Promise<Certificate | null> {
    try {
      const certificates = await this.listCertificates();
      return certificates.find(cert => 
        cert.userName === userName && cert.courseId === courseId
      ) || null;
    } catch (error) {
      console.error('Error finding certificate:', error);
      return null;
    }
  }
};