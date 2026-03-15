const fs = require('fs');
const vm = require('vm');

function loadEC2() {
  const code = fs.readFileSync(`${__dirname}/../src/EC2.js`, 'utf8');

  const mockDescribeInstances = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ reservationSet: { instancesSet: [] } }),
  });
  const mockDescribeSecurityGroups = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ securityGroupInfo: [] }),
  });

  const sandbox = {
    ...global,
    AWS: {
      EC2: jest.fn().mockReturnValue({
        describeInstances: mockDescribeInstances,
        describeSecurityGroups: mockDescribeSecurityGroups,
      }),
      config: { region: 'us-east-1' },
    },
    Logger: { log: jest.fn() },
    _mocks: { mockDescribeInstances, mockDescribeSecurityGroups },
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

describe('EC2', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = loadEC2();
  });

  describe('listEC2Instances', () => {
    test('lists instances using default region', async () => {
      const result = await sandbox.listEC2Instances();
      expect(result).toEqual({ reservationSet: { instancesSet: [] } });
      expect(sandbox.AWS.EC2).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: '2016-11-15',
          region: 'us-east-1',
        }),
      );
    });

    test('lists instances with custom region', async () => {
      await sandbox.listEC2Instances('eu-west-1');
      expect(sandbox.AWS.EC2).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'eu-west-1',
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDescribeInstances.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('EC2 error')),
      });

      const result = await sandbox.listEC2Instances();
      expect(result).toBe(false);
    });
  });

  describe('listSecurityGroups', () => {
    test('lists security groups using default region', async () => {
      const result = await sandbox.listSecurityGroups();
      expect(result).toEqual({ securityGroupInfo: [] });
    });

    test('lists security groups with custom region', async () => {
      await sandbox.listSecurityGroups('ap-southeast-1');
      expect(sandbox.AWS.EC2).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'ap-southeast-1',
        }),
      );
    });

    test('returns false on error', async () => {
      sandbox._mocks.mockDescribeSecurityGroups.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('SG error')),
      });

      const result = await sandbox.listSecurityGroups();
      expect(result).toBe(false);
    });
  });
});
