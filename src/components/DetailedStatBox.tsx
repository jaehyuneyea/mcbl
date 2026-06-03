// components/Modal.tsx
import type { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function DetailedStatBox({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0
        bg-black bg-opacity-50
        flex items-center justify-center
        z-50
      "
      onClick={onClose} // close when backdrop is clicked
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-600 font-medium rounded hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
