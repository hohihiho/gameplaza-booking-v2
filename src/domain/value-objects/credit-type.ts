/**
 * 크레딧 타입을 나타내는 Value Object
 */
export class CreditType {
  private readonly _value: string;

  // 지원되는 크레딧 타입
  static readonly FIXED = new CreditType('fixed');
  static readonly FREEPLAY = new CreditType('freeplay');
  static readonly UNLIMITED = new CreditType('unlimited');

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * 문자열로부터 CreditType 생성
   */
  static fromString(value: string): CreditType {
    const normalizedValue = value.toLowerCase().trim();
    
    switch (normalizedValue) {
      case 'fixed':
        return CreditType.FIXED;
      case 'freeplay':
        return CreditType.FREEPLAY;
      case 'unlimited':
        return CreditType.UNLIMITED;
      default:
        throw new Error(`유효하지 않은 크레딧 타입입니다: ${value}`);
    }
  }

  /**
   * 모든 크레딧 타입 반환
   */
  static getAllTypes(): CreditType[] {
    return [
      CreditType.FIXED,
      CreditType.FREEPLAY,
      CreditType.UNLIMITED
    ];
  }

  /**
   * 크레딧 타입 값 반환
   */
  get value(): string {
    return this._value;
  }

  /**
   * 문자열로 변환
   */
  toString(): string {
    return this._value;
  }

  /**
   * 한국어 라벨 반환
   */
  toKoreanLabel(): string {
    switch (this._value) {
      case 'fixed':
        return '고정 크레딧';
      case 'freeplay':
        return '프리플레이';
      case 'unlimited':
        return '무제한';
      default:
        return this._value;
    }
  }

  /**
   * 설명 반환
   */
  getDescription(): string {
    switch (this._value) {
      case 'fixed':
        return '정해진 크레딧으로 플레이';
      case 'freeplay':
        return '시간 내 무제한 플레이';
      case 'unlimited':
        return '크레딧 제한 없이 플레이';
      default:
        return '';
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: CreditType): boolean {
    return this._value === other._value;
  }

  /**
   * 고정 크레딧 타입인지 확인
   */
  isFixed(): boolean {
    return this.equals(CreditType.FIXED);
  }

  /**
   * 프리플레이 타입인지 확인
   */
  isFreeplay(): boolean {
    return this.equals(CreditType.FREEPLAY);
  }

  /**
   * 무제한 타입인지 확인
   */
  isUnlimited(): boolean {
    return this.equals(CreditType.UNLIMITED);
  }

  /**
   * 크레딧 제한이 있는지 확인
   */
  hasLimit(): boolean {
    return this.isFixed();
  }

  /**
   * 시간 기반 플레이인지 확인
   */
  isTimeBased(): boolean {
    return this.isFreeplay() || this.isUnlimited();
  }
}