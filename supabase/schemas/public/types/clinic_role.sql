CREATE TYPE "public"."clinic_role" AS ENUM (
  'owner',
  'non-owner'
);

GRANT USAGE ON TYPE "public"."clinic_role" TO "postgres";
