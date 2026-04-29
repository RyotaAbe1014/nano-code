export type OperationResult =
  | { ok: true; balance: number }
  | { ok: false; error: string };

/**
 * BankAccount: サンプルの銀行口座クラス
 * - constructor のパラメータプロパティ（ショートハンド）を利用
 * - public / private / readonly のプロパティを含む
 * - instance メソッド（deposit / withdraw）
 * - getter / setter（balance）
 * - static メンバ（bankName / createAccount）
 * - 継承された派生クラス（SavingsAccount）を含む
 */
export class BankAccount {
  public readonly accountNumber: string;

  // constructor のパラメータショートハンドで owner を readonly にする
  constructor(public readonly owner: string, private _balance: number = 0) {
    this.accountNumber = `ACCT-${BankAccount.nextId++}`;
  }

  // static プロパティ
  public static bankName: string = "TypeBank";
  private static nextId: number = 1;

  // getter
  public get balance(): number {
    return this._balance;
  }

  // setter: 負の値は 0 に丸める（例外は投げない）
  public set balance(value: number) {
    if (value < 0) {
      this._balance = 0;
    } else {
      this._balance = value;
    }
  }

  // deposit: 正の金額のみ受け付ける
  public deposit(amount: number): OperationResult {
    if (amount <= 0) {
      return { ok: false, error: "deposit amount must be positive" };
    }
    this._balance += amount;
    return { ok: true, balance: this._balance };
  }

  // withdraw: 残高を超える引き出しはエラー
  public withdraw(amount: number): OperationResult {
    if (amount <= 0) {
      return { ok: false, error: "withdraw amount must be positive" };
    }
    if (amount > this._balance) {
      return { ok: false, error: "insufficient funds" };
    }
    this._balance -= amount;
    return { ok: true, balance: this._balance };
  }

  // static ファクトリ
  public static createAccount(owner: string, initialBalance: number = 0): BankAccount {
    return new BankAccount(owner, initialBalance);
  }
}

// 派生クラス: 利息付き貯蓄口座
export class SavingsAccount extends BankAccount {
  constructor(owner: string, balance: number = 0, public readonly interestRate: number = 0.01) {
    super(owner, balance);
  }

  // withdraw を上書きして、手数料（interestRate%）を課す
  public override withdraw(amount: number): OperationResult {
    if (amount <= 0) {
      return { ok: false, error: "withdraw amount must be positive" };
    }
    const fee = amount * this.interestRate;
    const total = amount + fee;
    if (total > this.balance) {
      return { ok: false, error: "insufficient funds including fee" };
    }
    // BankAccount.withdraw を利用して状態を更新
    // BankAccount.withdraw は amount を引く実装なので、ここでは直接操作するために setter を使
    this.balance = this.balance - total;
    return { ok: true, balance: this.balance };
  }
}
