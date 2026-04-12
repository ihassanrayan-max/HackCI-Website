export type WinnerTrack = "A" | "B";

export type WinnerPlacement = "1st" | "2nd" | "3rd" | "winner";

export interface WinnerMember {
  name: string;
  linkedinUrl?: string;
}

export interface WinnerEntry {
  track: WinnerTrack;
  trackLabel: string;
  placement: WinnerPlacement;
  placementLabel: string;
  teamName: string;
  projectTitle: string;
  members: WinnerMember[];
  description: string;
  githubUrl?: string;
  demoMediaKind?: "image" | "video";
  demoImageUrl?: string;
  demoImageAlt?: string;
}

export const WINNERS_SECTION_COPY = {
  eyebrow: "Official Winners",
  title: "Recognizing the teams that set the standard.",
  description: "",
} as const;

export const WINNER_ENTRIES: WinnerEntry[] = [
  {
    track: "A",
    trackLabel: "Track A",
    placement: "1st",
    placementLabel: "1st Place",
    teamName: "CoreVision AI",
    projectTitle: "A cognitive-aware digital twin for nuclear emergency response.",
    members: [
      { name: "Aditya Ramjas", linkedinUrl: "https://www.linkedin.com/in/aditya-ramjas/" },
      {
        name: "Burhannadin Mohammad",
        linkedinUrl: "https://www.linkedin.com/in/burhanuddin-mohammed-1785bb35b/",
      },
      { name: "Fazal Sheikh", linkedinUrl: "https://www.linkedin.com/in/fazal-sheikh-bb4927292/" },
      { name: "Mohid Sohail", linkedinUrl: "https://www.linkedin.com/in/mohidsohail/" },
    ],
    description:
      "CoreVision AI combines a live reactor digital twin, adaptive smart HUD, cognitive load monitoring, and explainable AI guidance for nuclear emergency response. It detects fault causes in real time and simplifies the interface when operator stress rises.",
    githubUrl: "https://github.com/BMohammed7/CoreVision-AI/tree/main",
    demoMediaKind: "image",
  },
  {
    track: "A",
    trackLabel: "Track A",
    placement: "2nd",
    placementLabel: "2nd Place",
    teamName: "NewTron",
    projectTitle: "Dynamic Digital Twin of the Operator (DDTO) MVP for human-centered SMR control rooms.",
    members: [
      { name: "Urooj Fatima Khan", linkedinUrl: "https://www.linkedin.com/in/uroojfkhan/" },
      { name: "Summit Kabir", linkedinUrl: "https://www.linkedin.com/in/summit-kabir-101563290/" },
      { name: "Daniel Brown", linkedinUrl: "http://www.linkedin.com/in/daniel-brown-396926151" },
    ],
    description:
      "NewTron focuses on the operator instead of only the plant. Its dynamic digital twin estimates workload, fatigue, and near-term performance degradation using multimodal sensing and edge-based preprocessing. The project stood out for its strong human-factors focus and modular sensing strategy.",
    githubUrl: "https://github.com/summitkabir6/newtron",
    demoMediaKind: "video",
  },
  {
    track: "A",
    trackLabel: "Track A",
    placement: "3rd",
    placementLabel: "3rd Place",
    teamName: "DualAgent",
    projectTitle: "A dual-agent decision-support framework for cognitively synchronized SMR control-room operation.",
    members: [
      {
        name: "Amaan Durrani",
        linkedinUrl: "https://www.linkedin.com/in/amaan-durrani-756463351/",
      },
      { name: "Ayaan Ahmed", linkedinUrl: "https://www.linkedin.com/in/ayaanahmed05/" },
      { name: "Vlad Modroiu", linkedinUrl: "https://www.linkedin.com/in/vlad-modroiu-131b3b201/" },
    ],
    description:
      "DualAgent combines plant monitoring, operator-state awareness, and dual-agent decision support in a single control-room framework. Its main differentiator is attentional gating that delays AI-recommended actions until the operator is cognitively ready and focused on the correct safety-relevant information.",
    githubUrl: "https://github.com/ayaanahmed05/SMR-DualGuard",
    demoMediaKind: "image",
  },
  {
    track: "B",
    trackLabel: "Track B",
    placement: "winner",
    placementLabel: "1st Place",
    teamName: "GridSens",
    projectTitle: "An AI-powered resilience engine for predictive cascade-failure detection in hybrid energy infrastructure.",
    members: [
      { name: "Ese Omonoyan", linkedinUrl: "https://www.linkedin.com/in/ese-omonoyan" },
      { name: "Tarun Modekurty", linkedinUrl: "https://www.linkedin.com/in/tarun-modekurty/" },
      { name: "Joao Pedro Minari", linkedinUrl: "https://linkedin.com/in/joaopminari" },
      {
        name: "Jeshurun Constantine",
        linkedinUrl: "https://www.linkedin.com/in/jeshurun-constantine/",
      },
    ],
    description:
      "GridSens models interconnected energy infrastructure as a live graph and uses AI to predict cascade failures before they happen, optimize energy dispatch in real time, and explain its decisions through SHAP-based attribution. The approach is grounded in real ERCOT load data from the 2021 Texas Winter Storm Uri crisis.",
    demoMediaKind: "image",
  },
];
