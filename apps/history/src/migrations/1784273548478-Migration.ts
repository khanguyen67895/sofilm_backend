import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1784273548478 implements MigrationInterface {
  name = 'Migration1784273548478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "watch_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying NOT NULL, "movie_id" character varying NOT NULL, "episode_id" character varying, "position_seconds" integer NOT NULL DEFAULT '0', "duration_seconds" integer, "completed" boolean NOT NULL DEFAULT false, "last_watched_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_801581ad1b82f180fb37ea79167" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a10da827bd3f6cdc00a7cba93" ON "watch_progress" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e6595ad2b98535a62d0e32ef80" ON "watch_progress" ("movie_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a92bad298d2a3281dcd9cf5eeb" ON "watch_progress" ("user_id", "movie_id", "episode_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying NOT NULL, "movie_id" character varying NOT NULL, CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3f519ed95f775c781a25408917" ON "likes" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17adb777baffd826b2295308a3" ON "likes" ("movie_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9b2d4abf53a54dead5fe14ba0f" ON "likes" ("user_id", "movie_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9b2d4abf53a54dead5fe14ba0f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_17adb777baffd826b2295308a3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3f519ed95f775c781a25408917"`);
    await queryRunner.query(`DROP TABLE "likes"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a92bad298d2a3281dcd9cf5eeb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e6595ad2b98535a62d0e32ef80"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4a10da827bd3f6cdc00a7cba93"`);
    await queryRunner.query(`DROP TABLE "watch_progress"`);
  }
}
