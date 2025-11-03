import * as assert from 'assert';
import { YapiService } from '../yapiService';

suite('YapiService Test Suite', () => {
    let yapiService: YapiService;

    setup(() => {
        yapiService = new YapiService();
    });

    suite('Configuration Management', () => {
        test('should initialize with empty configuration', () => {
            assert.strictEqual(yapiService.getBaseUrl(), '');
            assert.strictEqual(yapiService.isConfigured(), false);
        });

        test('should set configuration correctly', () => {
            const yapiUrl = 'https://yapi.example.com';
            const projectToken = 'test-token-123';

            yapiService.setConfig(yapiUrl, projectToken);

            assert.strictEqual(yapiService.getBaseUrl(), yapiUrl);
            assert.strictEqual(yapiService.isConfigured(), true);
        });

        test('should handle empty configuration', () => {
            yapiService.setConfig('', '');
            assert.strictEqual(yapiService.isConfigured(), false);
        });

        test('should handle partial configuration', () => {
            yapiService.setConfig('https://yapi.example.com', '');
            assert.strictEqual(yapiService.isConfigured(), false);

            yapiService.setConfig('', 'token-123');
            assert.strictEqual(yapiService.isConfigured(), false);
        });
    });

    suite('URL Construction', () => {
        test('should return correct base URL', () => {
            const yapiUrl = 'https://yapi.example.com';
            yapiService.setConfig(yapiUrl, 'test-token');
            assert.strictEqual(yapiService.getBaseUrl(), yapiUrl);
        });

        test('should handle URL with trailing slash', () => {
            const yapiUrl = 'https://yapi.example.com/';
            yapiService.setConfig(yapiUrl, 'test-token');
            assert.strictEqual(yapiService.getBaseUrl(), yapiUrl);
        });
    });
});
