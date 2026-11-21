/** Mock phone status bar from Figma; only in the desktop phone frame (real phones draw their own). */
export default function StatusBar() {
  return (
    <div aria-hidden="true" className="hidden shrink-0 items-start justify-between px-4 pt-3 sm:flex" dir="ltr">
      <span className="text-body font-semibold">9:41</span>
      <span className="text-xs text-muted-foreground">Chrome</span>
    </div>
  )
}
