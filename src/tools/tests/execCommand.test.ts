import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execCommand, parseCommand } from '../execCommand';

const WORKSPACE_ROOT = path.resolve(process.cwd(), './workspace');
const TEST_DIR_NAME = '__execcommand_test__';
const TEST_DIR = path.join(WORKSPACE_ROOT, TEST_DIR_NAME);

beforeAll(async () => {
  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  await fs.rm(TEST_DIR, { recursive: true, force: true });
  await fs.mkdir(TEST_DIR, { recursive: true });
  await fs.writeFile(path.join(TEST_DIR, 'a.txt'), 'A', 'utf-8');
  await fs.writeFile(path.join(TEST_DIR, 'b.txt'), 'B', 'utf-8');
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

describe('parseCommand', () => {
  it('空白で分割される', () => {
    expect(parseCommand('ls -la src')).toEqual(['ls', '-la', 'src']);
  });

  it('連続する空白も1つの区切りとして扱われる', () => {
    expect(parseCommand('ls    -la')).toEqual(['ls', '-la']);
  });

  it('シングルクォート内の空白は保持される', () => {
    expect(parseCommand("git commit -m 'hello world'")).toEqual([
      'git',
      'commit',
      '-m',
      'hello world',
    ]);
  });

  it('ダブルクォート内の空白は保持される', () => {
    expect(parseCommand('git commit -m "hello world"')).toEqual([
      'git',
      'commit',
      '-m',
      'hello world',
    ]);
  });

  it('ダブルクォート内のエスケープが処理される', () => {
    expect(parseCommand('echo "say \\"hi\\""')).toEqual(['echo', 'say "hi"']);
  });

  it('シングルクォート内のバックスラッシュはそのまま', () => {
    // シングルクォートはエスケープを解釈しない
    expect(parseCommand("echo 'a\\b'")).toEqual(['echo', 'a\\b']);
  });

  it('クォートが閉じていないとエラー', () => {
    expect(() => parseCommand('echo "unclosed')).toThrow(/クォートが閉じられていません/);
  });

  it('空文字列は空配列を返す', () => {
    expect(parseCommand('')).toEqual([]);
    expect(parseCommand('   ')).toEqual([]);
  });
});

describe('execCommand', () => {
  describe('ツール定義', () => {
    it('name と description を持つ', () => {
      expect(execCommand.name).toBe('execCommand');
      expect(typeof execCommand.description).toBe('string');
    });

    it('parameters は command を required に持つ', () => {
      expect(execCommand.parameters.properties.command.type).toBe('string');
      expect(execCommand.parameters.required).toEqual(['command']);
    });
  });

  describe('正常系', () => {
    it('ls を実行できる', async () => {
      const result = await execCommand.execute({
        command: `ls ${TEST_DIR_NAME}`,
      });
      expect(result).toContain('a.txt');
      expect(result).toContain('b.txt');
    });

    it('引数なしでも実行できる（cwd = WORKSPACE_ROOT）', async () => {
      const result = await execCommand.execute({ command: 'ls' });
      expect(result).toContain(TEST_DIR_NAME);
    });
  });

  describe('異常系: 危険文字チェック', () => {
    it('セミコロンを含むコマンドは拒否', async () => {
      await expect(
        execCommand.execute({ command: 'ls; rm -rf /' })
      ).rejects.toThrow(/コマンド連結・置換文字/);
    });

    it('アンパサンドを含むコマンドは拒否', async () => {
      await expect(
        execCommand.execute({ command: 'ls && cat /etc/passwd' })
      ).rejects.toThrow(/コマンド連結・置換文字/);
    });

    it('バッククォートを含むコマンドは拒否', async () => {
      await expect(
        execCommand.execute({ command: 'echo `whoami`' })
      ).rejects.toThrow(/コマンド連結・置換文字/);
    });

    it('ドル記号を含むコマンドは拒否', async () => {
      await expect(
        execCommand.execute({ command: 'echo $HOME' })
      ).rejects.toThrow(/コマンド連結・置換文字/);
    });
  });

  describe('異常系: ホワイトリスト', () => {
    it('許可されていないコマンドは拒否', async () => {
      await expect(
        execCommand.execute({ command: 'rm -rf .' })
      ).rejects.toThrow(/許可されていません/);
    });

    it('cat も許可外', async () => {
      await expect(
        execCommand.execute({ command: 'cat a.txt' })
      ).rejects.toThrow(/許可されていません/);
    });

    it('空コマンドはエラー', async () => {
      await expect(
        execCommand.execute({ command: '   ' })
      ).rejects.toThrow(/コマンドが空/);
    });
  });

  describe('異常系: パス引数の検証', () => {
    it('引数で ../ を使うと拒否', async () => {
      await expect(
        execCommand.execute({ command: 'ls ../' })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('引数で絶対パス（外部）を使うと拒否', async () => {
      await expect(
        execCommand.execute({ command: 'ls /etc' })
      ).rejects.toThrow(/ワークスペース外/);
    });

    it('スラッシュを含まない引数はパス検証されない', async () => {
      // -la はスラッシュを含まないのでパス検証をスキップ → 通常の ls 実行
      const result = await execCommand.execute({ command: 'ls -la' });
      expect(result).toBeTruthy();
    });
  });

  describe('クォートを使ったケース', () => {
    it('クォート内の空白は1つの引数として渡る', async () => {
      // 存在しないファイル名でも ls はエラーで返ってくる（終了コード != 0）
      // クォートが効いていないと "hello" と "world" の2引数として解釈されてしまう
      const result = await execCommand.execute({
        command: 'ls "hello world.txt"',
      });
      // 終了コードが含まれることを確認（ファイルがないので非0）
      expect(result).toContain('終了コード');
    });
  });
});
