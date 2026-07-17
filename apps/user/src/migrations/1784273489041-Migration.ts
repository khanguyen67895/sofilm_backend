import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1784273489041 implements MigrationInterface {
    name = 'Migration1784273489041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "userId" character varying NOT NULL, "theme" character varying NOT NULL DEFAULT 'dark', "language" character varying NOT NULL DEFAULT 'vi', "autoplay" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_9175e059b0a720536f7726a88c7" UNIQUE ("userId"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9175e059b0a720536f7726a88c" ON "settings" ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."profiles_subscriptiontier_enum" AS ENUM('FREE', 'VIP', 'PREMIUM')`);
        await queryRunner.query(`CREATE TABLE "profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "userId" character varying NOT NULL, "displayName" character varying NOT NULL DEFAULT '', "avatar" character varying, "bio" text, "dateOfBirth" date, "gender" character varying, "country" character varying, "subscriptionTier" "public"."profiles_subscriptiontier_enum" NOT NULL DEFAULT 'FREE', "subscriptionExpiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_315ecd98bd1a42dcf2ec4e2e985" UNIQUE ("userId"), CONSTRAINT "PK_8e520eb4da7dc01d0e190447c8e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_315ecd98bd1a42dcf2ec4e2e98" ON "profiles" ("userId") `);
        await queryRunner.query(`CREATE TABLE "notification_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "userId" character varying NOT NULL, "emailEnabled" boolean NOT NULL DEFAULT true, "pushEnabled" boolean NOT NULL DEFAULT true, "smsEnabled" boolean NOT NULL DEFAULT false, "inAppEnabled" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_5a8ffc3b89343043c9440d631e2" UNIQUE ("userId"), CONSTRAINT "PK_d131abd7996c475ef768d4559ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a8ffc3b89343043c9440d631e" ON "notification_settings" ("userId") `);
        await queryRunner.query(`CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "userId" character varying NOT NULL, "movieId" character varying NOT NULL, CONSTRAINT "UQ_fa20f288eb90959390f381e20dd" UNIQUE ("userId", "movieId"), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e747534006c6e3c2f09939da60" ON "favorites" ("userId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_e747534006c6e3c2f09939da60"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a8ffc3b89343043c9440d631e"`);
        await queryRunner.query(`DROP TABLE "notification_settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_315ecd98bd1a42dcf2ec4e2e98"`);
        await queryRunner.query(`DROP TABLE "profiles"`);
        await queryRunner.query(`DROP TYPE "public"."profiles_subscriptiontier_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9175e059b0a720536f7726a88c"`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
