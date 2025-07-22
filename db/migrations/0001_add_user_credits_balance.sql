-- 创建用户积分余额表
CREATE TABLE "user_credits_balance" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_credits_balance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_uuid" varchar(255) NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_credits_balance_user_uuid_unique" UNIQUE("user_uuid")
);

-- 创建索引以提高查询性能
CREATE INDEX "user_credits_balance_user_uuid_idx" ON "user_credits_balance" USING btree ("user_uuid");

-- 添加注释
COMMENT ON TABLE "user_credits_balance" IS '用户积分余额表';
COMMENT ON COLUMN "user_credits_balance"."user_uuid" IS '用户唯一标识';
COMMENT ON COLUMN "user_credits_balance"."balance" IS '当前积分余额';
COMMENT ON COLUMN "user_credits_balance"."created_at" IS '创建时间';
COMMENT ON COLUMN "user_credits_balance"."updated_at" IS '更新时间';