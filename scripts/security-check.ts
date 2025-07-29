#!/usr/bin/env npx tsx

/**
 * 보안 설정 검증 스크립트
 * 개발/배포 전에 보안 설정이 올바른지 확인합니다.
 */

import fs from 'fs'
import path from 'path'

interface SecurityCheck {
  name: string
  description: string
  check: () => Promise<boolean> | boolean
  critical: boolean
}

class SecurityValidator {
  private checks: SecurityCheck[] = []
  private errors: string[] = []
  private warnings: string[] = []

  constructor() {
    this.setupChecks()
  }

  private setupChecks() {
    this.checks = [
      {
        name: 'Environment Variables',
        description: '필수 환경 변수가 설정되어 있는지 확인',
        check: () => this.checkEnvironmentVariables(),
        critical: true,
      },
      {
        name: 'NextAuth Secret',
        description: 'NextAuth 시크릿이 안전하게 설정되어 있는지 확인',
        check: () => this.checkNextAuthSecret(),
        critical: true,
      },
      {
        name: 'Hardcoded Secrets',
        description: '하드코딩된 시크릿이 있는지 확인',
        check: () => this.checkHardcodedSecrets(),
        critical: true,
      },
      {
        name: 'Security Headers',
        description: '보안 헤더 설정이 올바른지 확인',
        check: () => this.checkSecurityHeaders(),
        critical: false,
      },
      {
        name: 'Production Settings',
        description: '프로덕션 환경 설정이 올바른지 확인',
        check: () => this.checkProductionSettings(),
        critical: false,
      },
    ]
  }

  async runAllChecks(): Promise<void> {
    console.log('🔐 보안 설정 검증을 시작합니다...\n')

    for (const check of this.checks) {
      try {
        const result = await check.check()
        if (result) {
          console.log(`✅ ${check.name}: 통과`)
        } else {
          const message = `❌ ${check.name}: 실패 - ${check.description}`
          if (check.critical) {
            this.errors.push(message)
          } else {
            this.warnings.push(message)
          }
          console.log(message)
        }
      } catch (error) {
        const message = `💥 ${check.name}: 오류 - ${error}`
        this.errors.push(message)
        console.log(message)
      }
    }

    this.printSummary()
  }

  private checkEnvironmentVariables(): boolean {
    const requiredVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]

    const missingVars = requiredVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.log(`   누락된 환경 변수: ${missingVars.join(', ')}`)
      return false
    }

    return true
  }

  private checkNextAuthSecret(): boolean {
    const secret = process.env.NEXTAUTH_SECRET
    
    if (!secret) {
      console.log('   NEXTAUTH_SECRET이 설정되지 않았습니다.')
      return false
    }

    if (secret.length < 32) {
      console.log('   NEXTAUTH_SECRET이 너무 짧습니다. (최소 32자)')
      return false
    }

    if (secret === 'your-secret-key-here-must-be-32-characters-long') {
      console.log('   NEXTAUTH_SECRET이 기본값으로 설정되어 있습니다.')
      return false
    }

    return true
  }

  private async checkHardcodedSecrets(): Promise<boolean> {
    const filesToCheck = [
      'auth.ts',
      'lib/config/env.ts',
      'lib/supabase/admin.ts',
      'lib/supabase/client.ts',
    ]

    const suspiciousPatterns = [
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
      /eyJ[a-zA-Z0-9+/=]+/, // JWT tokens
      /AKIA[A-Z0-9]{16}/, // AWS access keys
      /https:\/\/[a-z0-9-]+\.supabase\.co/, // Supabase URLs in non-config files
    ]

    for (const file of filesToCheck) {
      const filePath = path.join(process.cwd(), file)
      
      if (!fs.existsSync(filePath)) {
        continue
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          console.log(`   의심스러운 패턴이 ${file}에서 발견되었습니다.`)
          return false
        }
      }
    }

    return true
  }

  private checkSecurityHeaders(): boolean {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js')
    
    if (!fs.existsSync(nextConfigPath)) {
      console.log('   next.config.js 파일을 찾을 수 없습니다.')
      return false
    }

    const content = fs.readFileSync(nextConfigPath, 'utf-8')
    
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Content-Security-Policy',
      'X-XSS-Protection',
    ]

    const missingHeaders = requiredHeaders.filter(header => !content.includes(header))
    
    if (missingHeaders.length > 0) {
      console.log(`   누락된 보안 헤더: ${missingHeaders.join(', ')}`)
      return false
    }

    return true
  }

  private checkProductionSettings(): boolean {
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (!isProduction) {
      console.log('   개발 환경에서는 프로덕션 설정을 검사하지 않습니다.')
      return true
    }

    const issues: string[] = []

    // HTTPS 확인
    if (!process.env.NEXTAUTH_URL?.startsWith('https://')) {
      issues.push('NEXTAUTH_URL이 HTTPS를 사용하지 않습니다.')
    }

    // 디버그 모드 확인
    if (process.env.NEXTAUTH_DEBUG === 'true') {
      issues.push('프로덕션에서 NEXTAUTH_DEBUG가 활성화되어 있습니다.')
    }

    if (issues.length > 0) {
      console.log(`   프로덕션 설정 문제: ${issues.join(', ')}`)
      return false
    }

    return true
  }

  private printSummary(): void {
    console.log('\n📊 보안 검증 결과:')
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 모든 보안 검사를 통과했습니다!')
    } else {
      if (this.errors.length > 0) {
        console.log(`\n💥 치명적 오류 (${this.errors.length}개):`)
        this.errors.forEach(error => console.log(`  - ${error}`))
      }

      if (this.warnings.length > 0) {
        console.log(`\n⚠️  경고 (${this.warnings.length}개):`)
        this.warnings.forEach(warning => console.log(`  - ${warning}`))
      }

      if (this.errors.length > 0) {
        console.log('\n❌ 치명적 오류가 있습니다. 배포하기 전에 수정해주세요.')
        process.exit(1)
      }
    }
  }
}

// 스크립트 실행
async function main() {
  const validator = new SecurityValidator()
  await validator.runAllChecks()
}

if (require.main === module) {
  main().catch(console.error)
}

export { SecurityValidator }