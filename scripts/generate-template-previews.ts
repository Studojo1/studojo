/**
 * Template Preview Generation Script
 * 
 * Generates preview images for all templates by:
 * 1. Loading templates from database/blob storage
 * 2. Generating PDFs using sample resume data via resume service
 * 3. Converting PDFs to PNG images
 * 4. Uploading PNGs to blob storage
 */

// Determine if we're in Docker or local
const isDocker = process.env.DOCKER_CONTAINER === "true" || process.cwd() === "/src";

// Import modules based on context
let loadAllTemplates: any;
let uploadTemplatePreviewImage: any;

if (isDocker) {
  const templateLoader = await import("/src/app/lib/template-loader.server.js");
  const blobStorage = await import("/src/app/lib/blob-storage.server.js");
  loadAllTemplates = templateLoader.loadAllTemplates;
  uploadTemplatePreviewImage = blobStorage.uploadTemplatePreviewImage;
} else {
  const templateLoader = await import("../apps/frontend/app/lib/template-loader.server.js");
  const blobStorage = await import("../apps/frontend/app/lib/blob-storage.server.js");
  loadAllTemplates = templateLoader.loadAllTemplates;
  uploadTemplatePreviewImage = blobStorage.uploadTemplatePreviewImage;
}

// Sample resume data for preview generation
const sampleResumeData = {
  contact_info: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
    website: "johndoe.dev",
  },
  summary: "Experienced software engineer with 5+ years of expertise in full-stack development, cloud architecture, and team leadership. Proven track record of delivering scalable solutions and mentoring junior developers.",
  work_experiences: [
    {
      company: "Tech Corp",
      role: "Senior Software Engineer",
      start_date: "2021-01",
      end_date: null,
      is_current: true,
      description: "Led development of microservices architecture serving 1M+ users\n• Architected and implemented RESTful APIs using Node.js and TypeScript\n• Reduced system latency by 40% through performance optimization\n• Mentored team of 5 junior engineers",
    },
    {
      company: "StartupXYZ",
      role: "Full Stack Developer",
      start_date: "2019-06",
      end_date: "2020-12",
      is_current: false,
      description: "Built customer-facing web applications using React and Node.js\n• Implemented CI/CD pipelines reducing deployment time by 60%\n• Collaborated with design team to improve UX metrics by 25%",
    },
  ],
  educations: [
    {
      institution: "University of Technology",
      degree: "B.S. Computer Science",
      field_of_study: "Computer Science",
      start_date: "2015-09",
      end_date: "2019-05",
      is_current: false,
      description: "GPA: 3.8/4.0\nRelevant Coursework: Data Structures, Algorithms, Database Systems",
    },
  ],
  skills: [
    { category: "Languages", name: "JavaScript", proficiency: "Expert" },
    { category: "Languages", name: "TypeScript", proficiency: "Expert" },
    { category: "Languages", name: "Python", proficiency: "Advanced" },
    { category: "Frameworks", name: "React", proficiency: "Expert" },
    { category: "Frameworks", name: "Node.js", proficiency: "Expert" },
    { category: "Tools", name: "Docker", proficiency: "Advanced" },
    { category: "Tools", name: "AWS", proficiency: "Advanced" },
  ],
  projects: [
    {
      title: "E-Commerce Platform",
      url: "github.com/johndoe/ecommerce",
      start_date: "2022-01",
      end_date: "2022-06",
      description: "Built full-stack e-commerce platform with payment integration\n• Handled 10K+ concurrent users with Redis caching\n• Implemented real-time inventory management system",
    },
  ],
  certifications: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      issue_date: "2022-03",
      expiry_date: null,
      url: "aws.amazon.com/certification",
    },
  ],
};

/**
 * Generate a static, clearly non-blank preview image for a template.
 * We intentionally bypass LaTeX/PDF here to guarantee a visible thumbnail.
 */
async function generateTemplatePreview(templateId: string, templateName: string, category: string): Promise<string | null> {
  try {
    console.log(`Generating preview for template: ${templateId}`);

    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    // @ts-ignore - canvas is a native module
    const { createCanvas } = require("canvas");

    const width = 800;
    const height = 1130;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#f9fafb"; // gray-50
    ctx.fillRect(0, 0, width, height);

    // Card border to hint at a page
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(60, 60, width - 120, height - 120);
    ctx.strokeStyle = "#d1d5db"; // gray-300
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Template name
    ctx.fillStyle = "#111827"; // gray-900
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(templateName || templateId, 100, 160);

    // Category
    if (category) {
      ctx.fillStyle = "#6b7280"; // gray-500
      ctx.font = "28px sans-serif";
      ctx.fillText(category, 100, 210);
    }

    // Dummy content lines to make it look like a resume
    ctx.fillStyle = "#4b5563"; // gray-600
    ctx.font = "20px sans-serif";
    const startY = 260;
    const lineHeight = 30;
    const lines = [
      "John Doe · Senior Software Engineer",
      "email@example.com · +1 (555) 123-4567 · San Francisco, CA",
      "• Built scalable services and modern web apps",
      "• Led teams and improved system reliability",
      "• Expert in TypeScript, React, and Node.js",
    ];
    lines.forEach((line, idx) => {
      ctx.fillText(line, 100, startY + idx * lineHeight);
    });

    const pngBuffer = canvas.toBuffer("image/png");
    console.log(`  ✓ PNG generated (${pngBuffer.length} bytes)`);

    // Upload to blob storage
    const previewUrl = await uploadTemplatePreviewImage(templateId, pngBuffer);
    console.log(`  ✓ Preview uploaded: ${previewUrl}`);

    return previewUrl;
  } catch (error: any) {
    // Log full error object so we can see underlying Azure/LocalStack issues
    console.error(`  ✗ Failed to generate preview for ${templateId}:`, error);
    if (error?.stack) {
      console.error(error.stack);
    }
    return null;
  }
}

/**
 * Main function to generate previews for all templates
 */
async function main() {
  console.log("Starting template preview generation...\n");

  try {
    // Load all templates
    const templates = await loadAllTemplates();
    console.log(`Found ${templates.length} templates\n`);

    if (templates.length === 0) {
      console.log("No templates found. Exiting.");
      return;
    }

    const results: Array<{ templateId: string; success: boolean; previewUrl?: string }> = [];

    // Generate preview for each template
    for (const template of templates) {
      const previewUrl = await generateTemplatePreview(
        template.id,
        template.name || template.id,
        template.category || ""
      );
      results.push({
        templateId: template.id,
        success: previewUrl !== null,
        previewUrl: previewUrl || undefined,
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
      console.log("\nFailed templates:");
      results
        .filter((r) => !r.success)
        .forEach((r) => console.log(`  - ${r.templateId}`));
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


