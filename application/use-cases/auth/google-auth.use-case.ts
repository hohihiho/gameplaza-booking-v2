export class GoogleAuthUseCase {
  async execute(token: string) {
    // Google OAuth 처리 로직
    return {
      success: true,
      user: {
        id: 'temp-id',
        email: 'temp@example.com',
        name: 'Temp User'
      }
    };
  }
}

export default new GoogleAuthUseCase();
