import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1784272875794 implements MigrationInterface {
    name = 'Migration1784272875794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying NOT NULL, "rating" double precision, "comment" text, "liked_by_user_ids" text NOT NULL DEFAULT '', "movie_id" uuid, CONSTRAINT "UQ_9e3702ffa3d824d95eee3ec287a" UNIQUE ("movie_id", "user_id"), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_728447781a30bc3fcfe5c2f1cd" ON "reviews" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "banners" ADD "content" text`);
        await queryRunner.query(`ALTER TABLE "banners" ADD "thumbnail_url" character varying`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_563501cf3faa75a1ca40be84f82" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_563501cf3faa75a1ca40be84f82"`);
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "thumbnail_url"`);
        await queryRunner.query(`ALTER TABLE "banners" DROP COLUMN "content"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_728447781a30bc3fcfe5c2f1cd"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
    }

}
