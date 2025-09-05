/**
 * Error Boundary for Nuru MVP
 * Provides graceful error handling and fallback UI
 */

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; onReset?: () => void }>;
}

export class NuruErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Nuru Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add monitoring service integration here
      console.error('Production error:', { error, errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onReset }) => {
  const getErrorMessage = (error?: Error): string => {
    if (!error) return 'An unexpected error occurred';
    
    // Handle common Web3/blockchain errors
    if (error.message.includes('user denied')) {
      return 'Transaction was cancelled by user';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient balance for this transaction';
    }
    if (error.message.includes('network')) {
      return 'Network connection issue - please check your internet';
    }
    if (error.message.includes('contract')) {
      return 'Smart contract interaction failed';
    }
    if (error.message.includes('voice') || error.message.includes('audio')) {
      return 'Voice recognition service is temporarily unavailable';
    }
    
    return 'Something went wrong with the application';
  };

  const getSuggestions = (error?: Error): string[] => {
    if (!error) return ['Try refreshing the page'];
    
    const suggestions: string[] = [];
    
    if (error.message.includes('network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try switching to a different network');
    }
    
    if (error.message.includes('wallet')) {
      suggestions.push('Make sure your wallet is connected');
      suggestions.push('Try reconnecting your wallet');
    }
    
    if (error.message.includes('voice') || error.message.includes('audio')) {
      suggestions.push('Check microphone permissions');
      suggestions.push('Try using the demo mode instead');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear browser cache and cookies');
    }
    
    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">⚠️</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
        <p className="text-red-600 font-medium mb-4">{getErrorMessage(error)}</p>
        
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-red-800 mb-2">What you can try:</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {getSuggestions(error).map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="space-y-3">
          {onReset && (
            <button
              onClick={onReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Developer Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default NuruErrorBoundary;