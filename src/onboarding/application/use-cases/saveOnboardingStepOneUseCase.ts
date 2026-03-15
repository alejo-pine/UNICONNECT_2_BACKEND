import { eventLogger } from '../../../utils/eventLogger';
import { ServiceResult } from '../dto/serviceResult';
import { OnboardingRepositoryPort, OnboardingStepOneRecord } from '../../domain/ports/onboardingRepositoryPort';
import { OnboardingStepOneData, OnboardingStepOneInput } from '../../domain/entities/onboarding';

const toOnboardingStepOneData = (record: OnboardingStepOneRecord): OnboardingStepOneData => ({
  profileId: record.profile_id,
  career: record.career,
  semester: record.semester,
  phoneNumber: record.phone_number,
});

export class SaveOnboardingStepOneUseCase {
  constructor(private readonly onboardingRepository: OnboardingRepositoryPort) {}

  async execute(
    profileId: string,
    input: OnboardingStepOneInput
  ): Promise<ServiceResult<OnboardingStepOneData>> {
    try {
      const record = await this.onboardingRepository.saveOnboardingStepOneForProfile(profileId, input);

      if (!record) {
        return {
          data: null,
          error: 'Profile not found',
          statusCode: 404,
        };
      }

      return {
        data: toOnboardingStepOneData(record),
        error: null,
        statusCode: 200,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving onboarding step 1';
      eventLogger.error('SaveOnboardingStepOneUseCase.execute', message, { profileId });
      return {
        data: null,
        error: 'Error saving onboarding step 1',
        statusCode: 500,
      };
    }
  }
}
