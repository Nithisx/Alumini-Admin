/**
 * apiClient — the single HTTP seam for the whole app.
 *
 * Every store talks to the backend through this; no component or store builds
 * its own fetch/axios call, auth header, or CSRF header. Auth (httpOnly cookie
 * + CSRF + legacy Authorization header) is already handled centrally by
 * lib/axiosInstance.js, so this layer only adds: envelope unwrapping (the
 * backend's `{ success, data }` shape vs. bare bodies), consistent error
 * normalization, and FormData handling.
 *
 * Usage from a store:
 *   const rooms = await api.get(endpoints.chat.rooms());
 *   await api.post(endpoints.events.create(), payload);
 *   await api.upload(endpoints.chat.upload(), formData);
 */
import axios from "../lib/axiosInstance";

/** Unwrap the backend envelope: `{ success, data }` → data; bare body → body. */
function unwrap(body) {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
}

/** Normalize any axios error into a plain Error with the server message. */
export class ApiError extends Error {
  constructor(message, { status, code, details, cause } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.cause = cause;
  }
}

function toApiError(err) {
  const res = err?.response;
  const data = res?.data;
  const message =
    data?.message ||
    data?.error ||
    data?.detail ||
    err?.message ||
    "Request failed";
  return new ApiError(message, {
    status: res?.status,
    code: data?.code,
    details: data?.details ?? data,
    cause: err,
  });
}

async function request(method, url, { data, params, headers, signal, raw } = {}) {
  try {
    const res = await axios.request({ method, url, data, params, headers, signal });
    return raw ? res.data : unwrap(res.data);
  } catch (err) {
    throw toApiError(err);
  }
}

export const api = {
  get:    (url, opts) => request("get", url, opts),
  post:   (url, data, opts) => request("post", url, { ...opts, data }),
  put:    (url, data, opts) => request("put", url, { ...opts, data }),
  patch:  (url, data, opts) => request("patch", url, { ...opts, data }),
  delete: (url, data, opts) => request("delete", url, { ...opts, data }),

  /** Multipart upload — pass a FormData; the browser sets the boundary header. */
  upload: (url, formData, opts) =>
    request("post", url, { ...opts, data: formData }),

  /** Escape hatch for the rare caller that needs the full axios response. */
  raw: (method, url, opts) => request(method, url, { ...opts, raw: true }),
};

export default api;
