// Naslovnica knjige; ce je ni, prikaze siv nadomestek z naslovom
export default function BookCover({ url, title, className = 'h-24 w-16' }) {
  if (url) {
    return (
      <img
        src={url}
        alt={`Cover of ${title}`}
        loading="lazy"
        className={`${className} shrink-0 rounded object-cover shadow-sm`}
      />
    )
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded bg-line p-1 text-center text-[10px] leading-tight text-muted`}
    >
      {title}
    </div>
  )
}
