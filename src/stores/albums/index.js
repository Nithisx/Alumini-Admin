/**
 * AlbumsStore — photo albums and their images (domain codenames: albums.*).
 */
import { runInAction } from "mobx";
import ContentStore from "../base/ContentStore";
import api from "../../services/apiClient";
import { API_ALBUMS, API_ALBUM_DETAIL, API_BASE } from "../../config/api";

export default class AlbumsStore extends ContentStore {
  constructor(root) {
    super(root, {
      list: () => API_ALBUMS,
      detail: (id) => API_ALBUM_DETAIL(id),
      ownerOf: (item) => item?.user ?? item?.created_by ?? item?.owner ?? item?.user_id ?? null,
    });
  }

  imagesUrl = (albumId) => `${API_BASE}/albums/${albumId}/images/`;
  imageUrl = (albumId, imageId) => `${API_BASE}/albums/${albumId}/images/${imageId}/`;

  async fetchImages(albumId) {
    const data = await api.get(this.imagesUrl(albumId), { raw: true });
    return Array.isArray(data) ? data : data?.results || [];
  }

  /** `formData` carries the files — multipart, so it goes through api.upload. */
  async uploadImages(albumId, formData) {
    this.saving = true;
    try {
      return await api.upload(this.imagesUrl(albumId), formData, { raw: true });
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }

  async deleteImage(albumId, imageId) {
    await api.delete(this.imageUrl(albumId, imageId));
  }
}
