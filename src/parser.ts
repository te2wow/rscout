import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { ComponentType } from './types';

export class ComponentParser {
  constructor(rootPath: string) {
    const configPath = ts.findConfigFile(
      rootPath,
      ts.sys.fileExists,
      'tsconfig.json'
    );
    
    let config: ts.ParsedCommandLine;
    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      config = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
    } else {
      config = {
        options: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.React,
        },
        fileNames: [],
        errors: []
      };
    }
    
  }

  public analyzeFile(filePath: string): {
    type: ComponentType;
    imports: string[];
    hasUseClientDirective: boolean;
  } {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TSX
    );

    const hasUseClientDirective = this.hasUseClientDirective(content);
    const imports = this.extractImports(sourceFile);

    return {
      type: hasUseClientDirective ? 'client' : 'server',
      imports,
      hasUseClientDirective
    };
  }

  private hasUseClientDirective(content: string): boolean {
    const lines = content.split('\n');
    for (const line of lines.slice(0, 10)) {
      const trimmed = line.trim();
      if (trimmed === "'use client'" || trimmed === '"use client"' || 
          trimmed === "'use client';" || trimmed === '"use client";') {
        return true;
      }
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
        break;
      }
    }
    return false;
  }

  private extractImports(sourceFile: ts.SourceFile): string[] {
    const imports: string[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          imports.push(moduleSpecifier.text);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  public resolveImportPath(fromPath: string, importPath: string): string | null {
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromPath);
      const resolvedPath = path.resolve(dir, importPath);
      
      const extensions = ['.tsx', '.ts', '.jsx', '.js'];
      for (const ext of extensions) {
        if (fs.existsSync(resolvedPath + ext)) {
          return resolvedPath + ext;
        }
      }
      
      const indexPaths = extensions.map(ext => path.join(resolvedPath, `index${ext}`));
      for (const indexPath of indexPaths) {
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
    
    return null;
  }
}