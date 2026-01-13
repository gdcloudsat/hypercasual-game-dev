import { IsInt, IsString, IsEnum, Min, Max } from 'class-validator';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  points: number;

  @IsInt()
  @Min(1)
  @Max(50)
  level: number;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsString()
  sessionToken: string;
}

export class StartSessionDto {
  @IsEnum(Difficulty)
  difficulty: Difficulty;
}
