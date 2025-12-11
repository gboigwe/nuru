import { XMTPService } from '../XMTPService';
import { PaymentNotificationService } from '../PaymentNotificationService';
import { MessageTemplates } from '../MessageTemplates';

describe('XMTP Messaging Services', () => {
  describe('MessageTemplates', () => {
    it('should generate correct payment sent template', () => {
      const result = MessageTemplates.paymentSent('100', 'USDC', 'John');
      expect(result).toContain('100 USDC');
      expect(result).toContain('John');
    });

    it('should generate correct payment received template', () => {
      const result = MessageTemplates.paymentReceived('50', 'NGN', 'Mama');
      expect(result).toContain('50 NGN');
      expect(result).toContain('Mama');
    });

    it('should generate correct support request template', () => {
      const result = MessageTemplates.supportRequest('Payment stuck');
      expect(result).toContain('Payment stuck');
      expect(result).toContain('🆘');
    });
  });

  describe('XMTPService Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = XMTPService.getInstance();
      const instance2 = XMTPService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('PaymentNotificationService Singleton', () => {
    it('should return the same instance', () => {
      const instance1 = PaymentNotificationService.getInstance();
      const instance2 = PaymentNotificationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});