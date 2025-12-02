"use client";

import { useState } from "react";
import { sessionManager } from "~~/services/session/SessionManager";

interface ProfileSetupProps {
  onNext: () => void;
  onSkip: () => void;
}

export const ProfileSetup = ({ onNext, onSkip }: ProfileSetupProps) => {
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("👤");

  const avatars = ["👤", "😊", "🎯", "🚀", "⭐", "🌟", "💎", "🔥", "✨", "🎨", "🎭", "🎪"];

  const handleSave = () => {
    sessionManager.updateSession({
      profile: {
        displayName: displayName.trim() || undefined,
        avatar: selectedAvatar,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-5xl mb-4">{selectedAvatar}</div>
        <h2 className="text-2xl font-bold text-gray-800">Set Up Your Profile</h2>
        <p className="text-gray-600">Help recipients recognize you when you send payments</p>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Display Name <span className="text-gray-400">(Optional)</span>
        </label>
        <input
          type="text"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g., John Doe"
          maxLength={30}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500">This will be shown to people you send money to</p>
      </div>

      {/* Avatar Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Choose an Avatar</label>
        <div className="grid grid-cols-6 gap-3">
          {avatars.map(avatar => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className={`text-3xl p-3 rounded-xl border-2 transition-all ${
                selectedAvatar === avatar
                  ? "border-blue-500 bg-blue-50 scale-110"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {displayName && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-xs text-blue-600 mb-2">Preview</p>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{selectedAvatar}</div>
            <div>
              <p className="font-semibold text-gray-800">{displayName}</p>
              <p className="text-xs text-gray-500">Payment from</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onSkip}
          className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Skip for Now
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
