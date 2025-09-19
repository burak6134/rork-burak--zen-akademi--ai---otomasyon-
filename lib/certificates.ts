import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { Certificate } from '@/types/api';
import { certificatesStore } from './certificates.store';

interface CreateCertificateParams {
  userName: string;
  courseId: string;
  courseTitle: string;
}

export const certificatesService = {
  async createCertificateForUser(params: CreateCertificateParams): Promise<Certificate> {
    const { userName, courseId, courseTitle } = params;
    
    // Check if certificate already exists for this user and course
    const existing = await certificatesStore.findCertificateByUserAndCourse(userName, courseId);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const certificateId = `CER-${courseId}-${now.getTime()}`;
    const id = `${userName}-${courseId}-${now.getTime()}`;
    const completedAtUTC = now.toISOString();
    const deepLink = Linking.createURL(`/course/${courseId}`);

    const certificate: Certificate = {
      id,
      certificateId,
      userName,
      courseId,
      courseTitle,
      completedAtUTC,
      deepLink,
    };

    try {
      // Generate PDF
      const pdfUri = await this.generatePDF(certificate);
      certificate.pdfUri = pdfUri;

      // Save certificate
      await certificatesStore.addOrUpdateCertificate(certificate);
      
      return certificate;
    } catch (error) {
      console.error('Error creating certificate:', error);
      // Save certificate without files if generation fails
      await certificatesStore.addOrUpdateCertificate(certificate);
      return certificate;
    }
  },

  async generatePDF(certificate: Certificate): Promise<string> {
    const html = this.generateCertificateHTML(certificate);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Move to documents directory with proper name
    const fileName = `certificate-${certificate.certificateId}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    return newUri;
  },

  async generatePNG(certificateRef: any): Promise<string> {
    try {
      const uri = await captureRef(certificateRef, {
        format: 'png',
        quality: 0.8,
        result: 'tmpfile',
      });
      
      return uri;
    } catch (error) {
      console.error('Error generating PNG:', error);
      throw error;
    }
  },

  generateCertificateHTML(certificate: Certificate): string {
    const formattedDate = new Date(certificate.completedAtUTC).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
      color: #FFFFFF;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .certificate {
      background: #1A1A1A;
      border: 3px solid #00E5FF;
      border-radius: 20px;
      padding: 60px;
      text-align: center;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 229, 255, 0.2);
      position: relative;
      overflow: hidden;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header {
      margin-bottom: 40px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #00E5FF;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #B0B0B0;
      margin-bottom: 40px;
    }
    .title {
      font-size: 48px;
      font-weight: bold;
      color: #00E5FF;
      margin-bottom: 30px;
    }
    .recipient {
      font-size: 24px;
      margin-bottom: 10px;
      color: #FFFFFF;
    }
    .name {
      font-size: 36px;
      font-weight: bold;
      color: #7C4DFF;
      margin: 20px 0;
    }
    .course {
      font-size: 28px;
      font-weight: 600;
      color: #FFFFFF;
      margin: 30px 0;
      padding: 20px;
      background: rgba(0, 229, 255, 0.1);
      border-radius: 10px;
      border: 1px solid rgba(0, 229, 255, 0.3);
    }
    .date {
      font-size: 18px;
      color: #B0B0B0;
      margin: 30px 0;
    }
    .certificate-id {
      font-size: 14px;
      color: #808080;
      margin-top: 40px;
      font-family: Courier New, monospace;
    }
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid rgba(0, 229, 255, 0.3);
    }
    .signature {
      font-size: 16px;
      color: #B0B0B0;
    }
    .academy {
      font-size: 20px;
      font-weight: bold;
      color: #00E5FF;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="content">
      <div class="header">
        <div class="logo">🎓 BURAK ÖZEN AKADEMİ</div>
        <div class="subtitle">AI + Otomasyon Eğitim Platformu</div>
      </div>
      
      <div class="title">BAŞARI SERTİFİKASI</div>
      
      <div class="recipient">Bu sertifika</div>
      <div class="name">${certificate.userName}</div>
      <div class="recipient">adlı kişinin</div>
      
      <div class="course">"${certificate.courseTitle}"</div>
      
      <div class="recipient">kursunu başarıyla tamamladığını belgeler.</div>
      
      <div class="date">Tamamlanma Tarihi: ${formattedDate}</div>
      
      <div class="footer">
        <div class="signature">Dijital olarak doğrulanmıştır</div>
        <div class="academy">Burak Özen Akademi</div>
      </div>
      
      <div class="certificate-id">Sertifika No: ${certificate.certificateId}</div>
    </div>
  </div>
</body>
</html>`;
  },

  async sharePDF(certificate: Certificate): Promise<void> {
    if (!certificate.pdfUri) {
      throw new Error('PDF not available');
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(certificate.pdfUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Sertifikayı Paylaş',
      });
    } else {
      throw new Error('Sharing not available');
    }
  },

  async sharePNG(pngUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pngUri, {
        mimeType: 'image/png',
        dialogTitle: 'Sertifikayı Paylaş',
      });
    } else {
      throw new Error('Sharing not available');
    }
  },

  async copyLink(certificate: Certificate): Promise<void> {
    await Clipboard.setStringAsync(certificate.deepLink);
  },

  async regenerateFiles(certificate: Certificate): Promise<Certificate> {
    try {
      const pdfUri = await this.generatePDF(certificate);
      const updatedCertificate = { ...certificate, pdfUri };
      await certificatesStore.addOrUpdateCertificate(updatedCertificate);
      return updatedCertificate;
    } catch (error) {
      console.error('Error regenerating certificate files:', error);
      throw error;
    }
  }
};