export default function FormField({ label, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        {...inputProps}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-amber-600 focus:outline-none"
      />
    </label>
  )
}
