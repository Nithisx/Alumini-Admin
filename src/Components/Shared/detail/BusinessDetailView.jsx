import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DetailScaffold from "./DetailScaffold";
import ImageGallery from "./ImageGallery";
import { InfoCard, FieldRow, MetaChip, TagPills, Icons } from "./primitives";
import useViewerProfile from "./useViewerProfile";
import { useBusinessStore } from "../../../stores";
import { getMediaUrl } from "./media";
import CountUp from "../CountUp";
import EngagementPanel from "../EngagementPanel";
import ConfirmModal from "../ConfirmModal";
import HeroActions from "./HeroActions";

const normalizeUrl = (url) => (url?.startsWith("http") ? url : `https://${url}`);

/**
 * BusinessDetailView — standard read view for a single business, all roles.
 * @param {string} basePath e.g. "/alumni"
 */
export default function BusinessDetailView({ basePath = "" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserId, canEditAny, canDeleteAny, canModerateComments } = useViewerProfile("business");
  const businessStore = useBusinessStore();

  const [business, setBusiness] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([businessStore.fetchOne(id), businessStore.fetchImages(id)])
      .then(([biz, imgs]) => {
        if (cancelled) return;
        setBusiness(biz);
        setImages(imgs);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load this business.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, businessStore]);

  const postOwnerId = business?.owner ?? business?.owner_details?.id ?? null;
  const isOwner = currentUserId != null && currentUserId === postOwnerId;
  const canEdit = canEditAny || isOwner;      // own business, or business.edit_any
  const canDelete = canDeleteAny || isOwner;  // own business, or business.delete_any

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await businessStore.remove(id);
      navigate(`${basePath}/business`);
    } catch {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const galleryImages = images.map((img) => getMediaUrl(img.image));

  const location = business
    ? [business.city, business.state].filter(Boolean).join(", ")
    : "";

  const meta = business
    ? [
        business.category && <MetaChip key="cat" icon={Icons.tag}>{business.category}</MetaChip>,
        location && <MetaChip key="loc" icon={Icons.pin}>{location}</MetaChip>,
        business.year_founded && <MetaChip key="yr" icon={Icons.calendar}>Est. {business.year_founded}</MetaChip>,
      ].filter(Boolean)
    : [];

  const sidebar = business && (
    <>
      <InfoCard title="Contact" icon={Icons.phone}>
        {(business.address || location) && (
          <FieldRow icon={Icons.pin} label="Address">
            <span>{[business.address, location].filter(Boolean).join(", ") || "—"}</span>
          </FieldRow>
        )}
        {business.phone && (
          <FieldRow icon={Icons.phone} label="Phone">
            <a href={`tel:${business.phone}`} className="text-emerald-600 hover:underline">{business.phone}</a>
          </FieldRow>
        )}
        {business.email && (
          <FieldRow icon={Icons.email} label="Email">
            <a href={`mailto:${business.email}`} className="text-emerald-600 hover:underline break-all">{business.email}</a>
          </FieldRow>
        )}
        {business.website && (
          <FieldRow icon={Icons.globe} label="Website">
            <a href={normalizeUrl(business.website)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline break-all">
              {business.website}
            </a>
          </FieldRow>
        )}
      </InfoCard>

      {(business.year_founded || business.employee_count) && (
        <InfoCard title="Company" icon={Icons.building}>
          {business.year_founded && (
            <FieldRow icon={Icons.calendar} label="Year Founded">
              <CountUp value={String(business.year_founded)} />
            </FieldRow>
          )}
          {business.employee_count && (
            <FieldRow icon={Icons.users} label="Employees">
              <CountUp value={String(business.employee_count)} />
            </FieldRow>
          )}
        </InfoCard>
      )}
    </>
  );

  return (
    <>
      <DetailScaffold
        loading={loading}
        error={error}
        notFound={!loading && !error && !business}
        loadingLabel="Loading business details…"
        errorTitle="Error Loading Business"
        notFoundTitle="Business Not Found"
        backFallback={`${basePath}/business`}
        title={business?.business_name}
        subtitle={business?.category}
        meta={meta}
        actions={
          (canEdit || canDelete) && (
            <HeroActions
              onEdit={canEdit ? () => navigate(`${basePath}/business/edit/${id}`) : undefined}
              onDelete={canDelete ? () => setConfirmOpen(true) : undefined}
            />
          )
        }
        sidebar={sidebar}
      >
        <InfoCard>
          <div className="flex items-center gap-4">
            {business?.logo && (
              <img
                src={getMediaUrl(business.logo)}
                alt={business.business_name}
                className="w-20 h-20 rounded-xl object-cover border border-gray-100"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{business?.business_name}</h2>
              {business?.category && <p className="text-emerald-600 font-medium">{business.category}</p>}
            </div>
          </div>
          {business?.description && (
            <p className="mt-5 text-gray-600 whitespace-pre-line leading-relaxed">{business.description}</p>
          )}
          {business?.keywords?.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Keywords</p>
              <TagPills items={business.keywords} />
            </div>
          )}
        </InfoCard>

        {galleryImages.length > 0 && <ImageGallery images={galleryImages} title={business?.business_name} />}

        <InfoCard bodyClassName="">
          <EngagementPanel
            contentType="businesses"
            contentId={id}
            postOwnerId={postOwnerId}
            canModerate={canModerateComments}
            currentUserId={currentUserId}
          />
        </InfoCard>
      </DetailScaffold>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete this business?"
        message="This action cannot be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
