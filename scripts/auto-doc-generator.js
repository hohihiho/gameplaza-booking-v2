#!/usr/bin/env node

/**
 * 문서 자동 생성 도구
 * API, 컴포넌트, 타입 등의 문서를 자동으로 생성
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AutoDocGenerator {
  constructor() {
    this.docTemplates = {
      api: {
        endpoint: `# {{endpointName}} API

## 개요
{{description}}

## 엔드포인트
\`{{method}} {{path}}\`

## 요청

### 헤더
\`\`\`
Content-Type: application/json
{{authHeader}}
\`\`\`

### 파라미터
{{parameters}}

### 요청 본문
\`\`\`json
{{requestBody}}
\`\`\`

## 응답

### 성공 ({{successCode}})
\`\`\`json
{{successResponse}}
\`\`\`

### 에러
{{errorResponses}}

## 사용 예시

### JavaScript
\`\`\`javascript
{{jsExample}}
\`\`\`

### cURL
\`\`\`bash
{{curlExample}}
\`\`\`

## 참고사항
{{notes}}

---
*자동 생성된 문서 - {{timestamp}}*`,

        collection: `# API 문서

{{apiList}}

## 인증
{{authInfo}}

## 에러 코드
{{errorCodes}}

## 공통 응답 형식
{{commonResponse}}

---
*자동 생성된 문서 - {{timestamp}}*`
      },

      component: {
        single: `# {{componentName}} 컴포넌트

## 개요
{{description}}

## Props
{{propsTable}}

## 사용법

### 기본 사용
\`\`\`tsx
{{basicUsage}}
\`\`\`

### 고급 사용
\`\`\`tsx
{{advancedUsage}}
\`\`\`

## 스타일링
{{styling}}

## 접근성
{{accessibility}}

## 예시
{{examples}}

---
*자동 생성된 문서 - {{timestamp}}*`,

        storybook: `import type { Meta, StoryObj } from '@storybook/react';
import { {{componentName}} } from './{{componentName}}';

const meta: Meta<typeof {{componentName}}> = {
  title: 'Components/{{componentName}}',
  component: {{componentName}},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    {{argTypes}}
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    {{defaultArgs}}
  },
};

export const {{variant1}}: Story = {
  args: {
    {{variant1Args}}
  },
};

export const {{variant2}}: Story = {
  args: {
    {{variant2Args}}
  },
};`
      },

      typescript: {
        types: `# {{fileName}} 타입 정의

## 개요
{{description}}

## 타입들

{{typeDefinitions}}

## 사용 예시
\`\`\`typescript
{{usage}}
\`\`\`

---
*자동 생성된 문서 - {{timestamp}}*`
      }
    };

    this.generatedDocs = [];
  }

  log(message, level = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString('ko-KR');
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.RESET}`);
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  // API 파일 분석
  analyzeApiFile(filePath, content) {
    const analysis = {
      endpoints: [],
      methods: [],
      types: []
    };

    // Next.js API 라우트 분석
    const handlerMatch = content.match(/export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/);
    if (handlerMatch) {
      analysis.handlerName = handlerMatch[1];
    }

    // HTTP 메서드 찾기
    const methodMatches = content.match(/req\.method\s*===?\s*['"](\w+)['"]/g);
    if (methodMatches) {
      methodMatches.forEach(match => {
        const method = match.match(/['"](\w+)['"]/)[1];
        analysis.methods.push(method);
      });
    }

    // 경로 분석 (파일 경로에서 추출)
    const routePath = filePath
      .replace(/.*\/api/, '/api')
      .replace(/\/route\.(ts|js)$/, '')
      .replace(/\/\[([^\]]+)\]/g, '/:$1');
    
    analysis.path = routePath;

    // 요청/응답 타입 찾기
    const typeMatches = content.match(/interface\s+(\w+)|type\s+(\w+)\s*=/g);
    if (typeMatches) {
      typeMatches.forEach(match => {
        const typeName = match.match(/(?:interface|type)\s+(\w+)/)[1];
        analysis.types.push(typeName);
      });
    }

    return analysis;
  }

  // 컴포넌트 파일 분석
  analyzeComponentFile(filePath, content) {
    const analysis = {
      name: '',
      props: [],
      exports: [],
      imports: [],
      isDefaultExport: false
    };

    // 컴포넌트 이름 추출
    const componentName = path.basename(filePath, path.extname(filePath));
    analysis.name = componentName;

    // Props 인터페이스 찾기
    const propsMatch = content.match(/interface\s+(\w*Props?\w*)\s*{([^}]*)}/s);
    if (propsMatch) {
      const propsContent = propsMatch[2];
      const propLines = propsContent.split('\n').filter(line => line.trim());
      
      propLines.forEach(line => {
        const propMatch = line.match(/(\w+)(\??):\s*([^;,]+)/);
        if (propMatch) {
          analysis.props.push({
            name: propMatch[1],
            optional: propMatch[2] === '?',
            type: propMatch[3].trim(),
            description: ''
          });
        }
      });
    }

    // 기본 내보내기 확인
    analysis.isDefaultExport = content.includes('export default');

    // 명명된 내보내기 찾기
    const namedExports = content.match(/export\s+(?:const|function|class)\s+(\w+)/g);
    if (namedExports) {
      namedExports.forEach(exp => {
        const name = exp.match(/export\s+(?:const|function|class)\s+(\w+)/)[1];
        analysis.exports.push(name);
      });
    }

    return analysis;
  }

  // TypeScript 타입 파일 분석
  analyzeTypeFile(filePath, content) {
    const analysis = {
      interfaces: [],
      types: [],
      enums: []
    };

    // 인터페이스 찾기
    const interfaceMatches = content.match(/export\s+interface\s+(\w+)\s*{([^}]*)}/gs);
    if (interfaceMatches) {
      interfaceMatches.forEach(match => {
        const nameMatch = match.match(/interface\s+(\w+)/);
        const bodyMatch = match.match(/{([^}]*)}/s);
        
        if (nameMatch && bodyMatch) {
          const properties = bodyMatch[1]
            .split('\n')
            .filter(line => line.trim() && !line.trim().startsWith('//'))
            .map(line => {
              const propMatch = line.match(/(\w+)(\??):\s*([^;,]+)/);
              return propMatch ? {
                name: propMatch[1],
                optional: propMatch[2] === '?',
                type: propMatch[3].trim()
              } : null;
            })
            .filter(Boolean);

          analysis.interfaces.push({
            name: nameMatch[1],
            properties
          });
        }
      });
    }

    // 타입 별칭 찾기
    const typeMatches = content.match(/export\s+type\s+(\w+)\s*=\s*([^;]+)/g);
    if (typeMatches) {
      typeMatches.forEach(match => {
        const parts = match.match(/type\s+(\w+)\s*=\s*([^;]+)/);
        if (parts) {
          analysis.types.push({
            name: parts[1],
            definition: parts[2].trim()
          });
        }
      });
    }

    // 열거형 찾기
    const enumMatches = content.match(/export\s+enum\s+(\w+)\s*{([^}]*)}/gs);
    if (enumMatches) {
      enumMatches.forEach(match => {
        const nameMatch = match.match(/enum\s+(\w+)/);
        const bodyMatch = match.match(/{([^}]*)}/s);
        
        if (nameMatch && bodyMatch) {
          const members = bodyMatch[1]
            .split(',')
            .map(member => member.trim())
            .filter(Boolean);

          analysis.enums.push({
            name: nameMatch[1],
            members
          });
        }
      });
    }

    return analysis;
  }

  // API 문서 생성
  generateApiDoc(filePath, analysis) {
    const endpointName = analysis.path.split('/').pop() || 'endpoint';
    
    let template = this.docTemplates.api.endpoint;
    
    // 메서드별 예시 생성
    const methods = analysis.methods.length > 0 ? analysis.methods : ['GET'];
    const primaryMethod = methods[0];
    
    // 파라미터 테이블 생성
    let parameters = '| 이름 | 타입 | 필수 | 설명 |\n|------|------|------|------|\n';
    if (analysis.path.includes(':')) {
      const pathParams = analysis.path.match(/:(\w+)/g);
      if (pathParams) {
        pathParams.forEach(param => {
          const paramName = param.replace(':', '');
          parameters += `| ${paramName} | string | ✅ | ${paramName} 식별자 |\n`;
        });
      }
    }

    // 에러 응답 생성
    const errorResponses = `
### 400 Bad Request
\`\`\`json
{
  "error": "잘못된 요청",
  "message": "요청 데이터를 확인해주세요"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "인증 필요",
  "message": "로그인이 필요합니다"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "서버 오류",
  "message": "내부 서버 오류가 발생했습니다"
}
\`\`\``;

    // JavaScript 예시 생성
    const jsExample = `
const response = await fetch('${analysis.path}', {
  method: '${primaryMethod}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  ${primaryMethod !== 'GET' ? `body: JSON.stringify({
    // 요청 데이터
  })` : ''}
});

const data = await response.json();
console.log(data);`;

    // cURL 예시 생성
    const curlExample = `curl -X ${primaryMethod} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  ${primaryMethod !== 'GET' ? `-d '{"key": "value"}' \\` : ''}
  "${analysis.path}"`;

    // 템플릿 치환
    template = template
      .replace(/\{\{endpointName\}\}/g, endpointName)
      .replace(/\{\{description\}\}/g, `${endpointName} API 엔드포인트`)
      .replace(/\{\{method\}\}/g, primaryMethod)
      .replace(/\{\{path\}\}/g, analysis.path)
      .replace(/\{\{authHeader\}\}/g, 'Authorization: Bearer YOUR_TOKEN')
      .replace(/\{\{parameters\}\}/g, parameters)
      .replace(/\{\{requestBody\}\}/g, '{\n  "key": "value"\n}')
      .replace(/\{\{successCode\}\}/g, primaryMethod === 'POST' ? '201' : '200')
      .replace(/\{\{successResponse\}\}/g, '{\n  "success": true,\n  "data": {}\n}')
      .replace(/\{\{errorResponses\}\}/g, errorResponses)
      .replace(/\{\{jsExample\}\}/g, jsExample)
      .replace(/\{\{curlExample\}\}/g, curlExample)
      .replace(/\{\{notes\}\}/g, '- 인증 토큰이 필요합니다\n- 요청 시 Content-Type을 올바르게 설정해주세요')
      .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString('ko-KR'));

    return template;
  }

  // 컴포넌트 문서 생성
  generateComponentDoc(filePath, analysis) {
    let template = this.docTemplates.component.single;
    
    // Props 테이블 생성
    let propsTable = '| Prop | 타입 | 필수 | 기본값 | 설명 |\n|------|------|------|--------|------|\n';
    
    if (analysis.props.length > 0) {
      analysis.props.forEach(prop => {
        propsTable += `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? '❌' : '✅'} | - | ${prop.description || 'TODO: 설명 추가'} |\n`;
      });
    } else {
      propsTable += '| - | - | - | - | Props가 감지되지 않았습니다 |\n';
    }

    // 기본 사용법 예시
    const basicUsage = `import { ${analysis.name} } from './components/${analysis.name}';

function App() {
  return (
    <div>
      <${analysis.name}${analysis.props.length > 0 ? ' />' : ' />'}
    </div>
  );
}`;

    // 고급 사용법 예시
    const advancedUsage = analysis.props.length > 0 ? `<${analysis.name}
${analysis.props.map(prop => `  ${prop.name}={${prop.type.includes('string') ? '"value"' : 'value'}}`).join('\n')}
/>` : `<${analysis.name} />`;

    // 템플릿 치환
    template = template
      .replace(/\{\{componentName\}\}/g, analysis.name)
      .replace(/\{\{description\}\}/g, `${analysis.name} 컴포넌트입니다.`)
      .replace(/\{\{propsTable\}\}/g, propsTable)
      .replace(/\{\{basicUsage\}\}/g, basicUsage)
      .replace(/\{\{advancedUsage\}\}/g, advancedUsage)
      .replace(/\{\{styling\}\}/g, 'Tailwind CSS를 사용하여 스타일링됩니다.')
      .replace(/\{\{accessibility\}\}/g, '접근성 가이드라인을 준수합니다.')
      .replace(/\{\{examples\}\}/g, 'TODO: 실제 사용 예시 추가')
      .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString('ko-KR'));

    return template;
  }

  // Storybook 스토리 생성
  generateStorybookStory(analysis) {
    let template = this.docTemplates.component.storybook;
    
    // ArgTypes 생성
    let argTypes = '';
    if (analysis.props.length > 0) {
      const argTypeList = analysis.props.map(prop => {
        const control = this.getStorybookControl(prop.type);
        return `    ${prop.name}: {\n      control: '${control}',\n      description: '${prop.description || 'TODO: 설명 추가'}'\n    }`;
      });
      argTypes = argTypeList.join(',\n');
    }

    // 기본 args 생성
    let defaultArgs = '';
    if (analysis.props.length > 0) {
      const argsList = analysis.props.map(prop => {
        const defaultValue = this.getDefaultValue(prop.type);
        return `    ${prop.name}: ${defaultValue}`;
      });
      defaultArgs = argsList.join(',\n');
    }

    // 템플릿 치환
    template = template
      .replace(/\{\{componentName\}\}/g, analysis.name)
      .replace(/\{\{argTypes\}\}/g, argTypes)
      .replace(/\{\{defaultArgs\}\}/g, defaultArgs)
      .replace(/\{\{variant1\}\}/g, 'WithProps')
      .replace(/\{\{variant1Args\}\}/g, defaultArgs)
      .replace(/\{\{variant2\}\}/g, 'Interactive')
      .replace(/\{\{variant2Args\}\}/g, defaultArgs);

    return template;
  }

  // TypeScript 타입 문서 생성
  generateTypeDoc(filePath, analysis) {
    let template = this.docTemplates.typescript.types;
    
    const fileName = path.basename(filePath, path.extname(filePath));
    
    // 타입 정의 섹션 생성
    let typeDefinitions = '';
    
    // 인터페이스 추가
    if (analysis.interfaces.length > 0) {
      typeDefinitions += '## 인터페이스\n\n';
      analysis.interfaces.forEach(iface => {
        typeDefinitions += `### ${iface.name}\n\n`;
        typeDefinitions += '| 속성 | 타입 | 필수 | 설명 |\n|------|------|------|------|\n';
        iface.properties.forEach(prop => {
          typeDefinitions += `| ${prop.name} | \`${prop.type}\` | ${prop.optional ? '❌' : '✅'} | TODO: 설명 추가 |\n`;
        });
        typeDefinitions += '\n';
      });
    }

    // 타입 추가
    if (analysis.types.length > 0) {
      typeDefinitions += '## 타입 별칭\n\n';
      analysis.types.forEach(type => {
        typeDefinitions += `### ${type.name}\n\n`;
        typeDefinitions += `\`\`\`typescript\ntype ${type.name} = ${type.definition};\n\`\`\`\n\n`;
      });
    }

    // 열거형 추가
    if (analysis.enums.length > 0) {
      typeDefinitions += '## 열거형\n\n';
      analysis.enums.forEach(enumDef => {
        typeDefinitions += `### ${enumDef.name}\n\n`;
        typeDefinitions += `\`\`\`typescript\nenum ${enumDef.name} {\n`;
        typeDefinitions += enumDef.members.map(member => `  ${member}`).join(',\n');
        typeDefinitions += '\n}\n\`\`\`\n\n';
      });
    }

    // 사용 예시 생성
    const usage = analysis.interfaces.length > 0 ? 
      `import { ${analysis.interfaces[0].name} } from './${fileName}';\n\nconst example: ${analysis.interfaces[0].name} = {\n  // TODO: 예시 데이터 추가\n};` :
      `import { /* 타입들 */ } from './${fileName}';`;

    // 템플릿 치환
    template = template
      .replace(/\{\{fileName\}\}/g, fileName)
      .replace(/\{\{description\}\}/g, `${fileName}에 정의된 TypeScript 타입들입니다.`)
      .replace(/\{\{typeDefinitions\}\}/g, typeDefinitions)
      .replace(/\{\{usage\}\}/g, usage)
      .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString('ko-KR'));

    return template;
  }

  // Storybook 컨트롤 타입 결정
  getStorybookControl(propType) {
    if (propType.includes('string')) return 'text';
    if (propType.includes('number')) return 'number';
    if (propType.includes('boolean')) return 'boolean';
    if (propType.includes('[]') || propType.includes('Array')) return 'object';
    if (propType.includes('|')) return 'select';
    return 'text';
  }

  // 기본값 생성
  getDefaultValue(propType) {
    if (propType.includes('string')) return "'default'";
    if (propType.includes('number')) return '0';
    if (propType.includes('boolean')) return 'false';
    if (propType.includes('[]')) return '[]';
    if (propType.includes('{}')) return '{}';
    return 'undefined';
  }

  // 문서 생성 메인 함수
  async generateDocs(targetFiles = []) {
    this.log('📚 문서 자동 생성 시작', 'INFO');

    let filesToProcess = targetFiles;
    
    if (filesToProcess.length === 0) {
      // 변경된 파일들 자동 감지
      try {
        const gitDiff = await this.runCommand('git', ['diff', '--name-only', 'HEAD']);
        const stagedDiff = await this.runCommand('git', ['diff', '--cached', '--name-only']);
        
        const changedFiles = [...new Set([
          ...gitDiff.split('\n').filter(f => f.trim()),
          ...stagedDiff.split('\n').filter(f => f.trim())
        ])];

        filesToProcess = changedFiles.filter(file => 
          (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
          fs.existsSync(file)
        );
      } catch (error) {
        this.log('Git 변경사항 감지 실패, 전체 스캔 진행', 'WARNING');
        
        // 중요한 디렉토리만 스캔  
        const patterns = [
          'app/api/**/*.{ts,js}',
          'components/**/*.{tsx,jsx}',
          'lib/**/*.ts',
          'types/**/*.ts'
        ];
        
        for (const pattern of patterns) {
          try {
            const files = await this.runCommand('find', ['.', '-path', `*/${pattern.replace('**/', '')}`]);
            filesToProcess.push(...files.split('\n').filter(f => f.trim()));
          } catch (err) {
            // 패턴 매칭 실패는 무시
          }
        }
      }
    }

    if (filesToProcess.length === 0) {
      this.log('문서 생성할 파일이 없습니다.', 'WARNING');
      return;
    }

    this.log(`${filesToProcess.length}개 파일 분석 중...`, 'INFO');

    const docsDir = path.join(process.cwd(), 'docs', 'auto-generated');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const results = [];

    for (const filePath of filesToProcess) {
      try {
        if (!fs.existsSync(filePath)) continue;

        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(process.cwd(), filePath);

        let docContent = '';
        let docPath = '';

        // 파일 타입에 따라 분기
        if (filePath.includes('/api/')) {
          // API 문서 생성
          const analysis = this.analyzeApiFile(filePath, content);
          docContent = this.generateApiDoc(filePath, analysis);
          docPath = path.join(docsDir, 'api', `${analysis.path.replace(/\//g, '-').replace(/^-/, '')}.md`);
          
          const apiDocDir = path.dirname(docPath);
          if (!fs.existsSync(apiDocDir)) {
            fs.mkdirSync(apiDocDir, { recursive: true });
          }

        } else if (filePath.includes('/components/') || (filePath.endsWith('.tsx') && !filePath.includes('/pages/'))) {
          // 컴포넌트 문서 생성
          const analysis = this.analyzeComponentFile(filePath, content);
          docContent = this.generateComponentDoc(filePath, analysis);
          docPath = path.join(docsDir, 'components', `${analysis.name}.md`);
          
          const compDocDir = path.dirname(docPath);
          if (!fs.existsSync(compDocDir)) {
            fs.mkdirSync(compDocDir, { recursive: true });
          }

          // Storybook 스토리도 생성
          const storyContent = this.generateStorybookStory(analysis);
          const storyPath = path.join(process.cwd(), 'stories', `${analysis.name}.stories.ts`);
          const storyDir = path.dirname(storyPath);
          
          if (!fs.existsSync(storyDir)) {
            fs.mkdirSync(storyDir, { recursive: true });
          }
          
          if (!fs.existsSync(storyPath)) {
            fs.writeFileSync(storyPath, storyContent);
            this.log(`📖 Storybook 스토리 생성: ${path.basename(storyPath)}`, 'SUCCESS');
          }

        } else if (filePath.includes('/types/') || filePath.endsWith('.d.ts')) {
          // 타입 문서 생성
          const analysis = this.analyzeTypeFile(filePath, content);
          if (analysis.interfaces.length > 0 || analysis.types.length > 0 || analysis.enums.length > 0) {
            docContent = this.generateTypeDoc(filePath, analysis);
            const fileName = path.basename(filePath, path.extname(filePath));
            docPath = path.join(docsDir, 'types', `${fileName}.md`);
            
            const typeDocDir = path.dirname(docPath);
            if (!fs.existsSync(typeDocDir)) {
              fs.mkdirSync(typeDocDir, { recursive: true });
            }
          }
        }

        if (docContent && docPath) {
          fs.writeFileSync(docPath, docContent);
          this.log(`✅ 문서 생성: ${path.basename(docPath)}`, 'SUCCESS');
          this.generatedDocs.push(docPath);
          
          results.push({
            sourceFile: relativePath,
            docFile: path.relative(process.cwd(), docPath),
            type: this.getDocType(filePath)
          });
        }

      } catch (error) {
        this.log(`❌ ${filePath} 처리 실패: ${error.message}`, 'ERROR');
      }
    }

    // 인덱스 파일 생성
    await this.generateIndexFiles();

    return results;
  }

  // 문서 타입 결정
  getDocType(filePath) {
    if (filePath.includes('/api/')) return 'API';
    if (filePath.includes('/components/')) return 'Component';
    if (filePath.includes('/types/')) return 'Types';
    return 'Other';
  }

  // 인덱스 파일들 생성
  async generateIndexFiles() {
    const docsDir = path.join(process.cwd(), 'docs', 'auto-generated');
    
    // 전체 인덱스
    const indexContent = `# 자동 생성된 문서

이 문서들은 코드에서 자동으로 생성되었습니다.

## 📂 카테고리

- [API 문서](./api/README.md)
- [컴포넌트 문서](./components/README.md)  
- [타입 문서](./types/README.md)

## 📝 문서 목록

${this.generatedDocs.map(docPath => {
  const relativePath = path.relative(docsDir, docPath);
  const title = path.basename(docPath, '.md');
  return `- [${title}](${relativePath})`;
}).join('\n')}

---
*마지막 업데이트: ${new Date().toLocaleString('ko-KR')}*`;

    fs.writeFileSync(path.join(docsDir, 'README.md'), indexContent);

    // 카테고리별 인덱스
    const categories = ['api', 'components', 'types'];
    
    for (const category of categories) {
      const categoryDir = path.join(docsDir, category);
      if (fs.existsSync(categoryDir)) {
        const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md'));
        
        const categoryIndex = `# ${category.toUpperCase()} 문서

${files.map(file => {
  const title = path.basename(file, '.md');
  return `- [${title}](${file})`;
}).join('\n')}

---
*자동 생성된 인덱스*`;

        fs.writeFileSync(path.join(categoryDir, 'README.md'), categoryIndex);
      }
    }

    this.log('📋 인덱스 파일 생성 완료', 'SUCCESS');
  }

  // 문서 서버 시작 (선택적)
  async startDocServer() {
    const docsDir = path.join(process.cwd(), 'docs');
    
    try {
      // docsify 사용해서 문서 서버 시작
      await this.runCommand('npx', ['docsify', 'serve', docsDir, '--port', '3003']);
    } catch (error) {
      this.log('문서 서버 시작 실패 (docsify 설치 필요)', 'WARNING');
    }
  }

  // 메인 실행 함수
  async run(options = {}) {
    const { files = [], startServer = false } = options;

    try {
      const results = await this.generateDocs(files);
      
      if (!results || results.length === 0) {
        this.log('생성된 문서가 없습니다.', 'WARNING');
        return;
      }

      this.log(`🎉 문서 생성 완료! ${results.length}개 파일`, 'SUCCESS');
      
      // 결과 출력
      console.log('\n📚 생성된 문서들:');
      results.forEach(result => {
        console.log(`  📄 ${result.type}: ${result.docFile} (from ${result.sourceFile})`);
      });

      console.log(`\n📂 문서 위치: docs/auto-generated/`);
      console.log(`📋 인덱스: docs/auto-generated/README.md`);

      if (startServer) {
        this.log('📖 문서 서버 시작 중...', 'INFO');
        await this.startDocServer();
      }

    } catch (error) {
      this.log(`❌ 문서 생성 중 오류: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// CLI 실행
async function main() {
  const args = process.argv.slice(2);
  const generator = new AutoDocGenerator();

  try {
    if (args.length === 0) {
      // 기본 모드: 변경된 파일들 자동 감지
      await generator.run();
      
    } else if (args[0] === 'serve') {
      // 문서 서버 시작
      await generator.run({ startServer: true });
      
    } else {
      // 특정 파일들 지정
      await generator.run({ files: args });
    }
    
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = AutoDocGenerator;