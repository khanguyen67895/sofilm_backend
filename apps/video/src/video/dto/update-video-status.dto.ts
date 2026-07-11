import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { VideoStatus } from '../../entities/video.entity';
import { VideoQualityLevel } from '../../entities/video-quality.entity';

export class VideoQualityInputDto {
  @ApiProperty({ enum: VideoQualityLevel })
  @IsEnum(VideoQualityLevel)
  quality: VideoQualityLevel;

  @ApiProperty()
  @IsString()
  hlsPlaylistUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bitrateKbps?: number;
}

export class SubtitleInputDto {
  @ApiProperty()
  @IsString()
  language: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateVideoStatusDto {
  @ApiProperty({ enum: VideoStatus })
  @IsEnum(VideoStatus)
  status: VideoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hlsMasterPlaylistUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiPropertyOptional({ type: [VideoQualityInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VideoQualityInputDto)
  qualities?: VideoQualityInputDto[];

  @ApiPropertyOptional({ type: [SubtitleInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtitleInputDto)
  subtitles?: SubtitleInputDto[];
}
