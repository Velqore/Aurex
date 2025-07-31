"use client";

import { useState, useEffect } from 'react';
import SecureTerminal from '../components/SecureTerminal';

export default function TerminalTestPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Set a mock user for testing
    setUser({
      id: 'test-user-123',
      username: 'testuser',
      role: 'admin',
      email: 'test@aurex.com'
    });
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading test user...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Terminal Test Page</h1>
        <div className="h-[600px] border border-gray-700 rounded-lg overflow-hidden">
          <SecureTerminal user={user} />
        </div>
      </div>
    </div>
  );
}
