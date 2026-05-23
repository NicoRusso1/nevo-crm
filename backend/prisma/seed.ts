/**
 * Prisma seed script.
 *
 * Models are not defined yet — this is a placeholder that runs cleanly so the
 * `db:seed` npm script and `prisma db seed` both succeed. Add real seed data
 * here once the schema introduces models (Users, Accounts, Contacts, etc.).
 */
import { prisma } from '../src/lib/prisma';

async function main(): Promise<void> {
  console.log('[seed] Starting neVo database seed...');

  // TODO: Insert seed data once Prisma models are defined.
  //   await prisma.user.createMany({ ... });

  console.log('[seed] No models defined yet — nothing to seed. Done.');
}

main()
  .catch((err: unknown) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
