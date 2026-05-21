import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import SessionView from './pages/SessionView';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Claude Dashboard</h1>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:projectPath" element={<SessionView />} />
            <Route path="/project/:projectPath/session/:sessionId" element={<SessionView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
