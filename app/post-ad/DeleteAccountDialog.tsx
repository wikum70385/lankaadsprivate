"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DeleteAccountDialogProps {
  onConfirm: () => Promise<void>;
}

export default function DeleteAccountDialog({ onConfirm }: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        className="w-full mt-4"
        onClick={() => setOpen(true)}
      >
        Delete My Account
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Confirm Account Deletion</h2>
            <p className="mb-4 text-gray-700">
              Your account and personal data will be <span className="font-bold">permanently deleted</span>.<br />
              Ads you posted that are still within their locked period will remain until they expire automatically.<br />
              Are you sure you want to proceed?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => setOpen(false)}
              >
                No
              </Button>
              <Button
                variant="destructive"
                disabled={loading}
                onClick={handleDelete}
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
