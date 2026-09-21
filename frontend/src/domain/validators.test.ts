import { describe, it, expect } from 'vitest';
import {
  validateStudentNumber,
  validateChineseMobile,
  validatePersonName,
  validateIdCardNumber,
  validateEmailAddress,
  validateQuestionAnswer,
} from './validators';

describe('Frontend Domain Value Validators', () => {
  describe('validateStudentNumber', () => {
    it.each([
      ['2026001', '2026001'],
      ['csu123456', 'CSU123456'],
      ['abcd', 'ABCD'],
      ['12345678901234567890', '12345678901234567890'], // 20 chars
      ['  CSU888  ', 'CSU888'],
    ])('accepts valid student number and normalizes to uppercase: %s', (input, expectedNorm) => {
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
      ['123', '学号须为 4 至 20 位字母或数字组合'], // 3 chars
      ['123456789012345678901', '学号须为 4 至 20 位字母或数字组合'], // 21 chars
      ['2026-001', '学号须为 4 至 20 位字母或数字组合'],
      ['2026 001', '学号须为 4 至 20 位字母或数字组合'],
      ['学号1234', '学号须为 4 至 20 位字母或数字组合'],
    ])('rejects format violations: %s', (input, errorMsg) => {
      const res = validateStudentNumber(input);
      expect(res.isValid).toBe(false);
      expect(res.error).toBe(errorMsg);
    });

    it.each([
      ['=CMD()'],
      ['+12345'],
      ['@SUM(1,2)'],
      ['-9999'],
      ['\tCSU123'],
      ['\rCSU123'],
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
        expect(validateQuestionAnswer(q, '2026001').isValid).toBe(true);
        expect(validateQuestionAnswer(q, '=CMD()').isValid).toBe(false);
      });

      it('validates demographic name field', () => {
        const q = { id: 'demo_name', field: 'name', type: 'text', text: '真实姓名' };
        expect(validateQuestionAnswer(q, '张三').isValid).toBe(true);
        expect(validateQuestionAnswer(q, 'A').isValid).toBe(false);
      });
    });
  });
});
