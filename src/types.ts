export type ComponentType = 'server' | 'client';

export interface Component {
  name: string;
  path: string;
  type: ComponentType;
  imports: string[];
  dependencies: Component[];
}

export interface AnalysisResult {
  components: Component[];
  warnings: Warning[];
  stats: {
    totalComponents: number;
    serverComponents: number;
    clientComponents: number;
    serverToClientDependencies: number;
  };
}

export interface Warning {
  type: 'server-imports-client';
  message: string;
  component: string;
  dependency: string;
}

export interface OutputOptions {
  format: 'json' | 'mermaid' | 'dot';
  output?: string;
}

export interface CLIOptions extends OutputOptions {
  verbose?: boolean;
}