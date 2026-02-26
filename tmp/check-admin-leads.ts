import { db } from '../server/db';
import { leads, formulas, users, multiServiceLeads } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  const single = await db.select({
    id: leads.id,
    leadUserId: leads.userId,
    formulaId: leads.formulaId,
    formulaUserId: formulas.userId,
    ownerUserId: sql<string | null>`COALESCE(${leads.userId}, ${formulas.userId})`,
  })
    .from(leads)
    .leftJoin(formulas, eq(leads.formulaId, formulas.id))
    .limit(10);

  const multi = await db.select({
    id: multiServiceLeads.id,
    businessOwnerId: multiServiceLeads.businessOwnerId,
  })
    .from(multiServiceLeads)
    .limit(10);

  const us = await db.select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
  }).from(users).limit(10);

  console.log('single', single);
  console.log('multi', multi);
  console.log('users', us);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
