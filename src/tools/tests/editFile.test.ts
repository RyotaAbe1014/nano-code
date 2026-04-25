import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { editFile } from '../editFile';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');
const TEST_DIR_NAME = '__editfile_test__';
const TEST_DIR = path.join(WORKSPACE_ROOT, TEST_DIR_NAME);

beforeAll(async () => {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
});

beforeEach(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

async function setupFile(name: string, content: string): Promise<string> {
  const filePath = path.join(TEST_DIR, name);
  await fs.writeFile(filePath, content, 'utf-8');
  return path.join(TEST_DIR_NAME, name);
}

describe('editFile', () => {
  describe('ツール定義', () => {
    it('name と description を持つ', () => {
      expect(editFile.name).toBe('editFile');
      expect(typeof editFile.description).toBe('string');
      expect(editFile.description.length).toBeGreaterThan(0);
    });

    it('parameters は path / oldText / newText を required に持つ', () => {
      expect(editFile.parameters.type).toBe('object');
      expect(editFile.parameters.properties.path.type).toBe('string');
      expect(editFile.parameters.properties.oldText.type).toBe('string');
      expect(editFile.parameters.properties.newText.type).toBe('string');
      expect(editFile.parameters.required).toEqual(['path', 'oldText', 'newText']);
    });
  });

  describe('正常系', () => {
    it('一意に特定できるテキストを置換できる', async () => {
      const target = await setupFile('a.txt', 'hello world');

      await editFile.execute({
        path: target,
        oldText: 'world',
        newText: 'TypeScript',
      });

      const updated = await fs.readFile(path.join(TEST_DIR, 'a.txt'), 'utf-8');
      expect(updated).toBe('hello TypeScript');
    });

    it('複数行にまたがるテキストも置換できる', async () => {
      const before = 'line1\nline2\nline3';
      const target = await setupFile('multi.txt', before);

      await editFile.execute({
        path: target,
        oldText: 'line2\nline3',
        newText: 'replaced',
      });

      const updated = await fs.readFile(path.join(TEST_DIR, 'multi.txt'), 'utf-8');
      expect(updated).toBe('line1\nreplaced');
    });

    it('newText が空文字列なら削除になる', async () => {
      const target = await setupFile('del.txt', 'keep DELETE keep');

      await editFile.execute({
        path: target,
        oldText: ' DELETE',
        newText: '',
      });

      const updated = await fs.readFile(path.join(TEST_DIR, 'del.txt'), 'utf-8');
      expect(updated).toBe('keep keep');
    });

    it('日本語テキストも置換できる', async () => {
      const target = await setupFile('ja.txt', 'こんにちは、世界');

      await editFile.execute({
        path: target,
        oldText: '世界',
        newText: 'TypeScript',
      });

      const updated = await fs.readFile(path.join(TEST_DIR, 'ja.txt'), 'utf-8');
      expect(updated).toBe('こんにちは、TypeScript');
    });

    it('成功時は変更内容を含むメッセージを返す', async () => {
      const target = await setupFile('msg.txt', 'foo');

      const result = await editFile.execute({
        path: target,
        oldText: 'foo',
        newText: 'bar',
      });

      expect(result).toContain('foo');
      expect(result).toContain('bar');
    });
  });

  describe('異常系: あいまい性チェック', () => {
    it('oldText が見つからない場合エラー', async () => {
      const target = await setupFile('notfound.txt', 'hello world');

      await expect(
        editFile.execute({
          path: target,
          oldText: 'NOT_PRESENT',
          newText: 'x',
        })
      ).rejects.toThrow(/変更対象が見つかりません/);
    });

    it('oldText が複数マッチする場合エラー', async () => {
      const target = await setupFile('dup.txt', 'foo foo foo');

      await expect(
        editFile.execute({
          path: target,
          oldText: 'foo',
          newText: 'bar',
        })
      ).rejects.toThrow(/複数の候補が見つかりました.*3箇所/);
    });

    it('複数マッチで失敗した時はファイルが変更されない', async () => {
      const target = await setupFile('keep.txt', 'foo foo');

      await expect(
        editFile.execute({
          path: target,
          oldText: 'foo',
          newText: 'bar',
        })
      ).rejects.toThrow();

      const unchanged = await fs.readFile(path.join(TEST_DIR, 'keep.txt'), 'utf-8');
      expect(unchanged).toBe('foo foo');
    });

    it('長い oldText が見つからない時はプレビューが省略される', async () => {
      const target = await setupFile('preview.txt', 'hello');
      const longText = 'x'.repeat(100);

      try {
        await editFile.execute({
          path: target,
          oldText: longText,
          newText: 'y',
        });
        throw new Error('should have thrown');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('...');
        // 50文字 + '...' が含まれる想定
        expect(message).toContain('x'.repeat(50));
      }
    });
  });

  describe('異常系: パス検証', () => {
    it('ワークスペース外（../）は拒否される', async () => {
      await expect(
        editFile.execute({
          path: '../escaped.txt',
          oldText: 'a',
          newText: 'b',
        })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('絶対パスでワークスペース外は拒否される', async () => {
      await expect(
        editFile.execute({
          path: '/etc/hosts',
          oldText: 'a',
          newText: 'b',
        })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('存在しないファイルはエラー', async () => {
      await expect(
        editFile.execute({
          path: path.join(TEST_DIR_NAME, 'nope.txt'),
          oldText: 'a',
          newText: 'b',
        })
      ).rejects.toThrow();
    });
  });
});
