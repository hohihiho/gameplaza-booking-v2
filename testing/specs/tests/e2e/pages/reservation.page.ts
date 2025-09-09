import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ReservationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  private readonly deviceSelect = '[data-testid="device-select"]';
  private readonly dateInput = '[data-testid="date-input"]';
  private readonly timeSelect = '[data-testid="time-select"]';
  private readonly durationSelect = '[data-testid="duration-select"]';
  private readonly submitButton = '[data-testid="submit-reservation"]';
  private readonly cancelButton = '[data-testid="cancel-reservation"]';
  private readonly selectedTimeDisplay = '[data-testid="selected-time"]';
  private readonly priceDisplay = '[data-testid="price-display"]';
  private readonly errorMessage = '[data-testid="error-message"]';
  private readonly successMessage = '[data-testid="success-message"]';
  
  // Time slot selectors for 24-hour display
  private readonly timeSlot = (hour: number) => `[data-testid="time-${hour}"]`;
  
  // Actions
  async navigateToReservation() {
    await this.navigate('/reservations/new');
  }

  async selectDevice(deviceId: string) {
    await this.selectOption(this.deviceSelect, deviceId);
  }

  async selectDate(date: Date) {
    const dateString = date.toISOString().split('T')[0];
    await this.fillInput(this.dateInput, dateString);
  }

  async selectTime(hour: string) {
    // 24시간 표시 체계 지원 (24-29시)
    const hourNumber = parseInt(hour);
    if (hourNumber >= 24 && hourNumber <= 29) {
      await this.clickElement(this.timeSlot(hourNumber));
    } else {
      await this.selectOption(this.timeSelect, hour);
    }
  }

  async selectDuration(minutes: string) {
    await this.selectOption(this.durationSelect, minutes);
  }

  async submitReservation() {
    await this.clickElement(this.submitButton);
  }

  async cancelReservation() {
    await this.clickElement(this.cancelButton);
  }

  async getSelectedTime(): Promise<string> {
    return await this.getElementText(this.selectedTimeDisplay);
  }

  async getPrice(): Promise<string> {
    return await this.getElementText(this.priceDisplay);
  }

  async getErrorMessage(): Promise<string> {
    return await this.getElementText(this.errorMessage);
  }

  async isSuccessful(): Promise<boolean> {
    return await this.isElementVisible(this.successMessage);
  }

  async createReservation(deviceId: string, date: Date, hour: string, duration: string) {
    await this.selectDevice(deviceId);
    await this.selectDate(date);
    await this.selectTime(hour);
    await this.selectDuration(duration);
    await this.submitReservation();
  }

  // 새벽 시간대 예약을 위한 특별 메서드
  async createLateNightReservation(deviceId: string, hour: number) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await this.selectDevice(deviceId);
    await this.selectDate(tomorrow);
    await this.clickElement(this.timeSlot(hour)); // 24-29시 직접 클릭
    await this.selectDuration('120'); // 2시간
    await this.submitReservation();
  }
}