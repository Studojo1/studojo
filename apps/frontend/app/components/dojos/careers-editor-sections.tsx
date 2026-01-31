import { motion } from "framer-motion";
import {
  FiUser,
  FiFileText,
  FiBriefcase,
  FiBook,
  FiZap,
  FiFolder,
  FiAward,
  FiChevronDown,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";

const inputBase =
  "rounded-lg bg-white px-3 py-2 font-['Satoshi'] text-sm font-normal text-neutral-950 outline outline-1 outline-gray-200 outline-offset-[-1px] placeholder:text-neutral-950/50 focus:outline-none focus:ring-2 focus:ring-emerald-500";
const labelBase =
  "font-['Satoshi'] text-xs font-normal leading-4 text-gray-500";

type ResumeData = {
  title?: string;
  summary?: string;
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  work_experiences?: Array<{
    company?: string;
    role?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }>;
  educations?: Array<{
    institution?: string;
    degree?: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }>;
  skills?: Array<{
    category?: string;
    name?: string;
    proficiency?: string;
  }>;
  projects?: Array<{
    title?: string;
    url?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    issue_date?: string;
    expiry_date?: string;
    url?: string;
  }>;
};

type FieldProps = {
  label: string;
  placeholder: string;
  type?: string;
  as?: "input" | "textarea";
  value?: string;
  onChange?: (value: string) => void;
};

function Field({ label, placeholder, type = "text", as = "input", value = "", onChange }: FieldProps) {
  const className = `${inputBase} w-full ${as === "textarea" ? "min-h-[80px] resize-none" : "h-10"}`;
  return (
    <div className="flex flex-col gap-1">
      <label className={labelBase}>{label}</label>
      {as === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={className}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </div>
  );
}

export type SectionId =
  | "basic-info"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications";

export const SECTION_IDS: SectionId[] = [
  "basic-info",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
];

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "basic-info", label: "Basic Info", icon: <FiUser className="h-4 w-4 text-gray-600" /> },
  { id: "summary", label: "Summary", icon: <FiFileText className="h-4 w-4 text-gray-600" /> },
  { id: "experience", label: "Experience", icon: <FiBriefcase className="h-4 w-4 text-gray-600" /> },
  { id: "education", label: "Education", icon: <FiBook className="h-4 w-4 text-gray-600" /> },
  { id: "skills", label: "Skills", icon: <FiZap className="h-4 w-4 text-gray-600" /> },
  { id: "projects", label: "Projects", icon: <FiFolder className="h-4 w-4 text-gray-600" /> },
  { id: "certifications", label: "Certifications", icon: <FiAward className="h-4 w-4 text-gray-600" /> },
];

const expandedContentClass =
  "flex flex-col gap-3 border-t border-gray-200 px-4 py-3";

type ExpandedBasicInfoProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedBasicInfo({ resume, onChange }: ExpandedBasicInfoProps) {
  const contact = resume.contact_info || {};
  return (
    <div className={expandedContentClass}>
      <Field
        label="Full Name"
        placeholder="John Doe"
        value={contact.name || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, name: value },
          })
        }
      />
      <Field
        label="Email"
        placeholder="john@example.com"
        type="email"
        value={contact.email || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, email: value },
          })
        }
      />
      <Field
        label="Phone"
        placeholder="+1 (555) 000-0000"
        type="tel"
        value={contact.phone || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, phone: value },
          })
        }
      />
      <Field
        label="Location"
        placeholder="San Francisco, CA"
        value={contact.location || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, location: value },
          })
        }
      />
      <Field
        label="LinkedIn"
        placeholder="linkedin.com/in/username"
        value={contact.linkedin || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, linkedin: value },
          })
        }
      />
      <Field
        label="Website"
        placeholder="yourwebsite.com"
        value={contact.website || ""}
        onChange={(value) =>
          onChange({
            ...resume,
            contact_info: { ...contact, website: value },
          })
        }
      />
    </div>
  );
}

type ExpandedSummaryProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedSummary({ resume, onChange }: ExpandedSummaryProps) {
  return (
    <div className={expandedContentClass}>
      <Field
        label="Professional Summary"
        placeholder="Write a brief summary about yourself..."
        as="textarea"
        value={resume.summary || ""}
        onChange={(value) => onChange({ ...resume, summary: value })}
      />
    </div>
  );
}

type ExpandedExperienceProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedExperience({ resume, onChange }: ExpandedExperienceProps) {
  const experiences = resume.work_experiences || [];
  
  const updateExperience = (index: number, field: string, value: string | boolean) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, work_experiences: updated });
  };

  const addExperience = () => {
    onChange({
      ...resume,
      work_experiences: [...experiences, { company: "", role: "", is_current: false }],
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...resume,
      work_experiences: experiences.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={expandedContentClass}>
      {experiences.map((exp, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-xs font-medium text-gray-600">
              Experience {index + 1}
            </span>
            {experiences.length > 1 && (
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <Field
            label="Job Title"
            placeholder="Software Engineer"
            value={exp.role || ""}
            onChange={(value) => updateExperience(index, "role", value)}
          />
          <Field
            label="Company"
            placeholder="Tech Corp"
            value={exp.company || ""}
            onChange={(value) => updateExperience(index, "company", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start Date"
              placeholder="Jan 2023"
              value={exp.start_date || ""}
              onChange={(value) => updateExperience(index, "start_date", value)}
            />
            <Field
              label="End Date"
              placeholder="Present"
              value={exp.end_date || ""}
              onChange={(value) => updateExperience(index, "end_date", value)}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={exp.is_current || false}
              onChange={(e) => updateExperience(index, "is_current", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className={labelBase}>Current Position</span>
          </label>
          <Field
            label="Description"
            placeholder="Describe your responsibilities and achievements..."
            as="textarea"
            value={exp.description || ""}
            onChange={(value) => updateExperience(index, "description", value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addExperience}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50"
      >
        <FiPlus className="h-4 w-4" />
        Add Another Experience
      </button>
    </div>
  );
}

type ExpandedEducationProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedEducation({ resume, onChange }: ExpandedEducationProps) {
  const educations = resume.educations || [];
  
  const updateEducation = (index: number, field: string, value: string | boolean) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, educations: updated });
  };

  const addEducation = () => {
    onChange({
      ...resume,
      educations: [...educations, { institution: "", degree: "", is_current: false }],
    });
  };

  const removeEducation = (index: number) => {
    onChange({
      ...resume,
      educations: educations.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={expandedContentClass}>
      {educations.map((edu, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-xs font-medium text-gray-600">
              Education {index + 1}
            </span>
            {educations.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(index)}
                className="flex items-center gap-1 text-red-500 hover:text-red-700"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <Field
            label="Degree"
            placeholder="Bachelor of Science"
            value={edu.degree || ""}
            onChange={(value) => updateEducation(index, "degree", value)}
          />
          <Field
            label="Institution"
            placeholder="University Name"
            value={edu.institution || ""}
            onChange={(value) => updateEducation(index, "institution", value)}
          />
          <Field
            label="Field of Study"
            placeholder="Computer Science"
            value={edu.field_of_study || ""}
            onChange={(value) => updateEducation(index, "field_of_study", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start Date"
              placeholder="Aug 2020"
              value={edu.start_date || ""}
              onChange={(value) => updateEducation(index, "start_date", value)}
            />
            <Field
              label="End Date"
              placeholder="May 2024"
              value={edu.end_date || ""}
              onChange={(value) => updateEducation(index, "end_date", value)}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={edu.is_current || false}
              onChange={(e) => updateEducation(index, "is_current", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className={labelBase}>Currently Enrolled</span>
          </label>
        </div>
      ))}
      <button
        type="button"
        onClick={addEducation}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50"
      >
        <FiPlus className="h-4 w-4" />
        Add Another Education
      </button>
    </div>
  );
}

type ExpandedSkillsProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedSkills({ resume, onChange }: ExpandedSkillsProps) {
  const skills = resume.skills || [];
  
  const updateSkill = (index: number, field: string, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, skills: updated });
  };

  const addSkill = () => {
    onChange({
      ...resume,
      skills: [...skills, { category: "", name: "", proficiency: "" }],
    });
  };

  const removeSkill = (index: number) => {
    onChange({
      ...resume,
      skills: skills.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={expandedContentClass}>
      {skills.map((skill, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-xs font-medium text-gray-600">
              Skill {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          <Field
            label="Category"
            placeholder="Languages, Frameworks, Tools..."
            value={skill.category || ""}
            onChange={(value) => updateSkill(index, "category", value)}
          />
          <Field
            label="Skill Name"
            placeholder="JavaScript"
            value={skill.name || ""}
            onChange={(value) => updateSkill(index, "name", value)}
          />
          <Field
            label="Proficiency (optional)"
            placeholder="Beginner, Intermediate, Advanced"
            value={skill.proficiency || ""}
            onChange={(value) => updateSkill(index, "proficiency", value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addSkill}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50"
      >
        <FiPlus className="h-4 w-4" />
        Add Skill
      </button>
    </div>
  );
}

type ExpandedProjectsProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedProjects({ resume, onChange }: ExpandedProjectsProps) {
  const projects = resume.projects || [];
  
  const updateProject = (index: number, field: string, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, projects: updated });
  };

  const addProject = () => {
    onChange({
      ...resume,
      projects: [...projects, { title: "", description: "" }],
    });
  };

  const removeProject = (index: number) => {
    onChange({
      ...resume,
      projects: projects.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={expandedContentClass}>
      {projects.map((proj, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-xs font-medium text-gray-600">
              Project {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeProject(index)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          <Field
            label="Project Name"
            placeholder="E-commerce Platform"
            value={proj.title || ""}
            onChange={(value) => updateProject(index, "title", value)}
          />
          <Field
            label="URL (optional)"
            placeholder="https://project-url.com"
            value={proj.url || ""}
            onChange={(value) => updateProject(index, "url", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start Date"
              placeholder="Jan 2023"
              value={proj.start_date || ""}
              onChange={(value) => updateProject(index, "start_date", value)}
            />
            <Field
              label="End Date"
              placeholder="Present"
              value={proj.end_date || ""}
              onChange={(value) => updateProject(index, "end_date", value)}
            />
          </div>
          <Field
            label="Description"
            placeholder="Brief project description..."
            as="textarea"
            value={proj.description || ""}
            onChange={(value) => updateProject(index, "description", value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addProject}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50"
      >
        <FiPlus className="h-4 w-4" />
        Add Project
      </button>
    </div>
  );
}

type ExpandedCertificationsProps = {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
};

function ExpandedCertifications({ resume, onChange }: ExpandedCertificationsProps) {
  const certifications = resume.certifications || [];
  
  const updateCertification = (index: number, field: string, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, certifications: updated });
  };

  const addCertification = () => {
    onChange({
      ...resume,
      certifications: [...certifications, { name: "", issuer: "" }],
    });
  };

  const removeCertification = (index: number) => {
    onChange({
      ...resume,
      certifications: certifications.filter((_, i) => i !== index),
    });
  };

  return (
    <div className={expandedContentClass}>
      {certifications.map((cert, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-lg border-2 border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-['Satoshi'] text-xs font-medium text-gray-600">
              Certification {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCertification(index)}
              className="flex items-center gap-1 text-red-500 hover:text-red-700"
            >
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
          <Field
            label="Certification Name"
            placeholder="AWS Certified Developer"
            value={cert.name || ""}
            onChange={(value) => updateCertification(index, "name", value)}
          />
          <Field
            label="Issuing Organization"
            placeholder="Amazon Web Services"
            value={cert.issuer || ""}
            onChange={(value) => updateCertification(index, "issuer", value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Issue Date"
              placeholder="Jan 2024"
              value={cert.issue_date || ""}
              onChange={(value) => updateCertification(index, "issue_date", value)}
            />
            <Field
              label="Expiry Date (optional)"
              placeholder="Jan 2027"
              value={cert.expiry_date || ""}
              onChange={(value) => updateCertification(index, "expiry_date", value)}
            />
          </div>
          <Field
            label="URL (optional)"
            placeholder="https://certificate-url.com"
            value={cert.url || ""}
            onChange={(value) => updateCertification(index, "url", value)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addCertification}
        className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-2 font-['Satoshi'] text-xs font-normal leading-4 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50"
      >
        <FiPlus className="h-4 w-4" />
        Add Certification
      </button>
    </div>
  );
}

type EditorSectionProps = {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function EditorSection({ id, label, icon, isExpanded, onToggle, children }: EditorSectionProps) {
  return (
    <div className="overflow-hidden rounded-2xl p-0.5 outline outline-2 outline-gray-200 outline-offset-[-2px]">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-14 w-full items-center justify-between px-4 text-left"
      >
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden">
            {icon}
          </div>
          <span className="font-['Satoshi'] text-sm font-medium leading-5 text-neutral-950">
            {label}
          </span>
        </div>
        <motion.span
          className="flex h-4 w-4 shrink-0 items-center justify-center text-gray-400"
          initial={false}
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <FiChevronDown className="h-4 w-4" aria-hidden />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}

type CareersEditorSectionsProps = {
  expandedSections: Record<SectionId, boolean>;
  toggleSection: (id: SectionId) => void;
  resume: ResumeData;
  onResumeChange: (resume: ResumeData) => void;
};

export function CareersEditorSections({
  expandedSections,
  toggleSection,
  resume,
  onResumeChange,
}: CareersEditorSectionsProps) {
  const renderSectionContent = (id: SectionId) => {
    switch (id) {
      case "basic-info":
        return <ExpandedBasicInfo resume={resume} onChange={onResumeChange} />;
      case "summary":
        return <ExpandedSummary resume={resume} onChange={onResumeChange} />;
      case "experience":
        return <ExpandedExperience resume={resume} onChange={onResumeChange} />;
      case "education":
        return <ExpandedEducation resume={resume} onChange={onResumeChange} />;
      case "skills":
        return <ExpandedSkills resume={resume} onChange={onResumeChange} />;
      case "projects":
        return <ExpandedProjects resume={resume} onChange={onResumeChange} />;
      case "certifications":
        return <ExpandedCertifications resume={resume} onChange={onResumeChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {SECTIONS.map(({ id, label, icon }) => (
        <EditorSection
          key={id}
          id={id}
          label={label}
          icon={icon}
          isExpanded={!!expandedSections[id]}
          onToggle={() => toggleSection(id)}
        >
          {renderSectionContent(id)}
        </EditorSection>
      ))}
    </div>
  );
}
