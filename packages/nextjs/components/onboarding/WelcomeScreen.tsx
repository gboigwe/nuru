"use client";

interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen = ({ onNext }: WelcomeScreenProps) => {
  return (
    <div className="text-center space-y-6">
      {/* Hero Icon */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-4xl">
          💡
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Welcome to Nuru!</h1>
        <p className="text-xl text-gray-600">Your crypto wallet is ready</p>
      </div>

      {/* Benefits */}
      <div className="space-y-4 text-left max-w-md mx-auto">
        <div className="flex items-start space-x-4">
          <div className="text-2xl mt-1">🎤</div>
          <div>
            <h3 className="font-semibold text-gray-800">Voice Payments</h3>
            <p className="text-sm text-gray-600">Send money using just your voice - no complicated addresses</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="text-2xl mt-1">🔒</div>
          <div>
            <h3 className="font-semibold text-gray-800">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your wallet is encrypted and only you have access</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="text-2xl mt-1">⚡</div>
          <div>
            <h3 className="font-semibold text-gray-800">Fast & Affordable</h3>
            <p className="text-sm text-gray-600">Send money to Africa in seconds with low fees</p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="text-2xl mt-1">🌍</div>
          <div>
            <h3 className="font-semibold text-gray-800">Works Everywhere</h3>
            <p className="text-sm text-gray-600">Send to anyone with an ENS name or wallet address</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <button
          onClick={onNext}
          className="w-full max-w-md py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          Get Started
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500">Takes less than 2 minutes to complete setup</p>
    </div>
  );
};
