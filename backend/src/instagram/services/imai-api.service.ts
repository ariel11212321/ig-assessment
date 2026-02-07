import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

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

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
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
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, endpoint);
    }
  }

  async post<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      headers: this.getHeaders(),
    };

    try {
      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService.post<T>(url, body || {}, config),
      );
      return response.data;
    } catch (error: unknown) {
      this.handleError(error, endpoint);
    }
  }

  private handleError(error: unknown, endpoint: string): never {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { error_message?: string; error?: string } } };
      const status = axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = axiosError.response?.data?.error_message ||
        axiosError.response?.data?.error ||
        'An error occurred with the IMAI API';

      this.logger.error(`IMAI API Error [${endpoint}]: ${status} - ${message}`, JSON.stringify(axiosError.response?.data));
      throw new HttpException(
        { error: message, statusCode: status },
        status,
      );
    }

    this.logger.error(`Unexpected error [${endpoint}]:`, error);
    throw new HttpException(
      { error: 'Internal server error', statusCode: 500 },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
