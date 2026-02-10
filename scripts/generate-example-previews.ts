/**
 * Example Resume Preview Generation Script
 * 
 * Generates preview images for all example resumes by:
 * 1. Loading example resumes from database
 * 2. Generating PDFs using resume service
 * 3. Converting PDFs to PNG images
 * 4. Uploading PNGs to blob storage and updating database
 */

// Determine if we're in Docker or local
const isDocker = process.env.DOCKER_CONTAINER === "true" || process.cwd() === "/src";

// Import modules based on context
let db: any;
let resumeExamples: any;
let eq: any;
let uploadExamplePreview: any;
let ResumeSection: any;

if (isDocker) {
  db = (await import("/src/app/lib/db.js")).default;
  const schema = await import("/src/auth-schema.js");
  resumeExamples = schema.resumeExamples;
  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  const blobStorage = await import("/src/app/lib/blob-storage.server.js");
  uploadExamplePreview = blobStorage.uploadExamplePreview;
  const draft = await import("/src/app/lib/resume-draft.js");
  ResumeSection = draft.ResumeSection;
} else {
  db = (await import("../apps/frontend/app/lib/db.js")).default;
  const schema = await import("../apps/frontend/app/auth-schema.js");
  resumeExamples = schema.resumeExamples;
  const drizzle = await import("drizzle-orm");
  eq = drizzle.eq;
  const blobStorage = await import("../apps/frontend/app/lib/blob-storage.server.js");
  uploadExamplePreview = blobStorage.uploadExamplePreview;
  const draft = await import("../apps/frontend/app/lib/resume-draft.js");
  ResumeSection = draft.ResumeSection;
}

/**
 * Convert resume sections to legacy format for resume service
 */
function convertSectionsToLegacy(sections: ResumeSection[]): any {
  const legacy: any = {
    contact_info: {},
    summary: "",
    work_experiences: [],
    educations: [],
    skills: [],
    projects: [],
    certifications: [],
  };

  for (const section of sections) {
    if (section.type === "contact" && section.content.contact) {
      legacy.contact_info = section.content.contact;
    } else if (section.type === "summary" && section.content.summary) {
      legacy.summary = section.content.summary;
    } else if (section.type === "experience" && section.content.experience) {
      legacy.work_experiences = section.content.experience.map((exp) => ({
        company: exp.company || "",
        role: exp.role || "",
        start_date: exp.startDate || "",
        end_date: exp.endDate || null,
        is_current: exp.isCurrent || false,
        description: exp.description || "",
      }));
    } else if (section.type === "education" && section.content.education) {
      legacy.educations = section.content.education.map((edu) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        field_of_study: edu.fieldOfStudy || "",
        start_date: edu.startDate || "",
        end_date: edu.endDate || null,
        is_current: edu.isCurrent || false,
        description: edu.description || "",
      }));
    } else if (section.type === "skills" && section.content.skills) {
      legacy.skills = section.content.skills.map((skill) => ({
        category: skill.category || "",
        name: skill.name || "",
        proficiency: skill.proficiency || "",
      }));
    } else if (section.type === "projects" && section.content.projects) {
      legacy.projects = section.content.projects.map((proj) => ({
        title: proj.title || "",
        url: proj.url || "",
        start_date: proj.startDate || "",
        end_date: proj.endDate || null,
        description: proj.description || "",
      }));
    } else if (section.type === "certifications" && section.content.certifications) {
      legacy.certifications = section.content.certifications.map((cert) => ({
        name: cert.name || "",
        issuer: cert.issuer || "",
        issue_date: cert.issueDate || "",
        expiry_date: cert.expiryDate || null,
        url: cert.url || "",
      }));
    }
  }

  return legacy;
}

/**
 * Generate preview for a single example resume
 */
async function generateExamplePreview(example: any): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    console.log(`Generating preview for example: ${example.name} (${example.id})`);

    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    // @ts-ignore - canvas is a native module
    const { createCanvas } = require("canvas");

    const width = 800;
    const height = 1130;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    // Card border
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(60, 60, width - 120, height - 120);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Example title
    ctx.fillStyle = "#111827";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(example.name, 100, 160);

    // Job type + template
    const jobTypeLabel = example.jobTypeLabel || example.jobType || "";
    const templateLabel = example.templateId
      ? `Template: ${example.templateId.charAt(0).toUpperCase()}${example.templateId.slice(1)}`
      : "";
    ctx.fillStyle = "#6b7280";
    ctx.font = "26px sans-serif";
    if (jobTypeLabel) {
      ctx.fillText(jobTypeLabel, 100, 210);
    }
    if (templateLabel) {
      ctx.fillText(templateLabel, 100, 250);
    }

    // A few bullet-style lines to suggest resume content
    ctx.fillStyle = "#4b5563";
    ctx.font = "20px sans-serif";
    const bullets = [
      "• Strong experience in modern web development",
      "• Proven impact through real projects and results",
      "• Ready-made content you can customize quickly",
    ];
    const startY = 310;
    const lineHeight = 32;
    bullets.forEach((line, idx) => {
      ctx.fillText(line, 100, startY + idx * lineHeight);
    });

    const pngBuffer = canvas.toBuffer("image/png");
    console.log(`  ✓ PNG generated (${pngBuffer.length} bytes)`);

    // Upload to blob storage
    const previewUrl = await uploadExamplePreview(example.id, pngBuffer);
    console.log(`  ✓ Preview uploaded: ${previewUrl}`);

    // Update database with preview URL
    await db
      .update(resumeExamples)
      .set({ previewUrl, updatedAt: new Date() })
      .where(eq(resumeExamples.id, example.id));

    console.log(`  ✓ Database updated`);

    return {
      success: true,
      previewUrl,
    };
  } catch (error: any) {
    // Log full error object so we can see underlying Azure/LocalStack issues
    console.error("  ✗ Failed:", error);
    if (error?.stack) {
      console.error(error.stack);
    }
    return {
      success: false,
      error: (error && error.message) || "Unknown error",
    };
  }
}


/**
 * Main function to generate previews for all example resumes
 */
async function main() {
  console.log("Starting example resume preview generation...\n");

  try {
    // Load all active examples
    const examples = await db
      .select()
      .from(resumeExamples)
      .where(eq(resumeExamples.isActive, true));

    console.log(`Found ${examples.length} example resumes\n`);

    if (examples.length === 0) {
      console.log("No examples found. Run seed-resume-examples.ts first.");
      return;
    }

    const results: Array<{ exampleId: string; name: string; success: boolean; previewUrl?: string; error?: string }> = [];

    // Generate preview for each example
    for (const example of examples) {
      const result = await generateExamplePreview(example);
      results.push({
        exampleId: example.id,
        name: example.name,
        success: result.success,
        previewUrl: result.previewUrl,
        error: result.error,
      });
      console.log(""); // Empty line for readability
    }

    // Summary
    console.log("=".repeat(50));
    console.log("Summary:");
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailed examples:");
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.name} (${r.exampleId}): ${r.error}`));
    }
  } catch (error: any) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

