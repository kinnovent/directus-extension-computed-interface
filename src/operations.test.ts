import { describe, expect, test, jest } from '@jest/globals';
import { parseExpression, parseOp, toSlug } from './operations';

jest
  .useFakeTimers()
  .setSystemTime(new Date('2023-01-01'));

describe('Test parseExpression', () => {
  describe('Dynamic variables', () => {
    test('$NOW', () => {
      expect(parseExpression('$NOW', {})).toStrictEqual(new Date());
    });

    test('$CURRENT_USER', () => {
      const user = {
        id: 1,
        name: 'Duy',
        role: {
          name: 'admin',
        },
      };
      expect(parseExpression('$CURRENT_USER', {})).toBe(undefined);
      expect(parseExpression('$CURRENT_USER', { __currentUser: user })).toBe(1);
      expect(parseExpression('$CURRENT_USER.name', { __currentUser: user })).toBe('Duy');
      expect(parseExpression('$CURRENT_USER.role.name', { __currentUser: user })).toBe('admin');
      expect(parseExpression('$CURRENT_USER.something', { __currentUser: user })).toBe(null);
    });
  });

  describe('Type conversion ops', () => {
    test('INT op', () => {
      expect(parseExpression('INT(a)', { a: '1' })).toBe(1);
    });

    test('FLOAT op', () => {
      expect(parseExpression('FLOAT(a)', { a: '1.234' })).toBe(1.234);
    });

    test('STRING op', () => {
      expect(parseExpression('STRING(1)', {})).toBe('1');
      expect(parseExpression('STRING(a)', { a: 123 })).toBe('123');
    });

    test('DATE op', () => {
      expect(parseExpression('DATE(a)', { a: '2022-01-01' })).toEqual(new Date('2022-01-01'));
      expect(parseExpression('DATE(a)', { a: 1640995200000 })).toEqual(new Date('2022-01-01'));
    });

    test('CURRENCY op', () => {
      expect(parseExpression('CURRENCY(a)', { a: 1000 })).toBe('1,000');
    });
  });

  describe('Date ops', () => {
    test('DATE_ISO op', () => {
      expect(parseExpression('DATE_ISO(a)', { a: '2022-01-01' })).toBe('2022-01-01T00:00:00.000Z');
      expect(parseExpression('DATE_ISO($NOW)', {})).toBe('2023-01-01T00:00:00.000Z');
    });

    test('DATE_UTC op', () => {
      expect(parseExpression('DATE_UTC(a)', { a: '2022-01-01' })).toBe('Sat, 01 Jan 2022 00:00:00 GMT');
      expect(parseExpression('DATE_UTC($NOW)', {})).toBe('Sun, 01 Jan 2023 00:00:00 GMT');
    });

    test('DATE_STR op', () => {
      expect(parseExpression('DATE_STR(a)', { a: new Date('2022-12-31') })).toBe('2022-12-31');
      expect(parseExpression('DATE_STR($NOW)', {})).toBe('2023-01-01');
    });

    test('TIME_STR op', () => {
      expect(parseExpression('TIME_STR(a)', { a: new Date('2022-12-31T11:59:59') })).toBe('11:59:59');
      expect(parseExpression('TIME_STR($NOW)', {})).toBe('00:00:00');
    });

    test('YEAR op', () => {
      expect(parseExpression('YEAR($NOW)', {})).toBe(new Date().getFullYear());
    });

    test('MONTH op', () => {
      expect(parseExpression('MONTH($NOW)', {})).toBe(new Date().getMonth());
    });

    test('GET_DATE op', () => {
      expect(parseExpression('GET_DATE($NOW)', {})).toBe(new Date().getDate());
    });

    test('DAY op', () => {
      expect(parseExpression('DAY($NOW)', {})).toBe(new Date().getDay());
    });

    test('HOURS op', () => {
      expect(parseExpression('HOURS($NOW)', {})).toBe(new Date().getHours());
    });

    test('MINUTES op', () => {
      expect(parseExpression('MINUTES($NOW)', {})).toBe(new Date().getMinutes());
    });

    test('SECONDS op', () => {
      expect(parseExpression('SECONDS($NOW)', {})).toBe(new Date().getSeconds());
    });

    test('TIME op', () => {
      expect(parseExpression('TIME($NOW)', {})).toBe(new Date().getTime());
    });
  });

  describe('Arithmetic ops', () => {
    test('ABS op', () => {
      expect(parseExpression('ABS(a)', { a: -1 })).toBe(1);
    });

    test('SQRT op', () => {
      expect(parseExpression('SQRT(a)', { a: 100 })).toBe(10);
    });

    test('SUM op', () => {
      expect(parseExpression('SUM(a)', { a: [1, 2, 3, 4, 5] })).toBe(15);
      expect(parseExpression('SUM(a)', { a: 1 })).toBe(0);
    });

    test('AVERAGE op', () => {
      expect(parseExpression('AVERAGE(a)', { a: [1, 2, 3, 4, 5] })).toBe(3);
      expect(parseExpression('AVERAGE(a)', { a: 1 })).toBe(0);
    });

    test('CEIL op', () => {
      expect(parseExpression('CEIL(a)', { a: 1.234 })).toBe(2);
    });

    test('FLOOR op', () => {
      expect(parseExpression('FLOOR(a)', { a: 1.234 })).toBe(1);
    });

    test('ROUND op', () => {
      expect(parseExpression('ROUND(a)', { a: 1.234 })).toBe(1);
      expect(parseExpression('ROUND(a, b)', { a: 5, b: 2 })).toBe('5.00');
    });

    test('EXP op', () => {
      expect(parseExpression('EXP(a)', { a: 1 })).toBeCloseTo(Math.exp(1), 8);
    });

    test('LOG op', () => {
      expect(parseExpression('LOG(a)', { a: 10 })).toBeCloseTo(Math.log(10), 8);
    });

    test('MAX op', () => {
      expect(parseExpression('MAX(a)', { a: [1, 2, 30, 4, 5] })).toBe(30);
      expect(parseExpression('MAX(a)', { a: 1 })).toBe(0);
      expect(parseExpression('MAX(a, b)', { a: 5, b: 2 })).toBe(5);
    });

    test('MIN op', () => {
      expect(parseExpression('MIN(a)', { a: [1, 2, 3, -4, 5] })).toBe(-4);
      expect(parseExpression('MIN(a)', { a: 1 })).toBe(0);
      expect(parseExpression('MIN(a, b)', { a: 5, b: 2 })).toBe(2);
    });

    test('SUM op', () => {
      expect(parseExpression('SUM(a, b)', { a: 1, b: 2 })).toBe(3);
    });

    test('SUBTRACT op', () => {
      expect(parseExpression('SUBTRACT(a, b)', { a: 5, b: 2 })).toBe(3);
      expect(parseExpression('SUBTRACT(DATE(a), DATE(b))', { a: '2022-01-02', b: '2022-01-01' })).toBe(86400000);
    });

    test('MULTIPLY op', () => {
      expect(parseExpression('MULTIPLY(a, b)', { a: 5, b: 2 })).toBe(10);
    });

    test('DIVIDE op', () => {
      expect(parseExpression('DIVIDE(a, b)', { a: 5, b: 2 })).toBe(2.5);
    });

    test('REMAINDER op', () => {
      expect(parseExpression('REMAINDER(a, b)', { a: 5, b: 2 })).toBe(1);
    });

    test('POWER op', () => {
      expect(parseExpression('POWER(a, b)', { a: 5, b: 2 })).toBe(25);
    });
  });

  describe('Boolean ops', () => {
    test('NULL op', () => {
      expect(parseExpression('NULL(a)', { a: null })).toBe(true);
      expect(parseExpression('NULL(a)', { a: undefined })).toBe(false);
      expect(parseExpression('NULL(a)', { a: 0 })).toBe(false);
      expect(parseExpression('NULL(a)', { a: '' })).toBe(false);
      expect(parseExpression('NULL(a)', { a: {} })).toBe(false);
      expect(parseExpression('NULL(a)', { a: [] })).toBe(false);
    });

    test('NOT_NULL op', () => {
      expect(parseExpression('NOT_NULL(a)', { a: null })).toBe(false);
      expect(parseExpression('NOT_NULL(a)', { a: undefined })).toBe(true);
      expect(parseExpression('NOT_NULL(a)', { a: 0 })).toBe(true);
      expect(parseExpression('NOT_NULL(a)', { a: '' })).toBe(true);
      expect(parseExpression('NOT_NULL(a)', { a: {} })).toBe(true);
      expect(parseExpression('NOT_NULL(a)', { a: [] })).toBe(true);
    });

    test('NOT op', () => {
      expect(parseExpression('NOT(a)', { a: false })).toBe(true);
      expect(parseExpression('NOT(a)', { a: true })).toBe(false);
    });

    test('EQUAL op', () => {
      expect(parseExpression('EQUAL(a, b)', { a: 1, b: 1 })).toBe(true);
      expect(parseExpression('EQUAL(a, b)', { a: 1, b: '1' })).toBe(false);
    });

    test('NOT_EQUAL op', () => {
      expect(parseExpression('NOT_EQUAL(a, b)', { a: 1, b: 1 })).toBe(false);
      expect(parseExpression('NOT_EQUAL(a, b)', { a: 1, b: '1' })).toBe(true);
    });

    test('GT op', () => {
      expect(parseExpression('GT(a, b)', { a: 1, b: 2 })).toBe(false);
      expect(parseExpression('GT(a, b)', { a: 1, b: 1 })).toBe(false);
      expect(parseExpression('GT(a, b)', { a: 2, b: 1 })).toBe(true);
    });

    test('GTE op', () => {
      expect(parseExpression('GTE(a, b)', { a: 1, b: 2 })).toBe(false);
      expect(parseExpression('GTE(a, b)', { a: 1, b: 1 })).toBe(true);
      expect(parseExpression('GTE(a, b)', { a: 2, b: 1 })).toBe(true);
    });

    test('LT op', () => {
      expect(parseExpression('LT(a, b)', { a: 1, b: 2 })).toBe(true);
      expect(parseExpression('LT(a, b)', { a: 1, b: 1 })).toBe(false);
      expect(parseExpression('LT(a, b)', { a: 2, b: 1 })).toBe(false);
    });

    test('LTE op', () => {
      expect(parseExpression('LTE(a, b)', { a: 1, b: 2 })).toBe(true);
      expect(parseExpression('LTE(a, b)', { a: 1, b: 1 })).toBe(true);
      expect(parseExpression('LTE(a, b)', { a: 2, b: 1 })).toBe(false);
    });

    test('AND op', () => {
      expect(parseExpression('AND(a, b)', { a: true, b: true })).toBe(true);
      expect(parseExpression('AND(a, b)', { a: true, b: false })).toBe(false);
      expect(parseExpression('AND(a, b)', { a: false, b: true })).toBe(false);
      expect(parseExpression('AND(a, b)', { a: false, b: false })).toBe(false);
    });

    test('OR op', () => {
      expect(parseExpression('OR(a, b)', { a: true, b: true })).toBe(true);
      expect(parseExpression('OR(a, b)', { a: true, b: false })).toBe(true);
      expect(parseExpression('OR(a, b)', { a: false, b: true })).toBe(true);
      expect(parseExpression('OR(a, b)', { a: false, b: false })).toBe(false);
    });
  });

  describe('String ops', () => {
    test('STR_LEN op', () => {
      expect(parseExpression('STR_LEN(a)', { a: '123' })).toBe(3);
      expect(parseExpression('STR_LEN(a)', { a: 1 })).toBe(1);
    });

    test('LOWER op', () => {
      expect(parseExpression('LOWER(a)', { a: 'ABCDEF' })).toBe('abcdef');
    });

    test('UPPER op', () => {
      expect(parseExpression('UPPER(a)', { a: 'abcdef' })).toBe('ABCDEF');
    });

    test('TRIM op', () => {
      expect(parseExpression('TRIM(a)', { a: '   abc  def   ' })).toBe('abc  def');
    });

    test('ENCODE_URL_COMPONENT op', () => {
      expect(parseExpression('ENCODE_URL_COMPONENT(a)', { a: 'abc def' })).toBe('abc%20def');
    });

    test('CONCAT op', () => {
      expect(parseExpression('CONCAT(a, b)', { a: '123', b: '456' })).toBe('123456');
    });

    test('LEFT op', () => {
      expect(parseExpression('LEFT(a, b)', { a: '123456', b: 2 })).toBe('12');
    });

    test('RIGHT op', () => {
      expect(parseExpression('RIGHT(a, b)', { a: '123456', b: 2 })).toBe('56');
    });

    test('MID op', () => {
      expect(parseExpression('MID(a, b, c)', { a: '123456', b: 1, c: 2 })).toBe('23');
    });

    test('SLUG op', () => {
      expect(parseExpression('SLUG(a)', { a: 'This is a title 123 !@#,./"' })).toBe('this-is-a-title-123-');
    });

    test('REPT op', () => {
      expect(parseExpression('REPT(a, b)', { a: '123', b: 3 })).toBe('123123123');
    });

    test('JOIN op', () => {
      expect(parseExpression('JOIN(a, " - ")', { a: ['a', 'b', 'c'] })).toBe('a - b - c');
    });

    test('SPLIT op', () => {
      expect(parseExpression('SPLIT(a, " - ")', { a: 'a - b - c' })).toEqual(['a', 'b', 'c']);
    });

    test('SUBSTITUTE op', () => {
      expect(parseExpression('SUBSTITUTE(a, "a", "b")', { a: 'abcabc' })).toBe('bbcbbc');
      expect(parseExpression('SUBSTITUTE(a, "d", "b")', { a: 'abcabc' })).toBe('abcabc');
    });

    test('SEARCH op', () => {
      expect(parseExpression('SEARCH(a, "b")', { a: 'abcabc' })).toBe(1);
      expect(parseExpression('SEARCH(a, "b", 3)', { a: 'abcabc' })).toBe(4);
      expect(parseExpression('SEARCH(a, "d")', { a: 'abcabc' })).toBe(-1);
    });
  });

  describe('Array ops', () => {
    test('ARRAY_LEN op', () => {
      expect(parseExpression('ARRAY_LEN(a)', { a: [1, 2, 3] })).toBe(3);
      expect(parseExpression('ARRAY_LEN(a)', { a: 1 })).toBe(0);
    });
  });

  describe('Relational ops', () => {
    test('ASUM op', () => {
      expect(parseExpression('ASUM(a, b)', { a: [{b: 5}, {b: 10}, {b: 0}, {b: 15}] })).toBe(30);
      expect(parseExpression('ASUM(a, MULTIPLY(b, c))', { a: [{b: 5, c: 1}, {b: 10, c: 2}, {b: 1000, c: 0}, {b: 15, c: 10}] })).toBe(175);
    });
  });

  describe('Condition ops', () => {
    test('IF op', () => {
      expect(parseExpression('IF(a, b, c)', { a: true, b: 1, c: 2})).toBe(1);
      expect(parseExpression('IF(a, b, c)', { a: false, b: 1, c: 2})).toBe(2);
      expect(parseExpression('IF(a, b, c)', { a: 1, b: 1, c: 2})).toBe(2);
      expect(parseExpression('IF(a, b, c)', { a: '1', b: 1, c: 2})).toBe(2);
      expect(parseExpression('IF(a, b, c)', { a: {}, b: 1, c: 2})).toBe(2);
      expect(parseExpression('IF(a, b, c)', { a: [], b: 1, c: 2})).toBe(2);
      expect(parseExpression('IF(EQUAL(a, 5), b, c)', { a: 5, b: 1, c: 2})).toBe(1);
      expect(parseExpression('IF(AND(GT(a, 0), LT(a, 10)), b, c)', { a: 5, b: 1, c: 2})).toBe(1);
    });
  });

  describe('Nested expressions', () => {
    test('Simple nested numeric expression', () => {
      expect(parseExpression('SUM(a, MULTIPLY(b, c))', { a: 1, b: 2, c: 3 })).toBe(7);
    });

    test('Complex nested numeric expression', () => {
      expect(parseExpression('SUM(a, MULTIPLY(b, SUM(c, d)))', { a: 1, b: 2, c: 3, d: 4 })).toBe(15);
    });

    test('Simple nested boolean expression', () => {
      expect(parseExpression('AND(a, OR(b, c))', { a: true, b: false, c: false })).toBe(false);
    });

    test('Complex nested boolean expression', () => {
      expect(parseExpression('AND(a, OR(b, AND(c, d)))', { a: true, b: false, c: true, d: false })).toBe(false);
    });

    test('Simple nested string expression', () => {
      expect(parseExpression('CONCAT(a, CONCAT(b, c))', { a: 'a', b: 'b', c: 'c' })).toBe('abc');
    });

    test('Complex nested string expression', () => {
      expect(parseExpression('CONCAT(a, CONCAT(b, CONCAT(c, d)))', { a: 'a', b: 'b', c: 'c', d: 'd' })).toBe('abcd');
    });
  });

  describe('Literal strings', () => {
    test('Simple string', () => {
      expect(parseExpression('"a"', {})).toBe('a');
    });

    test('String with escaped quotes', () => {
      expect(parseExpression('"a\\"b"', {})).toBe('a"b');
    });

    test('String with escaped backslash', () => {
      expect(parseExpression('"a\\b"', {})).toBe('a\\b');
    });

    test('String with parentheses and comma', () => {
      expect(parseExpression('"a(b,c)d"', {})).toBe('a(b,c)d');
    });

    test('String with all special characters', () => {
      expect(parseExpression('"a(b,c)d\\"e\\f"', {})).toBe('a(b,c)d"e\\f');
    });

    test('String operator 1', () => {
      expect(parseExpression('RIGHT(CONCAT(UPPER(CONCAT(a, "c")), 1), 3)', { a: 'ab' })).toBe('BC1');
    });

    test('String operator 2', () => {
      expect(parseExpression('EQUAL(CONCAT(LOWER("A,()\\""), a), "a,()\\"bc")', { a: 'bc' })).toBe(true);
      expect(parseExpression('EQUAL(CONCAT("A,()\\"", a), "a,()\\"bc")', { a: 'bc' })).toBe(false);
      expect(parseExpression('EQUAL(CONCAT("A,()\\"", a), "A,()\\"bc")', { a: 'bc' })).toBe(true);
    });
  });
});

describe('Test parseOp', () => {
  test('Simple unary op', () => {
    expect(parseOp('OP_(var)')).toStrictEqual({
      op: 'OP_',
      args: ['var'],
    });
  });

  test('Simple binary op', () => {
    expect(parseOp('OP_(var1,var2)')).toStrictEqual({
      op: 'OP_',
      args: ['var1', 'var2'],
    });
  });

  test('Literal number', () => {
    expect(parseOp('1')).toStrictEqual(null);
  });

  test('Field value', () => {
    expect(parseOp('a')).toStrictEqual(null);
  });

  test('Complex op 1', () => {
    expect(parseOp('OP_(OP_(var1))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(var1)'],
    });
  });

  test('Complex op 2', () => {
    expect(parseOp('OP_(OP_(var1),var2)')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(var1)', 'var2'],
    });
  });

  test('Complex op 3', () => {
    expect(parseOp('OP_(OP_(var1),OP_(var2))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(var1)', 'OP_(var2)'],
    });
  });

  test('Complex op 4', () => {
    expect(parseOp('OP_(OP_(OP_(var1), var2),OP_(var3))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(OP_(var1), var2)', 'OP_(var3)'],
    });
  });

  test('Complex op 5', () => {
    expect(parseOp('OP_(OP_(OP_(var1), var2),OP_(var3, OP_(var4, var5)))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(OP_(var1), var2)', 'OP_(var3, OP_(var4, var5))'],
    });
  });

  test('Complex op 5', () => {
    expect(parseOp('OP_(OP_(OP_(var1, OP_(var2, OP_(var3, var4))), var5))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(OP_(var1, OP_(var2, OP_(var3, var4))), var5)'],
    });
  });

  test('Ternary op', () => {
    expect(parseOp('OP_(OP_(var1),var2,var3)')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(var1)', 'var2', 'var3'],
    });
  });

  test('Contains space at both ends', () => {
    expect(parseOp(' OP_(var1) ')).toStrictEqual({
      op: 'OP_',
      args: ['var1'],
    });
  });

  test('Handle literal string', () => {
    expect(parseOp('OP_("(abc)\\", \\"(def)", ")(,\\"")')).toStrictEqual({
      op: 'OP_',
      args: ['"(abc)\\", \\"(def)"', '")(,\\""'],
    });
  });

  test('Handle literal string in complex op', () => {
    expect(parseOp('OP_(OP_(var1), OP_("(abc)\\", \\"(def)"))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_(var1)', 'OP_("(abc)\\", \\"(def)")'],
    });
    expect(parseOp('OP_(OP_("(abc)\\", \\"(def)"), OP_(var1))')).toStrictEqual({
      op: 'OP_',
      args: ['OP_("(abc)\\", \\"(def)")', 'OP_(var1)'],
    });
  });
});

describe('Test toSlug', () => {
  test('English text', () => {
    expect(toSlug('We’ll always be with you. No one’s ever really gone. A thousand generations live in you now.'))
      .toBe('well-always-be-with-you-no-ones-ever-really-gone-a-thousand-generations-live-in-you-now');

    expect(toSlug('123 ABC !@# a12 []=-,./<>? DEF')).toBe('123-abc-a12-def');
  });

  test('Multi-line', () => {
    expect(toSlug(`
We’ll always be with you. 
No one’s ever really gone. 
A thousand generations live in you now.`))
      .toBe('well-always-be-with-you-no-ones-ever-really-gone-a-thousand-generations-live-in-you-now');
  });

  test('Non-English text', () => {
    expect(toSlug(`
  Trăm năm trong cõi người ta,
  Chữ tài chữ mệnh khéo là ghét nhau.
  Trải qua một cuộc bể dâu,
  Những điều trông thấy mà đau đớn lòng.`))
      .toBe('tram-nam-trong-coi-nguoi-ta-chu-tai-chu-menh-kheo-la-ghet-nhau-trai-qua-mot-cuoc-be-dau-nhung-dieu-trong-thay-ma-dau-don-long')
  });

  test('Not a string', () => {
    expect(toSlug(1)).toBe('');
    expect(toSlug({})).toBe('');
    expect(toSlug([])).toBe('');
    expect(toSlug(new Date())).toBe('');
    expect(toSlug(new RegExp('123'))).toBe('');
  });
});
