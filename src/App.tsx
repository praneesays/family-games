import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './lib/store';
import { Landing } from './screens/Landing';
import { CreateRoom } from './screens/CreateRoom';
import { Room } from './screens/Room';
import { Profile } from './screens/Profile';
import { Login } from './screens/Login';
import { Dashboard } from './screens/Dashboard';
import { ToastHost, MomentLayer, FloatLayer } from './components/Overlays';

export default function App() {
  const loadSelf = useStore((s) => s.loadSelf);
  useEffect(() => {
    loadSelf();
  }, [loadSelf]);

  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/r/:code" element={<Room />} />
          <Route path="/me" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* platform-owned global overlays */}
      <FloatLayer />
      <ToastHost />
      <MomentLayer />
    </BrowserRouter>
  );
}
