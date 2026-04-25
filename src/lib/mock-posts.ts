import type { TaskKey } from "./site-config";
import type { SitePost } from "./site-connector";

const taskSeeds: Record<TaskKey, string> = {
  listing: "listing",
  classified: "classified",
  article: "article",
  image: "image",
  profile: "profile",
  social: "social",
  pdf: "pdf",
  org: "org",
  sbm: "sbm",
  comment: "comment",
};

const taskTitles: Record<TaskKey, string[]> = {
  listing: [
    "Policy Tracker: State Budget Portals",
    "Public Data Sources for Local Reporting",
    "Open Records Request Tool Directory",
    "Climate Data Dashboards by Region",
    "Election Coverage Resource Index",
  ],
  classified: [
    "Freelance Data Reporter Needed",
    "Open Call: Climate Photo Essays",
    "Part-Time Fact Checking Editor",
    "Investigative Fellowship Applications",
    "Internship: Civic Technology Desk",
  ],
  article: [
    "What New Housing Rules Mean for Renters in 2026",
    "Inside the Race to Modernize the Power Grid",
    "How AI Procurement Is Reshaping Public Schools",
    "The Quiet Economic Shift in Mid-Sized Cities",
    "After the Drought: Rebuilding Local Water Policy",
  ],
  image: [
    "City Council Night Session",
    "Heatwave on the Transit Corridor",
    "Farm Belt Morning Dispatch",
    "Floodplain Recovery in Motion",
    "School Board Hearing Portraits",
  ],
  profile: [
    "Nadia Rahman",
    "Luis Ortega",
    "Dana Kim",
    "Elijah Brooks",
    "Mira Joshi",
  ],
  social: [
    "Morning Brief: Top Five Policy Moves",
    "Fact Check Thread: Viral Budget Claims",
    "Reporter Notes: Field Dispatch",
    "Weekend Reading: Five Essential Reports",
    "Explainer Thread: Court Ruling Summary",
  ],
  pdf: [
    "2026 Housing Affordability Brief",
    "Power Grid Resilience Report",
    "School Technology Procurement Audit",
    "Urban Labor Market Snapshot",
    "Regional Water Risk Assessment",
  ],
  org: [
    "Civic Ledger Investigations Desk",
    "Data Journalism Lab",
    "Public Policy Editorial Unit",
    "Climate and Infrastructure Bureau",
    "Local Government Accountability Team",
  ],
  sbm: [
    "FOIA Request Templates",
    "Best Public Budget Databases",
    "State Election Result Archives",
    "Climate Impact Research Hubs",
    "Education Policy Reading List",
  ],
  comment: [
    "Analysis: Why Rate Cuts Won't Fix Housing Alone",
    "Commentary: The Real Cost of Grid Delays",
    "Response: Schools Need Procurement Transparency",
    "Opinion: City Growth Is Outpacing Services",
    "Debate: Who Should Pay for Water Upgrades",
  ],
};

const taskCategories: Record<TaskKey, string[]> = {
  listing: ["Research Tools", "Public Data", "Investigations", "Policy", "Civic Tech"],
  classified: ["Jobs", "Fellowships", "Editorial", "Opportunities", "Hiring"],
  article: ["Policy", "Technology", "Economy", "Climate", "Education"],
  image: ["Field Reporting", "Photo Essay", "Politics", "Infrastructure", "Community"],
  profile: ["Reporter", "Editor", "Analyst", "Contributor", "Photographer"],
  social: ["Daily Brief", "Fact Check", "Explainer", "Notes", "Reading List"],
  pdf: ["Reports", "Briefings", "Audits", "Research", "Documents"],
  org: ["Desk", "Bureau", "Lab", "Editorial", "Newsroom"],
  sbm: ["Resources", "Databases", "Research", "Archives", "Methods"],
  comment: ["Opinion", "Commentary", "Analysis", "Response", "Debate"],
};

const summaryByTask: Record<TaskKey, string> = {
  listing: "Verified newsroom resources to support rigorous reporting.",
  classified: "Editorial and reporting opportunities from trusted organizations.",
  article: "Reported story with context, evidence, and expert analysis.",
  image: "Visual field story documenting events and people on the ground.",
  profile: "Reporter profile with recent coverage and beat focus.",
  social: "Short-form newsroom update with key takeaways.",
  pdf: "Downloadable briefing document used in current coverage.",
  org: "Editorial team profile and reporting focus area.",
  sbm: "Curated research references for deeper reader exploration.",
  comment: "Opinion piece expanding on an ongoing reported issue.",
};

const randomFrom = (items: string[], index: number) => items[index % items.length];

const buildImage = (task: TaskKey, index: number) =>
  `https://picsum.photos/seed/${taskSeeds[task]}-${index}/1200/800`;

export const getMockPostsForTask = (task: TaskKey): SitePost[] => {
  return Array.from({ length: 5 }).map((_, index) => {
    const title = taskTitles[task][index];
    const category = randomFrom(taskCategories[task], index);
    const slug = `${title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return {
      id: `${task}-mock-${index + 1}`,
      title,
      slug,
      summary: summaryByTask[task],
      content: {
        type: task,
        category,
        location: "Washington, DC",
        description: summaryByTask[task],
        website: "https://gutsbranding.com",
        phone: "+1-202-555-0190",
      },
      media: [{ url: buildImage(task, index), type: "IMAGE" }],
      tags: [task, category],
      authorName: "Civic Ledger Desk",
      publishedAt: new Date().toISOString(),
    };
  });
};
