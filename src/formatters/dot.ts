import { AnalysisResult } from '../types';

export class DotFormatter {
  public format(result: AnalysisResult): string {
    const lines: string[] = [
      'digraph ComponentDependencies {',
      '    rankdir=TB;',
      '    node [shape=box];',
      ''
    ];

    const nodeIds = new Map<string, string>();
    let idCounter = 0;

    lines.push('    // Component nodes');
    for (const component of result.components) {
      const id = `node${idCounter++}`;
      nodeIds.set(component.path, id);
      const color = component.type === 'server' ? 'lightblue' : 'lightyellow';
      const style = component.type === 'server' ? 'filled' : 'filled,rounded';
      lines.push(`    ${id} [label="${component.name}", fillcolor="${color}", style="${style}"];`);
    }

    lines.push('');
    lines.push('    // Dependencies');
    for (const component of result.components) {
      const fromId = nodeIds.get(component.path)!;
      for (const dep of component.dependencies) {
        const toId = nodeIds.get(dep.path);
        if (toId) {
          const isWarning = component.type === 'server' && dep.type === 'client';
          const color = isWarning ? 'red' : 'black';
          const style = isWarning ? 'dashed' : 'solid';
          lines.push(`    ${fromId} -> ${toId} [color="${color}", style="${style}"];`);
        }
      }
    }

    if (result.warnings.length > 0) {
      lines.push('');
      lines.push(`    // Warnings: ${result.warnings.length} server-to-client dependencies`);
    }

    lines.push('}');
    return lines.join('\n');
  }
}