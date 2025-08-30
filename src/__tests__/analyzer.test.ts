import { ComponentAnalyzer } from '../analyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ComponentAnalyzer', () => {
  let tempDir: string;
  let analyzer: ComponentAnalyzer;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rscout-analyzer-test-'));
    analyzer = new ComponentAnalyzer(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should analyze a simple project structure', async () => {
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, 'ServerComponent.tsx'), `
export default function ServerComponent() {
  return <div>Server</div>;
}
`);

    fs.writeFileSync(path.join(srcDir, 'ClientComponent.tsx'), `
'use client'

export default function ClientComponent() {
  return <div>Client</div>;
}
`);

    const result = await analyzer.analyze(srcDir);

    expect(result.components).toHaveLength(2);
    expect(result.stats.totalComponents).toBe(2);
    expect(result.stats.serverComponents).toBe(1);
    expect(result.stats.clientComponents).toBe(1);
    expect(result.warnings).toHaveLength(0);
  });

  it('should detect server importing client warning', async () => {
    const srcDir = path.join(tempDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(path.join(srcDir, 'ClientComponent.tsx'), `
'use client'

export default function ClientComponent() {
  return <div>Client</div>;
}
`);

    fs.writeFileSync(path.join(srcDir, 'ServerComponent.tsx'), `
import ClientComponent from './ClientComponent';

export default function ServerComponent() {
  return <div><ClientComponent /></div>;
}
`);

    const result = await analyzer.analyze(srcDir);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('server-imports-client');
    expect(result.stats.serverToClientDependencies).toBe(1);
  });

  it('should handle nested directory structures', async () => {
    const srcDir = path.join(tempDir, 'src');
    const componentsDir = path.join(srcDir, 'components');
    fs.mkdirSync(componentsDir, { recursive: true });

    fs.writeFileSync(path.join(componentsDir, 'Button.tsx'), `
'use client'

export default function Button() {
  return <button>Click me</button>;
}
`);

    fs.writeFileSync(path.join(srcDir, 'Page.tsx'), `
import Button from './components/Button';

export default function Page() {
  return <div><Button /></div>;
}
`);

    const result = await analyzer.analyze(srcDir);

    expect(result.components).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
  });
});