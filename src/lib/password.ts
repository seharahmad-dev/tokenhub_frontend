export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  special: boolean;
};

export function runChecks(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  };
}

export function allGood(c: PasswordChecks) {
  return c.length && c.upper && c.lower && c.digit && c.special;
}