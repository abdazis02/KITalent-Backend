import { Module } from '@nestjs/common';
import { VacanciesController } from './vacancies.controller';
import { VacanciesService } from './vacancies.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  controllers: [VacanciesController, CandidatesController],
  providers: [VacanciesService, CandidatesService],
})
export class RecruitmentModule {}
