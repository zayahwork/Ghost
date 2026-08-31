import type { Project } from "@/types/project";

/**
 * Placeholder project list for the editor chrome. Persistence lands with the
 * projects API; until then the sidebar renders from this constant.
 */
export const MOCK_PROJECTS: Project[] = [
  {
    id: "prj_checkout",
    name: "Checkout Platform",
    slug: "checkout-platform",
    role: "owner",
  },
  {
    id: "prj_events",
    name: "Event Pipeline",
    slug: "event-pipeline",
    role: "owner",
  },
  {
    id: "prj_identity",
    name: "Identity Service",
    slug: "identity-service",
    role: "owner",
  },
  {
    id: "prj_billing",
    name: "Billing Ledger",
    slug: "billing-ledger",
    role: "collaborator",
  },
  {
    id: "prj_search",
    name: "Search Indexing",
    slug: "search-indexing",
    role: "collaborator",
  },
];
