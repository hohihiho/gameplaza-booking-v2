export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    const cleaned = this.cleanPhoneNumber(value);
    if (!this.isValid(cleaned)) {
      throw new Error('Invalid phone number format');
    }
    this._value = cleaned;
  }

  static create(value: string): PhoneNumber {
    return new PhoneNumber(value);
  }

  get value(): string {
    return this._value;
  }

  private cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  private isValid(phone: string): boolean {
    // 한국 휴대폰 번호 형식 (010-1234-5678)
    return /^010\d{8}$/.test(phone) || /^01[016789]\d{7,8}$/.test(phone);
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  toFormattedString(): string {
    if (this._value.length === 11) {
      return `${this._value.slice(0, 3)}-${this._value.slice(3, 7)}-${this._value.slice(7)}`;
    }
    return this._value;
  }
}