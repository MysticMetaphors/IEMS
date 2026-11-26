import { passwordStrength, validateRegistration, validateSignIn } from '@/lib/auth/validation';

const valid = {
  name: 'Maria Santos',
  email: 'maria@example.com',
  password: 'longenough',
  confirmPassword: 'longenough',
};

describe('registration validation', () => {
  it('accepts a complete form', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it('reports every invalid field', () => {
    const errors = validateRegistration({
      name: '  ',
      email: 'maria@',
      password: 'short',
      confirmPassword: 'other',
    });

    expect(Object.keys(errors).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
  });
});

describe('sign-in validation', () => {
  it('accepts an email with spaces and capitals', () => {
    expect(validateSignIn({ email: ' Maria@Example.com ', password: 'x' })).toEqual({});
  });

  it('requires both fields', () => {
    expect(Object.keys(validateSignIn({ email: '', password: '' }))).toHaveLength(2);
  });
});

describe('password strength', () => {
  it.each([
    ['', 0],
    ['abcdefgh', 1],
    ['Abcdefgh', 2],
    ['Abcdefg1', 3],
    ['Abcdef1!', 4],
  ])('scores %j as %i', (password, score) => {
    expect(passwordStrength(password)).toBe(score);
  });
});
