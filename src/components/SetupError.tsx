import { AlertCircle, FileText, Settings } from 'lucide-react';

interface SetupErrorProps {
  missingVars: string[];
}

export function SetupError({ missingVars }: SetupErrorProps) {
  const message = `Missing Firebase environment variables: ${missingVars.join(', ')}`;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 border-2 border-red-200">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Setup Required</h1>
            <p className="text-gray-600">Firebase configuration missing</p>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-800 font-medium">{message}</p>
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Fix (5 minutes)
            </h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <div>
                  <strong>Create .env file</strong>
                  <p className="text-sm text-gray-600">In your project folder, create a file named <code className="bg-gray-100 px-2 py-1 rounded">.env</code></p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <div>
                  <strong>Copy from template</strong>
                  <p className="text-sm text-gray-600">Copy contents from <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> file</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <div>
                  <strong>Add Firebase credentials</strong>
                  <p className="text-sm text-gray-600">Get from: <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">Firebase Console</a> → Project Settings → Your apps</p>
                </div>
              </li>
              
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <div>
                  <strong>Restart server</strong>
                  <p className="text-sm text-gray-600">Press <kbd className="bg-gray-100 px-2 py-1 rounded text-xs">Ctrl+C</kbd> in terminal, then run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> again</p>
                </div>
              </li>
            </ol>
          </div>

          {/* .env file example */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Your .env file should look like:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123`}
            </pre>
          </div>

          {/* Help Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Need detailed help?
            </h3>
            <p className="text-blue-800 text-sm mb-2">
              Open <strong>SETUP_GUIDE.md</strong> in your project folder for complete step-by-step instructions.
            </p>
            <div className="space-y-1 text-sm text-blue-700">
              <div>→ Part 4: Setup Firebase (5 min)</div>
              <div>→ Part 5: Configure Your App (3 min)</div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Important:</strong> Never commit your .env file to Git! It's already in .gitignore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}