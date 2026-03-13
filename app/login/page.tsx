"use client";

export default function LoginPage() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-lime-100 via-yellow-50 to-emerald-100" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-300/30 blur-3xl" />

      <div className="relative w-full max-w-2xl rounded-2xl border border-lime-200 bg-white/90 p-10 shadow-sm text-center backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-lime-900">Selamat Datang</h1>
        <p className="mt-4 text-lg font-medium text-lime-900/90">
          Simulasi Model Kebijakan Pertanian Tanaman Pangan
        </p>
        <p className="mt-1 text-lg text-lime-800">Provinsi Jawa Barat</p>

        <a
          href="/api/auth/signin/google?callbackUrl=%2F&prompt=select_account"
          className="mx-auto mt-8 inline-flex items-center gap-3 rounded-xl border border-lime-200 bg-white px-5 py-3 text-sm font-semibold text-lime-900 shadow-sm hover:bg-lime-50 transition"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-1.4 3.6-5.4 3.6-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.7 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.7 2.6 12s4.2 9.6 9.4 9.6c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
            <path fill="#34A853" d="M2.6 12c0 1.7.4 3.4 1.4 4.7l3.4-2.6c-.5-.7-.7-1.4-.7-2.1s.2-1.4.7-2.1L4 7.3C3 8.6 2.6 10.3 2.6 12z" />
            <path fill="#FBBC05" d="M12 21.6c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.8.6-1.9 1-3.3 1-2.5 0-4.6-1.7-5.3-3.9l-3.4 2.6c1.6 3.1 4.8 5.2 8.7 5.2z" />
            <path fill="#4285F4" d="M20.8 10.4H12v3.9h5.4c-.3 1.4-1.2 2.4-2.1 3.1l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7.4 0-.7-.1-1.3-.2-2z" />
          </svg>
          Login dengan Google
        </a>
      </div>
    </div>
  );
}