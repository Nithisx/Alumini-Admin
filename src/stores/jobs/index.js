/**
 * JobsStore — the feed. NOTE: "posts" in the UI are the JOBS domain on the
 * backend (codenames jobs.view/create/edit_any/delete_any/moderate_comments) —
 * a naming mismatch that has bitten this codebase before, hence this note.
 */
import { runInAction } from "mobx";
import ContentStore from "../base/ContentStore";
import api from "../../services/apiClient";
import { API_JOBS, API_JOB_DETAIL } from "../../config/api";

/** The jobs list has shipped in three shapes over time; accept all of them. */
const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.jobs)) return payload.jobs;
  return [];
};

/** Create sometimes echoes the job bare, sometimes wrapped. */
const normalizeCreated = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload.job || payload.data || payload.result || payload;
};

export default class JobsStore extends ContentStore {
  constructor(root) {
    super(root, {
      list: () => API_JOBS,
      detail: (id) => API_JOB_DETAIL(id),
      ownerOf: (item) => item?.user?.id ?? item?.user ?? null,
    });
  }

  async fetchAll(params) {
    this.loading = true;
    this.error = null;
    try {
      const data = await api.get(API_JOBS, { params, raw: true });
      const items = normalizeList(data);
      runInAction(() => { this.items = items; });
      return items;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      return [];
    } finally {
      runInAction(() => { this.loading = false; });
    }
  }

  /** `payload` is a FormData — the image and documents ride along with the job. */
  async create(payload) {
    this.saving = true;
    try {
      const created = normalizeCreated(await api.upload(API_JOBS, payload, { raw: true }));
      if (created) {
        runInAction(() => { this.items = [created, ...this.items]; });
      } else {
        // The server didn't echo the job back — resync rather than guess.
        await this.fetchAll();
      }
      return created;
    } catch (err) {
      runInAction(() => { this.error = err.message; });
      throw err;
    } finally {
      runInAction(() => { this.saving = false; });
    }
  }

  /**
   * Change a job's status (open/closed) — gated by jobs.edit_any or ownership.
   * PUT + multipart is what the endpoint has always been given from the UI;
   * kept as-is rather than "tidied" to JSON PATCH against a live backend.
   */
  async setStatus(id, status) {
    const body = new FormData();
    body.append("status", status);
    const updated = await api.raw("put", API_JOB_DETAIL(id), { data: body });
    runInAction(() => {
      this.items = this.items.map((i) =>
        String(i.id) === String(id) ? { ...i, status: updated?.status ?? status } : i
      );
    });
    return updated;
  }
}
