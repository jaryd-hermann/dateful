export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full bg-[var(--color-bg)] flex justify-center">
      <main className="w-full max-w-[28rem] min-h-screen px-6">
        {children}
      </main>
    </div>
  )
}
