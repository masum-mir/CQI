import api from "./apiClient";

export const documentApi = {
  download: async (id, suggestedName) => {
    const { blob, filename } = await documentApi.fetchBlob(id, suggestedName);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  fetchBlob: async (id, suggestedName) => {
    const res = await api.get(`/documents/${id}/preview`, {
      responseType: "blob",
    });
    const disposition = res.headers["content-disposition"];
    const match = disposition && /filename="?([^"]+)"?/.exec(disposition);
    const filename = match?.[1] || suggestedName || "document";
    return { blob: res.data, filename, mime: res.data.type };
  },

  remove: (id) => api.delete(`/documents/${id}`),

  // status: 'pending' | 'approved' | 'rejected'
  review: (id, status, remark) =>
    api.patch(`/documents/${id}/review`, { status, remark }),
};
