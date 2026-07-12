/**
 * EventsStore — events (domain codenames: events.*).
 */
import ContentStore from "../base/ContentStore";
import { API_EVENTS, API_EVENT_DETAIL } from "../../config/api";

export default class EventsStore extends ContentStore {
  constructor(root) {
    super(root, {
      list: () => API_EVENTS,
      detail: (id) => API_EVENT_DETAIL(id),
      ownerOf: (item) => item?.user?.id ?? item?.user ?? null,
    });
  }
}
