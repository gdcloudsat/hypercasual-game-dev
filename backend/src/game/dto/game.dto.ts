import { IsInt, IsString, IsEnum, Min, Max, IsOptional } from 'class-validator';

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
}

export enum GameType {
  COLOR_SORT = 'color_sort',
  BUBBLE_SHOOTER = 'bubble_shooter',
  ROLLING_BALL = 'rolling_ball',
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

  @IsEnum(GameType)
  @IsOptional()
  gameType?: GameType;
}

export class StartSessionDto {
  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsEnum(GameType)
  @IsOptional()
  gameType?: GameType;
}
