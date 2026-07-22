export default function Dashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-accent-50 flex items-center justify-center mb-6 shadow-soft">
        <svg className="w-10 h-10 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3 3h18M3 3l3 3m15-3v11.25A2.25 2.25 0 0118 16.5h-2.25m-9 0v3.75h6m-6 0h6m-9-3.75V12m12 0v3.75m0-3.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Content</h1>
      <p className="text-slate-500 max-w-md">
        This is the main content area. Page content will be rendered here.
      </p>
    </div>
  )
}
