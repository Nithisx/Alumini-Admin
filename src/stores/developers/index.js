/**
 * DevelopersStore — the developer showcase and its endorsements.
 * Editing a developer's role is gated by developer.moderate (backend-enforced).
 */
import { makeAutoObservable, runInAction } from "mobx";
import api from "../../services/apiClient";
import {
  API_DEVELOPER_SHOWCASE,
  API_ENDORSEMENTS,
  API_ENDORSEMENT_USER,
  API_ENDORSEMENT_DELETE,
  API_ADMIN_USER_UPDATE,
} from "../../config/api";

export default class DevelopersStore {
  developers = [];
  loading = false;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false });
  }

  async fetchShowcase(ids = []) {
    this.loading = true;
    try {
      const params = ids.length ? { ids: ids.join(",") } : undefined;
      const data = await api.get(API_DEVELOPER_SHOWCASE, { params, raw: true });
      const list = data?.developers || [];
      runInAction(() => { this.developers = list; });
      return list;
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** → the endorsement list for one developer (never throws; a card with no
   *  endorsements should still render). */
  async fetchEndorsements(userId) {
    try {
      const res = await api.get(API_ENDORSEMENT_USER(userId), { raw: true });
      return res?.success ? res.data || [] : [];
    } catch {
      return [];
    }
  }

  addEndorsement(recipientId, rating, content) {
    return api.post(
      API_ENDORSEMENTS,
      { recipient_id: recipientId, rating, content },
      { raw: true }
    );
  }

  deleteEndorsement(id) {
    return api.delete(API_ENDORSEMENT_DELETE(id), undefined, { raw: true });
  }

  /** Set a developer's displayed role — needs developer.moderate. */
  async setRole(userId, developerRole) {
    const res = await api.raw("patch", API_ADMIN_USER_UPDATE(userId), {
      data: { developer_role: developerRole },
    });
    const updated = res?.user;
    if (updated) {
      runInAction(() => {
        this.developers = this.developers.map((d) => (d.id === userId ? updated : d));
      });
    }
    return updated;
  }
}
