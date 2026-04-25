import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { writeFile } from '../writeFile';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');
const TEST_DIR_NAME = '__writefile_test__';
const TEST_DIR = path.join(WORKSPACE_ROOT, TEST_DIR_NAME);

beforeAll(async () => {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
});

beforeEach(async () => {
  // 各テスト前にテストディレクトリをクリーンな状態にする
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('writeFile', () => {
  describe('ツール定義', () => {
    it('name と description を持つ', () => {
      expect(writeFile.name).toBe('writeFile');
      expect(typeof writeFile.description).toBe('string');
      expect(writeFile.description.length).toBeGreaterThan(0);
    });

    it('parameters は path と content を required に持つ', () => {
      expect(writeFile.parameters.type).toBe('object');
      expect(writeFile.parameters.properties.path.type).toBe('string');
      expect(writeFile.parameters.properties.content.type).toBe('string');
      expect(writeFile.parameters.required).toEqual(['path', 'content']);
    });
  });

  describe('正常系', () => {
    it('ワークスペース内に新規ファイルを作成できる', async () => {
      const target = path.join(TEST_DIR_NAME, 'new.txt');
      const result = await writeFile.execute({
        path: target,
        content: 'hello',
      });

      expect(result).toBe(`ファイルを書き込みました: ${target}`);

      const written = await fs.readFile(path.join(TEST_DIR, 'new.txt'), 'utf-8');
      expect(written).toBe('hello');
    });

    it('既存ファイルを上書きできる', async () => {
      const filePath = path.join(TEST_DIR, 'overwrite.txt');
      await fs.writeFile(filePath, 'before', 'utf-8');

      await writeFile.execute({
        path: path.join(TEST_DIR_NAME, 'overwrite.txt'),
        content: 'after',
      });

      const written = await fs.readFile(filePath, 'utf-8');
      expect(written).toBe('after');
    });

    it('存在しないサブディレクトリ配下にも書き込める（recursive mkdir）', async () => {
      const target = path.join(TEST_DIR_NAME, 'a', 'b', 'c', 'deep.txt');
      await writeFile.execute({
        path: target,
        content: 'deep',
      });

      const written = await fs.readFile(
        path.join(TEST_DIR, 'a', 'b', 'c', 'deep.txt'),
        'utf-8'
      );
      expect(written).toBe('deep');
    });

    it('空文字列も書き込める', async () => {
      const target = path.join(TEST_DIR_NAME, 'empty.txt');
      await writeFile.execute({ path: target, content: '' });

      const stat = await fs.stat(path.join(TEST_DIR, 'empty.txt'));
      expect(stat.size).toBe(0);
    });

    it('UTF-8の日本語を正しく書き込める', async () => {
      const target = path.join(TEST_DIR_NAME, 'ja.txt');
      await writeFile.execute({ path: target, content: 'こんにちは🌸' });

      const written = await fs.readFile(path.join(TEST_DIR, 'ja.txt'), 'utf-8');
      expect(written).toBe('こんにちは🌸');
    });
  });

  describe('異常系: パス検証', () => {
    it('ワークスペース外（../）への書き込みは拒否される', async () => {
      await expect(
        writeFile.execute({ path: '../escaped.txt', content: 'x' })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('絶対パスでワークスペース外を指定すると拒否される', async () => {
      await expect(
        writeFile.execute({ path: '/tmp/escaped.txt', content: 'x' })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('拒否された場合はファイルが作成されない', async () => {
      const escapedPath = path.resolve(WORKSPACE_ROOT, '../should_not_exist.txt');

      await expect(
        writeFile.execute({ path: '../should_not_exist.txt', content: 'x' })
      ).rejects.toThrow();

      // ファイルが作成されていないことを確認
      await expect(fs.stat(escapedPath)).rejects.toThrow();
    });
  });
});
