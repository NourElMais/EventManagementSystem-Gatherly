import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5050/api',  // Use proxy in dev
});

// Add request interceptor for auth token if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


export const adminAPI = {
  // Stats
  getStats: () => api.get('/admins/stats'),

  // Event requests
  getEventRequests: () => api.get('/admins/event-requests'),
  approveEventRequest: (id) => api.put(`/admins/event-requests/${id}/approve`),
  rejectEventRequest: (id) => api.put(`/admins/event-requests/${id}/reject`),

  // Host applications (event applications)
  getHostApplications: () => api.get('/applications'),
  getApplicationsForEvent: (eventId) => api.get(`/applications/event/${eventId}`),
  approveHostApplication: (id, assignedRole) => api.put(`/applications/${id}`, { status: 'accepted', assignedRole }),
  rejectHostApplication: (id) => api.put(`/applications/${id}`, { status: 'rejected' }),

  // Host lifecycle
  listPendingHosts: () => api.get('/admins/hosts/pending'),
  approveHostAccount: (userId) => api.patch(`/admins/hosts/${userId}/approve`),
  blockHostAccount: (userId) => api.patch(`/admins/hosts/${userId}/block`),
  listClients: () => api.get('/admins/clients'),
  getClientDetails: (clientId) => api.get(`/admins/clients/${clientId}`),
  listClothing: () => api.get('/admins/clothing'),
  createClothing: (payload) => api.post('/admins/clothing', payload),
  addClothingStock: (clothesId, payload) => api.patch(`/admins/clothing/${clothesId}/stock`, payload),
  saveTransportation: (eventId, payload) => api.post(`/transportation/${eventId}`, payload),
  deleteTransportation: (eventId) => api.delete(`/transportation/${eventId}`),
  listTrainings: () => api.get('/trainings'),
  createTraining: (payload) => api.post('/trainings', payload),
  deleteTraining: (trainingId) => api.delete(`/trainings/${trainingId}`),
  listTrainingAttendees: (trainingId) => api.get(`/trainings/${trainingId}/attendees`),
};

export const userAPI = {
  getUser: (id) => api.get(`/users/${id}`),
};

export const clothingAPI = {
  getClothing: () => api.get('/clothing'),
};

export const hostAPI = {
  signupHost: (payload) => api.post('/auth/signup/host', payload),
  acceptCodeOfConduct: (userId) => api.post('/hosts/code-of-conduct/accept', { userId }),
};

export const clientAPI = {
  signupClient: (payload) => api.post('/auth/signup/client', payload),
};

export const reviewAPI = {
  getEventReviews: (eventId) => api.get(`/events/${eventId}/reviews`),
  submitTeamLeaderReview: (eventId, payload) => api.post(`/host/events/${eventId}/review`, payload),
  updateReviewVisibility: (eventId, reviewerId, visibility) =>
    api.patch(`/admin/events/${eventId}/reviews/${reviewerId}/visibility`, { visibility }),
};

export default api;
