import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Đảm bảo dotenv được nạp để sử dụng biến môi trường
const prisma = new PrismaClient();

async function clearAllTables() {
    await prisma.$executeRawUnsafe(`
    DO
    $$
    DECLARE
        tablename text;
    BEGIN
        FOR tablename IN
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
        LOOP
            EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', tablename);
        END LOOP;
    END
    $$;
  `);
    console.log('✅ Đã xoá toàn bộ bản ghi trong tất cả các bảng.');
}

clearAllTables()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
