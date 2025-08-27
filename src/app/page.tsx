import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Itineraries
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Your smart daily companion for executing life efficiently with time-blocked schedules and intelligent checklists.
        </p>
        
        <div className="flex gap-4 justify-center mb-12">
          <Link 
            href="/auth/signup" 
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started
          </Link>
          <Link 
            href="/auth/login" 
            className="px-8 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">⏰</div>
            <h3 className="font-semibold text-lg mb-2">Time-Blocked Schedule</h3>
            <p className="text-gray-600">15-minute increments that auto-collapse when empty, keeping your day organized and focused.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-lg mb-2">Smart Templates</h3>
            <p className="text-gray-600">Reusable procedures with checklists, resources, and everything needed for successful execution.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl mb-3">👫</div>
            <h3 className="font-semibold text-lg mb-2">Spouse Sync</h3>
            <p className="text-gray-600">Real-time coordination with your partner, see what's been done and what's coming up.</p>
          </div>
        </div>
      </div>
    </div>
  );
}