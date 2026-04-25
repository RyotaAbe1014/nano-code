import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { readFile } from '../readFile';

// テスト用のワークスペース内一時ディレクトリ
const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');
const TEST_DIR_NAME = '__readfile_test__';
const TEST_DIR = path.join(WORKSPACE_ROOT, TEST_DIR_NAME);

beforeAll(async () => {
  // workspace 自体が存在しない場合に備えて作成
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  await fs.mkdir(TEST_DIR, { recursive: true });

  // 通常ファイル
  await fs.writeFile(path.join(TEST_DIR, 'hello.txt'), 'こんにちは', 'utf-8');

  // サブディレクトリ内のファイル
  await fs.mkdir(path.join(TEST_DIR, 'sub'), { recursive: true });
  await fs.writeFile(path.join(TEST_DIR, 'sub', 'nested.txt'), 'nested content', 'utf-8');

  // 空ファイル
  await fs.writeFile(path.join(TEST_DIR, 'empty.txt'), '', 'utf-8');

  // 100KB超のファイル（101KB）
  await fs.writeFile(path.join(TEST_DIR, 'large.txt'), 'a'.repeat(101 * 1024), 'utf-8');
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('readFile', () => {
  describe('ツール定義', () => {
    it('name と description を持つ', () => {
      expect(readFile.name).toBe('readFile');
      expect(typeof readFile.description).toBe('string');
      expect(readFile.description.length).toBeGreaterThan(0);
    });

    it('parameters は path を required に持つ JSON Schema', () => {
      expect(readFile.parameters.type).toBe('object');
      expect(readFile.parameters.properties.path.type).toBe('string');
      expect(readFile.parameters.required).toContain('path');
    });
  });

  describe('正常系', () => {
    it('ワークスペース内のファイルを読み込める', async () => {
      const content = await readFile.execute({
        path: path.join(TEST_DIR_NAME, 'hello.txt'),
      });
      expect(content).toBe('こんにちは');
    });

    it('サブディレクトリのファイルを読み込める', async () => {
      const content = await readFile.execute({
        path: path.join(TEST_DIR_NAME, 'sub', 'nested.txt'),
      });
      expect(content).toBe('nested content');
    });

    it('空ファイルを読み込める', async () => {
      const content = await readFile.execute({
        path: path.join(TEST_DIR_NAME, 'empty.txt'),
      });
      expect(content).toBe('');
    });
  });

  describe('異常系: パス検証', () => {
    it('ワークスペース外（../）を指定するとエラー', async () => {
      await expect(
        readFile.execute({ path: '../package.json' })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('絶対パスでワークスペース外を指定するとエラー', async () => {
      await expect(
        readFile.execute({ path: '/etc/hosts' })
      ).rejects.toThrow(/ワークスペース外/);
    });
  });

  describe('異常系: ファイル種別とサイズ', () => {
    it('ディレクトリを指定するとエラー', async () => {
      await expect(
        readFile.execute({ path: path.join(TEST_DIR_NAME, 'sub') })
      ).rejects.toThrow(/通常ファイルではありません/);
    });

    it('100KBを超えるファイルはエラー', async () => {
      await expect(
        readFile.execute({ path: path.join(TEST_DIR_NAME, 'large.txt') })
      ).rejects.toThrow(/ファイルが大きすぎます/);
    });

    it('存在しないファイルはエラー', async () => {
      await expect(
        readFile.execute({ path: path.join(TEST_DIR_NAME, 'nope.txt') })
      ).rejects.toThrow();
    });
  });
});
