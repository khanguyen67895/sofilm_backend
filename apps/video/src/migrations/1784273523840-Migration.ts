import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1784273523840 implements MigrationInterface {
    name = 'Migration1784273523840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "shorts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "title" character varying NOT NULL, "content" text, "thumbnail_url" character varying, "movie_slug" character varying, "likes_count" integer NOT NULL DEFAULT '0', "comments_count" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "video_id" uuid, CONSTRAINT "PK_5ef2e7a99b5c20e3de786724972" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "short_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" character varying NOT NULL, "short_id" character varying NOT NULL, CONSTRAINT "PK_82fa52285186a65cc0a6c9449aa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ebb8009c4bee57c58ffc47e06" ON "short_likes" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_614b7bf4cdd5fffb46260ed0bc" ON "short_likes" ("short_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_546688d7a0e3458feadf0100f4" ON "short_likes" ("user_id", "short_id") `);
        await queryRunner.query(`ALTER TABLE "shorts" ADD CONSTRAINT "FK_c542761e0aa9559d78e021ee69d" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shorts" DROP CONSTRAINT "FK_c542761e0aa9559d78e021ee69d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_546688d7a0e3458feadf0100f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_614b7bf4cdd5fffb46260ed0bc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ebb8009c4bee57c58ffc47e06"`);
        await queryRunner.query(`DROP TABLE "short_likes"`);
        await queryRunner.query(`DROP TABLE "shorts"`);
    }

}
