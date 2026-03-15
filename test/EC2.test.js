const fs = require('fs');
const vm = require('vm');

function loadEC2() {
  const code = fs.readFileSync(`${__dirname}/../src/EC2.js`, 'utf8');

  const mockDescribeInstances = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ reservationSet: { instancesSet: [{ instanceId: 'i-123' }] } }),
  });
  const mockDescribeSecurityGroups = jest.fn().mockReturnValue({
    promise: () => Promise.resolve({ securityGroupInfo: [{ groupId: 'sg-123' }] }),
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
    test('lists instances with region option', async () => {
      const result = await sandbox.listEC2Instances({ region: 'us-west-2' });
      expect(result.reservationSet.instancesSet).toHaveLength(1);
      expect(sandbox.AWS.EC2).toHaveBeenCalledWith(expect.objectContaining({ region: 'us-west-2' }));
    });

    test('falls back to default region when no options', async () => {
      await sandbox.listEC2Instances();
      expect(sandbox.AWS.EC2).toHaveBeenCalledWith(expect.objectContaining({ region: 'us-east-1' }));
    });

    test('passes filters and instanceIds', async () => {
      const filters = [{ Name: 'instance-state-name', Values: ['running'] }];
      await sandbox.listEC2Instances({ filters, instanceIds: ['i-abc'] });
      expect(sandbox._mocks.mockDescribeInstances).toHaveBeenCalledWith({
        Filters: filters,
        InstanceIds: ['i-abc'],
      });
    });

    test('passes pagination params', async () => {
      await sandbox.listEC2Instances({ maxResults: 10, nextToken: 'token123' });
      expect(sandbox._mocks.mockDescribeInstances).toHaveBeenCalledWith({
        MaxResults: 10,
        NextToken: 'token123',
      });
    });

    test('throws on error', async () => {
      sandbox._mocks.mockDescribeInstances.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('UnauthorizedOperation')),
      });
      await expect(sandbox.listEC2Instances()).rejects.toThrow('UnauthorizedOperation');
    });
  });

  describe('listSecurityGroups', () => {
    test('lists security groups with region option', async () => {
      const result = await sandbox.listSecurityGroups({ region: 'eu-west-1' });
      expect(result.securityGroupInfo).toHaveLength(1);
    });

    test('passes filters, groupIds, groupNames', async () => {
      await sandbox.listSecurityGroups({
        filters: [{ Name: 'group-name', Values: ['my-sg'] }],
        groupIds: ['sg-abc'],
        groupNames: ['my-sg'],
      });
      expect(sandbox._mocks.mockDescribeSecurityGroups).toHaveBeenCalledWith({
        Filters: [{ Name: 'group-name', Values: ['my-sg'] }],
        GroupIds: ['sg-abc'],
        GroupNames: ['my-sg'],
      });
    });

    test('throws on error', async () => {
      sandbox._mocks.mockDescribeSecurityGroups.mockReturnValueOnce({
        promise: () => Promise.reject(new Error('Access denied')),
      });
      await expect(sandbox.listSecurityGroups()).rejects.toThrow('Access denied');
    });
  });
});
