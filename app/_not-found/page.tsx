import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
};

export const viewport: Viewport = {
  themeColor: '#0d9488', // ✅ This is now correctly placed
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600">Sorry, the page you were looking for does not exist.</p>
      </div>
    </div>
  );
}
