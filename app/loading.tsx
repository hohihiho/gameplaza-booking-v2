// 로딩 컴포넌트
// 페이지가 로딩 중일 때 보여주는 화면입니다

import { PageSkeleton } from '@/app/components/ui/Skeleton';

export default function Loading() {
  return <PageSkeleton content="list" />;
}