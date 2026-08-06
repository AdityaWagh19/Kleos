import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

export default function WorkspaceLayout() {
  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[#111111]">
      {/* 
        The Workspace (canvas) handles its own background colors mostly, 
        but we wrap it here. The NavBar sits on top.
      */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <NavBar />
      </div>
      <main className="flex-1 relative w-full h-full pt-[60px]">
        <Outlet />
      </main>
    </div>
  );
}
