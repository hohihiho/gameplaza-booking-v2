#!/usr/bin/env tsx

/**
 * Canary Deployment Manager for v2 API
 * 
 * 이 스크립트는 v2 API의 점진적 배포를 관리합니다.
 * Vercel Edge Config를 사용하여 트래픽을 제어합니다.
 */

import { createClient } from '@vercel/edge-config';
import fetch from 'node-fetch';

interface CanaryConfig {
  enabled: boolean;
  percentage: number;
  deploymentUrl: string;
  startTime: string;
  lastUpdated?: string;
  metrics?: {
    errorRate: number;
    p95ResponseTime: number;
    requestCount: number;
  };
}

interface DeploymentOptions {
  percentage: number;
  deploymentUrl: string;
  dryRun?: boolean;
}

class CanaryDeploymentManager {
  private edgeConfig: ReturnType<typeof createClient>;
  private vercelToken: string;
  private projectId: string;

  constructor() {
    this.edgeConfig = createClient(process.env.EDGE_CONFIG!);
    this.vercelToken = process.env.VERCEL_TOKEN!;
    this.projectId = process.env.VERCEL_PROJECT_ID!;

    if (!this.vercelToken || !this.projectId) {
      throw new Error('Missing required environment variables');
    }
  }

  /**
   * 현재 Canary 설정 조회
   */
  async getCurrentConfig(): Promise<CanaryConfig | null> {
    try {
      const config = await this.edgeConfig.get<CanaryConfig>('v2-api-canary');
      return config;
    } catch (error) {
      console.error('Failed to get current config:', error);
      return null;
    }
  }

  /**
   * Canary 배포 시작 또는 업데이트
   */
  async deployCanary(options: DeploymentOptions): Promise<void> {
    const { percentage, deploymentUrl, dryRun = false } = options;

    console.log(`🚀 Deploying canary with ${percentage}% traffic`);

    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }

    const config: CanaryConfig = {
      enabled: percentage > 0,
      percentage,
      deploymentUrl,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    if (dryRun) {
      console.log('🔍 Dry run - would update config to:', JSON.stringify(config, null, 2));
      return;
    }

    // Edge Config 업데이트
    await this.updateEdgeConfig(config);

    // 메트릭 수집 시작
    if (percentage > 0) {
      console.log('📊 Starting metrics collection...');
      await this.startMetricsCollection(deploymentUrl);
    }

    console.log('✅ Canary deployment updated successfully');
  }

  /**
   * Canary 트래픽 비율 조정
   */
  async adjustTraffic(percentage: number): Promise<void> {
    const currentConfig = await this.getCurrentConfig();
    
    if (!currentConfig || !currentConfig.enabled) {
      throw new Error('No active canary deployment found');
    }

    console.log(`📈 Adjusting canary traffic from ${currentConfig.percentage}% to ${percentage}%`);

    // 현재 메트릭 확인
    const metrics = await this.getDeploymentMetrics(currentConfig.deploymentUrl);
    
    // metrics null 체크
    if (!metrics) {
      throw new Error('Failed to retrieve deployment metrics');
    }
    
    // 안전성 검사
    if (metrics.errorRate > 1) {
      console.warn('⚠️  Warning: High error rate detected:', metrics.errorRate);
      
      if (percentage > currentConfig.percentage) {
        throw new Error('Cannot increase traffic due to high error rate');
      }
    }

    // 설정 업데이트
    await this.updateEdgeConfig({
      ...currentConfig,
      percentage,
      lastUpdated: new Date().toISOString(),
      metrics,
    });

    console.log('✅ Traffic adjusted successfully');
  }

  /**
   * Canary 배포 롤백
   */
  async rollback(): Promise<void> {
    console.log('🔄 Rolling back canary deployment...');

    const config: CanaryConfig = {
      enabled: false,
      percentage: 0,
      deploymentUrl: '',
      startTime: '',
      lastUpdated: new Date().toISOString(),
    };

    await this.updateEdgeConfig(config);
    console.log('✅ Rollback completed');
  }

  /**
   * 배포 메트릭 조회
   */
  private async getDeploymentMetrics(deploymentUrl: string): Promise<CanaryConfig['metrics']> {
    try {
      const response = await fetch(`${deploymentUrl}/api/v2/metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        errorRate: data.error_rate || 0,
        p95ResponseTime: data.response_time?.p95 || 0,
        requestCount: data.request_count || 0,
      };
    } catch (error) {
      console.error('Failed to get deployment metrics:', error);
      return {
        errorRate: 0,
        p95ResponseTime: 0,
        requestCount: 0,
      };
    }
  }

  /**
   * Edge Config 업데이트
   */
  private async updateEdgeConfig(config: CanaryConfig): Promise<void> {
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              key: 'v2-api-canary',
              value: config,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update Edge Config: ${error}`);
    }
  }

  /**
   * 메트릭 수집 시작
   */
  private async startMetricsCollection(deploymentUrl: string): Promise<void> {
    // 메트릭 수집을 위한 웹훅 등록
    const webhook = {
      url: `${deploymentUrl}/api/internal/metrics-webhook`,
      events: ['deployment.metric'],
      projectId: this.projectId,
    };

    const response = await fetch('https://api.vercel.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhook),
    });

    if (!response.ok) {
      console.warn('Failed to register metrics webhook:', await response.text());
    }
  }

  /**
   * 상태 리포트 생성
   */
  async generateReport(): Promise<void> {
    const config = await this.getCurrentConfig();

    if (!config) {
      console.log('No canary deployment active');
      return;
    }

    console.log('\n📊 Canary Deployment Report');
    console.log('═══════════════════════════');
    console.log(`Status: ${config.enabled ? '🟢 Active' : '🔴 Inactive'}`);
    console.log(`Traffic: ${config.percentage}%`);
    console.log(`Started: ${config.startTime}`);
    console.log(`Last Updated: ${config.lastUpdated}`);

    if (config.metrics) {
      console.log('\nMetrics:');
      console.log(`  Error Rate: ${config.metrics.errorRate.toFixed(2)}%`);
      console.log(`  P95 Response Time: ${config.metrics.p95ResponseTime}ms`);
      console.log(`  Request Count: ${config.metrics.requestCount}`);
    }

    // 권장사항
    if (config.enabled && config.metrics) {
      console.log('\n🎯 Recommendations:');
      
      if (config.metrics.errorRate > 1) {
        console.log('  ⚠️  High error rate detected - consider rolling back');
      } else if (config.metrics.p95ResponseTime > 200) {
        console.log('  ⚠️  Response time above threshold - monitor closely');
      } else if (config.percentage < 100) {
        console.log('  ✅ Metrics look good - safe to increase traffic');
      } else {
        console.log('  ✅ Full deployment successful!');
      }
    }
  }
}

// CLI 인터페이스
async function main() {
  const manager = new CanaryDeploymentManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'deploy':
        const percentage = parseInt(process.argv[3] || '10');
        const deploymentUrl = process.argv[4];
        
        if (!deploymentUrl) {
          throw new Error('Deployment URL required');
        }

        await manager.deployCanary({ percentage, deploymentUrl });
        break;

      case 'adjust':
        const newPercentage = parseInt(process.argv[3]);
        
        if (isNaN(newPercentage)) {
          throw new Error('Valid percentage required');
        }

        await manager.adjustTraffic(newPercentage);
        break;

      case 'rollback':
        await manager.rollback();
        break;

      case 'status':
        await manager.generateReport();
        break;

      default:
        console.log(`
Usage: canary-deploy.ts <command> [options]

Commands:
  deploy <percentage> <deployment-url>  Start canary deployment
  adjust <percentage>                   Adjust traffic percentage
  rollback                             Rollback canary deployment
  status                               Show current status

Examples:
  canary-deploy.ts deploy 10 https://gameplaza-abc123.vercel.app
  canary-deploy.ts adjust 50
  canary-deploy.ts rollback
  canary-deploy.ts status
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

export { CanaryDeploymentManager };