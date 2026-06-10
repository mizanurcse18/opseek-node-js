import { useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { handleApiError } from '@/lib/error-handler';
import { visitPlanService } from '../api/visit-plans.api';
import { Navigation, X } from 'lucide-react';
import { useState } from 'react';

interface VisitPlanSubmitModalProps {
  detail: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitPlanSubmitModal({ detail, onClose, onSuccess }: VisitPlanSubmitModalProps) {
  const [comments, setComments] = useState('');
  const [actualLat, setActualLat] = useState(detail.planned_latitude ?? '');
  const [actualLng, setActualLng] = useState(detail.planned_longitude ?? '');
  const [checkInTime, setCheckInTime] = useState(new Date().toISOString().slice(0, 16));
  const [checkOutTime, setCheckOutTime] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const { toast, ToastComponent } = useToast();

  const handleSubmit = async () => {
    if (!actualLat || !actualLng) {
      toast({ title: 'Validation Error', description: 'GPS coordinates are required.', status: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        detail_id: detail.detail_id,
        comments: comments || undefined,
        actual_latitude: Number(actualLat),
        actual_longitude: Number(actualLng),
        check_in_time: checkInTime || undefined,
        check_out_time: checkOutTime || undefined,
        images: imageUrls.filter(Boolean).map(url => ({ image_path: url, image_type: 'photo' })),
      };

      const response = await visitPlanService.submitVisit(payload);
      if (response && (response.status_code === 200 || response.response_code === 'SUCCESS' || response.response_code === 'SUBMIT_SUCCESS')) {
        toast({ title: 'Success', description: 'Visit submitted successfully.', status: 'success' });
        onSuccess();
        onClose();
      } else {
        toast(handleApiError(response));
      }
    } catch (error) {
      toast(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const addImageField = () => setImageUrls(prev => [...prev, '']);
  const updateImageUrl = (index: number, val: string) => {
    setImageUrls(prev => prev.map((u, i) => i === index ? val : u));
  };
  const removeImageUrl = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <Button onClick={onClose} variant="ghost" className="h-9 px-4 text-xs font-medium">Cancel</Button>
      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="h-9 px-5 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest"
      >
        {loading ? 'Submitting...' : <><Navigation className="h-3.5 w-3.5" /> Submit Visit</>}
      </Button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        maxWidth="lg"
        title="Submit Visit"
        footer={footer}
        headerAction={
          <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded uppercase tracking-[0.15em]">
            DSR Report
          </span>
        }
      >
        <div className="space-y-4">
          {/* Visit info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Navigation className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-main">
                {detail.location_name || `Stop #${detail.visit_order}`}
              </p>
              <p className="text-[10px] text-text-muted">
                {detail.visit_date ? new Date(detail.visit_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                {detail.dsr_user_id ? ` — DSR #${detail.dsr_user_id}` : ''}
              </p>
            </div>
          </div>

          {/* GPS */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-1.5 block">
              GPS Coordinates <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number" step="any"
                  value={actualLat}
                  onChange={(e) => setActualLat(e.target.value)}
                  placeholder="Latitude"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number" step="any"
                  value={actualLng}
                  onChange={(e) => setActualLng(e.target.value)}
                  placeholder="Longitude"
                  className="h-10 text-sm font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => { setActualLat(pos.coords.latitude); setActualLng(pos.coords.longitude); },
                      () => toast({ title: 'Error', description: 'Could not get current location.', status: 'error' })
                    );
                  }
                }}
                className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary-50 hover:border-primary-200 transition-colors"
                title="Get current location"
              >
                <Navigation className="h-4 w-4 text-primary-600" />
              </button>
            </div>
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-1.5 block">Check-in Time</label>
              <Input
                type="datetime-local"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="h-10 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-1.5 block">Check-out Time</label>
              <Input
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="h-10 text-xs font-medium"
              />
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50 mb-1.5 block">Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Visit notes, observations..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-300 transition-all resize-none"
            />
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted/50">Photos</label>
              <button onClick={addImageField} className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700">
                + Add Photo
              </button>
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={url}
                    onChange={(e) => updateImageUrl(i, e.target.value)}
                    placeholder="Image URL or path"
                    className="h-9 text-xs font-medium flex-1"
                  />
                  {imageUrls.length > 1 && (
                    <button onClick={() => removeImageUrl(i)} className="h-9 w-9 flex items-center justify-center text-red-400 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
      <ToastComponent />
    </>
  );
}
