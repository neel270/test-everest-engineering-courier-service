import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackToHome?: boolean;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackToHome = false,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-white">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">CS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Courier Service</h1>
                <p className="text-sm text-gray-600">Fast • Reliable • Secure</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Streamline Your Deliveries
                </h2>
                <p className="text-lg text-gray-600">
                  Manage packages, track deliveries, and optimize routes with our
                  comprehensive courier management system.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Real-time package tracking</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Optimized delivery routes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700">Advanced analytics & reporting</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex flex-1 flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CS</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Courier Service</span>
              </Link>
            </div>

            {/* Back to home link */}
            {showBackToHome && (
              <div className="mb-8">
                <Link
                  to="/"
                  className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                >
                  ← Back to home
                </Link>
              </div>
            )}

            {/* Auth form */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                {subtitle && (
                  <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};