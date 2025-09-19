import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceSelector } from '../DeviceSelector';

const mockDeviceTypes = [
  {
    id: '1',
    name: 'TEKKEN 8',
    category: 'NAMCO 게임기',
    model_name: 'NOIR VEWLIX',
    version_name: 'Latest Version',
    requires_approval: false,
    active_device_count: 2,
    total_device_count: 2,
    max_players: 2,
  },
  {
    id: '2',
    name: '스트리트 파이터 6',
    category: 'CAPCOM 게임기',
    model_name: 'Vewlix Diamond Blue',
    requires_approval: true,
    active_device_count: 1,
    total_device_count: 2,
  },
  {
    id: '3',
    name: 'Beatmania IIDX',
    category: 'KONAMI 게임기',
    model_name: 'Lightning Model',
    requires_approval: false,
    active_device_count: 0,
    total_device_count: 1,
  },
];

describe('DeviceSelector', () => {
  const mockOnDeviceSelect = jest.fn();

  beforeEach(() => {
    mockOnDeviceSelect.mockClear();
  });

  it('기기 목록이 올바르게 렌더링되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // 모든 기기가 표시되는지 확인
    expect(screen.getByText('TEKKEN 8')).toBeInTheDocument();
    expect(screen.getByText('스트리트 파이터 6')).toBeInTheDocument();
    expect(screen.getByText('Beatmania IIDX')).toBeInTheDocument();
  });

  it('기기 클릭 시 onDeviceSelect가 호출되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    const tekkenButton = screen.getByText('TEKKEN 8').closest('button');
    fireEvent.click(tekkenButton!);

    expect(mockOnDeviceSelect).toHaveBeenCalledWith('1');
  });

  it('선택된 기기가 하이라이트되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        selectedDeviceId="2"
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    const sfButton = screen.getByText('스트리트 파이터 6').closest('button');
    expect(sfButton).toHaveClass('border-indigo-600');
  });

  it('사용 불가능한 기기는 비활성화되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    const beatmaniaButton = screen.getByText('Beatmania IIDX').closest('button');
    expect(beatmaniaButton).toBeDisabled();
    expect(beatmaniaButton).toHaveClass('opacity-50');
  });

  it('로딩 상태가 올바르게 표시되어야 한다', () => {
    const { container } = render(
      <DeviceSelector
        deviceTypes={[]}
        isLoading={true}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // 스켈레톤 로더가 표시되는지 확인
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('에러 상태가 올바르게 표시되어야 한다', () => {
    const errorMessage = '기기 정보를 불러올 수 없습니다';
    render(
      <DeviceSelector
        deviceTypes={[]}
        error={errorMessage}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('빈 상태가 올바르게 표시되어야 한다', () => {
    const emptyMessage = '사용 가능한 기기가 없습니다';
    render(
      <DeviceSelector
        deviceTypes={[]}
        emptyMessage={emptyMessage}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });

  it('카테고리별 그룹핑이 올바르게 작동해야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        groupByCategory={true}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // 카테고리 헤더가 표시되는지 확인 (h3 태그로 특정)
    const categoryHeaders = screen.getAllByRole('heading', { level: 3 });
    const categoryNames = categoryHeaders.map(header => header.textContent);
    
    expect(categoryNames).toContain('NAMCO 게임기');
    expect(categoryNames).toContain('CAPCOM 게임기');
    expect(categoryNames).toContain('KONAMI 게임기');
  });

  it('기기 정보가 올바르게 표시되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // 모델명 표시
    expect(screen.getByText('NOIR VEWLIX')).toBeInTheDocument();
    expect(screen.getByText('Vewlix Diamond Blue')).toBeInTheDocument();

    // 버전명 표시
    expect(screen.getByText('Latest Version')).toBeInTheDocument();

    // 사용 가능 대수 표시
    expect(screen.getByText('2대 가능')).toBeInTheDocument();
    expect(screen.getByText('1대 가능')).toBeInTheDocument();
    expect(screen.getByText('예약 불가')).toBeInTheDocument();
  });

  it('승인 필요 배지가 올바르게 표시되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // 스트리트 파이터 6는 승인 필요
    const sfCard = screen.getByText('스트리트 파이터 6').closest('button');
    const approvalBadge = sfCard?.querySelector('.text-amber-700');
    expect(approvalBadge).toHaveTextContent('승인 필요');
  });

  it('최대 플레이어 수가 표시되어야 한다', () => {
    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        onDeviceSelect={mockOnDeviceSelect}
      />
    );

    // TEKKEN 8은 최대 2인 플레이 가능
    expect(screen.getByText('최대 2인')).toBeInTheDocument();
  });

  it('커스텀 렌더링이 작동해야 한다', () => {
    const customRender = jest.fn((device, isSelected) => (
      <div key={device.id} data-testid="custom-device">
        {device.name} - {isSelected ? 'Selected' : 'Not Selected'}
      </div>
    ));

    render(
      <DeviceSelector
        deviceTypes={mockDeviceTypes}
        selectedDeviceId="1"
        onDeviceSelect={mockOnDeviceSelect}
        renderDevice={customRender}
      />
    );

    // 커스텀 렌더 함수가 각 기기에 대해 호출되었는지 확인
    expect(customRender).toHaveBeenCalledTimes(3);
    
    // 커스텀 렌더링 결과 확인
    expect(screen.getByText('TEKKEN 8 - Selected')).toBeInTheDocument();
    expect(screen.getByText('스트리트 파이터 6 - Not Selected')).toBeInTheDocument();
  });
});