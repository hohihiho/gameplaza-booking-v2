// 기기 관리 페이지
// 비전공자 설명: 관리자가 게임기 정보와 요금을 설정하는 페이지입니다
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type Machine = {
  id: string;
  name: string;
  type: string;
  status: string;
  supports2P: boolean;
  priceMode: string;
  creditPrice: number;
  freeplayPrice: number;
  unlimitedPrice: number;
  additionalPlayerRate: number;
  count: number;
};

export default function AdminMachinesPage() {
  const [machines, setMachines] = useState([
    { 
      id: '1', 
      name: '마이마이', 
      type: 'rhythm', 
      status: 'active',
      supports2P: true, 
      priceMode: 'credit', 
      creditPrice: 500,
      freeplayPrice: 0,
      unlimitedPrice: 0,
      additionalPlayerRate: 2,
      count: 4 
    },
    { 
      id: '2', 
      name: '츄니즘', 
      type: 'rhythm', 
      status: 'active',
      supports2P: false, 
      priceMode: 'freeplay', 
      creditPrice: 0,
      freeplayPrice: 5000,
      unlimitedPrice: 0,
      additionalPlayerRate: 1,
      count: 2 
    },
  ]);

  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);

  const priceModes = [
    { value: 'credit', label: '고정 크레딧', description: '크레딧당 요금 설정' },
    { value: 'freeplay', label: '프리플레이', description: '시간당 요금 설정' },
    { value: 'unlimited', label: '무한 크레딧', description: '시간 무관 고정 요금' },
  ];

  const handleSaveMachine = (machine: Machine) => {
    if (machine.id) {
      setMachines(machines.map(m => m.id === machine.id ? machine : m));
    } else {
      setMachines([...machines, { ...machine, id: Date.now().toString() }]);
    }
    setEditingMachine(null);
    setIsAddingMachine(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-light dark:text-white">기기 관리</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">게임기 정보와 요금을 설정합니다</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddingMachine(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            기기 추가
          </motion.button>
        </div>

        {/* 기기 목록 */}
        <div className="grid gap-4">
          {machines.map((machine, index) => (
            <motion.div
              key={machine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-medium dark:text-white">{machine.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {machine.type === 'rhythm' ? '리듬게임' : '격투게임'} • {machine.count}대 보유
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-24">요금제:</span>
                      <span className="text-sm font-medium dark:text-white">
                        {priceModes.find(m => m.value === machine.priceMode)?.label}
                      </span>
                    </div>
                    
                    {machine.priceMode === 'credit' && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-24">크레딧 요금:</span>
                        <span className="text-sm font-medium dark:text-white">
                          {machine.creditPrice}원/크레딧
                        </span>
                      </div>
                    )}
                    
                    {machine.priceMode === 'freeplay' && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-24">시간당 요금:</span>
                        <span className="text-sm font-medium dark:text-white">
                          {machine.freeplayPrice.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    
                    {machine.priceMode === 'unlimited' && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-24">고정 요금:</span>
                        <span className="text-sm font-medium dark:text-white">
                          {machine.unlimitedPrice.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    
                    {machine.supports2P && (
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-24">2P 추가요금:</span>
                        <span className="text-sm font-medium dark:text-white">
                          {machine.additionalPlayerRate}배
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingMachine(machine)}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    className="px-4 py-2 text-sm text-red-600 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 기기 추가/수정 모달 */}
        {(editingMachine || isAddingMachine) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-light mb-6 dark:text-white">
                {editingMachine ? '기기 수정' : '기기 추가'}
              </h2>
              
              <MachineForm
                machine={editingMachine}
                onSave={handleSaveMachine}
                onCancel={() => {
                  setEditingMachine(null);
                  setIsAddingMachine(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}

// 기기 폼 컴포넌트
function MachineForm({ machine, onSave, onCancel }: { 
  machine: Machine | null; 
  onSave: (machine: Machine) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: machine?.name || '',
    type: machine?.type || 'rhythm',
    status: machine?.status || 'active',
    supports2P: machine?.supports2P || false,
    priceMode: machine?.priceMode || 'credit',
    creditPrice: machine?.creditPrice || 500,
    freeplayPrice: machine?.freeplayPrice || 5000,
    unlimitedPrice: machine?.unlimitedPrice || 20000,
    additionalPlayerRate: machine?.additionalPlayerRate || 1.5,
    count: machine?.count || 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: machine?.id || '',
      count: machine?.count || 1,
    } as Machine);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          기기명
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          게임 종류
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
        >
          <option value="rhythm">리듬게임</option>
          <option value="fighting">격투게임</option>
          <option value="racing">레이싱</option>
          <option value="arcade">아케이드</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          보유 대수
        </label>
        <input
          type="number"
          value={formData.count}
          onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          min="1"
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.supports2P}
            onChange={(e) => setFormData({ ...formData, supports2P: e.target.checked })}
            className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            2인 플레이 지원
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          요금제
        </label>
        <div className="space-y-3">
          {[
            { value: 'credit', label: '고정 크레딧', description: '크레딧당 요금' },
            { value: 'freeplay', label: '프리플레이', description: '시간당 요금' },
            { value: 'unlimited', label: '무한 크레딧', description: '고정 요금' },
          ].map((mode) => (
            <label
              key={mode.value}
              className={`block p-4 border rounded-xl cursor-pointer transition-all ${
                formData.priceMode === mode.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="priceMode"
                value={mode.value}
                checked={formData.priceMode === mode.value}
                onChange={(e) => setFormData({ ...formData, priceMode: e.target.value })}
                className="sr-only"
              />
              <div>
                <div className="font-medium dark:text-white">{mode.label}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{mode.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {formData.priceMode === 'credit' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            크레딧당 요금
          </label>
          <input
            type="number"
            value={formData.creditPrice}
            onChange={(e) => setFormData({ ...formData, creditPrice: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            min="0"
            step="100"
          />
        </div>
      )}

      {formData.priceMode === 'freeplay' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            시간당 요금
          </label>
          <input
            type="number"
            value={formData.freeplayPrice}
            onChange={(e) => setFormData({ ...formData, freeplayPrice: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            min="0"
            step="1000"
          />
        </div>
      )}

      {formData.priceMode === 'unlimited' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            고정 요금
          </label>
          <input
            type="number"
            value={formData.unlimitedPrice}
            onChange={(e) => setFormData({ ...formData, unlimitedPrice: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            min="0"
            step="1000"
          />
        </div>
      )}

      {formData.supports2P && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            2인 플레이 요금 배율
          </label>
          <input
            type="number"
            value={formData.additionalPlayerRate}
            onChange={(e) => setFormData({ ...formData, additionalPlayerRate: parseFloat(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            min="1"
            max="3"
            step="0.1"
          />
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          저장
        </button>
      </div>
    </form>
  );
}