'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type DuplicateStudent = {
  id: string;
  firstName: string;
  lastName: string | null;
  aadharNumber: string;
  gender: string;
  schoolName: string | null;
};

type DuplicateWarningDialogProps = {
  open: boolean;
  duplicates: DuplicateStudent[];
  onCancel: () => void;
  onProceed: () => void;
};

export function DuplicateWarningDialog({
  open,
  duplicates,
  onCancel,
  onProceed,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-amber-600'>
            ⚠️ Potential Duplicate Students Found
          </DialogTitle>
          <DialogDescription>
            The student you are trying to save may already exist. Please review
            the matches below before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-64 overflow-y-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-left'>
                <th className='pb-2 pr-3'>Name</th>
                <th className='pb-2 pr-3'>Aadhar</th>
                <th className='pb-2 pr-3'>Gender</th>
                <th className='pb-2'>School</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((dup) => (
                <tr key={dup.id} className='border-b'>
                  <td className='py-2 pr-3'>
                    {dup.firstName}
                    {dup.lastName ? ` ${dup.lastName}` : ''}
                  </td>
                  <td className='py-2 pr-3 font-mono text-xs'>
                    {dup.aadharNumber}
                  </td>
                  <td className='py-2 pr-3'>{dup.gender}</td>
                  <td className='py-2'>{dup.schoolName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={onCancel}>
            Go Back
          </Button>
          <Button variant='destructive' onClick={onProceed}>
            Save Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
