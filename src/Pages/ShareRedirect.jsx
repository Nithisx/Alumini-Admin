import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_SHARE_RESOLVE } from '../config/api';
import { normalizeRoleForBase } from '../lib/authRole';

function buildTargetPath(role, shareType, contentId) {
  const roleBase = normalizeRoleForBase(role);
  if (!roleBase || !shareType || !contentId) return null;

  switch (shareType) {
    case 'event':
      return `/${roleBase}/event/${contentId}`;
    case 'news':
      return `/${roleBase}/news/${contentId}`;
    case 'business':
      return `/${roleBase}/business/view/${contentId}`;
    case 'job':
      return `/${roleBase}/jobs`;
    default:
      return `/${roleBase}/dashboard`;
  }
}

function prettyDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function formatDateOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function formatTimeOnly(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function resolveEventDate(content) {
  const rawDate = firstText(content, ['event_date', 'date']);
  if (rawDate) return rawDate;
  return formatDateOnly(content?.from_date_time);
}

function resolveEventTime(content) {
  const rawTime = firstText(content, ['event_time', 'time']);
  if (rawTime) return rawTime;

  const start = formatTimeOnly(content?.from_date_time);
  const end = formatTimeOnly(content?.end_date_time);

  if (start === '-' && end === '-') return '-';
  if (start !== '-' && end !== '-') return `${start} - ${end}`;
  return start !== '-' ? start : end;
}

function firstText(content, keys) {
  for (const key of keys) {
    const value = content?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function firstValue(content, keys) {
  for (const key of keys) {
    const value = content?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '-';
}

function resolveMediaUrl(path, apiOrigin) {
  if (!path || typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${apiOrigin}${path}`;
  return `${apiOrigin}/${path}`;
}

function collectImageUrls(content, apiOrigin) {
  const urls = [];

  const mediaKeys = ['image', 'thumbnail', 'business_logo', 'profile_photo'];
  mediaKeys.forEach((key) => {
    const value = resolveMediaUrl(content?.[key], apiOrigin);
    if (value) urls.push(value);
  });

  if (Array.isArray(content?.images)) {
    content.images.forEach((item) => {
      const raw = item?.image || item?.url || item;
      const value = resolveMediaUrl(raw, apiOrigin);
      if (value) urls.push(value);
    });
  }

  return [...new Set(urls)];
}

function buildPreview(sharePayload) {
  const type = sharePayload?.type || '';
  const content = sharePayload?.content || {};
  const user = content?.user || content?.owner_details || {};

  const authorName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Alumni member';
  const sharedAt = prettyDate(sharePayload?.shared_at);
  const shareMessage = sharePayload?.message || '';

  if (type === 'job') {
    return {
      heading: 'Shared Job Opportunity',
      title: firstText(content, ['company_name', 'role']) || 'Job Post',
      subtitle: `Posted by ${authorName}`,
      description: firstText(content, ['description']),
      meta: [
        ['Role', firstValue(content, ['role'])],
        ['Location', firstValue(content, ['location'])],
        ['Salary', firstValue(content, ['salary_range'])],
        ['Type', firstValue(content, ['job_type'])],
        ['Posted On', prettyDate(content?.posted_on)],
        ['Shared At', sharedAt],
      ],
      shareMessage,
    };
  }

  if (type === 'event') {
    return {
      heading: 'Shared Event',
      title: firstText(content, ['title', 'name']) || 'Event Post',
      subtitle: `Posted by ${authorName}`,
      description: firstText(content, ['description', 'content']),
      meta: [
        ['Date', resolveEventDate(content)],
        ['Time', resolveEventTime(content)],
        ['Venue', firstValue(content, ['venue', 'location'])],
        ['Shared At', sharedAt],
      ],
      shareMessage,
    };
  }

  if (type === 'business') {
    const locationParts = [content?.address, content?.city, content?.state, content?.country]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter(Boolean);

    const location = locationParts.length > 0
      ? locationParts.join(', ')
      : firstValue(content, ['location', 'address']);

    return {
      heading: 'Shared Business',
      title: firstText(content, ['business_name', 'company_name']) || 'Business Post',
      subtitle: `Posted by ${authorName}`,
      description: firstText(content, ['description', 'about']),
      meta: [
        ['Category', firstValue(content, ['category', 'business_type'])],
        ['Location', location],
        ['Contact', firstValue(content, ['phone', 'phone_number', 'contact_number'])],
        ['Email', firstValue(content, ['email'])],
        ['Website', firstValue(content, ['website'])],
        ['Founded', firstValue(content, ['year_founded'])],
        ['Shared At', sharedAt],
      ],
      shareMessage,
    };
  }

  if (type === 'news') {
    return {
      heading: 'Shared News',
      title: firstText(content, ['title', 'headline']) || 'News Post',
      subtitle: `Posted by ${authorName}`,
      description: firstText(content, ['description', 'content', 'body']),
      meta: [
        ['Category', firstValue(content, ['category'])],
        ['Published', prettyDate(content?.published_on || content?.created_at || content?.posted_on)],
        ['Updated', prettyDate(content?.updated_on || content?.updated_at)],
        ['Shared At', sharedAt],
      ],
      shareMessage,
    };
  }

  return {
    heading: 'Shared Post',
    title: firstText(content, ['title', 'headline']) || 'News Post',
    subtitle: `Posted by ${authorName}`,
    description: firstText(content, ['description', 'content', 'body']),
    meta: [
      ['Published', prettyDate(content?.created_at || content?.posted_on)],
      ['Shared At', sharedAt],
    ],
    shareMessage,
  };
}

export default function ShareRedirect() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [status, setStatus] = useState('Resolving shared link...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharePayload, setSharePayload] = useState(null);

  const storedToken = useMemo(() => localStorage.getItem('Token'), []);
  const storedRole = useMemo(() => localStorage.getItem('Role'), []);
  const apiOrigin = useMemo(() => {
    try {
      return new URL(API_SHARE_RESOLVE(token || '00000000-0000-0000-0000-000000000000')).origin;
    } catch {
      return window.location.origin;
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const resolveAndRedirect = async () => {
      if (!token) {
        setError('Invalid share link.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(API_SHARE_RESOLVE(token));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.detail || 'Unable to open this shared link.');
        }

        if (!cancelled) {
          setSharePayload(data);
        }

        const contentId = data?.content?.id;
        const shareType = data?.type;
        const targetPath = buildTargetPath(storedRole, shareType, contentId);

        if (!storedToken || !targetPath) {
          if (!cancelled) {
            setStatus('Showing shared content...');
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setStatus('Opening shared content...');
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to open this shared link.');
          setLoading(false);
        }
      }
    };

    resolveAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [navigate, storedRole, storedToken, token]);

  const preview = useMemo(() => buildPreview(sharePayload), [sharePayload]);
  const images = useMemo(() => collectImageUrls(sharePayload?.content || {}, apiOrigin), [apiOrigin, sharePayload]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-semibold text-emerald-800 mb-2">Karpagam Alumni</h1>
        {error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => navigate('/home', { replace: true })}
            >
              Go to Home
            </button>
          </>
        ) : loading ? (
          <p className="text-gray-700">{status}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">{preview.heading}</p>
            <h2 className="text-xl font-bold text-gray-900">{preview.title}</h2>
            <p className="text-sm text-gray-600">{preview.subtitle}</p>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {images.slice(0, 4).map((src, idx) => (
                  <img
                    key={`${src}-${idx}`}
                    src={src}
                    alt="Shared content"
                    className="w-full h-44 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}

            {preview.description ? (
              <p className="text-gray-800 leading-relaxed">{preview.description}</p>
            ) : (
              <p className="text-gray-500">No additional description provided.</p>
            )}

            {preview.shareMessage ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Shared Message</p>
                <p className="text-sm text-emerald-900">{preview.shareMessage}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {preview.meta.map(([label, value]) => (
                <div key={label} className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                  <p className="text-[11px] uppercase text-gray-500">{label}</p>
                  <p className="text-gray-800 font-medium">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {!storedToken && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => navigate('/login', {
                    state: { from: { pathname: `/share/${token}` } },
                  })}
                >
                  Login to Interact
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                onClick={() => navigate('/home', { replace: true })}
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
