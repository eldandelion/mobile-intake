import { describe, it, expect } from 'vitest';
import {
  validateStudentNumber,
  validateChineseMobile,
  validatePersonName,
  validateIdCardNumber,
  validateEmailAddress,
  validateQuestionAnswer,
  getDaysInMonth,
  validateBirthDate,
  MIN_STUDENT_AGE,
  MAX_STUDENT_AGE,
} from './validators';

describe('Frontend Domain Value Validators', () => {
  describe('validateStudentNumber', () => {
    it.each([
      ['8209220532', '8209220532'], // 10-digit undergrad
      ['2026001001', '2026001001'],
      ['264718003', '264718003'], // 9-digit postgrad
      ['202600101', '202600101'],
      ['L209220532', 'L209220532'], // 10-character international
      ['l209220532', 'L209220532'], // lowercase 'l' auto-normalizes
      ['  l209220532  ', 'L209220532'],
      ['  8209220532  ', '8209220532'],
    ])('accepts valid institutional student number and normalizes to uppercase: %s', (input, expectedNorm) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(expectedNorm);
      expect(res.error).toBeUndefined();
    });

    it.each([
      ['', '请输入您的学号'],
      ['   ', '请输入您的学号'],
      [null, '请输入您的学号'],
      [undefined, '请输入您的学号'],
    ])('rejects empty input: %s', (input, errorMsg) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });

    it.each([
      ['0209220532'],
      ['026471800'],
      ['L009220532'],
      ['123'], // 3 chars
      ['2026001'], // 7 chars
      ['12345678'], // 8 chars
      ['12345678901'], // 11 chars
      ['M209220532'], // only 'L' allowed
      ['abcd'],
      ['CSU123456'],
      ['8209-22053'],
      ['8209 22053'],
    ])('rejects format and leading zero violations: %s', (input) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('学号格式不正确（本科生10位数字、研究生9位数字，留学生以L开头加9位数字，首位非0）');
    });

    it.each([
      ['9999999999'],
      ['2222222222'],
      ['111111111'],
      ['L999999999'],
      ['L111111111'],
    ])('rejects degenerate uniform digit repetitions: %s', (input) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('学号不能为全重复数字');
    });

    it.each([
      ['=CMD()'],
      ['+8209220532'],
      ['@SUM(1,2)'],
      ['-9999'],
      ['\tL209220532'],
      ['\rL209220532'],
    ])('rejects Excel formula injection prefixes: %s', (input) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('学号不能包含公式或特殊计算符号');
    });
  });

  describe('validateChineseMobile', () => {
    it.each([
      ['13812345678'],
      ['19987654321'],
      ['15000000000'],
      ['17712345678'],
      ['18812345678'],
      ['16612345678'],
      ['14712345678'],
      ['  13812345678  '],
    ])('accepts valid 11-digit Chinese mobile numbers: %s', (phone) => {
      const res = validateChineseMobile(phone);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(phone.trim());
    });

    it.each([
      ['', '请输入正确的11位手机号码'],
      ['   ', '请输入正确的11位手机号码'],
      [null, '请输入正确的11位手机号码'],
    ])('rejects empty input: %s', (phone, errorMsg) => {
      const res = validateChineseMobile(phone);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });

    it.each([
      ['1381234567', '请输入正确的11位中国大陆手机号码'], // 10 digits
      ['138123456789', '请输入正确的11位中国大陆手机号码'], // 12 digits
      ['23812345678', '请输入正确的11位中国大陆手机号码'], // invalid prefix 2xx
      ['10812345678', '请输入正确的11位中国大陆手机号码'], // invalid prefix 10x
      ['11812345678', '请输入正确的11位中国大陆手机号码'], // invalid prefix 11x
      ['12812345678', '请输入正确的11位中国大陆手机号码'], // invalid prefix 12x
      ['138abcd5678', '请输入正确的11位中国大陆手机号码'],
    ])('rejects invalid mobile numbers: %s', (phone, errorMsg) => {
      const res = validateChineseMobile(phone);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });
  });

  describe('validatePersonName', () => {
    it.each([
      ['张三', '张三'],
      ['李四五', '李四五'],
      ['欧阳六七', '欧阳六七'],
      ['买买提·阿不都', '买买提·阿不都'],
      ['John Doe', 'John Doe'],
      ["Mary O'Connor", "Mary O'Connor"],
      ['Jean-Luc Picard', 'Jean-Luc Picard'],
    ])('accepts valid person names: %s', (name, expectedNorm) => {
      const res = validatePersonName(name);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(expectedNorm);
    });

    it.each([
      ['', '请输入您的真实姓名'],
      ['   ', '请输入您的真实姓名'],
      [null, '请输入您的真实姓名'],
    ])('rejects empty name: %s', (input, errorMsg) => {
      const res = validatePersonName(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });

    it.each([
      ['张', '姓名长度须在 2 至 64 个字符之间'],
      ['A', '姓名长度须在 2 至 64 个字符之间'],
      ['a'.repeat(65), '姓名长度须在 2 至 64 个字符之间'],
    ])('rejects out-of-range lengths: %s', (name, errorMsg) => {
      const res = validatePersonName(name);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });

    it.each([
      ['张三123'],
      ['User@Name'],
      ['<script>'],
      ['=SUM()'],
    ])('rejects invalid characters in name: %s', (name) => {
      const res = validatePersonName(name);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe('姓名仅支持汉字、少数民族间隔符或标准英文字符');
    });
  });

  describe('validateIdCardNumber', () => {
    // 110101199003072375 is a valid ISO 7064 test ID (check code 5)
    it('accepts valid 18-digit ID card with correct check code', () => {
      const res = validateIdCardNumber('110101199003072375');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('110101199003072375');
    });

    it('accepts valid 18-digit ID card ending in lowercase x and normalizes to X', () => {
      // 11010519491231002x has check code X
      const validX = validateIdCardNumber('11010519491231002x');
      expect(validX.isValid).toBe(true);
      expect(validX.normalized).toBe('11010519491231002X');
    });

    it('rejects incorrect check digit', () => {
      const res = validateIdCardNumber('110101199003072379'); // check code should be 5
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('身份证校验码错误');
    });

    it('rejects invalid calendar date (Feb 30)', () => {
      const res = validateIdCardNumber('110101199002302379');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('无效的出生年月日');
    });

    it('rejects invalid calendar date (non-leap year Feb 29)', () => {
      // 1991 is not a leap year
      const res = validateIdCardNumber('110101199102292379');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('无效的出生年月日');
    });

    it('rejects malformed ID format', () => {
      expect(validateIdCardNumber('').isValid).toBe(false);
      expect(validateIdCardNumber('12345678901234567').isValid).toBe(false); // 17 digits
      expect(validateIdCardNumber('11010119900307237A').isValid).toBe(false); // 'A' not allowed
    });
  });

  describe('validateEmailAddress', () => {
    it.each([
      ['student@csu.edu.cn', 'student@csu.edu.cn'],
      ['TEST.USER@EXAMPLE.COM', 'test.user@example.com'],
      ['user+tag@sub.domain.org', 'user+tag@sub.domain.org'],
    ])('accepts valid email: %s', (email, expected) => {
      const res = validateEmailAddress(email);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(expected);
    });

    it.each([
      ['', '请输入电子邮箱'],
      ['invalid-email', '请输入有效的电子邮箱地址'],
      ['user@', '请输入有效的电子邮箱地址'],
      ['@domain.com', '请输入有效的电子邮箱地址'],
      ['user@domain', '请输入有效的电子邮箱地址'],
    ])('rejects invalid email: %s', (email, errorMsg) => {
      const res = validateEmailAddress(email);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });
  });

  describe('validateBirthDate and getDaysInMonth', () => {
    it('getDaysInMonth handles variable month lengths and leap years', () => {
      expect(getDaysInMonth(2024, 1)).toBe(31);
      expect(getDaysInMonth(2024, 4)).toBe(30);
      expect(getDaysInMonth(2024, 2)).toBe(29); // Leap year
      expect(getDaysInMonth(2023, 2)).toBe(28); // Non-leap year
      expect(getDaysInMonth(2000, 2)).toBe(29); // Century leap year
      expect(getDaysInMonth(1900, 2)).toBe(28); // Century non-leap year
    });

    it('accepts valid birth dates within student age bounds', () => {
      const currentYear = new Date().getFullYear();
      const validDob = `${currentYear - 18}-05-18`;
      const res = validateBirthDate(validDob);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(validDob);

      // Leap year Feb 29
      const leapDob = '2004-02-29';
      expect(validateBirthDate(leapDob).isValid).toBe(true);
    });

    it('rejects invalid calendar dates', () => {
      // Non-leap year Feb 29
      const resNonLeap = validateBirthDate('2003-02-29');
      expect(resNonLeap.isValid).toBe(false);
      expect(resNonLeap.error).toContain('该月最大天数为 28 日');

      // April 31
      const resApril = validateBirthDate('2004-04-31');
      expect(resApril.isValid).toBe(false);
      expect(resApril.error).toContain('该月最大天数为 30 日');

      // Invalid month
      expect(validateBirthDate('2004-13-10').isValid).toBe(false);
    });

    it('rejects age out of bounds (14-70) and future dates', () => {
      const currentYear = new Date().getFullYear();

      // Underage (< 14)
      const underage = `${currentYear - 10}-01-01`;
      const resUnderage = validateBirthDate(underage);
      expect(resUnderage.isValid).toBe(false);
      expect(resUnderage.error).toContain(`年龄须年满 ${MIN_STUDENT_AGE} 周岁`);

      // Overage (> 70)
      const overage = `${currentYear - 80}-01-01`;
      const resOverage = validateBirthDate(overage);
      expect(resOverage.isValid).toBe(false);
      expect(resOverage.error).toContain(`最大 ${MAX_STUDENT_AGE} 周岁`);

      // Future date
      const future = `${currentYear + 1}-01-01`;
      const resFuture = validateBirthDate(future);
      expect(resFuture.isValid).toBe(false);
      expect(resFuture.error).toBe('出生日期不能晚于当前时间');

      // Incomplete or empty
      expect(validateBirthDate('').isValid).toBe(false);
      expect(validateBirthDate('2006-05-').isValid).toBe(false);
      expect(validateBirthDate('2006/05/18').isValid).toBe(false);
    });
  });

  describe('validateQuestionAnswer', () => {
    it('rejects empty or undefined answers', () => {
      const q = { id: 'q1', type: 'single_choice', text: '题目1' };
      expect(validateQuestionAnswer(q, undefined).isValid).toBe(false);
      expect(validateQuestionAnswer(q, null).isValid).toBe(false);
      expect(validateQuestionAnswer(q, '').isValid).toBe(false);
    });

    describe('Numeric and Slider questions', () => {
      it('enforces min and max bounds', () => {
        const q = { id: 'G2', type: 'number', text: '年龄', min: 10, max: 100 };
        expect(validateQuestionAnswer(q, 18).isValid).toBe(true);
        expect(validateQuestionAnswer(q, '18').isValid).toBe(true);
        expect(validateQuestionAnswer(q, 9).isValid).toBe(false);
        expect(validateQuestionAnswer(q, 9).error).toBe('输入数值不能小于 10');
        expect(validateQuestionAnswer(q, 101).isValid).toBe(false);
        expect(validateQuestionAnswer(q, 101).error).toBe('输入数值不能大于 100');
        expect(validateQuestionAnswer(q, 'not-a-number').isValid).toBe(false);
      });

      it('allows zero option when zeroOptionLabel or G17a is specified', () => {
        const q = { id: 'G17a', type: 'number', text: '喝酒年龄', min: 1, max: 80, zeroOptionLabel: '从不' };
        expect(validateQuestionAnswer(q, 0).isValid).toBe(true);
        expect(validateQuestionAnswer(q, '0').isValid).toBe(true);
        expect(validateQuestionAnswer(q, 18).isValid).toBe(true);
      });
    });

    describe('Single Choice with conditional text input', () => {
      const q = {
        id: 'ghq_21',
        type: 'single_choice',
        text: '住院史',
        options: [
          { value: 0, label: '否' },
          { value: 1, label: '是', hasTextInput: true },
        ],
      };

      it('accepts standard option without textInput', () => {
        expect(validateQuestionAnswer(q, 0).isValid).toBe(true);
      });

      it('rejects option with hasTextInput when text explanation is missing or blank', () => {
        const res = validateQuestionAnswer(q, { value: 1, text: '' });
        expect(res.isValid).toBe(false);
        expect(res.error).toBe('请补充填写具体说明');

        const resSpaces = validateQuestionAnswer(q, { value: 1, text: '   ' });
        expect(resSpaces.isValid).toBe(false);
      });

      it('accepts option with hasTextInput when valid explanation is provided', () => {
        const res = validateQuestionAnswer(q, { value: 1, text: '2024年3月因失眠就医' });
        expect(res.isValid).toBe(true);
      });
    });

    describe('Multiple Choice questions', () => {
      const q = {
        id: 'mc_1',
        type: 'multiple_choice',
        text: '兴趣爱好',
        options: [
          { value: 'reading', label: '阅读' },
          { value: 'sports', label: '运动' },
          { value: 'other', label: '其他', hasTextInput: true },
        ],
      };

      it('rejects empty array', () => {
        expect(validateQuestionAnswer(q, []).isValid).toBe(false);
        expect(validateQuestionAnswer(q, []).error).toBe('多选题至少选择一项');
      });

      it('accepts valid selection', () => {
        expect(validateQuestionAnswer(q, ['reading', 'sports']).isValid).toBe(true);
      });

      it('rejects multi-choice if selected option with hasTextInput has empty text', () => {
        const res = validateQuestionAnswer(q, ['reading', { value: 'other', text: '' }]);
        expect(res.isValid).toBe(false);
        expect(res.error).toBe('请补充填写具体说明');
      });
    });

    describe('Text questions with contextual domain mapping', () => {
      it('validates demographic ID card field', () => {
        const q = { id: 'demo_id_card', field: 'id_card', type: 'text', text: '身份证号' };
        expect(validateQuestionAnswer(q, '110101199003072375').isValid).toBe(true);
        expect(validateQuestionAnswer(q, '110101199003072379').isValid).toBe(false);
      });

      it('validates demographic phone field', () => {
        const q = { id: 'demo_phone', field: 'phone', type: 'text', text: '联系电话' };
        expect(validateQuestionAnswer(q, '13812345678').isValid).toBe(true);
        expect(validateQuestionAnswer(q, '12345').isValid).toBe(false);
      });

      it('validates student number field and rejects formula injection', () => {
        const q = { id: 'demo_student_number', field: 'student_number', type: 'text', text: '学号' };
        expect(validateQuestionAnswer(q, '8209220532').isValid).toBe(true);
        expect(validateQuestionAnswer(q, '=CMD()').isValid).toBe(false);
      });

      it('validates demographic name field', () => {
        const q = { id: 'demo_name', field: 'name', type: 'text', text: '真实姓名' };
        expect(validateQuestionAnswer(q, '张三').isValid).toBe(true);
        expect(validateQuestionAnswer(q, 'A').isValid).toBe(false);
      });
    });

    describe('Date questions (e.g. G2 Date of Birth)', () => {
      const q = { id: 'G2', field: 'birthday', type: 'date', text: 'G2. 出生日期：' };

      it('validates valid ISO date string within age bounds', () => {
        const currentYear = new Date().getFullYear();
        expect(validateQuestionAnswer(q, `${currentYear - 19}-08-20`).isValid).toBe(true);
        expect(validateQuestionAnswer(q, '2004-02-29').isValid).toBe(true);
      });

      it('rejects invalid calendar dates or out-of-range dates', () => {
        expect(validateQuestionAnswer(q, '2003-02-29').isValid).toBe(false);
        expect(validateQuestionAnswer(q, '2004-04-31').isValid).toBe(false);
        expect(validateQuestionAnswer(q, '2004-05-').isValid).toBe(false);
        expect(validateQuestionAnswer(q, 'not-a-date').isValid).toBe(false);
      });
    });
  });
});
