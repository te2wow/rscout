import * as path from 'path';
import { glob } from 'glob';
import { ComponentParser } from './parser';
import { Component, AnalysisResult, Warning } from './types';

export class ComponentAnalyzer {
  private parser: ComponentParser;
  private components: Map<string, Component> = new Map();
  private warnings: Warning[] = [];

  constructor(private rootPath: string) {
    this.parser = new ComponentParser(rootPath);
  }

  public async analyze(targetPath: string): Promise<AnalysisResult> {
    const pattern = path.join(targetPath, '**/*.{tsx,ts,jsx,js}');
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });

    for (const file of files) {
      await this.analyzeComponent(file);
    }

    this.resolveDependencies();
    this.detectWarnings();

    const components = Array.from(this.components.values());
    const serverComponents = components.filter(c => c.type === 'server');
    const clientComponents = components.filter(c => c.type === 'client');
    
    const serverToClientDeps = this.warnings.filter(
      w => w.type === 'server-imports-client'
    ).length;

    return {
      components,
      warnings: this.warnings,
      stats: {
        totalComponents: components.length,
        serverComponents: serverComponents.length,
        clientComponents: clientComponents.length,
        serverToClientDependencies: serverToClientDeps
      }
    };
  }

  private async analyzeComponent(filePath: string): Promise<void> {
    try {
      const analysis = this.parser.analyzeFile(filePath);
      const name = this.getComponentName(filePath);

      const component: Component = {
        name,
        path: filePath,
        type: analysis.type,
        imports: analysis.imports,
        dependencies: []
      };

      this.components.set(filePath, component);
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}:`, error);
    }
  }

  private getComponentName(filePath: string): string {
    const relativePath = path.relative(this.rootPath, filePath);
    const parsed = path.parse(relativePath);
    const name = parsed.name === 'index' 
      ? path.basename(parsed.dir) 
      : parsed.name;
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  private resolveDependencies(): void {
    for (const component of this.components.values()) {
      for (const importPath of component.imports) {
        const resolvedPath = this.parser.resolveImportPath(component.path, importPath);
        if (resolvedPath && this.components.has(resolvedPath)) {
          const dependency = this.components.get(resolvedPath)!;
          component.dependencies.push(dependency);
        }
      }
    }
  }

  private detectWarnings(): void {
    for (const component of this.components.values()) {
      if (component.type === 'server') {
        for (const dependency of component.dependencies) {
          if (dependency.type === 'client') {
            this.warnings.push({
              type: 'server-imports-client',
              message: `Server component "${component.name}" imports client component "${dependency.name}"`,
              component: component.path,
              dependency: dependency.path
            });
          }
        }
      }
    }
  }
}