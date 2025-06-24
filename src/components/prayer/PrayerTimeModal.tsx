'use client';

import { usePrayerTime } from '@/contexts/prayer-time-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function PrayerTimeModal() {
  const { user } = useAuth();
  const {
    promptedMissedPrayer,
    handlePrayerConfirmation,
    handlePrayerPostponement,
  } = usePrayerTime();

  if (!user || !promptedMissedPrayer) return null; // Only show for logged-in users and when a prayer is prompted

  const onConfirm = () => {
    if (promptedMissedPrayer) {
      handlePrayerConfirmation(promptedMissedPrayer);
    }
  };

  const onPostpone = () => {
    if (promptedMissedPrayer) {
      handlePrayerPostponement(promptedMissedPrayer);
    }
  };

  return (
    <Dialog open={!!promptedMissedPrayer}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-bold">
            هل صليت {promptedMissedPrayer}؟
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            تذكير لطيف بالصلاة التي فات وقتها للتو.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="lg" onClick={onPostpone}>
            <Clock className="mr-2 h-5 w-5" />
            ليس بعد
          </Button>
          <Button size="lg" onClick={onConfirm} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-5 w-5" />
            نعم، صليت
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
