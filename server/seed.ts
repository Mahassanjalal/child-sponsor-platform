import { db } from "./db";
import { users, children, sponsorships, reports, payments } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

const sampleChildren = [
  {
    firstName: "Maria",
    lastName: "Santos",
    dateOfBirth: new Date("2016-03-15"),
    gender: "female",
    location: "Manila, Philippines",
    story: "Maria is a bright and curious 8-year-old who loves reading and dreams of becoming a teacher. She lives with her grandmother in a small community where access to education is limited.",
    needs: "School supplies, uniform, and educational materials for her primary education. Maria also needs regular health check-ups and nutritious meals to support her growth.",
    monthlyAmount: "35.00",
  },
  {
    firstName: "Emmanuel",
    lastName: "Okonkwo",
    dateOfBirth: new Date("2015-07-22"),
    gender: "male",
    location: "Lagos, Nigeria",
    story: "Emmanuel is a talented 9-year-old who excels in mathematics and enjoys playing football with his friends. His father works as a day laborer, making it difficult to afford school fees.",
    needs: "Tuition support, textbooks, and school uniforms. Emmanuel also requires regular healthcare visits and balanced nutrition to thrive in his studies.",
    monthlyAmount: "35.00",
  },
  {
    firstName: "Priya",
    lastName: "Sharma",
    dateOfBirth: new Date("2017-11-08"),
    gender: "female",
    location: "Jaipur, India",
    story: "Priya is a joyful 7-year-old with a passion for drawing and singing. She lives with her parents and two siblings in a small village where educational opportunities are scarce.",
    needs: "School enrollment fees, art supplies, and basic educational materials. Priya needs nutritional support and regular health monitoring.",
    monthlyAmount: "35.00",
  },
  {
    firstName: "Carlos",
    lastName: "Mendoza",
    dateOfBirth: new Date("2014-05-30"),
    gender: "male",
    location: "Guatemala City, Guatemala",
    story: "Carlos is an energetic 10-year-old who loves learning about animals and nature. Despite his enthusiasm for learning, his family struggles to provide the resources he needs for school.",
    needs: "Complete school supplies, uniforms, and transportation to the nearest school. Carlos requires regular medical check-ups and a balanced diet.",
    monthlyAmount: "40.00",
  },
  {
    firstName: "Amara",
    lastName: "Diallo",
    dateOfBirth: new Date("2016-09-12"),
    gender: "female",
    location: "Dakar, Senegal",
    story: "Amara is a compassionate 8-year-old who helps care for her younger siblings while her mother works. She dreams of becoming a nurse to help others in her community.",
    needs: "School fees, healthcare access, and educational materials. Amara needs nutritional support and opportunities to focus on her education.",
    monthlyAmount: "35.00",
  },
];

export async function seedDatabase() {
  try {
    
    // check if db is connected
    const existingChildren = await db.select().from(children).limit(1);
    if (existingChildren.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    const adminPassword = await hashPassword("admin123");
    const [admin] = await db.insert(users).values({
      email: "admin@hopeconnect.org",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    }).returning();
    console.log("Created admin user:", admin.email);

    const sponsorPassword = await hashPassword("sponsor123");
    const [sponsor1] = await db.insert(users).values({
      email: "sarah.johnson@email.com",
      password: sponsorPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      role: "sponsor",
      phone: "+1-555-0123",
    }).returning();
    console.log("Created sponsor user:", sponsor1.email);

    const [sponsor2] = await db.insert(users).values({
      email: "michael.chen@email.com",
      password: sponsorPassword,
      firstName: "Michael",
      lastName: "Chen",
      role: "sponsor",
      phone: "+1-555-0124",
    }).returning();
    console.log("Created sponsor user:", sponsor2.email);

    const [sponsor3] = await db.insert(users).values({
      email: "emily.williams@email.com",
      password: sponsorPassword,
      firstName: "Emily",
      lastName: "Williams",
      role: "sponsor",
      phone: "+1-555-0125",
      address: "123 Oak Street, Boston, MA 02101",
    }).returning();
    console.log("Created sponsor user:", sponsor3.email);

    const [sponsor4] = await db.insert(users).values({
      email: "david.garcia@email.com",
      password: sponsorPassword,
      firstName: "David",
      lastName: "Garcia",
      role: "sponsor",
      phone: "+1-555-0126",
    }).returning();
    console.log("Created sponsor user:", sponsor4.email);

    const [sponsor5] = await db.insert(users).values({
      email: "jennifer.brown@email.com",
      password: sponsorPassword,
      firstName: "Jennifer",
      lastName: "Brown",
      role: "sponsor",
      phone: "+1-555-0127",
      address: "456 Maple Avenue, Seattle, WA 98101",
    }).returning();
    console.log("Created sponsor user:", sponsor5.email);

    const admin2Password = await hashPassword("admin456");
    const [admin2] = await db.insert(users).values({
      email: "coordinator@hopeconnect.org",
      password: admin2Password,
      firstName: "Program",
      lastName: "Coordinator",
      role: "admin",
    }).returning();
    console.log("Created admin user:", admin2.email);

    const createdChildren: typeof children.$inferSelect[] = [];
    for (const childData of sampleChildren) {
      const [child] = await db.insert(children).values(childData).returning();
      createdChildren.push(child);
      console.log("Created child:", child.firstName, child.lastName);
    }

    const [sponsorship1] = await db.insert(sponsorships).values({
      sponsorId: sponsor1.id,
      childId: createdChildren[0].id,
      status: "active",
      monthlyAmount: createdChildren[0].monthlyAmount,
    }).returning();

    await db.update(children).set({ isSponsored: true }).where(eq(children.id, createdChildren[0].id));
    console.log("Created sponsorship for Maria");

    const [sponsorship2] = await db.insert(sponsorships).values({
      sponsorId: sponsor2.id,
      childId: createdChildren[1].id,
      status: "active",
      monthlyAmount: createdChildren[1].monthlyAmount,
    }).returning();

    await db.update(children).set({ isSponsored: true }).where(eq(children.id, createdChildren[1].id));
    console.log("Created sponsorship for Emmanuel");

    const paymentDates = [
      new Date("2025-01-01"),
      new Date("2024-12-01"),
      new Date("2024-11-01"),
    ];

    for (const date of paymentDates) {
      await db.insert(payments).values({
        sponsorshipId: sponsorship1.id,
        amount: createdChildren[0].monthlyAmount,
        status: "completed",
        paymentDate: date,
      });
    }
    console.log("Created payments for sponsorship 1");

    for (const date of paymentDates) {
      await db.insert(payments).values({
        sponsorshipId: sponsorship2.id,
        amount: createdChildren[1].monthlyAmount,
        status: "completed",
        paymentDate: date,
      });
    }
    console.log("Created payments for sponsorship 2");

    await db.insert(reports).values({
      childId: createdChildren[0].id,
      title: "January 2025 Progress Report - Maria",
      content: "Maria has been doing exceptionally well in her studies this month. She received high marks in her reading comprehension test and has been helping other students with their assignments. Her teacher notes that she is one of the most dedicated students in class. Maria continues to express her desire to become a teacher and has been participating actively in all classroom activities.",
      reportDate: new Date("2025-01-15"),
    });

    await db.insert(reports).values({
      childId: createdChildren[0].id,
      title: "December 2024 Holiday Update - Maria",
      content: "During the holiday season, Maria participated in the community celebration organized by our program. She performed a traditional dance with her classmates and received a special gift package including new books and school supplies. Maria sends her heartfelt gratitude to her sponsor for the continued support.",
      reportDate: new Date("2024-12-20"),
    });

    await db.insert(reports).values({
      childId: createdChildren[1].id,
      title: "January 2025 Progress Report - Emmanuel",
      content: "Emmanuel continues to excel in mathematics, scoring 95% on his recent exam. He has been selected to represent his school in an upcoming regional math competition. Outside of academics, Emmanuel has been practicing football regularly and his team won a local tournament. His family is grateful for the educational support that allows him to focus on his studies.",
      reportDate: new Date("2025-01-15"),
    });

    console.log("Created sample reports");
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
