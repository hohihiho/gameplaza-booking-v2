'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Gamepad2, 
  Calendar,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideContent {
  id: string;
  category: 'arcade' | 'reservation';
  section: string;
  title: string;
  content: string[];
  order_index: number;
  is_active: boolean;
}

export default function GuideManagementPage() {
  const [contents, setContents] = useState<GuideContent[]>([]);
  const [activeCategory, setActiveCategory] = useState<'arcade' | 'reservation'>('arcade');
  const [editingContent, setEditingContent] = useState<GuideContent | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // 새 콘텐츠 기본값
  const [newContent, setNewContent] = useState<Partial<GuideContent>>({
    category: 'arcade',
    section: '',
    title: '',
    content: [''],
    order_index: 0,
    is_active: true
  });

  // 데이터 로드
  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guide-contents');
      const data = await response.json();
      
      if (response.ok) {
        setContents(data.contents);
      } else {
        console.error('콘텐츠 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('콘텐츠 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 콘텐츠 저장
  const saveContent = async (content: GuideContent) => {
    try {
      const response = await fetch(`/api/guide-contents/${content.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          content: content.content,
          order_index: content.order_index,
          is_active: content.is_active
        })
      });

      if (response.ok) {
        await fetchContents();
        setEditingContent(null);
      } else {
        console.error('저장 실패');
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 새 콘텐츠 추가
  const addNewContent = async () => {
    try {
      const response = await fetch('/api/guide-contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContent)
      });

      if (response.ok) {
        await fetchContents();
        setIsAddingNew(false);
        setNewContent({
          category: activeCategory,
          section: '',
          title: '',
          content: [''],
          order_index: 0,
          is_active: true
        });
      } else {
        console.error('추가 실패');
      }
    } catch (error) {
      console.error('추가 오류:', error);
    }
  };

  // 콘텐츠 삭제 (비활성화)
  const deleteContent = async (id: string) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/guide-contents/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchContents();
      } else {
        console.error('삭제 실패');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
    }
  };

  // 리스트 아이템 추가/제거
  const addListItem = (content: GuideContent | typeof newContent) => {
    if ('id' in content) {
      setEditingContent({
        ...content,
        content: [...content.content, '']
      });
    } else {
      setNewContent({
        ...content,
        content: [...(content.content || []), '']
      });
    }
  };

  const removeListItem = (content: GuideContent | typeof newContent, index: number) => {
    if ('id' in content) {
      setEditingContent({
        ...content,
        content: content.content.filter((_, i) => i !== index)
      });
    } else {
      setNewContent({
        ...content,
        content: (content.content || []).filter((_, i) => i !== index)
      });
    }
  };

  const updateListItem = (content: GuideContent | typeof newContent, index: number, value: string) => {
    if ('id' in content) {
      const newContentArray = [...content.content];
      newContentArray[index] = value;
      setEditingContent({
        ...content,
        content: newContentArray
      });
    } else {
      const newContentArray = [...(content.content || [])];
      newContentArray[index] = value;
      setNewContent({
        ...content,
        content: newContentArray
      });
    }
  };

  const filteredContents = contents.filter(content => 
    content.category === activeCategory && content.is_active
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          이용안내 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          오락실 이용안내와 예약 이용안내를 편집할 수 있습니다
        </p>
      </div>

      {/* 탭 */}
      <div className="flex justify-between items-center mb-6">
        <div className="inline-flex bg-white dark:bg-gray-900 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveCategory('arcade')}
            className={`px-6 py-2.5 rounded-md transition-all font-medium text-sm ${
              activeCategory === 'arcade'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4 inline mr-2" />
            오락실 이용안내
          </button>
          <button
            onClick={() => setActiveCategory('reservation')}
            className={`px-6 py-2.5 rounded-md transition-all font-medium text-sm ${
              activeCategory === 'reservation'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            예약 이용안내
          </button>
        </div>

        <button
          onClick={() => setIsAddingNew(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          새 항목 추가
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 기존 콘텐츠 목록 */}
          {filteredContents.map((content) => (
            <motion.div
              key={content.id}
              layout
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              {editingContent?.id === content.id ? (
                // 편집 모드
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={editingContent.title}
                      onChange={(e) => setEditingContent({
                        ...editingContent,
                        title: e.target.value
                      })}
                      className="text-xl font-bold bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none pb-1"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveContent(editingContent)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingContent(null)}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {editingContent.content.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-indigo-600">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateListItem(editingContent, index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                          placeholder="항목을 입력하세요"
                        />
                        <button
                          onClick={() => removeListItem(editingContent, index)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem(editingContent)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      + 항목 추가
                    </button>
                  </div>
                </div>
              ) : (
                // 보기 모드
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {content.title}
                    </h3>
                    <ul className="space-y-1">
                      {content.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-indigo-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditingContent(content)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteContent(content.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {/* 새 항목 추가 폼 */}
          <AnimatePresence>
            {isAddingNew && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 border-dashed border-indigo-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={newContent.title || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        title: e.target.value
                      })}
                      placeholder="제목을 입력하세요"
                      className="text-xl font-bold bg-transparent border-b-2 border-indigo-300 focus:border-indigo-500 outline-none pb-1 w-full"
                    />
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={addNewContent}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsAddingNew(false)}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newContent.section || ''}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        section: e.target.value
                      })}
                      placeholder="섹션 ID (예: rules, broadcast)"
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                    <input
                      type="number"
                      value={newContent.order_index || 0}
                      onChange={(e) => setNewContent({
                        ...newContent,
                        order_index: parseInt(e.target.value) || 0
                      })}
                      placeholder="정렬 순서"
                      className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {(newContent.content || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-indigo-600">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateListItem(newContent, index, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
                          placeholder="항목을 입력하세요"
                        />
                        <button
                          onClick={() => removeListItem(newContent, index)}
                          className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem(newContent)}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      + 항목 추가
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}