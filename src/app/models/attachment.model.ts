
export interface Attachment {
    attachmentId: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    uploadedAt: string;
    ticketId: number;
}

export interface FileUploadResponse {
    attachmentId: number;
    fileName: string;
    fileUrl: string;
}

export interface DownloadedFile {
    fileData: Blob;
    fileName: string;
    fileType: string;
}