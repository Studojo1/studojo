/**
 * Seed Resume Examples Script
 * 
 * Creates example resumes for different job types that users can browse and use as templates.
 */

// Determine if we're in Docker or local
const isDocker = process.env.DOCKER_CONTAINER === "true" || process.cwd() === "/src";

// Import modules based on context
let db: any;
let resumeExamples: any;
let eq: any, and: any;
let ResumeSection: any;

if (isDocker) {
  // In Docker, app code is at /src/app
  db = (await import("/src/app/lib/db.js")).default;
  const schema = await import("/src/auth-schema.js");
  resumeExamples = schema.resumeExamples;
  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  and = drizzle.and;
  const draft = await import("/src/app/lib/resume-draft.js");
  ResumeSection = draft.ResumeSection;
} else {
  // Local execution
  db = (await import("../apps/frontend/app/lib/db.js")).default;
  const schema = await import("../apps/frontend/app/auth-schema.js");
  resumeExamples = schema.resumeExamples;
  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  and = drizzle.and;
  const draft = await import("../apps/frontend/app/lib/resume-draft.js");
  ResumeSection = draft.ResumeSection;
}

// Example resume data for different job types
const exampleResumes: Array<{
  jobType: string;
  jobTypeLabel: string;
  templateId: string;
  name: string;
  description: string;
  sections: ResumeSection[];
}> = [
  // Software Engineer - Modern Template
  {
    jobType: "software-engineer",
    jobTypeLabel: "Software Engineer",
    templateId: "modern",
    name: "Software Engineer - Modern Template",
    description: "Professional software engineer resume with modern design",
    sections: [
      {
        id: "contact-1",
        type: "contact",
        order: 0,
        content: {
          contact: {
            name: "Alex Chen",
            email: "alex.chen@example.com",
            phone: "+1 (555) 234-5678",
            location: "Seattle, WA",
            linkedin: "linkedin.com/in/alexchen",
            website: "alexchen.dev",
          },
        },
      },
      {
        id: "summary-1",
        type: "summary",
        order: 1,
        content: {
          summary: "Full-stack software engineer with 6+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud infrastructure. Passionate about clean code, system design, and mentoring junior developers.",
        },
      },
      {
        id: "experience-1",
        type: "experience",
        order: 2,
        content: {
          experience: [
            {
              id: "exp-1",
              company: "Tech Innovations Inc.",
              role: "Senior Software Engineer",
              startDate: "2020-03",
              endDate: null,
              isCurrent: true,
              description: "Lead development of customer-facing platform serving 500K+ users\n• Architected microservices using Node.js, reducing latency by 50%\n• Built React components library used across 10+ teams\n• Implemented CI/CD pipelines reducing deployment time by 70%",
            },
            {
              id: "exp-2",
              company: "StartupCo",
              role: "Full Stack Developer",
              startDate: "2018-06",
              endDate: "2020-02",
              isCurrent: false,
              description: "Developed RESTful APIs and React frontend for SaaS platform\n• Reduced database query time by 60% through optimization\n• Collaborated with product team to ship features 2x faster",
            },
          ],
        },
      },
      {
        id: "education-1",
        type: "education",
        order: 3,
        content: {
          education: [
            {
              id: "edu-1",
              institution: "University of Washington",
              degree: "B.S. Computer Science",
              fieldOfStudy: "Computer Science",
              startDate: "2014-09",
              endDate: "2018-05",
              isCurrent: false,
              description: "GPA: 3.9/4.0\nDean's List: 2016-2018",
            },
          ],
        },
      },
      {
        id: "skills-1",
        type: "skills",
        order: 4,
        content: {
          skills: [
            { id: "skill-1", category: "Languages", name: "JavaScript", proficiency: "Expert" },
            { id: "skill-2", category: "Languages", name: "TypeScript", proficiency: "Expert" },
            { id: "skill-3", category: "Languages", name: "Python", proficiency: "Advanced" },
            { id: "skill-4", category: "Frameworks", name: "React", proficiency: "Expert" },
            { id: "skill-5", category: "Frameworks", name: "Node.js", proficiency: "Expert" },
            { id: "skill-6", category: "Tools", name: "Docker", proficiency: "Advanced" },
            { id: "skill-7", category: "Tools", name: "AWS", proficiency: "Advanced" },
            { id: "skill-8", category: "Tools", name: "Kubernetes", proficiency: "Intermediate" },
          ],
        },
      },
      {
        id: "projects-1",
        type: "projects",
        order: 5,
        content: {
          projects: [
            {
              id: "proj-1",
              title: "Open Source Library",
              url: "github.com/alexchen/oss-lib",
              startDate: "2021-01",
              endDate: null,
              description: "Maintained popular open-source library with 5K+ stars\n• Implemented new features based on community feedback\n• Fixed critical bugs affecting 100+ projects",
            },
          ],
        },
      },
    ],
  },
  // Software Engineer - Minimal Template
  {
    jobType: "software-engineer",
    jobTypeLabel: "Software Engineer",
    templateId: "minimal",
    name: "Software Engineer - Minimal Template",
    description: "ATS-friendly software engineer resume with clean design",
    sections: [
      {
        id: "contact-2",
        type: "contact",
        order: 0,
        content: {
          contact: {
            name: "Alex Chen",
            email: "alex.chen@example.com",
            phone: "+1 (555) 234-5678",
            location: "Seattle, WA",
            linkedin: "linkedin.com/in/alexchen",
            website: "alexchen.dev",
          },
        },
      },
      {
        id: "summary-2",
        type: "summary",
        order: 1,
        content: {
          summary: "Full-stack software engineer with 6+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud infrastructure.",
        },
      },
      {
        id: "experience-2",
        type: "experience",
        order: 2,
        content: {
          experience: [
            {
              id: "exp-3",
              company: "Tech Innovations Inc.",
              role: "Senior Software Engineer",
              startDate: "2020-03",
              endDate: null,
              isCurrent: true,
              description: "Lead development of customer-facing platform serving 500K+ users. Architected microservices using Node.js, reducing latency by 50%. Built React components library used across 10+ teams.",
            },
          ],
        },
      },
      {
        id: "education-2",
        type: "education",
        order: 3,
        content: {
          education: [
            {
              id: "edu-2",
              institution: "University of Washington",
              degree: "B.S. Computer Science",
              fieldOfStudy: "Computer Science",
              startDate: "2014-09",
              endDate: "2018-05",
              isCurrent: false,
            },
          ],
        },
      },
      {
        id: "skills-2",
        type: "skills",
        order: 4,
        content: {
          skills: [
            { id: "skill-9", category: "Languages", name: "JavaScript" },
            { id: "skill-10", category: "Languages", name: "TypeScript" },
            { id: "skill-11", category: "Languages", name: "Python" },
            { id: "skill-12", category: "Frameworks", name: "React" },
            { id: "skill-13", category: "Frameworks", name: "Node.js" },
            { id: "skill-14", category: "Tools", name: "Docker" },
            { id: "skill-15", category: "Tools", name: "AWS" },
          ],
        },
      },
    ],
  },
  // Marketing Manager - Creative Template
  {
    jobType: "marketing-manager",
    jobTypeLabel: "Marketing Manager",
    templateId: "creative",
    name: "Marketing Manager - Creative Template",
    description: "Dynamic marketing manager resume with creative design",
    sections: [
      {
        id: "contact-3",
        type: "contact",
        order: 0,
        content: {
          contact: {
            name: "Sarah Martinez",
            email: "sarah.martinez@example.com",
            phone: "+1 (555) 345-6789",
            location: "New York, NY",
            linkedin: "linkedin.com/in/sarahmartinez",
            website: "sarahmartinez.com",
          },
        },
      },
      {
        id: "summary-3",
        type: "summary",
        order: 1,
        content: {
          summary: "Strategic marketing leader with 8+ years of experience driving brand growth and customer acquisition. Proven track record of launching successful campaigns that increased revenue by 40%+. Expert in digital marketing, content strategy, and team leadership.",
        },
      },
      {
        id: "experience-3",
        type: "experience",
        order: 2,
        content: {
          experience: [
            {
              id: "exp-4",
              company: "Global Brands Co.",
              role: "Marketing Manager",
              startDate: "2019-05",
              endDate: null,
              isCurrent: true,
              description: "Lead marketing strategy for portfolio of 5 consumer brands\n• Increased brand awareness by 60% through integrated campaigns\n• Managed $2M+ annual marketing budget\n• Grew email list from 50K to 200K subscribers",
            },
            {
              id: "exp-5",
              company: "Digital Agency",
              role: "Senior Marketing Specialist",
              startDate: "2017-01",
              endDate: "2019-04",
              isCurrent: false,
              description: "Developed and executed marketing campaigns for 20+ clients\n• Achieved average ROI of 300% across all campaigns\n• Managed social media accounts with 500K+ followers",
            },
          ],
        },
      },
      {
        id: "education-3",
        type: "education",
        order: 3,
        content: {
          education: [
            {
              id: "edu-3",
              institution: "New York University",
              degree: "M.B.A. Marketing",
              fieldOfStudy: "Marketing",
              startDate: "2015-09",
              endDate: "2017-05",
              isCurrent: false,
            },
            {
              id: "edu-4",
              institution: "Boston University",
              degree: "B.A. Communications",
              fieldOfStudy: "Communications",
              startDate: "2011-09",
              endDate: "2015-05",
              isCurrent: false,
            },
          ],
        },
      },
      {
        id: "skills-3",
        type: "skills",
        order: 4,
        content: {
          skills: [
            { id: "skill-16", category: "Marketing", name: "Digital Marketing", proficiency: "Expert" },
            { id: "skill-17", category: "Marketing", name: "Content Strategy", proficiency: "Expert" },
            { id: "skill-18", category: "Marketing", name: "SEO/SEM", proficiency: "Advanced" },
            { id: "skill-19", category: "Tools", name: "Google Analytics", proficiency: "Expert" },
            { id: "skill-20", category: "Tools", name: "HubSpot", proficiency: "Advanced" },
            { id: "skill-21", category: "Tools", name: "Adobe Creative Suite", proficiency: "Intermediate" },
          ],
        },
      },
    ],
  },
  // Data Scientist - Minimal Template
  {
    jobType: "data-scientist",
    jobTypeLabel: "Data Scientist",
    templateId: "minimal",
    name: "Data Scientist - Minimal Template",
    description: "Professional data scientist resume with ATS-friendly format",
    sections: [
      {
        id: "contact-4",
        type: "contact",
        order: 0,
        content: {
          contact: {
            name: "Dr. James Kim",
            email: "james.kim@example.com",
            phone: "+1 (555) 456-7890",
            location: "San Francisco, CA",
            linkedin: "linkedin.com/in/jameskim",
            website: "jameskim.ai",
          },
        },
      },
      {
        id: "summary-4",
        type: "summary",
        order: 1,
        content: {
          summary: "Data scientist with 5+ years of experience in machine learning, statistical analysis, and predictive modeling. PhD in Statistics. Expert in Python, R, and cloud ML platforms. Published 10+ research papers.",
        },
      },
      {
        id: "experience-4",
        type: "experience",
        order: 2,
        content: {
          experience: [
            {
              id: "exp-6",
              company: "AI Solutions Inc.",
              role: "Senior Data Scientist",
              startDate: "2020-08",
              endDate: null,
              isCurrent: true,
              description: "Develop ML models for recommendation systems serving 1M+ users\n• Improved model accuracy by 25% through feature engineering\n• Built real-time prediction pipeline reducing latency to <100ms\n• Mentored team of 3 junior data scientists",
            },
            {
              id: "exp-7",
              company: "Research Lab",
              role: "Research Scientist",
              startDate: "2018-06",
              endDate: "2020-07",
              isCurrent: false,
              description: "Conducted research on deep learning for computer vision\n• Published 5 papers in top-tier conferences\n• Developed novel architecture improving accuracy by 15%",
            },
          ],
        },
      },
      {
        id: "education-4",
        type: "education",
        order: 3,
        content: {
          education: [
            {
              id: "edu-5",
              institution: "Stanford University",
              degree: "Ph.D. Statistics",
              fieldOfStudy: "Statistics",
              startDate: "2014-09",
              endDate: "2018-05",
              isCurrent: false,
              description: "Dissertation: Advanced Machine Learning Techniques for High-Dimensional Data",
            },
            {
              id: "edu-6",
              institution: "MIT",
              degree: "M.S. Mathematics",
              fieldOfStudy: "Mathematics",
              startDate: "2012-09",
              endDate: "2014-05",
              isCurrent: false,
            },
          ],
        },
      },
      {
        id: "skills-4",
        type: "skills",
        order: 4,
        content: {
          skills: [
            { id: "skill-22", category: "Languages", name: "Python", proficiency: "Expert" },
            { id: "skill-23", category: "Languages", name: "R", proficiency: "Expert" },
            { id: "skill-24", category: "Languages", name: "SQL", proficiency: "Advanced" },
            { id: "skill-25", category: "ML Frameworks", name: "TensorFlow", proficiency: "Expert" },
            { id: "skill-26", category: "ML Frameworks", name: "PyTorch", proficiency: "Expert" },
            { id: "skill-27", category: "Tools", name: "AWS SageMaker", proficiency: "Advanced" },
            { id: "skill-28", category: "Tools", name: "Databricks", proficiency: "Advanced" },
          ],
        },
      },
      {
        id: "projects-2",
        type: "projects",
        order: 5,
        content: {
          projects: [
            {
              id: "proj-2",
              title: "NLP Sentiment Analysis",
              url: "github.com/jameskim/nlp-sentiment",
              startDate: "2021-01",
              endDate: null,
              description: "Built transformer-based model for sentiment analysis\n• Achieved 92% accuracy on benchmark dataset\n• Deployed as API serving 10K+ requests/day",
            },
          ],
        },
      },
    ],
  },
  // Product Manager - Executive Template
  {
    jobType: "product-manager",
    jobTypeLabel: "Product Manager",
    templateId: "executive",
    name: "Product Manager - Executive Template",
    description: "Senior product manager resume with executive design",
    sections: [
      {
        id: "contact-5",
        type: "contact",
        order: 0,
        content: {
          contact: {
            name: "Michael Thompson",
            email: "michael.thompson@example.com",
            phone: "+1 (555) 567-8901",
            location: "Austin, TX",
            linkedin: "linkedin.com/in/michaelthompson",
            website: "michaelthompson.pm",
          },
        },
      },
      {
        id: "summary-5",
        type: "summary",
        order: 1,
        content: {
          summary: "Strategic product leader with 10+ years of experience launching successful products from concept to market. Expert in product strategy, user research, and cross-functional team leadership. Led products generating $50M+ in annual revenue.",
        },
      },
      {
        id: "experience-5",
        type: "experience",
        order: 2,
        content: {
          experience: [
            {
              id: "exp-8",
              company: "TechCorp",
              role: "Senior Product Manager",
              startDate: "2019-01",
              endDate: null,
              isCurrent: true,
              description: "Lead product strategy for enterprise SaaS platform\n• Increased user engagement by 80% through feature improvements\n• Launched 3 major product features generating $20M+ revenue\n• Manage team of 15 engineers and designers",
            },
            {
              id: "exp-9",
              company: "StartupXYZ",
              role: "Product Manager",
              startDate: "2016-03",
              endDate: "2018-12",
              isCurrent: false,
              description: "Owned product roadmap and feature prioritization\n• Increased conversion rate by 45% through A/B testing\n• Collaborated with engineering to ship features 50% faster",
            },
          ],
        },
      },
      {
        id: "education-5",
        type: "education",
        order: 3,
        content: {
          education: [
            {
              id: "edu-7",
              institution: "Harvard Business School",
              degree: "M.B.A.",
              fieldOfStudy: "Business Administration",
              startDate: "2014-09",
              endDate: "2016-05",
              isCurrent: false,
            },
            {
              id: "edu-8",
              institution: "UC Berkeley",
              degree: "B.S. Computer Science",
              fieldOfStudy: "Computer Science",
              startDate: "2010-09",
              endDate: "2014-05",
              isCurrent: false,
            },
          ],
        },
      },
      {
        id: "skills-5",
        type: "skills",
        order: 4,
        content: {
          skills: [
            { id: "skill-29", category: "Product", name: "Product Strategy", proficiency: "Expert" },
            { id: "skill-30", category: "Product", name: "User Research", proficiency: "Expert" },
            { id: "skill-31", category: "Product", name: "Roadmap Planning", proficiency: "Expert" },
            { id: "skill-32", category: "Tools", name: "Jira", proficiency: "Expert" },
            { id: "skill-33", category: "Tools", name: "Figma", proficiency: "Advanced" },
            { id: "skill-34", category: "Tools", name: "Mixpanel", proficiency: "Advanced" },
          ],
        },
      },
    ],
  },
];

/**
 * Seed example resumes into database
 */
async function main() {
  console.log("Starting resume examples seed...\n");

  try {
    // Clear existing examples (optional - comment out if you want to keep existing)
    // await db.delete(resumeExamples);

    let inserted = 0;
    let skipped = 0;

    for (const example of exampleResumes) {
      try {
        // Check if example already exists
        const existing = await db
          .select()
          .from(resumeExamples)
          .where(
            and(
              eq(resumeExamples.jobType, example.jobType),
              eq(resumeExamples.templateId, example.templateId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`  ⏭ Skipping ${example.name} (already exists)`);
          skipped++;
          continue;
        }

        // Insert example
        await db.insert(resumeExamples).values({
          jobType: example.jobType,
          jobTypeLabel: example.jobTypeLabel,
          templateId: example.templateId,
          name: example.name,
          description: example.description,
          resumeData: example.sections as any,
          isActive: true,
        });

        console.log(`  ✓ Inserted ${example.name}`);
        inserted++;
      } catch (error: any) {
        console.error(`  ✗ Failed to insert ${example.name}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Summary:");
    console.log(`  Inserted: ${inserted}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${exampleResumes.length}`);
  } catch (error: any) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

