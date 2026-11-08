import { useEffect, useRef } from "react";

// Pojavno okno (pop-up)
export default function Modal({ open, onClose, title, children }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={(event) => event.target === dialogRef.current && onClose()}
            className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-paper p-0 text-ink shadow-xl backdrop:bg-black/40">
            <div className="max-h-[85vh] overflow-y-auto p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-2xl leading-none text-muted hover:text-ink">
                        ×
                    </button>
                </div>
                {open && children}
            </div>
        </dialog>
    );
}
