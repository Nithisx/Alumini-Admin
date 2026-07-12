/**
 * NewsStore — news articles (domain codenames: news.*).
 * All fetching/creating/updating/deleting lives here; News.jsx only renders.
 */
import ContentStore from "../base/ContentStore";
import { API_NEWS, API_NEWS_DETAIL } from "../../config/api";

export default class NewsStore extends ContentStore {
  constructor(root) {
    super(root, {
      list: () => API_NEWS,
      detail: (id) => API_NEWS_DETAIL(id),
      // News serialises its author as a nested object on some endpoints and a
      // bare id on others — accept both rather than silently failing the check.
      ownerOf: (item) => item?.user?.id ?? item?.user ?? null,
    });
  }
}
