import { NavLink } from "react-router-dom";

export default function LibraryTabs() {
    const tabClass = ({ isActive }) =>
        `pb-2 font-medium ${
            isActive
                ? "border-b-2 border-accent text-accent"
                : "text-muted hover:text-ink"
        }`;

    return (
        <nav className="flex gap-6 border-b border-line">
            <NavLink to="/library" end className={tabClass}>
                My library
            </NavLink>
            <NavLink to="/library/lent" className={tabClass}>
                Lent
            </NavLink>
        </nav>
    );
}
