import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_SHARE_RESOLVE } from '../config/api';

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'student') return 'alumni';
  if (value === 'admin' || value === 'staff' || value === 'alumni') return value;
  return null;
}

function buildTargetPath(role, shareType, contentId) {
  const roleBase = normalizeRole(role);
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

export default function ShareRedirect() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [status, setStatus] = useState('Resolving shared link...');
  const [error, setError] = useState('');

  const storedToken = useMemo(() => localStorage.getItem('Token'), []);
  const storedRole = useMemo(() => localStorage.getItem('Role'), []);

  useEffect(() => {
    let cancelled = false;

    const resolveAndRedirect = async () => {
      if (!token) {
        setError('Invalid share link.');
        return;
      }

      try {
        const res = await fetch(API_SHARE_RESOLVE(token));
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.detail || 'Unable to open this shared link.');
        }

        const contentId = data?.content?.id;
        const shareType = data?.type;
        const targetPath = buildTargetPath(storedRole, shareType, contentId);

        if (!targetPath) {
          if (!cancelled) {
            setStatus('Please login to continue...');
            navigate('/login', {
              replace: true,
              state: {
                from: { pathname: '/alumni/dashboard' },
              },
            });
          }
          return;
        }

        if (!storedToken) {
          if (!cancelled) {
            setStatus('Please login to open this shared content...');
            navigate('/login', {
              replace: true,
              state: {
                from: { pathname: targetPath },
              },
            });
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
        }
      }
    };

    resolveAndRedirect();

    return () => {
      cancelled = true;
    };
  }, [navigate, storedRole, storedToken, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-6 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-emerald-800 mb-2">Shared Link</h1>
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
        ) : (
          <p className="text-gray-700">{status}</p>
        )}
      </div>
    </div>
  );
}
