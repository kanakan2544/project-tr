import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <main className="relative bg-void-glow flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-8">
      <div className="tex-grid opacity-50" />

      <div className="relative z-10 text-center">
        <h1 className="font-impact text-[64px] leading-none uppercase tracking-tight text-text-primary md:text-[80px]"
          style={{ textShadow: "0 0 20px rgba(244,201,93,0.5)" }}>
          TCG
        </h1>
        <h1 className="font-impact text-[64px] leading-none uppercase tracking-tight text-neon md:text-[80px]"
          style={{ textShadow: "0 0 30px rgba(244,201,93,0.8)" }}>
          ONLINE
        </h1>
      </div>

      <form
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/" })
        }}
        className="relative z-10"
      >
        <button
          type="submit"
          className="rounded-sm border-[2px] border-neon bg-neon/20 px-6 py-3 font-impact text-base uppercase tracking-tight text-neon shadow-glow-neon transition-all hover:shadow-none"
        >
          Sign in with Google
        </button>
      </form>
    </main>
  )
}
