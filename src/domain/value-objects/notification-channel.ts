/**
 * 알림 채널을 나타내는 Value Object
 */
export class NotificationChannel {
  private readonly _value: string;

  // 지원되는 채널 타입
  static readonly EMAIL = new NotificationChannel('email');
  static readonly SMS = new NotificationChannel('sms');
  static readonly PUSH = new NotificationChannel('push');
  static readonly IN_APP = new NotificationChannel('in_app');
  static readonly KAKAO = new NotificationChannel('kakao');

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * 문자열로부터 NotificationChannel 생성
   */
  static fromString(value: string): NotificationChannel {
    const normalizedValue = value.toLowerCase().trim();
    
    switch (normalizedValue) {
      case 'email':
        return NotificationChannel.EMAIL;
      case 'sms':
        return NotificationChannel.SMS;
      case 'push':
        return NotificationChannel.PUSH;
      case 'in_app':
      case 'in-app':
        return NotificationChannel.IN_APP;
      case 'kakao':
        return NotificationChannel.KAKAO;
      default:
        throw new Error(`Invalid notification channel: ${value}`);
    }
  }

  /**
   * 모든 채널 타입 반환
   */
  static getAllChannels(): NotificationChannel[] {
    return [
      NotificationChannel.EMAIL,
      NotificationChannel.SMS,
      NotificationChannel.PUSH,
      NotificationChannel.IN_APP,
      NotificationChannel.KAKAO
    ];
  }

  /**
   * 채널 값 반환
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
   * 동등성 비교
   */
  equals(other: NotificationChannel): boolean {
    return this._value === other._value;
  }

  /**
   * 이메일 채널인지 확인
   */
  isEmail(): boolean {
    return this.equals(NotificationChannel.EMAIL);
  }

  /**
   * SMS 채널인지 확인
   */
  isSMS(): boolean {
    return this.equals(NotificationChannel.SMS);
  }

  /**
   * 푸시 알림 채널인지 확인
   */
  isPush(): boolean {
    return this.equals(NotificationChannel.PUSH);
  }

  /**
   * 인앱 알림 채널인지 확인
   */
  isInApp(): boolean {
    return this.equals(NotificationChannel.IN_APP);
  }

  /**
   * 카카오 알림 채널인지 확인
   */
  isKakao(): boolean {
    return this.equals(NotificationChannel.KAKAO);
  }

  /**
   * 외부 서비스가 필요한 채널인지 확인
   */
  requiresExternalService(): boolean {
    return this.isEmail() || this.isSMS() || this.isPush() || this.isKakao();
  }
}