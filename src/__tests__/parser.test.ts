import { ComponentParser } from '../parser';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ComponentParser', () => {
  let tempDir: string;
  let parser: ComponentParser;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rscout-test-'));
    parser = new ComponentParser(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('analyzeFile', () => {
    it('should detect client component with "use client" directive', () => {
      const filePath = path.join(tempDir, 'ClientComponent.tsx');
      fs.writeFileSync(filePath, `'use client'
      
export default function ClientComponent() {
  return <div>Client Component</div>;
}`);

      const result = parser.analyzeFile(filePath);
      expect(result.type).toBe('client');
      expect(result.hasUseClientDirective).toBe(true);
    });

    it('should detect server component without "use client" directive', () => {
      const filePath = path.join(tempDir, 'ServerComponent.tsx');
      fs.writeFileSync(filePath, `export default function ServerComponent() {
  return <div>Server Component</div>;
}`);

      const result = parser.analyzeFile(filePath);
      expect(result.type).toBe('server');
      expect(result.hasUseClientDirective).toBe(false);
    });

    it('should extract imports correctly', () => {
      const filePath = path.join(tempDir, 'Component.tsx');
      fs.writeFileSync(filePath, `import React from 'react';
import { useState } from 'react';
import styles from './styles.module.css';

export default function Component() {
  return <div>Component</div>;
}`);

      const result = parser.analyzeFile(filePath);
      expect(result.imports).toEqual(['react', 'react', './styles.module.css']);
    });
  });

  describe('resolveImportPath', () => {
    it('should resolve relative import paths', () => {
      const componentPath = path.join(tempDir, 'components', 'Component.tsx');
      const helperPath = path.join(tempDir, 'components', 'helper.ts');
      
      fs.mkdirSync(path.dirname(componentPath), { recursive: true });
      fs.writeFileSync(helperPath, 'export const helper = () => {};');

      const resolved = parser.resolveImportPath(componentPath, './helper');
      expect(resolved).toBe(helperPath);
    });

    it('should resolve index files', () => {
      const componentPath = path.join(tempDir, 'Component.tsx');
      const utilsDir = path.join(tempDir, 'utils');
      const indexPath = path.join(utilsDir, 'index.ts');
      
      fs.mkdirSync(utilsDir, { recursive: true });
      fs.writeFileSync(indexPath, 'export const util = () => {};');

      const resolved = parser.resolveImportPath(componentPath, './utils');
      expect(resolved).toBe(indexPath);
    });

    it('should return null for non-existent paths', () => {
      const componentPath = path.join(tempDir, 'Component.tsx');
      const resolved = parser.resolveImportPath(componentPath, './non-existent');
      expect(resolved).toBeNull();
    });

    it('should return null for external modules', () => {
      const componentPath = path.join(tempDir, 'Component.tsx');
      const resolved = parser.resolveImportPath(componentPath, 'react');
      expect(resolved).toBeNull();
    });
  });
});