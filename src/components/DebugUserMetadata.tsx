import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function DebugUserMetadata() {
  const { profile } = useAuth();
  const isPremium = profile?.plan_type === 'premium';

  return (
    <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, margin: 16 }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 8 }}>Debug profile</h2>
      <div><strong>is_admin:</strong> {String(profile?.is_admin)}</div>
      <div><strong>is_premium:</strong> {String(isPremium)}</div>
      <div><strong>plan_type:</strong> {profile?.plan_type}</div>
      <div><strong>subscription_status:</strong> {profile?.subscription_status}</div>
      <div><strong>profile:</strong></div>
      <pre style={{ background: '#fff', padding: 8, borderRadius: 4, fontSize: 14 }}>
        {JSON.stringify(profile, null, 2)}
      </pre>
    </div>
  );
}
