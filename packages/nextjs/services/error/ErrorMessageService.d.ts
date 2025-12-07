export interface UserError {
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  severity: 'info' | 'warning' | 'error';
}

export declare class ErrorMessageService {
  getUserFriendlyError(error: any): UserError;
  private parseRevertReason(error: any): string | null;
}

export declare const errorMessageService: ErrorMessageService;
