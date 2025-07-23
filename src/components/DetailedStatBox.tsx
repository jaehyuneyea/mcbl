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
        className="
          bg-white rounded-lg shadow-xl
          w-full p-6
        "
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        {children}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}
