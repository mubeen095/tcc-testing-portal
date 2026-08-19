import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash as _hash, genSalt as _genSalt } from "bcryptjs";

const connectionString = process.env.DATABASE_URL ?? "";
const useSsl =
  process.env.DATABASE_SSL === "true" ||
  (!process.env.DATABASE_SSL &&
    new URL(connectionString).hostname.includes("supabase"));
const adapter = new PrismaPg({
  connectionString,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});
const prisma = new PrismaClient({ adapter });

async function hashPassword(plain: string) {
  const salt = await _genSalt(12);
  return _hash(plain, salt);
}

type Bank = {
  section: "COMMUNICATION" | "APTITUDE" | "VIBE";
  items: { text: string; options: string[]; correct: number }[];
};

// ------------------------------------------------------------------ Commons
const COMM: { text: string; options: string[]; correct: number }[] = [
  {
    text: "Choose the sentence with correct grammar:",
    options: [
      "She don't like coffee.",
      "She doesn't likes coffee.",
      "She does not like coffee.",
      "She not like coffee.",
    ],
    correct: 2,
  },
  {
    text: "Select the correctly spelled word:",
    options: ["Recieve", "Receive", "Reciet", "Receeve"],
    correct: 1,
  },
  {
    text: "Which word is closest in meaning to 'diligent'?",
    options: ["Lazy", "Careless", "Hardworking", "Rude"],
    correct: 2,
  },
  {
    text: "Complete the sentence: 'By the time we arrived, the meeting ____.'",
    options: ["has started", "had started", "have started", "will start"],
    correct: 1,
  },
  {
    text: "Choose the best professional opening for an email to a client:",
    options: [
      "'Hey, wats up??'",
      "'Dear Sir/Madam, I hope this message finds you well.'",
      "'Yo, we got your email.'",
      "'Hey there!!!'",
    ],
    correct: 1,
  },
  {
    text: "Identify the antonym of 'transparent' in the context of communication:",
    options: ["Clear", "Honest", "Opaque", "Open"],
    correct: 2,
  },
  {
    text: "Which option uses the comma correctly?",
    options: [
      "After the meeting, we will review the report.",
      "After the meeting we, will review the report.",
      "After, the meeting we will review the report.",
      "After the meeting we will, review the report.",
    ],
    correct: 0,
  },
  {
    text: "Reading comprehension: 'The manager praised the team for meeting the deadline despite the tight schedule.' What is the main idea?",
    options: [
      "The team missed the deadline.",
      "The manager praised the team for completing work on time under pressure.",
      "The schedule was very relaxed.",
      "The manager was unhappy with the work.",
    ],
    correct: 1,
  },
  {
    text: "'The proposal was rejected due to ____ lack of detail.' Choose the correct word:",
    options: ["its", "it's", "its'", "it"],
    correct: 0,
  },
  {
    text: "Choose the most professional way to decline a request:",
    options: [
      "No. Not interested.",
      "I'm afraid I won't be able to help with this, but I can suggest someone who can.",
      "Whatever, figure it out yourself.",
      "Sorry bro, can't do it.",
    ],
    correct: 1,
  },
  {
    text: "Which sentence is grammatically correct?",
    options: [
      "Neither of the answers are correct.",
      "Neither of the answers is correct.",
      "Neither of the answers were correct.",
      "Neither answers is correct.",
    ],
    correct: 1,
  },
  {
    text: "In a professional email, which closing is most appropriate?",
    options: [
      "Later, dude",
      "Best regards",
      "Cya soon!!!",
      "Toodles",
    ],
    correct: 1,
  },
];

const APT: (set: number) => { text: string; options: string[]; correct: number }[] = (s) => [
  {
    text: `If a train travels ${90 + s * 15} km in ${3 + s} hours, what is its average speed in km/h?`,
    options: [
      `${(90 + s * 15) / (3 + s)}`,
      `${(90 + s * 15) / (2 + s)}`,
      `${(90 + s * 15) / (4 + s)}`,
      `${90 + s * 15}`,
    ],
    correct: 0,
  },
  {
    text: "What is the next number in the series: 2, 6, 12, 20, 30, __?",
    options: ["36", "40", "42", "44"],
    correct: 2,
  },
  {
    text: "A shopkeeper buys an item for ₹500 and sells it for ₹625. What is the profit percentage?",
    options: ["20%", "25%", "15%", "30%"],
    correct: 1,
  },
  {
    text: "All roses are flowers. Some flowers fade quickly. Which conclusion must be true?",
    options: [
      "All roses fade quickly.",
      "Some roses fade quickly.",
      "No roses fade quickly.",
      "Cannot be determined from the statements.",
    ],
    correct: 3,
  },
  {
    text: `If 5 machines can produce ${50 * (s + 1)} items in 5 days, how many items can 8 machines produce in 5 days?`,
    options: [
      `${50 * (s + 1) * 8 / 5}`,
      `${50 * (s + 1) * 2}`,
      `${50 * (s + 1) * 5}`,
      `${50 * (s + 1)}`,
    ],
    correct: 0,
  },
  {
    text: "A data table shows monthly sales. January: 120, February: 150, March: 130. What is the average monthly sales for these three months?",
    options: ["130", "133.33", "140", "126.67"],
    correct: 1,
  },
  {
    text: "If x + y = 12 and x - y = 4, what is the value of x?",
    options: ["4", "6", "8", "10"],
    correct: 2,
  },
  {
    text: "In a class of 40 students, 25% are from Delhi. How many students are NOT from Delhi?",
    options: ["10", "15", "25", "30"],
    correct: 3,
  },
  {
    text: "Statement: 'The company's revenue increased by 20% in Q1 and then decreased by 10% in Q2.' Compared to the start of the year, revenue is:",
    options: [
      "down by 10%",
      "the same",
      "up by 8%",
      "up by 10%",
    ],
    correct: 2,
  },
  {
    text: "Which shape completes the analogy: square : 4 :: hexagon : ?",
    options: ["5", "6", "7", "8"],
    correct: 1,
  },
  {
    text: "A person walks 3 km north, then 4 km east. How far is the person now from the starting point (in straight line)?",
    options: ["7 km", "1 km", "5 km", "6 km"],
    correct: 2,
  },
  {
    text: "If the price of an item is ₹200 and it is discounted by 15%, what is the final price?",
    options: ["₹170", "₹175", "₹180", "₹185"],
    correct: 0,
  },
];

const VIBE: { text: string; options: string[]; correct: number }[] = [
  {
    text: "Your teammate misses a deadline and the task is now behind. What do you do?",
    options: [
      "Blame them in front of the team.",
      "Silently redo the work and complain later.",
      "Talk to them privately, understand what happened, and help get the task back on track.",
      "Report them to the manager immediately without discussing.",
    ],
    correct: 2,
  },
  {
    text: "You discover a small mistake in work you already submitted. Nobody noticed. What is your response?",
    options: [
      "Ignore it since nobody noticed.",
      "Wait to see if anyone complains.",
      "Inform your lead and fix the mistake.",
      "Hide the evidence.",
    ],
    correct: 2,
  },
  {
    text: "During an interview or meeting, you don't understand the question. What do you do?",
    options: [
      "Answer something vague to seem confident.",
      "Politely ask for clarification.",
      "Stay silent.",
      "Change the topic.",
    ],
    correct: 1,
  },
  {
    text: "A client rejects your proposal but gives no feedback. What's the best first step?",
    options: [
      "Send an aggressive reply.",
      "Ask for specific feedback so you can improve.",
      "Assume it's not the right fit and move on.",
      "Blame the proposal team.",
    ],
    correct: 1,
  },
  {
    text: "Your team has a disagreement about how to solve a problem. What should you do?",
    options: [
      "Insist only your idea works.",
      "Leave the discussion.",
      "Listen to all views and work toward a consensus based on the best evidence.",
      "Win the argument by any means.",
    ],
    correct: 2,
  },
  {
    text: "You are assigned a task you have never done before. What is your attitude?",
    options: [
      "Refuse the task.",
      "Try to avoid it.",
      "Take it as a learning opportunity and seek help where needed.",
      "Do it half-heartedly.",
    ],
    correct: 2,
  },
  {
    text: "Your project gets changed at the last minute. You were almost done. How do you respond at work?",
    options: [
      "Complain loudly about wasted effort.",
      "Adapt to the change calmly and adjust your plan.",
      "Stop working altogether.",
      "Blame the client.",
    ],
    correct: 1,
  },
  {
    text: "A colleague is struggling and asks you for help during your busy time. What do you do?",
    options: [
      "Say you're too busy and ignore them.",
      "Help only if it benefits you.",
      "Offer a reasonable helping hand or schedule a time to assist.",
      "Tell them to figure it out.",
    ],
    correct: 2,
  },
  {
    text: "You make an error that costs your team extra time. What is the most professional behavior?",
    options: [
      "Own it, apologize briefly, and work to correct it.",
      "Deny it ever happened.",
      "Blame the tools.",
      "Keep quiet and hope nobody notices.",
    ],
    correct: 0,
  },
  {
    text: "Which statement best reflects a growth mindset?",
    options: [
      "'I already know everything I need.'",
      "'Feedback helps me get better.'",
      "'I'm just not good at this, period.'",
      "'Other people are just more talented.'",
    ],
    correct: 1,
  },
  {
    text: "Your manager gives you constructive criticism on your work. What is the best reaction?",
    options: [
      "Get defensive and argue.",
      "Take notes, thank them, and incorporate the feedback.",
      "Take it personally and feel discouraged.",
      "Ignore the feedback.",
    ],
    correct: 1,
  },
  {
    text: "During a group discussion, someone interrupts others constantly. What should you do?",
    options: [
      "Interrupt them back.",
      "Kindly bring the conversation back to a respectful flow so everyone gets heard.",
      "Refuse to participate.",
      "Just stay silent the whole time.",
    ],
    correct: 1,
  },
];

const bankTemplate = (s: number): Bank[] => [
  { section: "COMMUNICATION", items: COMM },
  { section: "APTITUDE", items: APT(s) },
  { section: "VIBE", items: VIBE },
];

// ------------------------------------------------------------------ Sample candidates
const SAMPLES = [
  {
    fullName: "Ananya Sharma",
    email: "ananya.s@student.test",
    set: 0,
    college: "National Institute of Technology",
    branch: "Computer Science",
    year: "2023",
    roll: "21CSE104",
    phone: "+919812345601",
  },
  {
    fullName: "Rohan Mehta",
    email: "rohan.mehta@student.test",
    set: 1,
    college: "Delhi Technological University",
    branch: "Electronics",
    year: "2024",
    roll: "22ECE072",
    phone: "+919812345602",
  },
  {
    fullName: "Priya Nair",
    email: "priya.nair@student.test",
    set: 2,
    college: "College of Engineering Pune",
    branch: "Mechanical",
    year: "2022",
    roll: "20MEC315",
    phone: "+919812345603",
  },
  {
    fullName: "Kabir Singh",
    email: "kabir.singh@student.test",
    set: 0,
    college: "BITS Pilani",
    branch: "Information Technology",
    year: "2023",
    roll: "21IT098",
    phone: "+919812345604",
  },
  {
    fullName: "Isha Verma",
    email: "isha.verma@student.test",
    set: 1,
    college: "Delhi Technological University",
    branch: "Computer Science",
    year: "2024",
    roll: "22CSE055",
    phone: "+919812345605",
  },
];

async function main() {
  console.log("Seeding TCC recruitment portal…");

  const adminEmail =
    process.env.ADMIN_EMAIL ?? "mubeenmohammed2211@gmail.com";
  const adminPassword =
    process.env.ADMIN_PASSWORD ?? "asdmnb@123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "ADMIN" },
    });
    console.log(`  Admin created: ${adminEmail}`);
  } else {
    console.log("  Admin already exists (kept).");
  }

  await prisma.answer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.candidateEvaluation.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.user.deleteMany({ where: { role: "CANDIDATE" } });
  await prisma.question.deleteMany({});
  await prisma.assessment.deleteMany({});

  const now = new Date();
  const sets: { id: string; code: string; name: string }[] = [];
  for (const code of ["A", "B", "C"]) {
    const set = await prisma.testSet.upsert({
      where: { code },
      update: {},
      create: { code, name: `Test Set ${code}`, createdAt: now },
    });
    sets.push(set);
  }

  sets.forEach((set) => {
    console.log(`  Seeding Set ${set.code}…`);
  });

  const setIds: Record<string, string> = {};
  for (const set of sets) setIds[set.code] = set.id;

  for (let s = 0; s < 3; s++) {
    const set = sets[s];
    const banks = bankTemplate(s);
    for (const bank of banks) {
      let number = 1;
      for (const item of bank.items) {
        await prisma.question.create({
          data: {
            testSetId: set.id,
            section: bank.section,
            number,
            text: item.text,
            marks: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
            options: {
              create: item.options.map((text, i) => ({
                text,
                order: i + 1,
                isCorrect: i === item.correct,
              })),
            },
          },
        });
        number++;
      }
    }
  }
  console.log("  Question banks created (3 sets x 36 questions).");

  const assessment = await prisma.assessment.create({
    data: {
      name: "Campus Recruitment Assessment",
      durationMinutes: 30,
      isActive: true,
      createdAt: now,
    },
  });
  console.log(`  Assessment created: ${assessment.name}`);

  for (const sample of SAMPLES) {
    const passwordHash = await hashPassword("Candidate@123");
    const user = await prisma.user.create({
      data: {
        email: sample.email,
        passwordHash,
        role: "CANDIDATE",
        createdAt: now,
        updatedAt: now,
        candidateProfile: {
          create: {
            fullName: sample.fullName,
            phone: sample.phone,
            college: sample.college,
            branch: sample.branch,
            academicYear: sample.year,
            rollNumber: sample.roll,
            testSetId: setIds[["A", "B", "C"][sample.set]],
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    });
    void user;
  }
  console.log(`  ${SAMPLES.length} sample candidates created (password: Candidate@123).`);

  console.log("\nSeed complete.");
  console.log("Demo credentials:");
  console.log(`  Candidate:  ${SAMPLES[0].email} / Candidate@123`);
  console.log(`  Admin:      ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());