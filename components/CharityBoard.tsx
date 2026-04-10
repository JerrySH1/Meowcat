import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface CharityBoardProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

type Tab = 'lost' | 'adopt' | 'stories';

interface Post {
  id: number;
  type: 'lost' | 'adopt' | 'story';
  image?: string;
  name?: string;
  breed?: string;
  desc: string;
  contact?: string;
  date: string;
  author?: string;
}

const MOCK_POSTS: Post[] = [
  { id: 1, type: 'lost', name: 'Mimi', breed: 'Tabby', desc: 'Lost near Central Park on 2024-05-20. Has a red collar.', contact: '123-456-7890', date: '2024-05-21', image: 'https://picsum.photos/seed/cat1/200/200' },
  { id: 2, type: 'adopt', name: 'Luna', breed: 'Black Cat', desc: 'Very friendly, 2 years old. Spayed and vaccinated.', contact: 'City Shelter', date: '2024-06-01', image: 'https://picsum.photos/seed/cat2/200/200' },
  { id: 3, type: 'story', author: 'Alice', desc: 'I found my best friend here. Thank you for saving cats!', date: '2024-06-10' }
];

const CharityBoard: React.FC<CharityBoardProps> = ({ isOpen, onClose, language }) => {
  const [activeTab, setActiveTab] = useState<Tab>('lost');
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [showForm, setShowForm] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    desc: '',
    contact: '',
    author: ''
  });

  if (!isOpen) return null;

  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPost: Post = {
      id: Date.now(),
      type: activeTab === 'stories' ? 'story' : (activeTab === 'lost' ? 'lost' : 'adopt'),
      ...formData,
      date: new Date().toLocaleDateString(),
      image: `https://picsum.photos/seed/${Date.now()}/200/200` // Mock image
    };
    setPosts([newPost, ...posts]);
    setShowForm(false);
    setFormData({ name: '', breed: '', desc: '', contact: '', author: '' });
  };

  const renderCard = (post: Post) => {
    if (post.type === 'story') {
      return (
        <div key={post.id} className="bg-[#fff9c4] p-4 rounded shadow-md rotate-1 hover:rotate-0 transition-transform relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-sm border border-black/20"></div>
          <p className="font-handwriting text-lg mb-2">"{post.desc}"</p>
          <div className="text-right text-sm text-gray-600">- {post.author}, {post.date}</div>
        </div>
      );
    }

    return (
      <div key={post.id} className="bg-white p-3 rounded shadow-md flex flex-col gap-2 rotate-[-1deg] hover:rotate-0 transition-transform relative border border-gray-200">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-sm border border-black/20"></div>
        <div className="w-full h-32 bg-gray-100 rounded overflow-hidden">
            <img src={post.image} alt={post.name} className="w-full h-full object-cover" />
        </div>
        <div className="font-bold text-lg text-[#2d2d2d]">{post.name} <span className="text-xs font-normal text-gray-500">({post.breed})</span></div>
        <p className="text-sm text-gray-700 line-clamp-3">{post.desc}</p>
        <div className="mt-auto pt-2 border-t border-dashed border-gray-300 text-xs text-gray-500">
          📞 {post.contact}
        </div>
        {post.type === 'lost' && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded font-bold transform rotate-12">LOST</div>
        )}
        {post.type === 'adopt' && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold transform rotate-12">ADOPT</div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-[#d4a373] w-full max-w-4xl h-[85vh] rounded-lg shadow-2xl relative flex flex-col border-[12px] border-[#8d6e63] overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cork-board.png")',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Header */}
        <div className="bg-[#fffdf5] p-4 border-b-4 border-[#8d6e63] flex justify-between items-center shadow-md z-10">
           <div>
             <h2 className="text-2xl font-bold text-[#5d4037] flex items-center gap-2">
               📌 Furry Notice Board
             </h2>
             <p className="text-xs text-[#8d6e63] mt-1">"Wash a cat, hear a story, change a fate."</p>
           </div>
           <button onClick={onClose} className="text-2xl font-bold hover:scale-110 text-[#5d4037]">✖️</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-[#8d6e63]/20 backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('lost')}
            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'lost' ? 'bg-[#ffecb3] text-[#5d4037] translate-y-1 shadow-inner' : 'bg-[#d7ccc8] text-[#5d4037] hover:bg-[#eefebe]'}`}
          >
            😿 Lost Cats
          </button>
          <button 
            onClick={() => setActiveTab('adopt')}
            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'adopt' ? 'bg-[#c8e6c9] text-[#2e7d32] translate-y-1 shadow-inner' : 'bg-[#d7ccc8] text-[#5d4037] hover:bg-[#eefebe]'}`}
          >
            🏠 Adoption
          </button>
          <button 
            onClick={() => setActiveTab('stories')}
            className={`px-6 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'stories' ? 'bg-[#ffccbc] text-[#bf360c] translate-y-1 shadow-inner' : 'bg-[#d7ccc8] text-[#5d4037] hover:bg-[#eefebe]'}`}
          >
            ❤️ Stories
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative">
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Add Button */}
              <div 
                onClick={() => setShowForm(true)}
                className="bg-white/50 border-4 border-dashed border-[#8d6e63] rounded flex flex-col items-center justify-center p-8 cursor-pointer hover:bg-white/70 transition-colors min-h-[200px]"
              >
                <div className="text-4xl mb-2">➕</div>
                <div className="font-bold text-[#5d4037]">Post New</div>
              </div>

              {posts.filter(p => p.type === (activeTab === 'stories' ? 'story' : activeTab)).map(renderCard)}
           </div>
        </div>

        {/* Post Form Modal */}
        {showForm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4 rotate-1">
              <h3 className="text-xl font-bold mb-4 text-[#5d4037]">
                {activeTab === 'lost' ? 'Post Lost Cat' : (activeTab === 'adopt' ? 'Post Adoption' : 'Share Story')}
              </h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {activeTab !== 'stories' && (
                  <>
                    <input 
                      type="text" 
                      placeholder="Cat Name" 
                      className="border p-2 rounded"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Breed / Color" 
                      className="border p-2 rounded"
                      value={formData.breed}
                      onChange={e => setFormData({...formData, breed: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Contact Info" 
                      className="border p-2 rounded"
                      value={formData.contact}
                      onChange={e => setFormData({...formData, contact: e.target.value})}
                      required
                    />
                  </>
                )}
                {activeTab === 'stories' && (
                   <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="border p-2 rounded"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                      required
                    />
                )}
                <textarea 
                  placeholder={activeTab === 'stories' ? "Write your story..." : "Description (Time, Location, etc.)"}
                  className="border p-2 rounded h-32"
                  value={formData.desc}
                  onChange={e => setFormData({...formData, desc: e.target.value})}
                  required
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">Cancel</button>
                  <button type="submit" className="flex-1 bg-[#8d6e63] text-white py-2 rounded font-bold hover:bg-[#6d4c41]">Post</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CharityBoard;
