import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface ImaiErrorResponse {
  success: false;
  error?: string;
  error_message?: string;
}

const IMAI_ERROR_STATUS_MAP: Record<string, number> = {
  bad_request: HttpStatus.BAD_REQUEST,
  account_not_found: HttpStatus.BAD_REQUEST,
  account_data_removed: HttpStatus.BAD_REQUEST,
  account_removed: HttpStatus.BAD_REQUEST,
  account_is_private: HttpStatus.BAD_REQUEST,
  empty_audience: HttpStatus.BAD_REQUEST,
  empty_audience_data: HttpStatus.BAD_REQUEST,
  retry_later: HttpStatus.BAD_REQUEST,
  bad_filter: HttpStatus.BAD_REQUEST,
  comment_unavailable: HttpStatus.BAD_REQUEST,
  media_not_found: HttpStatus.BAD_REQUEST,
  entity_not_found: HttpStatus.BAD_REQUEST,
  entity_is_hidden: HttpStatus.BAD_REQUEST,
  no_tokens_remaining: HttpStatus.BAD_REQUEST,
  no_quota_remaining: HttpStatus.BAD_REQUEST,
  daily_tokens_limit_exceeded: HttpStatus.BAD_REQUEST,
  not_authenticated: HttpStatus.UNAUTHORIZED,
  invalid_api_key: HttpStatus.FORBIDDEN,
  permission_denied: HttpStatus.FORBIDDEN,
  token_is_disabled: HttpStatus.FORBIDDEN,
  tokens_expired: HttpStatus.FORBIDDEN,
  subscription_expired: HttpStatus.FORBIDDEN,
  subscription_required: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  method_not_allowed: HttpStatus.METHOD_NOT_ALLOWED,
  rate_limit_exceeded: HttpStatus.TOO_MANY_REQUESTS,
  internal_server_error: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Injectable()
export class ImaiApiService {
  private readonly logger = new Logger(ImaiApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('IMAI_BASE_URL', 'https://imai.co/api');
    this.apiKey = this.configService.get<string>('IMAI_API_KEY', '');
  }

  private getHeaders(): Record<string, string> {
    return {
      'authkey': this.apiKey,
    };
  }

  async get<T extends { success?: boolean }>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const filteredParams: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          filteredParams[key] = value;
        }
      }
    }

    const config: AxiosRequestConfig = {
      headers: this.getHeaders(),
      params: filteredParams,
    };

    this.logger.debug(`GET ${url} params=${JSON.stringify(filteredParams)}`);

    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.get<T>(url, config),
      );
      this.validateResponse(response.data, endpoint);
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, endpoint);
    }
  }

  async post<T extends { success?: boolean }>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      headers: this.getHeaders(),
    };

    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.post<T>(url, body || {}, config),
      );
      this.validateResponse(response.data, endpoint);
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, endpoint);
    }
  }

  private validateResponse<T extends { success?: boolean }>(data: T, endpoint: string): void {
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      const errorData = data as unknown as ImaiErrorResponse;
      const errorCode = errorData.error || 'unknown_error';
      const errorMessage = errorData.error_message || errorCode;
      const status = IMAI_ERROR_STATUS_MAP[errorCode] || HttpStatus.BAD_REQUEST;

      this.logger.error(`IMAI API Error [${endpoint}]: ${errorCode} - ${errorMessage}`);
      throw new HttpException(
        { error: errorCode, error_message: errorMessage, statusCode: status },
        status,
      );
    }
  }

  private handleError(error: unknown, endpoint: string): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: ImaiErrorResponse } };
      const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const errorCode = axiosError.response?.data?.error || 'unknown_error';
      const errorMessage = axiosError.response?.data?.error_message || errorCode;

      this.logger.error(`IMAI API Error [${endpoint}]: ${status} - ${errorCode} - ${errorMessage}`, JSON.stringify(axiosError.response?.data));
      throw new HttpException(
        { error: errorCode, error_message: errorMessage, statusCode: status },
        status,
      );
    }

    this.logger.error(`Unexpected error [${endpoint}]:`, error);
    throw new HttpException(
      { error: 'internal_server_error', error_message: 'An unexpected error occurred', statusCode: 500 },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
