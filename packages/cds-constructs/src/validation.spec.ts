import { checkIpv4 } from './validation';

describe('checkIpv4()', () => {
  describe('when address is valid', () => {
    const pool = [
      '0.0.0.0',
      '8.8.8.8',
      '127.0.0.1',
      '100.100.100.100',
      '192.168.0.1',
      '18.101.25.153',
      '123.23.34.2',
      '172.26.168.134',
      '212.58.241.131',
      '128.0.0.0',
      '23.71.254.72',
      '223.255.255.255',
      '192.0.2.235',
      '99.198.122.146',
      '46.51.197.88',
      '173.194.34.134'
    ];

    it('returns true', () => {
      for (const address of pool) {
        expect(checkIpv4(address)).toBe(true);
      }
    });
  });

  describe('when address is not valid', () => {
    const pool = [
      '256.0.0.0',
      '192.168.1.256',
      '300.0.0.0',
      '127.0.0.01',
      '10.10.10.10.',
      '172.16.256.1',
      '192.168.257.1',
      '0.0.0.0.0',
      '1.2.3.4.5',
      '192.168.1.0/24',
      '192.168.1.256/24',
      '256.256.256.256',
      '192.168.1.300',
      '192.168.1.256/16'
    ];

    it('returns false', () => {
      for (const address of pool) {
        expect(checkIpv4(address)).toBe(false);
      }
    });
  });
});
