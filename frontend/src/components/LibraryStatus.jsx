import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiGet } from "../api.js";
import { useAuth } from "../auth/AuthContext.js";
import AddToLibraryForm from "./AddToLibraryForm.jsx";
import Modal from "./Modal.jsx";

// Gumb "I own this" ali oznaka, da je knjiga ze v knjiznici
export default function LibraryStatus({ book }) {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [owned, setOwned] = useState({ key: null, value: false });
    const [reloadCount, setReloadCount] = useState(0);
    const [addOpen, setAddOpen] = useState(false);

    // Podatek velja za dolocenega uporabnika, knjigo in osvezitev
    const key = profile ? `${profile.id}-${book.id}-${reloadCount}` : null;

    useEffect(() => {
        if (!key) return;
        let ignore = false;
        apiGet(`/library?work_id=${book.id}`)
            .then(
                (items) =>
                    !ignore && setOwned({ key, value: items.length > 0 }),
            )
            .catch(() => !ignore && setOwned({ key, value: false }));
        return () => {
            ignore = true;
        };
    }, [key, book.id]);

    function openAdd() {
        if (!profile) {
            navigate("/login", { state: { from: location } });
            return;
        }
        setAddOpen(true);
    }

    if (profile && owned.key !== key) {
        return <div className="h-10" />;
    }

    if (profile && owned.value) {
        return (
            <p className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-accent-soft px-4 py-2 font-medium text-accent-dark">
                    In your library
                </span>
                <Link to="/library" className="text-sm text-accent underline">
                    Go to My library
                </Link>
            </p>
        );
    }

    return (
        <>
            <button
                type="button"
                onClick={openAdd}
                className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark">
                I own this
            </button>
            <Modal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Add to library">
                <AddToLibraryForm
                    book={book}
                    onAdded={() => {
                        setAddOpen(false);
                        setReloadCount((n) => n + 1);
                    }}
                />
            </Modal>
        </>
    );
}
