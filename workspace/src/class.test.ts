import { describe, it, expect } from "vitest";
import { BankAccount, SavingsAccount } from "./class";

describe("BankAccount class", () => {
  it("creates account with owner and assigns accountNumber and bankName", () => {
    const a = new BankAccount("Alice", 100);
    expect(a.owner).toBe("Alice");
    expect(a.balance).toBe(100);
    expect(BankAccount.bankName).toBe("TypeBank");
    expect(typeof a.accountNumber).toBe("string");
  });

  it("deposit positive amount succeeds and negative/zero fails", () => {
    const a = new BankAccount("Bob", 0);
    const r1 = a.deposit(50);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.balance).toBe(50);

    const r2 = a.deposit(0);
    expect(r2.ok).toBe(false);

    const r3 = a.deposit(-10);
    expect(r3.ok).toBe(false);
  });

  it("withdraw works within balance and fails otherwise", () => {
    const a = new BankAccount("Carol", 100);
    const r1 = a.withdraw(40);
    expect(r1.ok).toBe(true);
    if (r1.ok) expect(r1.balance).toBe(60);

    const r2 = a.withdraw(1000);
    expect(r2.ok).toBe(false);
  });

  it("getter and setter for balance enforce non-negative", () => {
    const a = new BankAccount("Dave", 10);
    a.balance = -100; // should be set to 0
    expect(a.balance).toBe(0);
    a.balance = 5;
    expect(a.balance).toBe(5);
  });

  it("static createAccount works", () => {
    const a = BankAccount.createAccount("Eve", 20);
    expect(a.owner).toBe("Eve");
    expect(a.balance).toBe(20);
  });
});

describe("SavingsAccount inheritance", () => {
  it("has interestRate and applies fee on withdraw", () => {
    const s = new SavingsAccount("Frank", 100, 0.1); // 10% fee
    expect(s.interestRate).toBe(0.1);
    const r = s.withdraw(50);
    // fee = 5, total = 55 -> remaining 45
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.balance).toBeCloseTo(45);
  });

  it("withdraw fails if insufficient including fee", () => {
    const s = new SavingsAccount("Grace", 10, 0.5); // 50% fee
    const r = s.withdraw(8); // total = 12 > 10
    expect(r.ok).toBe(false);
  });
});
