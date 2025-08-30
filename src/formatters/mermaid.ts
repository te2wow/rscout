import { AnalysisResult, Component } from '../types';

export class MermaidFormatter {
  public format(result: AnalysisResult): string {
    const lines: string[] = ['graph TD'];
    const nodeIds = new Map<string, string>();
    let idCounter = 0;

    for (const component of result.components) {
      const id = `node${idCounter++}`;
      nodeIds.set(component.path, id);
      const shape = component.type === 'server' ? '[' : '(';
      const endShape = component.type === 'server' ? ']' : ')';
      const style = component.type === 'server' ? ':::server' : ':::client';
      lines.push(`    ${id}${shape}"${component.name}"${endShape}${style}`);
    }

    for (const component of result.components) {
      const fromId = nodeIds.get(component.path)!;
      for (const dep of component.dependencies) {
        const toId = nodeIds.get(dep.path);
        if (toId) {
          const isWarning = component.type === 'server' && dep.type === 'client';
          const style = isWarning ? '-.->|warning|' : '-->';
          lines.push(`    ${fromId} ${style} ${toId}`);
        }
      }
    }

    lines.push('');
    lines.push('    classDef server fill:#e1f5fe,stroke:#01579b,stroke-width:2px;');
    lines.push('    classDef client fill:#fff3e0,stroke:#e65100,stroke-width:2px;');
    
    if (result.warnings.length > 0) {
      lines.push('');
      lines.push(`    %% Warnings: ${result.warnings.length} server-to-client dependencies detected`);
    }

    return lines.join('\n');
  }
}