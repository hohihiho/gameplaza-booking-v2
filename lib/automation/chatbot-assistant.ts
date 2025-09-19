/**
 * 챗봇 어시스턴트
 *
 * 기능:
 * - 자연어 처리 및 의도 파악
 * - 자동 응답 생성
 * - 예약 도우미
 * - FAQ 자동 응답
 * - 다국어 지원
 */

import { EventEmitter } from 'events';

type Intent =
  | 'reservation_inquiry'
  | 'reservation_create'
  | 'reservation_cancel'
  | 'reservation_modify'
  | 'device_inquiry'
  | 'price_inquiry'
  | 'location_inquiry'
  | 'operating_hours'
  | 'complaint'
  | 'feedback'
  | 'greeting'
  | 'thanks'
  | 'unknown';

type Entity = {
  type: 'date' | 'time' | 'device' | 'duration' | 'person' | 'location';
  value: string;
  confidence: number;
};

type Language = 'ko' | 'en' | 'ja' | 'zh';

interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  language: Language;
  metadata?: Record<string, any>;
}

interface Response {
  id: string;
  text: string;
  suggestions?: string[];
  actions?: Array<{
    type: string;
    label: string;
    payload: any;
  }>;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: string;
  userId: string;
  messages: Array<Message | Response>;
  context: ConversationContext;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'resolved' | 'escalated' | 'abandoned';
}

interface ConversationContext {
  intent?: Intent;
  entities: Entity[];
  sentiment: 'positive' | 'neutral' | 'negative';
  language: Language;
  previousIntents: Intent[];
  userData?: {
    name?: string;
    tier?: string;
    reservations?: any[];
  };
  stage?: 'greeting' | 'understanding' | 'processing' | 'confirmation' | 'closing';
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  language: Language;
  views: number;
  helpful: number;
}

interface IntentPattern {
  intent: Intent;
  patterns: RegExp[];
  keywords: string[];
  examples: string[];
}

interface ResponseTemplate {
  intent: Intent;
  templates: {
    [key in Language]: string[];
  };
  requiresData?: string[];
}

/**
 * 챗봇 어시스턴트
 */
export class ChatbotAssistant extends EventEmitter {
  private conversations: Map<string, Conversation> = new Map();
  private faqs: FAQ[] = [];
  private intentPatterns: IntentPattern[] = [];
  private responseTemplates: Map<Intent, ResponseTemplate> = new Map();
  private activeConversations: Map<string, string> = new Map(); // userId -> conversationId

  constructor() {
    super();
    this.initializePatterns();
    this.initializeTemplates();
    this.initializeFAQs();
  }

  /**
   * 의도 패턴 초기화
   */
  private initializePatterns(): void {
    this.intentPatterns = [
      {
        intent: 'reservation_create',
        patterns: [
          /예약.*하고.*싶/i,
          /예약.*할래/i,
          /예약.*해.*주/i,
          /빌리고.*싶/i,
          /대여.*하고.*싶/i,
        ],
        keywords: ['예약', '빌리다', '대여', '이용'],
        examples: ['예약하고 싶어요', 'PS5 예약할래요', '오늘 저녁에 예약 가능한가요?'],
      },
      {
        intent: 'reservation_cancel',
        patterns: [
          /예약.*취소/i,
          /취소.*하고.*싶/i,
          /예약.*없애/i,
          /안.*가/i,
        ],
        keywords: ['취소', '없애다', '안가다'],
        examples: ['예약 취소하고 싶어요', '내일 예약 취소할게요'],
      },
      {
        intent: 'device_inquiry',
        patterns: [
          /어떤.*기기/i,
          /뭐.*있/i,
          /기기.*목록/i,
          /게임기.*종류/i,
        ],
        keywords: ['기기', '게임기', '종류', '목록', 'PS5', '스위치', '레이싱'],
        examples: ['어떤 기기가 있나요?', 'PS5 있어요?', '게임기 종류 알려주세요'],
      },
      {
        intent: 'price_inquiry',
        patterns: [
          /가격/i,
          /얼마/i,
          /요금/i,
          /비용/i,
        ],
        keywords: ['가격', '얼마', '요금', '비용', '할인'],
        examples: ['가격이 얼마예요?', '시간당 요금 알려주세요'],
      },
      {
        intent: 'operating_hours',
        patterns: [
          /영업.*시간/i,
          /몇.*시.*까지/i,
          /언제.*오픈/i,
          /열.*시간/i,
        ],
        keywords: ['영업시간', '오픈', '마감', '운영시간'],
        examples: ['영업시간이 어떻게 되나요?', '몇 시까지 해요?'],
      },
      {
        intent: 'greeting',
        patterns: [
          /안녕/i,
          /하이/i,
          /헬로/i,
          /반가/i,
        ],
        keywords: ['안녕', '하이', '헬로', '반가워'],
        examples: ['안녕하세요', '안녕!'],
      },
    ];
  }

  /**
   * 응답 템플릿 초기화
   */
  private initializeTemplates(): void {
    const templates: ResponseTemplate[] = [
      {
        intent: 'greeting',
        templates: {
          ko: [
            '안녕하세요! 광주 게임플라자입니다 😊 무엇을 도와드릴까요?',
            '반갑습니다! 예약이나 문의사항이 있으신가요?',
            '어서오세요! 게임플라자 챗봇입니다. 어떤 도움이 필요하신가요?',
          ],
          en: [
            'Hello! Welcome to Gwangju Game Plaza 😊 How can I help you?',
            'Hi there! Do you have any reservations or inquiries?',
          ],
          ja: ['こんにちは！光州ゲームプラザです。何かお手伝いできることはありますか？'],
          zh: ['你好！欢迎来到光州游戏广场。有什么可以帮助您的吗？'],
        },
      },
      {
        intent: 'reservation_create',
        templates: {
          ko: [
            '예약을 도와드리겠습니다! 어떤 기기를 언제 이용하고 싶으신가요?',
            '네, 예약 가능합니다. 날짜와 시간, 원하시는 기기를 알려주세요.',
            '예약 진행하겠습니다. 언제 방문하실 예정이신가요?',
          ],
          en: ['I\'ll help you with the reservation! Which device would you like to use and when?'],
          ja: ['予約をお手伝いします！いつ、どの機器を利用したいですか？'],
          zh: ['我来帮您预订！您想什么时候使用哪个设备？'],
        },
      },
      {
        intent: 'price_inquiry',
        templates: {
          ko: [
            '기기별 이용 요금은 다음과 같습니다:\n• PS5: 시간당 10,000원\n• 닌텐도 스위치: 시간당 8,000원\n• 레이싱 시뮬레이터: 시간당 15,000원\n• VR 기기: 시간당 12,000원',
            '요금 안내드립니다. 어떤 기기의 가격이 궁금하신가요?',
          ],
          en: ['Here are our rates per hour:\n• PS5: ₩10,000\n• Nintendo Switch: ₩8,000\n• Racing Simulator: ₩15,000\n• VR: ₩12,000'],
          ja: ['料金は以下の通りです：\n• PS5: 1時間10,000ウォン\n• ニンテンドースイッチ: 1時間8,000ウォン'],
          zh: ['价格如下：\n• PS5: 每小时10,000韩元\n• 任天堂Switch: 每小时8,000韩元'],
        },
      },
      {
        intent: 'operating_hours',
        templates: {
          ko: [
            '영업시간 안내드립니다:\n• 평일: 14:00 ~ 24:00\n• 주말/공휴일: 10:00 ~ 02:00\n• 월요일 휴무',
            '저희 게임플라자는 평일 오후 2시부터 자정까지, 주말은 오전 10시부터 새벽 2시까지 운영합니다!',
          ],
          en: ['Operating Hours:\n• Weekdays: 2PM - 12AM\n• Weekends/Holidays: 10AM - 2AM\n• Closed on Mondays'],
          ja: ['営業時間：\n• 平日: 14:00～24:00\n• 週末/祝日: 10:00～02:00\n• 月曜定休'],
          zh: ['营业时间：\n• 平日: 14:00-24:00\n• 周末/节假日: 10:00-02:00\n• 周一休息'],
        },
      },
    ];

    for (const template of templates) {
      this.responseTemplates.set(template.intent, template);
    }
  }

  /**
   * FAQ 초기화
   */
  private initializeFAQs(): void {
    this.faqs = [
      {
        id: 'faq_1',
        question: '주차장이 있나요?',
        answer: '네, 건물 지하에 무료 주차장이 있습니다. 이용 시간만큼 주차 가능합니다.',
        keywords: ['주차', '주차장', '파킹'],
        category: '시설',
        language: 'ko',
        views: 0,
        helpful: 0,
      },
      {
        id: 'faq_2',
        question: '음식물 반입이 가능한가요?',
        answer: '간단한 음료와 스낵은 반입 가능합니다. 단, 냄새가 심한 음식은 자제 부탁드립니다.',
        keywords: ['음식', '음료', '반입', '먹을거리'],
        category: '이용규칙',
        language: 'ko',
        views: 0,
        helpful: 0,
      },
      {
        id: 'faq_3',
        question: '예약 없이도 이용 가능한가요?',
        answer: '네, 현장에서도 이용 가능하지만 주말에는 예약을 권장드립니다.',
        keywords: ['예약', '현장', '워크인'],
        category: '예약',
        language: 'ko',
        views: 0,
        helpful: 0,
      },
      {
        id: 'faq_4',
        question: '단체 예약이 가능한가요?',
        answer: '네, 5명 이상 단체 예약 시 10% 할인이 적용됩니다. 전화로 문의해주세요.',
        keywords: ['단체', '그룹', '할인'],
        category: '예약',
        language: 'ko',
        views: 0,
        helpful: 0,
      },
    ];
  }

  /**
   * 메시지 처리
   */
  public async processMessage(
    userId: string,
    text: string,
    language: Language = 'ko'
  ): Promise<Response> {
    // 대화 컨텍스트 가져오기/생성
    let conversation = this.getOrCreateConversation(userId);

    // 메시지 저장
    const message: Message = {
      id: `msg_${Date.now()}`,
      userId,
      text,
      timestamp: new Date(),
      language,
    };
    conversation.messages.push(message);

    // 언어 감지
    const detectedLanguage = this.detectLanguage(text);
    if (detectedLanguage !== language) {
      conversation.context.language = detectedLanguage;
    }

    // 의도 파악
    const intent = this.detectIntent(text, conversation.context);
    conversation.context.intent = intent;

    // 엔티티 추출
    const entities = this.extractEntities(text);
    conversation.context.entities = entities;

    // 감정 분석
    const sentiment = this.analyzeSentiment(text);
    conversation.context.sentiment = sentiment;

    // 응답 생성
    const response = await this.generateResponse(intent, entities, conversation);

    // 응답 저장
    conversation.messages.push(response);

    // 대화 상태 업데이트
    this.updateConversationStage(conversation, intent);

    this.emit('message-processed', {
      message,
      response,
      conversation,
    });

    return response;
  }

  /**
   * 의도 감지
   */
  private detectIntent(text: string, context: ConversationContext): Intent {
    const normalizedText = text.toLowerCase().trim();

    // 패턴 매칭
    for (const pattern of this.intentPatterns) {
      // 정규표현식 매칭
      for (const regex of pattern.patterns) {
        if (regex.test(normalizedText)) {
          return pattern.intent;
        }
      }

      // 키워드 매칭
      for (const keyword of pattern.keywords) {
        if (normalizedText.includes(keyword)) {
          return pattern.intent;
        }
      }
    }

    // FAQ 매칭
    const faqMatch = this.findMatchingFAQ(text);
    if (faqMatch) {
      return 'unknown'; // FAQ는 별도 처리
    }

    // 컨텍스트 기반 추론
    if (context.previousIntents.length > 0) {
      const lastIntent = context.previousIntents[context.previousIntents.length - 1];
      if (lastIntent === 'reservation_create' && normalizedText.includes('네')) {
        return 'reservation_create';
      }
    }

    return 'unknown';
  }

  /**
   * 엔티티 추출
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];

    // 날짜 추출
    const datePatterns = [
      /(\d{1,2})월\s*(\d{1,2})일/,
      /오늘/,
      /내일/,
      /모레/,
      /이번주/,
      /다음주/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.push({
          type: 'date',
          value: match[0],
          confidence: 0.9,
        });
      }
    }

    // 시간 추출
    const timePatterns = [
      /(\d{1,2})시/,
      /오전\s*(\d{1,2})/,
      /오후\s*(\d{1,2})/,
      /저녁/,
      /아침/,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.push({
          type: 'time',
          value: match[0],
          confidence: 0.85,
        });
      }
    }

    // 기기 추출
    const devices = ['PS5', 'ps5', '플스', '플레이스테이션', '스위치', '닌텐도', 'VR', '레이싱'];
    for (const device of devices) {
      if (text.includes(device)) {
        entities.push({
          type: 'device',
          value: device,
          confidence: 0.95,
        });
      }
    }

    // 시간 길이 추출
    const durationPattern = /(\d+)\s*시간/;
    const durationMatch = text.match(durationPattern);
    if (durationMatch) {
      entities.push({
        type: 'duration',
        value: durationMatch[1],
        confidence: 0.9,
      });
    }

    return entities;
  }

  /**
   * 감정 분석
   */
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['좋', '감사', '최고', '훌륭', '만족', '친절', '빠르'];
    const negativeWords = ['나쁘', '불만', '실망', '화나', '짜증', '별로', '최악'];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) positiveScore++;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeScore++;
    }

    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  /**
   * 응답 생성
   */
  private async generateResponse(
    intent: Intent,
    entities: Entity[],
    conversation: Conversation
  ): Promise<Response> {
    const template = this.responseTemplates.get(intent);
    const language = conversation.context.language;

    let responseText = '';
    let suggestions: string[] = [];
    let actions: any[] = [];

    if (template) {
      const templates = template.templates[language] || template.templates.ko;
      responseText = templates[Math.floor(Math.random() * templates.length)];

      // 엔티티 기반 응답 커스터마이징
      if (intent === 'reservation_create') {
        const deviceEntity = entities.find(e => e.type === 'device');
        const dateEntity = entities.find(e => e.type === 'date');
        const timeEntity = entities.find(e => e.type === 'time');

        if (deviceEntity && dateEntity && timeEntity) {
          responseText = `${deviceEntity.value}를 ${dateEntity.value} ${timeEntity.value}에 예약하시겠습니까?`;
          suggestions = ['네, 예약할게요', '다른 시간 보기', '취소'];
          actions = [
            {
              type: 'confirm_reservation',
              label: '예약 확인',
              payload: { device: deviceEntity.value, date: dateEntity.value, time: timeEntity.value },
            },
          ];
        } else if (deviceEntity) {
          responseText = `${deviceEntity.value} 예약을 원하시는군요! 언제 이용하실 예정이신가요?`;
          suggestions = ['오늘', '내일', '이번 주말'];
        } else {
          suggestions = ['PS5', '닌텐도 스위치', '레이싱 시뮬레이터', 'VR'];
        }
      }
    } else {
      // FAQ 검색
      const faq = this.findMatchingFAQ(conversation.messages[conversation.messages.length - 1].text);
      if (faq) {
        responseText = faq.answer;
        faq.views++;
      } else {
        // 기본 응답
        responseText = this.getDefaultResponse(language);
        suggestions = ['예약하기', '요금 안내', '영업시간', '오시는 길'];
      }
    }

    return {
      id: `res_${Date.now()}`,
      text: responseText,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      actions: actions.length > 0 ? actions : undefined,
    };
  }

  /**
   * FAQ 검색
   */
  private findMatchingFAQ(text: string): FAQ | null {
    const normalizedText = text.toLowerCase();
    let bestMatch: FAQ | null = null;
    let bestScore = 0;

    for (const faq of this.faqs) {
      let score = 0;

      // 키워드 매칭
      for (const keyword of faq.keywords) {
        if (normalizedText.includes(keyword)) {
          score += 10;
        }
      }

      // 질문 유사도
      const questionWords = faq.question.toLowerCase().split(' ');
      for (const word of questionWords) {
        if (normalizedText.includes(word)) {
          score += 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    return bestScore > 15 ? bestMatch : null;
  }

  /**
   * 대화 가져오기/생성
   */
  private getOrCreateConversation(userId: string): Conversation {
    const existingId = this.activeConversations.get(userId);

    if (existingId) {
      const conversation = this.conversations.get(existingId);
      if (conversation && conversation.status === 'active') {
        return conversation;
      }
    }

    // 새 대화 생성
    const conversation: Conversation = {
      id: `conv_${Date.now()}`,
      userId,
      messages: [],
      context: {
        entities: [],
        sentiment: 'neutral',
        language: 'ko',
        previousIntents: [],
      },
      startedAt: new Date(),
      status: 'active',
    };

    this.conversations.set(conversation.id, conversation);
    this.activeConversations.set(userId, conversation.id);

    return conversation;
  }

  /**
   * 대화 단계 업데이트
   */
  private updateConversationStage(conversation: Conversation, intent: Intent): void {
    conversation.context.previousIntents.push(intent);

    switch (intent) {
      case 'greeting':
        conversation.context.stage = 'greeting';
        break;
      case 'reservation_create':
      case 'reservation_modify':
        conversation.context.stage = 'processing';
        break;
      case 'thanks':
        conversation.context.stage = 'closing';
        break;
      default:
        conversation.context.stage = 'understanding';
    }

    // 대화가 길어지면 에스컬레이션
    if (conversation.messages.length > 20) {
      conversation.status = 'escalated';
      this.emit('conversation-escalated', conversation);
    }
  }

  /**
   * 언어 감지
   */
  private detectLanguage(text: string): Language {
    // 간단한 언어 감지
    if (/[가-힣]/.test(text)) return 'ko';
    if (/[ぁ-ゔ]/.test(text)) return 'ja';
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    return 'en';
  }

  /**
   * 기본 응답
   */
  private getDefaultResponse(language: Language): string {
    const responses = {
      ko: '죄송합니다, 잘 이해하지 못했어요. 다시 한 번 말씀해주시겠어요?',
      en: 'Sorry, I didn\'t understand that. Could you please rephrase?',
      ja: 'すみません、よく分かりませんでした。もう一度お願いします。',
      zh: '对不起，我没有理解。请您再说一遍。',
    };

    return responses[language] || responses.ko;
  }

  /**
   * 대화 종료
   */
  public endConversation(userId: string): void {
    const conversationId = this.activeConversations.get(userId);
    if (conversationId) {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.endedAt = new Date();
        conversation.status = 'resolved';
      }
      this.activeConversations.delete(userId);
    }
  }

  /**
   * 대화 이력 조회
   */
  public getConversationHistory(userId: string): Conversation[] {
    const history: Conversation[] = [];

    for (const conversation of this.conversations.values()) {
      if (conversation.userId === userId) {
        history.push(conversation);
      }
    }

    return history.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * 통계
   */
  public getStatistics(): {
    totalConversations: number;
    activeConversations: number;
    averageMessageCount: number;
    intentDistribution: Record<Intent, number>;
    sentimentDistribution: Record<string, number>;
    escalationRate: number;
  } {
    const stats = {
      totalConversations: this.conversations.size,
      activeConversations: this.activeConversations.size,
      averageMessageCount: 0,
      intentDistribution: {} as Record<Intent, number>,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      escalationRate: 0,
    };

    let totalMessages = 0;
    let escalatedCount = 0;

    for (const conversation of this.conversations.values()) {
      totalMessages += conversation.messages.length;

      if (conversation.status === 'escalated') {
        escalatedCount++;
      }

      // 감정 분포
      stats.sentimentDistribution[conversation.context.sentiment]++;

      // 의도 분포
      for (const intent of conversation.context.previousIntents) {
        stats.intentDistribution[intent] = (stats.intentDistribution[intent] || 0) + 1;
      }
    }

    stats.averageMessageCount = this.conversations.size > 0
      ? totalMessages / this.conversations.size
      : 0;

    stats.escalationRate = this.conversations.size > 0
      ? (escalatedCount / this.conversations.size) * 100
      : 0;

    return stats;
  }
}

// 싱글톤 인스턴스
export const chatbotAssistant = new ChatbotAssistant();