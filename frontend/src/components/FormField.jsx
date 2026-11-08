export default function FormField({ label, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        {...inputProps}
        className="mt-1 w-full rounded-md border border-line-strong px-3 py-2 focus:border-accent focus:outline-none"
      />
    </label>
  )
}
