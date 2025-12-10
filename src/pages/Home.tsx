import Navbar from "../components/Navbar";
import LoginButton from "../components/LoginButton";
import AuthIllustration from "../components/AuthIllustration";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 py-12 max-w-6xl space-y-12">
        <section className="w-full bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-gray-200">
          <header className="mb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              Welcome to <span className="text-blue-600">TokenHUB</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">Choose your portal to continue</p>
            <p className="mt-3 text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Your unified authentication system for campus services. Access dashboards, manage activities,
              and stay updated - all from one secure portal.
            </p>
          </header>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
            <LoginButton label="Student" href="/login/student" color="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" />
            <LoginButton label="Faculty" href="/login/faculty" color="bg-green-600 hover:bg-green-700 text-white rounded-xl" />
            <LoginButton label="Admin" href="/login/admin" color="bg-red-600 hover:bg-red-700 text-white rounded-xl" />
          </div>
        </section>

        <section className="w-full bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-gray-200 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 order-2 lg:order-1  flex justify-center">
            
              <AuthIllustration />
          
          </div>

          <div className="flex-1 order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">Fast. Secure. Campus-ready.</h2>

            <p className="text-gray-600 leading-relaxed text-lg">
              TokenHUB provides a modern authentication system aimed at simplifying access management for
              students, faculty, and administrators. Built with security and ease-of-use in mind, it offers
              instant access to essential tools and workflows.
            </p>

            <ul className="mt-8 space-y-3 text-gray-700">
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>Quick login based on your role</span>
              </li>
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>Clean and intuitive dashboards</span>
              </li>
              <li className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-start">
                <span className="text-blue-600 font-bold mr-3">•</span>
                <span>Secure authentication workflows</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl text-gray-700 leading-relaxed">
              TokenHUB is actively expanding with upcoming features such as activity insights, event
              integrations, and improved accessibility across all devices.
            </div>
          </div>
        </section>

        <section className="w-full text-center py-8">
          <p className="text-gray-600">
            Need help? Contact{' '}
            <a className="text-blue-600 hover:text-blue-700 font-medium hover:underline" href="mailto:tokenhub@bmsce.ac.in">
              tokenhub@bmsce.ac.in
            </a>
          </p>
          <p className="mt-3 text-sm text-gray-400">© {new Date().getFullYear()} TokenHUB - All rights reserved.</p>
        </section>
      </main>
    </div>
  );
}
