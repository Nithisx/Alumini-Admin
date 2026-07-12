/**
 * JobsStore — the feed. NOTE: "posts" in the UI are the JOBS domain on the
 * backend (codenames jobs.view/create/edit_any/delete_any/moderate_comments) —
 * a naming mismatch that has bitten this codebase before, hence this note.
 */
import ContentStore from "../base/ContentStore";
import api from "../../services/apiClient";
import { API_JOBS, API_JOB_DETAIL } from "../../config/api";

export default class JobsStore extends ContentStore {
  constructor(root) {
    super(root, {
      list: () => API_JOBS,
      detail: (id) => API_JOB_DETAIL(id),
      ownerOf: (item) => item?.user?.id ?? item?.user ?? null,
    });
  }

  /** Change a job's status (open/closed/…) — gated by jobs.edit_any or ownership. */
  async setStatus(id, status) {
    const updated = await api.patch(API_JOB_DETAIL(id), { status }, { raw: true });
    this.items = this.items.map((i) =>
      String(i.id) === String(id) ? { ...i, status: updated?.status ?? status } : i
    );
    return updated;
  }
}
