import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailScaffold from "./DetailScaffold";
import ImageGallery from "./ImageGallery";
import { InfoCard, FieldRow, MetaChip, Icons } from "./primitives";
import useViewerProfile from "./useViewerProfile";
import { useEventsStore } from "../../../stores";
import { getMediaUrl } from "./media";
import EngagementPanel from "../EngagementPanel";
import { DocumentList } from "../DocumentPreview";
import ConfirmModal from "../ConfirmModal";
import HeroActions from "./HeroActions";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getGoogleCalendarUrl = (event) => {
  const start = new Date(event?.from_date_time);
  if (Number.isNaN(start.getTime())) return null;
  const endCandidate = event?.end_date_time ? new Date(event.end_date_time) : null;
  const end = endCandidate && !Number.isNaN(endCandidate.getTime()) ? endCandidate : start;
  const toGoogle = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event?.title || "Alumni Event",
    dates: `${toGoogle(start)}/${toGoogle(end)}`,
    details: event?.description || "",
    location: event?.venue || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * EventDetailView — standard view for a single event, used by all roles.
 * @param {string} basePath e.g. "/alumni"
 */
export default function EventDetailView({ basePath = "" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserId, canEditAny, canDeleteAny, canModerateComments } = useViewerProfile("events");
  const eventsStore = useEventsStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    eventsStore.fetchOne(id)
      .then((data) => { if (!cancelled) setEvent(data); })
      .catch(() => { if (!cancelled) setError("Unable to load this event."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, eventsStore]);

  const postOwnerId = event?.user ?? null;
  const isOwner = currentUserId != null && currentUserId === postOwnerId;
  const canEdit = canEditAny || isOwner;      // own event, or events.edit_any
  const canDelete = canDeleteAny || isOwner;  // own event, or events.delete_any

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await eventsStore.remove(id);
      navigate(`${basePath}/event`);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const images = (event?.images || []).map((img) => getMediaUrl(img.image));

  const meta = event
    ? [
        <MetaChip key="date" icon={Icons.calendar}>{formatDate(event.from_date_time)}</MetaChip>,
        event.venue && <MetaChip key="venue" icon={Icons.pin}>{event.venue}</MetaChip>,
      ].filter(Boolean)
    : [];

  const calendarUrl = event ? getGoogleCalendarUrl(event) : null;

  const sidebar = event && (
    <>
      <InfoCard title="Date & Time" icon={Icons.clock}>
        <div className="space-y-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">From</div>
            <div className="text-sm text-gray-700">{formatDate(event.from_date_time)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">To</div>
            <div className="text-sm text-gray-700">{formatDate(event.end_date_time)}</div>
          </div>
        </div>
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            Add to Google Calendar
          </a>
        )}
      </InfoCard>

      <InfoCard title="Location" icon={Icons.pin}>
        <p className="text-sm text-gray-700">{event.venue || "—"}</p>
      </InfoCard>

      {event.tag && (
        <InfoCard title="Category" icon={Icons.tag}>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-100 text-emerald-700">
            {event.tag}
          </span>
        </InfoCard>
      )}

      <InfoCard title="Posted by" icon={Icons.person}>
        <div className="text-sm font-medium text-gray-700">{event.uploaded_by || "—"}</div>
        {event.uploaded_on && (
          <div className="text-xs text-gray-500">{new Date(event.uploaded_on).toLocaleDateString()}</div>
        )}
      </InfoCard>
    </>
  );

  return (
    <>
      <DetailScaffold
        loading={loading}
        error={error}
        notFound={!loading && !error && !event}
        loadingLabel="Loading event details…"
        errorTitle="Error Loading Event"
        notFoundTitle="No Event Found"
        backFallback={`${basePath}/event`}
        title={event?.title}
        meta={meta}
        actions={
          (canEdit || canDelete) && (
            <HeroActions
              onEdit={canEdit ? () => navigate(`${basePath}/event/${id}/edit`) : undefined}
              onDelete={canDelete ? () => setConfirmOpen(true) : undefined}
            />
          )
        }
        sidebar={sidebar}
      >
        {images.length > 0 && <ImageGallery images={images} title={event?.title} />}

        <InfoCard title="About This Event" icon={Icons.info}>
          <p className="text-gray-600 whitespace-pre-line leading-relaxed">{event?.description}</p>
          {event?.documents?.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <DocumentList documents={event.documents} title="Documents" />
            </div>
          )}
        </InfoCard>

        <InfoCard bodyClassName="">
          <EngagementPanel
            contentType="events"
            contentId={id}
            postOwnerId={postOwnerId}
            canModerate={canModerateComments}
            currentUserId={currentUserId}
          />
        </InfoCard>
      </DetailScaffold>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete this event?"
        message="This action cannot be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
