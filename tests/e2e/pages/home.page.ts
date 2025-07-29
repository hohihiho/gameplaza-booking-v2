import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  private readonly loginButton = '[data-testid="login-button"]';
  private readonly profileButton = '[data-testid="profile-button"]';
  private readonly reservationButton = '[data-testid="reservation-button"]';
  private readonly quickReservationWidget = '[data-testid="quick-reservation-widget"]';
  private readonly deviceCards = '[data-testid^="device-card-"]';
  
  // Actions
  async navigateToHome() {
    await this.navigate('/');
  }

  async clickLogin() {
    await this.clickElement(this.loginButton);
  }

  async clickReservation() {
    await this.clickElement(this.reservationButton);
  }

  async selectDevice(deviceId: string) {
    await this.clickElement(`[data-testid="device-card-${deviceId}"]`);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isElementVisible(this.profileButton);
  }

  async getAvailableDevices(): Promise<number> {
    const devices = await this.page.$$(this.deviceCards);
    return devices.length;
  }

  async quickReserve(deviceType: string, time: string) {
    const widget = this.page.locator(this.quickReservationWidget);
    await widget.locator(`[data-device-type="${deviceType}"]`).click();
    await widget.locator(`[data-time="${time}"]`).click();
    await widget.locator('[data-testid="quick-reserve-button"]').click();
  }
}