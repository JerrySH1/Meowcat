import React, { useState } from 'react';

const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'upload'>('preview');

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4 font-sans">
      <div className="bg-gray-900 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl relative flex flex-col overflow-hidden border border-gray-700 text-white">
        
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-emerald-400">Hellycat Admin System</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'preview' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Mobile Preview
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'upload' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                Media Upload
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex bg-gray-950">
          {activeTab === 'preview' ? (
            <div className="flex-1 flex items-center justify-center p-8">
              {/* Mobile Device Mockup */}
              <div className="w-[375px] h-[812px] bg-black rounded-[3rem] border-[12px] border-gray-800 relative overflow-hidden shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-2xl z-50"></div>
                {/* Iframe for preview */}
                <iframe 
                  src={window.location.href} 
                  className="w-full h-full border-none bg-white"
                  title="Mobile Preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-200">Upload Media</h3>
                  <p className="text-gray-400 mb-6">Upload images or videos for the Charity Board or Story Backgrounds.</p>
                  
                  <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-emerald-500 hover:bg-gray-800/50 transition-colors cursor-pointer">
                    <span className="text-5xl mb-4">📁</span>
                    <p className="text-lg font-medium text-gray-300 mb-2">Drag and drop files here</p>
                    <p className="text-sm text-gray-500 mb-6">Supports JPG, PNG, GIF, MP4 (Max 50MB)</p>
                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Browse Files
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-200">Recent Uploads</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Placeholder for uploaded files */}
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-square bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center text-gray-500">
                        Empty Slot {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
