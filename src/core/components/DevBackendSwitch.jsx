import { useState } from "react";
import { Database, Cloud } from "lucide-react";

export default function DevBackendSwitch() {
  if (!import.meta.env.DEV) return null;

  const [useDeployed, setUseDeployed] = useState(
    localStorage.getItem("USE_DEPLOYED_BACKEND") === "true"
  );

  const toggleBackend = () => {
    const newValue = !useDeployed;
    setUseDeployed(newValue);
    localStorage.setItem("USE_DEPLOYED_BACKEND", String(newValue));
    // Reload the page to re-initialize axios and the app with new URL
    window.location.reload();
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-white dark:bg-gray-800 p-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-700 flex items-center space-x-2 transition-all">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 pl-2 tracking-wider">API:</span>
      <button
        onClick={toggleBackend}
        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          !useDeployed
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-transparent"
        }`}
        title="Connect to Local Backend"
      >
        <Database className="w-3.5 h-3.5 mr-1" /> Local
      </button>
      <button
        onClick={toggleBackend}
        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
          useDeployed
            ? "bg-blue-100 text-blue-700 border border-blue-300"
            : "bg-gray-50 text-gray-400 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 border border-transparent"
        }`}
        title="Connect to Deployed Backend"
      >
        <Cloud className="w-3.5 h-3.5 mr-1" /> Deployed
      </button>
    </div>
  );
}
