vi.mock('js-cookie', () => ({
  default: { set: vi.fn(), get: vi.fn(() => 'tok'), remove: vi.fn() },
}));

import Cookies from 'js-cookie';
import { setToken, getToken, setCategory } from './authStorage';

describe('authStorage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('setToken writes the token cookie with hardening options', () => {
    setToken('abc');
    expect(Cookies.set).toHaveBeenCalledWith(
      'token',
      'abc',
      expect.objectContaining({ sameSite: 'strict' })
    );
  });

  it('getToken reads the token cookie', () => {
    expect(getToken()).toBe('tok');
  });

  it('setCategory maps category ids', () => {
    setCategory([{ 'category.category_id': 2 }, { 'category.category_id': 4 }]);
    expect(Cookies.set).toHaveBeenCalledWith('category', [2, 4], expect.any(Object));
  });
});
