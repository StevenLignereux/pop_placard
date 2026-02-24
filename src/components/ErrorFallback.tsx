import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorFallback: React.FC<FallbackProps> = ({ error }) => {
  const crashId = React.useMemo(() => `CRASH-${Date.now().toString(36).toUpperCase()}`, []);

  return (
    <div 
      role="alert" 
      aria-live="polite" 
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-lg border border-red-100 max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Une erreur est survenue
        </h2>
        
        <p className="text-gray-600 mb-6">
          Nous nous excusons pour la gêne occasionnée. L'application a rencontré un problème inattendu.
        </p>

        {/* Technical details (hidden in production usually, but useful for now or if dev) */}
        <details className="text-left bg-gray-50 p-3 rounded text-xs text-gray-500 mb-6 overflow-auto max-h-32 border border-gray-200">
          <summary className="cursor-pointer font-medium mb-1 hover:text-gray-700">Détails techniques</summary>
          <pre className="whitespace-pre-wrap font-mono">{error.message}</pre>
        </details>

        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 mb-6">
          <p className="text-xs text-blue-800 font-medium">
            Code erreur support : <span className="font-mono font-bold select-all">{crashId}</span>
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Recharger la page
        </button>
      </div>
    </div>
  );
};
