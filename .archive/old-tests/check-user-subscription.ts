import { db } from './server/db';
import { users, companies } from './shared/schema';
import { eq } from 'drizzle-orm';

async function checkUser() {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, 'saba@newvantageco.com'));
    
    console.log('User Details:');
    console.log(JSON.stringify({
      id: user?.id,
      email: user?.email,
      role: user?.role,
      isActive: user?.isActive,
      companyId: user?.companyId,
      subscriptionPlan: user?.subscriptionPlan
    }, null, 2));
    
    if (user?.companyId) {
      const [company] = await db.select().from(companies).where(eq(companies.id, user.companyId));
      console.log('\nCompany Details:');
      console.log(JSON.stringify({
        id: company?.id,
        name: company?.name,
        status: company?.status,
        subscriptionPlan: company?.subscriptionPlan,
        aiEnabled: company?.aiEnabled,
        stripeSubscriptionStatus: company?.stripeSubscriptionStatus,
        isSubscriptionExempt: company?.isSubscriptionExempt
      }, null, 2));
    } else {
      console.log('\nNo company associated with user');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
