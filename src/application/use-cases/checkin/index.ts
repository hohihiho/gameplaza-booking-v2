// 체크인 관련 유스케이스
export { ProcessCheckInUseCase } from './process-checkin.use-case';
export { ConfirmPaymentUseCase } from './confirm-payment.use-case';
export { AdjustTimeAndAmountUseCase } from './adjust-time-and-amount.use-case';

// 체크아웃 관련 유스케이스
export { ProcessCheckOutUseCase } from './process-checkout.use-case';
export { GetCheckInDetailsUseCase } from './get-checkin-details.use-case';
export { GetActiveCheckInsUseCase } from './get-active-checkins.use-case';
export { GetCheckInsByDateRangeUseCase } from './get-checkins-by-date-range.use-case';

// Request/Response 타입
export type { ProcessCheckInRequest, ProcessCheckInResponse } from './process-checkin.use-case';
export type { ConfirmPaymentRequest, ConfirmPaymentResponse } from './confirm-payment.use-case';
export type { AdjustTimeAndAmountRequest, AdjustTimeAndAmountResponse } from './adjust-time-and-amount.use-case';
export type { ProcessCheckOutRequest, ProcessCheckOutResponse } from './process-checkout.use-case';
export type { GetCheckInDetailsRequest, GetCheckInDetailsResponse } from './get-checkin-details.use-case';
export type { GetActiveCheckInsRequest, GetActiveCheckInsResponse } from './get-active-checkins.use-case';
export type { GetCheckInsByDateRangeRequest, GetCheckInsByDateRangeResponse } from './get-checkins-by-date-range.use-case';