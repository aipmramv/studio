import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';

class AzureBlobStorageService {
  private containerClient: ContainerClient | null = null;
  private blobServiceClient: BlobServiceClient | null = null;

  async initialize(): Promise<void> {
    if (!config.azure.storageConnectionString) {
      logger.warn('Azure Storage not configured. File uploads will be disabled.');
      return;
    }

    try {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        config.azure.storageConnectionString
      );

      this.containerClient = this.blobServiceClient.getContainerClient(
        config.azure.containerName
      );

      // Create container if it doesn't exist
      const containerExists = await this.containerClient.exists();
      if (!containerExists) {
        await this.blobServiceClient
          .getContainerClient(config.azure.containerName)
          .create();
        logger.info(`Created Azure Blob Storage container: ${config.azure.containerName}`);
      }

      logger.info('Azure Blob Storage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Azure Blob Storage', error);
      throw error;
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    if (!this.containerClient) {
      throw new Error('Azure Blob Storage not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: { blobContentType: contentType },
      });

      logger.info(`File uploaded: ${fileName}`);
      return blockBlobClient.url;
    } catch (error) {
      logger.error('Failed to upload file to Azure Blob Storage', error);
      throw error;
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    if (!this.containerClient) {
      throw new Error('Azure Blob Storage not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.delete();
      logger.info(`File deleted: ${fileName}`);
    } catch (error) {
      logger.error('Failed to delete file from Azure Blob Storage', error);
      throw error;
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    if (!this.containerClient) {
      throw new Error('Azure Blob Storage not initialized');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    return blockBlobClient.url;
  }

  generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }
}

export const blobStorageService = new AzureBlobStorageService();
