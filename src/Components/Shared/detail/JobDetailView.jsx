import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailScaffold from "./DetailScaffold";
import ImageGallery from "./ImageGallery";
import { InfoCard, FieldRow, MetaChip, Icons } from "./primitives";
import useViewerProfile from "./useViewerProfile";
import { API_BASE, getMediaUrl } from "./media";
import EngagementPanel from "../EngagementPanel";
import ConfirmModal from "../ConfirmModal";
import HeroActions from "./HeroActions";
import JobStatusTag from "../JobStatusTag";

/**
 * JobDetailView — standard view for a single job post (new page), all roles.
 * @param {string} basePath e.g. "/alumni"
 */
export default function JobDetailView({ basePath = "" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserId, canEditAny, canDeleteAny, canModerateComments } = useViewerProfile("jobs");
  const token = localStorage.getItem("Token");

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/jobs/${id}/`, { headers: { Authorization: `Token ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("Unable to load this job post.");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setJob(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const postOwnerId = job?.user?.id ?? job?.user ?? null;
  const isOwner = currentUserId != null && currentUserId === postOwnerId;
  const canEdit = canEditAny || isOwner;      // own job, or jobs.edit_any (also gates status change)
  const canDelete = canDeleteAny || isOwner;  // own job, or jobs.delete_any

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error();
      navigate(`${basePath}/jobs`);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const title = job?.role || job?.company_name || "Job";
  const images = job?.image_url ? [getMediaUrl(job.image_url)] : [];

  const meta = job
    ? [
        <JobStatusTag
          key="status"
          status={job.status}
          jobId={job.id}
          canManage={canEdit}
          size="lg"
          onChange={(next) => setJob((prev) => ({ ...prev, status: next }))}
        />,
        job.company_name && <MetaChip key="co" icon={Icons.building}>{job.company_name}</MetaChip>,
        job.location && <MetaChip key="loc" icon={Icons.pin}>{job.location}</MetaChip>,
        job.job_type && <MetaChip key="type" icon={Icons.briefcase}>{job.job_type}</MetaChip>,
      ].filter(Boolean)
    : [];

  const sidebar = job && (
    <>
      <InfoCard title="Job Details" icon={Icons.briefcase}>
        <FieldRow icon={Icons.building} label="Company">
          <span>{job.company_name || "—"}</span>
        </FieldRow>
        <FieldRow icon={Icons.tag} label="Role">
          <span>{job.role || "—"}</span>
        </FieldRow>
        <FieldRow icon={Icons.pin} label="Location">
          <span>{job.location || "—"}</span>
        </FieldRow>
        <FieldRow icon={Icons.briefcase} label="Job Type">
          <span>{job.job_type || "—"}</span>
        </FieldRow>
        {job.salary_range && (
          <FieldRow icon={Icons.chart} label="Salary">
            <span>{job.salary_range}</span>
          </FieldRow>
        )}
      </InfoCard>

      <InfoCard title="Posted by" icon={Icons.person}>
        <div className="text-sm font-medium text-gray-700">{job.user?.username || "—"}</div>
        {job.created_at && (
          <div className="text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</div>
        )}
      </InfoCard>
    </>
  );

  return (
    <>
      <DetailScaffold
        loading={loading}
        error={error}
        notFound={!loading && !error && !job}
        loadingLabel="Loading job post…"
        errorTitle="Error Loading Job"
        notFoundTitle="Job Not Found"
        backFallback={`${basePath}/jobs`}
        title={title}
        subtitle={job?.role && job?.company_name ? job.company_name : undefined}
        meta={meta}
        actions={canDelete && <HeroActions onDelete={() => setConfirmOpen(true)} />}
        sidebar={sidebar}
      >
        {images.length > 0 && <ImageGallery images={images} title={title} />}

        <InfoCard title="Job Description" icon={Icons.info}>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
            {job?.description || "No description provided."}
          </p>
        </InfoCard>

        <InfoCard bodyClassName="">
          <EngagementPanel
            contentType="jobs"
            contentId={id}
            postOwnerId={postOwnerId}
            canModerate={canModerateComments}
            currentUserId={currentUserId}
          />
        </InfoCard>
      </DetailScaffold>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete this job post?"
        message="This action cannot be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
