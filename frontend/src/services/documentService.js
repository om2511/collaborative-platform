import api from './api';

export const documentService = {
  // Get all documents for a project
  getProjectDocuments: (projectId) => api.get(`/documents/project/${projectId}`),
  
  // Get a single document
  getDocument: (documentId) => api.get(`/documents/${documentId}`),
  
  // Create a new document
  createDocument: (documentData) => api.post('/documents', documentData),
  
  // Update a document
  updateDocument: (documentId, updates) => api.put(`/documents/${documentId}`, updates),
  
  // Delete a document
  deleteDocument: (documentId) => api.delete(`/documents/${documentId}`),
  
  // Get document version history
  getDocumentVersions: (documentId) => api.get(`/documents/${documentId}/versions`),
  
  // Restore a specific version
  restoreVersion: (documentId, versionNumber) => 
    api.post(`/documents/${documentId}/versions/${versionNumber}/restore`),
  
  // Add comment to document
  addComment: (documentId, comment) => api.post(`/documents/${documentId}/comments`, { comment }),
  
  // Share document
  shareDocument: (documentId, shareData) => api.post(`/documents/${documentId}/share`, shareData)
};

export default documentService;