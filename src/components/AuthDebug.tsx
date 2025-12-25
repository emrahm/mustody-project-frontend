import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export function AuthDebug() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('=== AUTH DEBUG ===');
    console.log('User from context:', user);
    console.log('Loading:', loading);
    console.log('Token exists:', !!token);
    console.log('UserData exists:', !!userData);
    console.log('UserData content:', userData);
    console.log('==================');
  }, [user, loading]);

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded text-xs z-50">
      <div>User: {user ? user.name : 'null'}</div>
      <div>Loading: {loading.toString()}</div>
      <div>Token: {!!localStorage.getItem('auth_token') ? 'exists' : 'missing'}</div>
    </div>
  );
}
