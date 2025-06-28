// 콘텐츠 관리 메인 페이지
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText,
  Save,
  ChevronLeft,
  Edit3,
  Eye,
  AlertCircle,
  Type,
  Image as ImageIcon,
  Layout,
  Plus,
  Copy,
  Trash2,
  Smartphone,
  Monitor,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  EyeOff,
  Layers,
  Square,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import { getKSTNow } from '@/lib/utils/date';

type ContentBlock = {
  id: string;
  type: 'heading' | 'text' | 'image' | 'button' | 'spacer' | 'divider' | 'alert' | 'card' | 'list' | 'columns' | 'accordion' | 'steps' | 'iconGrid';
  content: ContentBlockContent;
  style: ContentBlockStyle;
};

interface ContentBlockContent {
  text?: string;
  src?: string;
  alt?: string;
  link?: string;
  title?: string;
  items?: string[];
  columns?: ContentBlock[];
  columnCount?: number;
}

interface ContentBlockStyle {
  level?: string;
  align?: string;
  color?: string;
  fontSize?: string;
  width?: string;
  borderRadius?: string;
  backgroundColor?: string;
  padding?: string;
  type?: string;
  borderColor?: string;
  border?: string;
  listStyle?: string;
  height?: string;
  margin?: string;
}

type Page = {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft';
  lastUpdated: string;
  blocks: ContentBlock[];
};

export default function ContentManagementPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // 페이지 목록 로드
  useEffect(() => {
    setPages([
      {
        id: '1',
        title: '오락실 이용안내',
        slug: 'guide',
        status: 'published',
        lastUpdated: '2024-01-25',
        blocks: [
          {
            id: 'b1',
            type: 'heading',
            content: { text: '오락실 이용안내' },
            style: { level: 'h1', align: 'left', color: '#000000' }
          },
          {
            id: 'b2',
            type: 'text',
            content: { text: '광주 게임플라자의 모든 것을 안내드립니다' },
            style: { align: 'left', fontSize: '16px', color: '#666666' }
          },
          {
            id: 'b3',
            type: 'spacer',
            content: {},
            style: { height: '40px' }
          },
          {
            id: 'b4',
            type: 'card',
            content: {
              title: '영업 정보',
              text: '',
              items: [
                '영업시간: 오전 10:00 - 익일 오전 2:00 (연중무휴)',
                '위치: 광주광역시 서구 게임로 123',
                '연락처: 062-123-4567 (카카오톡 채널 우선)'
              ]
            },
            style: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', color: '#000000' }
          },
          {
            id: 'b5',
            type: 'spacer',
            content: {},
            style: { height: '20px' }
          },
          {
            id: 'b6',
            type: 'card',
            content: {
              title: '이용 요금',
              text: '일반 이용 (자유 이용)',
              items: [
                '리듬게임: 500원/1곡, 1,000원/3곡',
                '아케이드게임: 500원~1,000원/1플레이',
                '대전게임: 500원/1판'
              ]
            },
            style: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e5e7eb', color: '#000000' }
          },
          {
            id: 'b7',
            type: 'spacer',
            content: {},
            style: { height: '20px' }
          },
          {
            id: 'b8',
            type: 'columns',
            content: {
              columnCount: 2,
              columns: []
            },
            style: {}
          },
          {
            id: 'b9',
            type: 'spacer',
            content: {},
            style: { height: '20px' }
          },
          {
            id: 'b10',
            type: 'alert',
            content: {
              title: '편의시설',
              text: '무료 WiFi • 충전 스테이션 • 음료 자판기 • 휴게 공간 • 짐 보관함 • 흡연구역'
            },
            style: { type: 'info', backgroundColor: '#eff6ff', borderColor: '#3b82f6', padding: '16px', borderRadius: '8px' }
          },
          {
            id: 'b11',
            type: 'spacer',
            content: {},
            style: { height: '40px' }
          },
          {
            id: 'b12',
            type: 'button',
            content: {
              text: '지금 예약하기',
              link: '/reservations/new'
            },
            style: { align: 'center', backgroundColor: '#111827', color: '#ffffff', padding: '12px 24px', borderRadius: '8px' }
          }
        ]
      },
      {
        id: '2',
        title: '이벤트 안내',
        slug: 'event',
        status: 'draft',
        lastUpdated: '2024-01-26',
        blocks: []
      }
    ]);
  }, []);

  // 블록 추가
  const addBlock = (type: ContentBlock['type']) => {
    if (!selectedPage) return;

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      style: getDefaultStyle(type)
    };

    const updatedPage = {
      ...selectedPage,
      blocks: [...selectedPage.blocks, newBlock]
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  // 블록 삭제
  const deleteBlock = (blockId: string) => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      blocks: selectedPage.blocks.filter(b => b.id !== blockId)
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
    setSelectedBlock(null);
  };

  // 블록 복제
  const duplicateBlock = (blockId: string) => {
    if (!selectedPage) return;

    const block = selectedPage.blocks.find(b => b.id === blockId);
    if (!block) return;

    const newBlock = {
      ...block,
      id: `block-${Date.now()}`
    };

    const index = selectedPage.blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...selectedPage.blocks];
    newBlocks.splice(index + 1, 0, newBlock);

    const updatedPage = {
      ...selectedPage,
      blocks: newBlocks
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  // 블록 순서 변경
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlock || !selectedPage || draggedBlock === targetId) return;

    const draggedIndex = selectedPage.blocks.findIndex(b => b.id === draggedBlock);
    const targetIndex = selectedPage.blocks.findIndex(b => b.id === targetId);

    const newBlocks = [...selectedPage.blocks];
    const [removed] = newBlocks.splice(draggedIndex, 1);
    if (removed) {
      newBlocks.splice(targetIndex, 0, removed);
    }

    const updatedPage = {
      ...selectedPage,
      blocks: newBlocks
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
    setDraggedBlock(null);
  };

  // 블록 내용 업데이트
  const updateBlockContent = (blockId: string, content: ContentBlockContent) => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      blocks: selectedPage.blocks.map(b => 
        b.id === blockId ? { ...b, content } : b
      )
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  // 블록 스타일 업데이트
  const updateBlockStyle = (blockId: string, style: ContentBlockStyle) => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      blocks: selectedPage.blocks.map(b => 
        b.id === blockId ? { ...b, style: { ...b.style, ...style } } : b
      )
    };

    setSelectedPage(updatedPage);
    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
  };

  // 기본 콘텐츠
  const getDefaultContent = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading':
        return { text: '제목을 입력하세요' };
      case 'text':
        return { text: '텍스트를 입력하세요' };
      case 'image':
        return { src: '', alt: '이미지 설명' };
      case 'button':
        return { text: '버튼', link: '#' };
      case 'alert':
        return { title: '알림', text: '알림 내용을 입력하세요' };
      case 'card':
        return { title: '카드 제목', text: '카드 내용', items: [] };
      case 'list':
        return { items: ['항목 1', '항목 2', '항목 3'] };
      case 'columns':
        return { columnCount: 2, columns: [] };
      default:
        return {};
    }
  };

  // 기본 스타일
  const getDefaultStyle = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading':
        return { level: 'h2', align: 'left', color: '#000000' };
      case 'text':
        return { align: 'left', fontSize: '16px', color: '#333333' };
      case 'image':
        return { width: '100%', align: 'center', borderRadius: '8px' };
      case 'button':
        return { 
          align: 'center', 
          backgroundColor: '#3b82f6', 
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px'
        };
      case 'alert':
        return { 
          type: 'info',
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          padding: '16px',
          borderRadius: '8px'
        };
      case 'card':
        return {
          backgroundColor: '#f9fafb',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        };
      case 'list':
        return { 
          listStyle: 'disc',
          fontSize: '16px',
          color: '#333333'
        };
      case 'spacer':
        return { height: '20px' };
      case 'divider':
        return { color: '#e5e7eb', margin: '20px 0' };
      default:
        return {};
    }
  };

  // 블록 렌더링
  const renderBlock = (block: ContentBlock, isPreview: boolean = false) => {
    const baseClass = isPreview ? '' : 'relative group';

    switch (block.type) {
      case 'heading':
        const HeadingTag = block.style.level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return (
          <div className={baseClass}>
            <HeadingTag 
              className={`font-bold ${
                block.style.level === 'h1' ? 'text-3xl' : 
                block.style.level === 'h2' ? 'text-2xl' : 
                block.style.level === 'h3' ? 'text-xl' : 'text-lg'
              } ${!isPreview && isEditing && selectedBlock === block.id ? 'cursor-text' : ''}`}
              style={{ 
                textAlign: block.style.align as React.CSSProperties['textAlign'],
                color: block.style.color 
              }}
              contentEditable={!isPreview && isEditing && selectedBlock === block.id}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                if (!isPreview && isEditing) {
                  updateBlockContent(block.id, { ...block.content, text: e.currentTarget.textContent || '' });
                }
              }}
            >
              {block.content.text}
            </HeadingTag>
          </div>
        );

      case 'text':
        return (
          <div className={baseClass}>
            <p 
              className={`${!isPreview && isEditing && selectedBlock === block.id ? 'cursor-text' : ''}`}
              style={{ 
                textAlign: block.style.align as React.CSSProperties['textAlign'],
                fontSize: block.style.fontSize,
                color: block.style.color,
                whiteSpace: 'pre-wrap'
              }}
              contentEditable={!isPreview && isEditing && selectedBlock === block.id}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                if (!isPreview && isEditing) {
                  updateBlockContent(block.id, { ...block.content, text: e.currentTarget.textContent || '' });
                }
              }}
            >
              {block.content.text}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className={baseClass} style={{ textAlign: block.style.align as React.CSSProperties['textAlign'] }}>
            {block.content.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={block.content.src}
                alt={block.content.alt || ''}
                style={{
                  width: block.style.width,
                  borderRadius: block.style.borderRadius,
                  maxWidth: '100%'
                }}
                className="inline-block"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">이미지를 추가하세요</p>
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div className={baseClass} style={{ textAlign: block.style.align as React.CSSProperties['textAlign'] }}>
            <button
              className="font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: block.style.backgroundColor,
                color: block.style.color,
                padding: block.style.padding,
                borderRadius: block.style.borderRadius
              }}
            >
              {block.content.text}
            </button>
          </div>
        );

      case 'alert':
        return (
          <div 
            className={baseClass}
            style={{
              backgroundColor: block.style.backgroundColor,
              borderLeft: `4px solid ${block.style.borderColor}`,
              padding: block.style.padding,
              borderRadius: block.style.borderRadius
            }}
          >
            {block.content.title && (
              <h4 className="font-semibold mb-2">{block.content.title}</h4>
            )}
            <p>{block.content.text}</p>
          </div>
        );

      case 'card':
        return (
          <div 
            className={baseClass}
            style={{
              backgroundColor: block.style.backgroundColor,
              padding: block.style.padding,
              borderRadius: block.style.borderRadius,
              border: block.style.border,
              color: block.style.color
            }}
          >
            {block.content.title && (
              <h3 className="text-lg font-semibold mb-2" style={{ color: block.style.color }}>
                {block.content.title}
              </h3>
            )}
            {block.content.text && (
              <p className="mb-2" style={{ opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                {block.content.text}
              </p>
            )}
            {block.content.items && block.content.items.length > 0 && (
              <ul className="space-y-1 ml-5" style={{ listStyleType: 'disc' }}>
                {block.content.items?.map((item: string, index: number) => (
                  <li key={index} style={{ opacity: 0.9 }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'list':
        return (
          <div className={baseClass}>
            <ul 
              className="space-y-1 ml-5"
              style={{
                listStyleType: block.style.listStyle,
                fontSize: block.style.fontSize,
                color: block.style.color
              }}
            >
              {block.content.items?.map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        );

      case 'spacer':
        return <div className={baseClass} style={{ height: block.style.height }} />;

      case 'divider':
        return (
          <div className={baseClass} style={{ margin: block.style.margin }}>
            <hr style={{ borderColor: block.style.color }} />
          </div>
        );

      case 'columns':
        return (
          <div className={baseClass}>
            <div className={`grid gap-4 ${
              block.content.columnCount === 2 ? 'grid-cols-1 md:grid-cols-2' :
              block.content.columnCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
              'grid-cols-1 md:grid-cols-4'
            }`}>
              {block.content.columns?.map((column, index) => (
                <div key={index} className="space-y-4">
                  {column.content && renderBlock(column, isPreview)}
                </div>
              )) || (
                Array.from({ length: block.content.columnCount || 2 }).map((_, index) => (
                  <div key={index} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <p className="text-gray-500">열 {index + 1}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // 새 페이지 생성
  const createNewPage = () => {
    if (!newPageTitle || !newPageSlug) return;

    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: newPageTitle,
      slug: newPageSlug,
      status: 'draft',
      lastUpdated: getKSTNow().split('T')[0] || '',
      blocks: []
    };

    setPages([...pages, newPage]);
    setSelectedPage(newPage);
    setShowPageModal(false);
    setNewPageTitle('');
    setNewPageSlug('');
    setIsEditing(true);
  };

  // 페이지 저장
  const savePage = () => {
    if (!selectedPage) return;

    const updatedPage = {
      ...selectedPage,
      lastUpdated: getKSTNow().split('T')[0] || ''
    };

    setPages(pages.map(p => p.id === selectedPage.id ? updatedPage : p));
    setIsEditing(false);
    alert('페이지가 저장되었습니다.');
  };

  // 페이지 삭제
  const deletePage = (pageId: string) => {
    if (confirm('정말로 이 페이지를 삭제하시겠습니까?')) {
      setPages(pages.filter(p => p.id !== pageId));
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/admin/content"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-2xl font-bold dark:text-white">콘텐츠 빌더</h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          드래그 앤 드롭으로 페이지를 디자인하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 페이지 목록 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold dark:text-white">페이지</h2>
              <button
                onClick={() => setShowPageModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page);
                    setIsEditing(false);
                    setShowPreview(false);
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedPage?.id === page.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium dark:text-white">{page.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/{page.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {page.status === 'published' ? (
                        <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(page.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 블록 추가 패널 */}
          {isEditing && selectedPage && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold dark:text-white mb-3">블록 추가</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'heading' as const, icon: Type, label: '제목' },
                  { type: 'text' as const, icon: FileText, label: '텍스트' },
                  { type: 'image' as const, icon: ImageIcon, label: '이미지' },
                  { type: 'button' as const, icon: Square, label: '버튼' },
                  { type: 'alert' as const, icon: AlertCircle, label: '알림' },
                  { type: 'card' as const, icon: Layout, label: '카드' },
                  { type: 'list' as const, icon: List, label: '목록' },
                  { type: 'columns' as const, icon: Layers, label: '열 나누기' },
                  { type: 'spacer' as const, icon: Minus, label: '공백' },
                  { type: 'divider' as const, icon: Minus, label: '구분선' }
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="p-3 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 에디터 영역 */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* 툴바 */}
              <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold dark:text-white">
                      {selectedPage.title}
                    </h2>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      selectedPage.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {selectedPage.status === 'published' ? '게시됨' : '초안'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showPreview ? '편집' : '미리보기'}
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          편집
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={savePage}
                          className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          저장
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showPreview && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">디바이스:</span>
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-2 rounded-lg transition-colors ${
                        previewDevice === 'desktop'
                          ? 'bg-gray-200 dark:bg-gray-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-2 rounded-lg transition-colors ${
                        previewDevice === 'mobile'
                          ? 'bg-gray-200 dark:bg-gray-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )}
              </div>

              {/* 콘텐츠 영역 */}
              <div className={`p-6 min-h-[500px] ${
                showPreview ? 'bg-gray-50 dark:bg-gray-900' : ''
              }`}>
                <div className={`${
                  showPreview && previewDevice === 'mobile' 
                    ? 'max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4' 
                    : ''
                }`}>
                  {selectedPage.blocks.length === 0 ? (
                    <div className="text-center py-12">
                      <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {isEditing ? '왼쪽 패널에서 블록을 추가하세요' : '콘텐츠가 없습니다'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPage.blocks.map((block) => (
                        <div
                          key={block.id}
                          draggable={isEditing && !showPreview}
                          onDragStart={(e) => handleDragStart(e, block.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, block.id)}
                          onClick={() => isEditing && !showPreview && setSelectedBlock(block.id)}
                          className={`${
                            isEditing && !showPreview
                              ? `cursor-move p-4 rounded-lg border-2 transition-all relative ${
                                  selectedBlock === block.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                                }`
                              : ''
                          }`}
                        >
                          {/* 블록 타입 라벨 */}
                          {isEditing && !showPreview && (
                            <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              {(() => {
                                const labels: Partial<Record<ContentBlock['type'], string>> = {
                                  heading: '제목',
                                  text: '텍스트',
                                  image: '이미지',
                                  button: '버튼',
                                  alert: '알림',
                                  card: '카드',
                                  list: '목록',
                                  spacer: '공백',
                                  divider: '구분선'
                                };
                                return labels[block.type] || block.type;
                              })()}
                            </div>
                          )}
                          
                          {renderBlock(block, showPreview)}
                          
                          {/* 블록 액션 버튼 */}
                          {isEditing && !showPreview && selectedBlock === block.id && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateBlock(block.id);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                title="복제"
                              >
                                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </button>
                              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id);
                                }}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                페이지를 선택하거나 새로 만드세요
              </p>
              <button
                onClick={() => setShowPageModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                새 페이지 만들기
              </button>
            </div>
          )}

          {/* 블록 속성 편집 패널 */}
          {isEditing && selectedBlock && selectedPage && (
            <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold dark:text-white mb-4">블록 속성</h3>
              {(() => {
                const block = selectedPage.blocks.find(b => b.id === selectedBlock);
                if (!block) return null;

                return (
                  <div className="space-y-4">
                    {/* 콘텐츠 편집 */}
                    {(block.type === 'heading' || block.type === 'text') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          텍스트
                        </label>
                        <textarea
                          value={block.content.text}
                          onChange={(e) => updateBlockContent(block.id, { ...block.content, text: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={block.type === 'text' ? 3 : 1}
                        />
                      </div>
                    )}

                    {block.type === 'button' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            버튼 텍스트
                          </label>
                          <input
                            type="text"
                            value={block.content.text}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            링크 URL
                          </label>
                          <input
                            type="text"
                            value={block.content.link || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, link: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://example.com"
                          />
                        </div>
                      </>
                    )}

                    {block.type === 'image' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            이미지 URL
                          </label>
                          <input
                            type="text"
                            value={block.content.src || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, src: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            대체 텍스트
                          </label>
                          <input
                            type="text"
                            value={block.content.alt || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, alt: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            너비
                          </label>
                          <select
                            value={block.style.width || '100%'}
                            onChange={(e) => updateBlockStyle(block.id, { width: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="100%">전체 너비</option>
                            <option value="75%">75%</option>
                            <option value="50%">50%</option>
                            <option value="25%">25%</option>
                            <option value="auto">자동</option>
                          </select>
                        </div>
                      </>
                    )}

                    {block.type === 'alert' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            제목 (선택)
                          </label>
                          <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            내용
                          </label>
                          <textarea
                            value={block.content.text || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            타입
                          </label>
                          <select
                            value={block.style.type || 'info'}
                            onChange={(e) => {
                              const type = e.target.value;
                              const colors = {
                                info: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
                                success: { backgroundColor: '#f0fdf4', borderColor: '#22c55e' },
                                warning: { backgroundColor: '#fffbeb', borderColor: '#f59e0b' },
                                error: { backgroundColor: '#fef2f2', borderColor: '#ef4444' }
                              };
                              updateBlockStyle(block.id, { type, ...colors[type as keyof typeof colors] });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="info">정보</option>
                            <option value="success">성공</option>
                            <option value="warning">경고</option>
                            <option value="error">오류</option>
                          </select>
                        </div>
                      </>
                    )}

                    {block.type === 'card' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            제목
                          </label>
                          <input
                            type="text"
                            value={block.content.title || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            내용
                          </label>
                          <textarea
                            value={block.content.text || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, text: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            목록 항목 (선택사항, 줄바꿈으로 구분)
                          </label>
                          <textarea
                            value={block.content.items?.join('\n') || ''}
                            onChange={(e) => updateBlockContent(block.id, { ...block.content, items: e.target.value.split('\n').filter(item => item.trim()) })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="항목 1&#10;항목 2&#10;항목 3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            배경색
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={block.style.backgroundColor || '#f9fafb'}
                              onChange={(e) => updateBlockStyle(block.id, { backgroundColor: e.target.value })}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={block.style.backgroundColor || '#f9fafb'}
                              onChange={(e) => updateBlockStyle(block.id, { backgroundColor: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            텍스트 색상
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={block.style.color || '#000000'}
                              onChange={(e) => updateBlockStyle(block.id, { color: e.target.value })}
                              className="w-12 h-10 rounded-lg cursor-pointer"
                            />
                            <input
                              type="text"
                              value={block.style.color || '#000000'}
                              onChange={(e) => updateBlockStyle(block.id, { color: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            모서리 둥글기
                          </label>
                          <select
                            value={block.style.borderRadius || '12px'}
                            onChange={(e) => updateBlockStyle(block.id, { borderRadius: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="0px">직각</option>
                            <option value="8px">약간 둥글게</option>
                            <option value="12px">보통</option>
                            <option value="16px">많이 둥글게</option>
                            <option value="24px">매우 둥글게</option>
                          </select>
                        </div>
                      </>
                    )}

                    {block.type === 'list' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          목록 항목 (줄바꿈으로 구분)
                        </label>
                        <textarea
                          value={block.content.items?.join('\n') || ''}
                          onChange={(e) => updateBlockContent(block.id, { ...block.content, items: e.target.value.split('\n').filter(item => item.trim()) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          rows={4}
                          placeholder="항목 1&#10;항목 2&#10;항목 3"
                        />
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            목록 스타일
                          </label>
                          <select
                            value={block.style.listStyle || 'disc'}
                            onChange={(e) => updateBlockStyle(block.id, { listStyle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="disc">● 원형</option>
                            <option value="decimal">1. 숫자</option>
                            <option value="square">■ 사각형</option>
                            <option value="none">없음</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {block.type === 'spacer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          공백 높이
                        </label>
                        <select
                          value={block.style.height || '20px'}
                          onChange={(e) => updateBlockStyle(block.id, { height: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="10px">작게 (10px)</option>
                          <option value="20px">보통 (20px)</option>
                          <option value="40px">크게 (40px)</option>
                          <option value="60px">매우 크게 (60px)</option>
                        </select>
                      </div>
                    )}

                    {block.type === 'columns' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          열 개수
                        </label>
                        <select
                          value={block.content.columnCount || 2}
                          onChange={(e) => updateBlockContent(block.id, { ...block.content, columnCount: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="2">2열</option>
                          <option value="3">3열</option>
                          <option value="4">4열</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          모바일에서는 자동으로 1열로 표시됩니다
                        </p>
                      </div>
                    )}

                    {/* 정렬 */}
                    {(block.type === 'heading' || block.type === 'text' || block.type === 'button' || block.type === 'image') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          정렬
                        </label>
                        <div className="flex gap-2">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              onClick={() => updateBlockStyle(block.id, { align })}
                              className={`p-2 rounded-lg transition-colors ${
                                block.style.align === align
                                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {align === 'left' && <AlignLeft className="w-4 h-4" />}
                              {align === 'center' && <AlignCenter className="w-4 h-4" />}
                              {align === 'right' && <AlignRight className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 색상 */}
                    {(block.type === 'heading' || block.type === 'text' || block.type === 'button') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {block.type === 'button' ? '텍스트 색상' : '색상'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={block.style.color || '#000000'}
                            onChange={(e) => updateBlockStyle(block.id, { color: e.target.value })}
                            className="w-12 h-10 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={block.style.color || '#000000'}
                            onChange={(e) => updateBlockStyle(block.id, { color: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* 배경색 - 버튼 전용 */}
                    {block.type === 'button' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          배경색
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={block.style.backgroundColor || '#3b82f6'}
                            onChange={(e) => updateBlockStyle(block.id, { backgroundColor: e.target.value })}
                            className="w-12 h-10 rounded-lg cursor-pointer"
                          />
                          <input
                            type="text"
                            value={block.style.backgroundColor || '#3b82f6'}
                            onChange={(e) => updateBlockStyle(block.id, { backgroundColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* 폰트 크기 */}
                    {(block.type === 'text' || block.type === 'list') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          글자 크기
                        </label>
                        <select
                          value={block.style.fontSize || '16px'}
                          onChange={(e) => updateBlockStyle(block.id, { fontSize: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="14px">작게 (14px)</option>
                          <option value="16px">보통 (16px)</option>
                          <option value="18px">크게 (18px)</option>
                          <option value="20px">더 크게 (20px)</option>
                          <option value="24px">매우 크게 (24px)</option>
                        </select>
                      </div>
                    )}

                    {/* 제목 레벨 */}
                    {block.type === 'heading' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          제목 레벨
                        </label>
                        <select
                          value={block.style.level || 'h2'}
                          onChange={(e) => updateBlockStyle(block.id, { level: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="h1">H1 (가장 큼)</option>
                          <option value="h2">H2</option>
                          <option value="h3">H3</option>
                          <option value="h4">H4 (가장 작음)</option>
                        </select>
                      </div>
                    )}

                    {/* 버튼 스타일 */}
                    {block.type === 'button' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            패딩
                          </label>
                          <select
                            value={block.style.padding || '12px 24px'}
                            onChange={(e) => updateBlockStyle(block.id, { padding: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="8px 16px">작게</option>
                            <option value="12px 24px">보통</option>
                            <option value="16px 32px">크게</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            모서리 둥글기
                          </label>
                          <select
                            value={block.style.borderRadius || '8px'}
                            onChange={(e) => updateBlockStyle(block.id, { borderRadius: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="0px">직각</option>
                            <option value="4px">약간 둥글게</option>
                            <option value="8px">보통</option>
                            <option value="16px">많이 둥글게</option>
                            <option value="9999px">완전히 둥글게</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* 새 페이지 모달 */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">새 페이지 만들기</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  페이지 제목
                </label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="예: 이벤트 안내"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL 경로
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 dark:text-gray-400 mr-1">/</span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="예: event"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPageModal(false);
                  setNewPageTitle('');
                  setNewPageSlug('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                onClick={createNewPage}
                disabled={!newPageTitle || !newPageSlug}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                만들기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}