import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Star, Eye, EyeOff, Check, X } from 'lucide-react';
import { api, apiMessage } from '../../lib/api';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { formatDate } from '../../lib/utils';

export default function AdminReviews() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews'],
    queryFn: async () => (await api.get('/reviews/staff/all')).data.reviews,
  });

  const moderate = async (r, patch) => {
    try {
      await api.patch(`/reviews/staff/${r._id}`, patch);
      toast.success('Review updated');
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      qc.invalidateQueries({ queryKey: ['reviews', 'public'] });
    } catch (e) {
      toast.error(apiMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Reviews & feedback" description="Only genuine feedback from delivered orders appears here. Publishing requires the student's consent." />

      {isLoading ? <SkeletonRows count={4} /> : data?.length ? (
        <div className="space-y-3">
          {data.map((r) => (
            <Card key={r._id}>
              <CardHeader
                title={`${r.student?.name} · ${r.order?.reference}`}
                description={`Submitted ${formatDate(r.createdAt)} · consent to publish: ${r.consentToPublish ? 'yes' : 'no'}`}
                icon={Star}
                action={<div className="flex gap-1.5">
                  <Badge tone={r.moderationStatus === 'approved' ? 'success' : r.moderationStatus === 'rejected' ? 'danger' : 'warn'}>{r.moderationStatus}</Badge>
                  <Badge tone={r.isPublished ? 'forest' : 'neutral'}>{r.isPublished ? 'Published' : 'Hidden'}</Badge>
                </div>}
              />
              <div className="space-y-2 p-5">
                <p className="text-amber" aria-label={`${r.rating} of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                {r.feedback && <p className="text-[13px] leading-relaxed text-ink">{r.feedback}</p>}
                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button size="sm" variant="soft" onClick={() => moderate(r, { moderationStatus: 'approved' })} icon={Check}>Approve</Button>
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-red-50" onClick={() => moderate(r, { moderationStatus: 'rejected', isPublished: false })} icon={X}>Reject</Button>
                  <Button size="sm" variant="secondary" disabled={!r.consentToPublish} onClick={() => moderate(r, { isPublished: !r.isPublished })} icon={r.isPublished ? EyeOff : Eye}>{r.isPublished ? 'Unpublish' : 'Publish'}</Button>
                  {!r.consentToPublish && <span className="self-center text-[11px] text-muted">Student did not consent to publication.</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState icon={Star} title="No reviews yet" description="Students can leave feedback once an order has been delivered." />}
    </div>
  );
}
