const fs = require('fs');
const vm = require('vm');

function loadSes() {
  const xmlCode = fs.readFileSync(`${__dirname}/../src/Xml.js`, 'utf8');
  const sesCode = fs.readFileSync(`${__dirname}/../src/Ses.js`, 'utf8');

  const mockSendEmail = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ MessageId: 'test-message-id' }),
  });

  const sandbox = {
    ...global,
    AWS: {
      SES: jest.fn().mockReturnValue({ sendEmail: mockSendEmail }),
    },
    XmlService: {
      parse: jest.fn(),
    },
    Logger: { log: jest.fn() },
    _mockSendEmail: mockSendEmail,
  };

  vm.createContext(sandbox);
  vm.runInContext(xmlCode, sandbox);
  vm.runInContext(sesCode, sandbox);
  return sandbox;
}

describe('SES', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadSes();
  });

  describe('splitEmails_', () => {
    test('splits comma-separated emails', () => {
      const result = sandbox.splitEmails_('a@b.com, c@d.com, e@f.com');
      expect(result).toEqual(['a@b.com', 'c@d.com', 'e@f.com']);
    });

    test('handles single email', () => {
      const result = sandbox.splitEmails_('test@example.com');
      expect(result).toEqual(['test@example.com']);
    });

    test('filters empty strings', () => {
      const result = sandbox.splitEmails_('a@b.com, , c@d.com');
      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    test('trims whitespace', () => {
      const result = sandbox.splitEmails_('  a@b.com  ');
      expect(result).toEqual(['a@b.com']);
    });
  });

  describe('sendEmail', () => {
    test('sends email successfully with string addresses', async () => {
      const result = await sandbox.sendEmail(
        'to@example.com',
        'cc@example.com',
        'bcc@example.com',
        'from@example.com',
        'reply@example.com',
        'Test Subject',
        '<html><body>Hello</body></html>',
        'Hello plain',
      );

      expect(result).toEqual({ MessageId: 'test-message-id' });
      expect(sandbox.AWS.SES).toHaveBeenCalledWith({ apiVersion: '2010-12-01' });
    });

    test('sends email with array addresses', async () => {
      const result = await sandbox.sendEmail(
        ['to@example.com'],
        ['cc@example.com'],
        [],
        'from@example.com',
        ['reply@example.com'],
        'Test Subject',
        '<html><body>Hello</body></html>',
        'Hello plain',
      );

      expect(result).toEqual({ MessageId: 'test-message-id' });
    });

    test('returns false on error', async () => {
      sandbox._mockSendEmail.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SES error')),
      });

      const result = await sandbox.sendEmail('to@example.com', '', '', 'from@example.com', '', 'Subj', '<html><body>Hi</body></html>', 'Hi');

      expect(result).toBe(false);
      expect(sandbox.Logger.log).toHaveBeenCalled();
    });
  });
});
