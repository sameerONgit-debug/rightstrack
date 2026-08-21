import './globals.css';
import Navbar from '../components/Navbar';
import LegalDisclaimer from '../components/LegalDisclaimer';

export const metadata = {
  title: 'RightsTrack — AI-Powered Civic & Legal Case Tracker',
  description:
    'Describe your legal or civic problem once — get the right legal document, and never miss a statutory deadline again.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <LegalDisclaimer />
            <div className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} RightsTrack — AI for Civic & Legal Empowerment. Built for Hackathon PS3.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
