import { JsonFormatter, MermaidFormatter, DotFormatter } from '../formatters';
import { AnalysisResult, Component } from '../types';

describe('Formatters', () => {
  const mockResult: AnalysisResult = {
    components: [
      {
        name: 'ServerComponent',
        path: '/src/ServerComponent.tsx',
        type: 'server',
        imports: ['./ClientComponent'],
        dependencies: []
      },
      {
        name: 'ClientComponent',
        path: '/src/ClientComponent.tsx',
        type: 'client',
        imports: [],
        dependencies: []
      }
    ],
    warnings: [
      {
        type: 'server-imports-client',
        message: 'Server component "ServerComponent" imports client component "ClientComponent"',
        component: '/src/ServerComponent.tsx',
        dependency: '/src/ClientComponent.tsx'
      }
    ],
    stats: {
      totalComponents: 2,
      serverComponents: 1,
      clientComponents: 1,
      serverToClientDependencies: 1
    }
  };

  beforeEach(() => {
    mockResult.components[0].dependencies = [mockResult.components[1]];
  });

  describe('JsonFormatter', () => {
    it('should format analysis result as JSON', () => {
      const formatter = new JsonFormatter();
      const output = formatter.format(mockResult);
      const parsed = JSON.parse(output);

      expect(parsed.stats).toEqual(mockResult.stats);
      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.components).toHaveLength(2);
      expect(parsed.components[0].dependencies).toHaveLength(1);
    });
  });

  describe('MermaidFormatter', () => {
    it('should format analysis result as Mermaid diagram', () => {
      const formatter = new MermaidFormatter();
      const output = formatter.format(mockResult);

      expect(output).toContain('graph TD');
      expect(output).toContain('ServerComponent');
      expect(output).toContain('ClientComponent');
      expect(output).toContain('-.->|warning|');
      expect(output).toContain('classDef server');
      expect(output).toContain('classDef client');
    });
  });

  describe('DotFormatter', () => {
    it('should format analysis result as Graphviz DOT', () => {
      const formatter = new DotFormatter();
      const output = formatter.format(mockResult);

      expect(output).toContain('digraph ComponentDependencies');
      expect(output).toContain('ServerComponent');
      expect(output).toContain('ClientComponent');
      expect(output).toContain('color="red"');
      expect(output).toContain('style="dashed"');
      expect(output).toContain('fillcolor="lightblue"');
      expect(output).toContain('fillcolor="lightyellow"');
    });
  });
});