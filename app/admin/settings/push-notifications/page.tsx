'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface PushTemplate {
  id: string;
  template_key: string;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PushNotificationsPage() {
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  // 템플릿 로드
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/push-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates);
      } else {
        throw new Error(data.error || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 로드 오류:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 업데이트
  const updateTemplate = async (template: PushTemplate) => {
    setSaving(template.template_key);
    try {
      const response = await fetch('/api/admin/push-templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_key: template.template_key,
          title: template.title,
          body: template.body,
          is_active: template.is_active,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('템플릿이 업데이트되었습니다.');
        setEditingTemplate(null);
        await loadTemplates();
      } else {
        throw new Error(data.error || '템플릿 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 업데이트 오류:', error);
      toast.error('템플릿 업데이트에 실패했습니다.');
    } finally {
      setSaving(null);
    }
  };

  // 테스트 푸시 발송
  const sendTestPush = async () => {
    setTestSending(true);
    try {
      const response = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🎮 게임플라자 테스트 알림',
          message: `관리자 테스트 푸시 알림입니다. 현재 시간: ${new Date().toLocaleTimeString('ko-KR')}`,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`테스트 푸시가 ${data.sentCount}명에게 발송되었습니다!`);
      } else {
        throw new Error(data.error || '테스트 푸시 발송에 실패했습니다.');
      }
    } catch (error) {
      console.error('테스트 푸시 발송 오류:', error);
      toast.error('테스트 푸시 발송에 실패했습니다.');
    } finally {
      setTestSending(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">푸시 알림 관리</h1>
        <button
          onClick={sendTestPush}
          disabled={testSending}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {testSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              발송 중...
            </>
          ) : (
            <>
              📱 테스트 푸시 발송
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {template.template_key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <p className="text-sm text-gray-500">키: {template.template_key}</p>
              </div>
              
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => {
                      const updatedTemplate = { ...template, is_active: e.target.checked };
                      updateTemplate(updatedTemplate);
                    }}
                    disabled={saving === template.template_key}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={template.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {template.is_active ? '활성' : '비활성'}
                  </span>
                </label>

                <button
                  onClick={() => setEditingTemplate(
                    editingTemplate === template.template_key ? null : template.template_key
                  )}
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  {editingTemplate === template.template_key ? '취소' : '편집'}
                </button>
              </div>
            </div>

            {editingTemplate === template.template_key ? (
              <EditTemplateForm
                template={template}
                onSave={updateTemplate}
                onCancel={() => setEditingTemplate(null)}
                saving={saving === template.template_key}
              />
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm">{template.title}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm whitespace-pre-wrap">{template.body}</div>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              최종 수정: {new Date(template.updated_at).toLocaleString('ko-KR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 템플릿 편집 폼 컴포넌트
function EditTemplateForm({ 
  template, 
  onSave, 
  onCancel, 
  saving 
}: { 
  template: PushTemplate;
  onSave: (template: PushTemplate) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    onSave({
      ...template,
      title: title.trim(),
      body: body.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="푸시 알림 제목을 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="푸시 알림 내용을 입력하세요"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}