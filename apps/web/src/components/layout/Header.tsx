export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="/" className="text-2xl font-serif tracking-wide">
          Gabriel & Ana
        </a>

        <nav className="hidden gap-6 md:flex text-sm text-zinc-700">
          <a href="/">Home</a>
          <a href="/rsvp">RSVP</a>
          <a href="/presentes">Presentes</a>
        </nav>
      </div>
    </header>
  );
}