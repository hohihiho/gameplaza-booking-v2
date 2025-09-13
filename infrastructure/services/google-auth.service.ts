export class GoogleAuthService {
  async verifyToken(token: string) {
    // Google token 검증 로직
    return {
      valid: true,
      payload: {
        email: 'temp@example.com',
        name: 'Temp User'
      }
    };
  }
}

export default new GoogleAuthService();
