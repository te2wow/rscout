import { AnalysisResult } from '../types';

export class JsonFormatter {
  public format(result: AnalysisResult): string {
    const output = {
      stats: result.stats,
      warnings: result.warnings.map(w => ({
        type: w.type,
        message: w.message,
        component: w.component,
        dependency: w.dependency
      })),
      components: result.components.map(comp => ({
        name: comp.name,
        path: comp.path,
        type: comp.type,
        dependencies: comp.dependencies.map(dep => ({
          name: dep.name,
          path: dep.path,
          type: dep.type
        }))
      }))
    };

    return JSON.stringify(output, null, 2);
  }
}