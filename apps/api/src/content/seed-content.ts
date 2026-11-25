/**
 * Default induction content (used by the seed and by "Reset to default"), written from the source notes in /Data.
 *
 * Company content only - no real employee data. Wording, business units and
 * founder scripts are drafts that HR / Marketing must confirm before go-live.
 */
import type { AvatarAppearance } from '@induction/shared';
import type { Emotion, Gesture } from '@prisma/client';

/** [text, emotion, gesture] */
export type Seg = readonly [text: string, emotion?: Emotion, gesture?: Gesture];

export type AvatarKey =
  | 'company'
  | 'founderRaj'
  | 'founderRamki'
  | 'culture'
  | 'policies'
  | 'compliance'
  | 'business'
  | 'closing';

export interface AvatarDef {
  key: AvatarKey;
  name: string;
  title: string;
  appearance: AvatarAppearance;
  voiceGender: 'female' | 'male';
  voiceLang: string;
  voicePitch: number;
  voiceRate: number;
  themeColor: string;
  personalityNotes: string;
  defaultEmotion: Emotion;
  entryGesture: Gesture;
  exitGesture: Gesture;
  energy: number;
}

export type StepDef =
  | {
      type: 'VIDEO';
      title: string;
      topic: string;
      emotion: Emotion;
      segs: Seg[];
      avatar?: AvatarKey;
    }
  | { type: 'QUESTION'; pool: string }
  | { type: 'ACKNOWLEDGMENT'; title: string; topic: string; ackText: string }
  | { type: 'TRANSITION'; segs: Seg[]; avatar?: AvatarKey };

export interface QuestionDef {
  topic: string;
  text: string;
  /** First option is the correct one; the seed shuffles display order. */
  options: readonly [string, string, string, string];
  hint: string;
  explanation: string;
}

export interface ModuleDef {
  slug: string;
  title: string;
  description: string;
  avatar: AvatarKey;
  requiresAcknowledgment: boolean;
  steps: StepDef[];
  questions: QuestionDef[];
}

export const AVATARS: AvatarDef[] = [
  {
    key: 'company',
    name: 'Maya',
    title: 'Company Guide',
    appearance: {
      skin: '#C68B5E',
      hair: '#2B1B12',
      hairStyle: 'long',
      outfit: '#2563EB',
      shirt: '#FFFFFF',
      glasses: false,
      beard: false,
      earrings: true,
    },
    voiceGender: 'female',
    voiceLang: 'en-IN',
    voicePitch: 1.05,
    voiceRate: 1,
    themeColor: '#2563EB',
    personalityNotes:
      'Warm, welcoming host. Smiles often, speaks at an easy pace, sets a relaxed tone.',
    defaultEmotion: 'CHEERFUL',
    entryGesture: 'WAVE',
    exitGesture: 'OPEN_ARMS',
    energy: 1.1,
  },
  {
    key: 'founderRaj',
    name: 'Rajamannar Abboy',
    title: 'Founder and Director',
    appearance: {
      skin: '#B9794C',
      hair: '#8A8F98',
      hairStyle: 'sidePart',
      outfit: '#1F2937',
      shirt: '#E5E7EB',
      glasses: true,
      beard: false,
      earrings: false,
    },
    voiceGender: 'male',
    voiceLang: 'en-IN',
    voicePitch: 0.9,
    voiceRate: 0.95,
    themeColor: '#0F766E',
    personalityNotes:
      'Calm, thoughtful and precise. An engineer at heart; measured gestures, steady voice.',
    defaultEmotion: 'PROUD',
    entryGesture: 'NOD',
    exitGesture: 'OPEN_ARMS',
    energy: 0.8,
  },
  {
    key: 'founderRamki',
    name: 'Ramki Ramakrishnen',
    title: 'Founder Director',
    appearance: {
      skin: '#A86B43',
      hair: '#3A3A3A',
      hairStyle: 'short',
      outfit: '#7C2D12',
      shirt: '#FDF6E3',
      glasses: false,
      beard: true,
      earrings: false,
    },
    voiceGender: 'male',
    voiceLang: 'en-IN',
    voicePitch: 1,
    voiceRate: 1,
    themeColor: '#B45309',
    personalityNotes:
      'Energetic storyteller and serial entrepreneur. Expressive hands, optimistic tone.',
    defaultEmotion: 'HOPEFUL',
    entryGesture: 'WAVE',
    exitGesture: 'HAND_ON_HEART',
    energy: 1.1,
  },
  {
    key: 'culture',
    name: 'Zara',
    title: 'Culture Guide',
    appearance: {
      skin: '#E8B48C',
      hair: '#5B2C83',
      hairStyle: 'curly',
      outfit: '#DB2777',
      shirt: '#FFF1F7',
      glasses: false,
      beard: false,
      earrings: true,
    },
    voiceGender: 'female',
    voiceLang: 'en-US',
    voicePitch: 1.15,
    voiceRate: 1.05,
    themeColor: '#DB2777',
    personalityNotes:
      'Upbeat and playful. The most animated presenter; lots of open, inviting gestures.',
    defaultEmotion: 'CHEERFUL',
    entryGesture: 'WAVE',
    exitGesture: 'THUMBS_UP',
    energy: 1.3,
  },
  {
    key: 'policies',
    name: 'Arjun',
    title: 'Policies Guide',
    appearance: {
      skin: '#8D5A3B',
      hair: '#16110D',
      hairStyle: 'short',
      outfit: '#4F46E5',
      shirt: '#FFFFFF',
      glasses: true,
      beard: true,
      earrings: false,
    },
    voiceGender: 'male',
    voiceLang: 'en-US',
    voicePitch: 0.95,
    voiceRate: 1,
    themeColor: '#4F46E5',
    personalityNotes:
      'Practical and friendly. Explains rules plainly, counts points off on his fingers.',
    defaultEmotion: 'FRIENDLY',
    entryGesture: 'WAVE',
    exitGesture: 'NOD',
    energy: 0.9,
  },
  {
    key: 'compliance',
    name: 'Priya',
    title: 'Compliance Guide',
    appearance: {
      skin: '#D9A066',
      hair: '#1C1410',
      hairStyle: 'bun',
      outfit: '#7F1D1D',
      shirt: '#F8FAFC',
      glasses: true,
      beard: false,
      earrings: false,
    },
    voiceGender: 'female',
    voiceLang: 'en-GB',
    voicePitch: 0.95,
    voiceRate: 0.93,
    themeColor: '#B91C1C',
    personalityNotes:
      'Serious but kind. Slower pace, minimal movement, empathetic on sensitive topics.',
    defaultEmotion: 'SERIOUS',
    entryGesture: 'NOD',
    exitGesture: 'HAND_ON_HEART',
    energy: 0.7,
  },
  {
    key: 'business',
    name: 'Kabir',
    title: 'Business Units Guide',
    appearance: {
      skin: '#F0C6A0',
      hair: '#6B3F1D',
      hairStyle: 'sidePart',
      outfit: '#7C3AED',
      shirt: '#FDE68A',
      glasses: false,
      beard: false,
      earrings: false,
    },
    voiceGender: 'male',
    voiceLang: 'en-US',
    voicePitch: 1.1,
    voiceRate: 1.08,
    themeColor: '#7C3AED',
    personalityNotes:
      'Enthusiastic tour guide. Points left and right as he moves between business units.',
    defaultEmotion: 'EXCITED',
    entryGesture: 'WAVE',
    exitGesture: 'POINT_RIGHT',
    energy: 1.3,
  },
  {
    key: 'closing',
    name: 'Anika',
    title: 'Closing Host',
    appearance: {
      skin: '#7A4A2E',
      hair: '#0F0A07',
      hairStyle: 'bob',
      outfit: '#059669',
      shirt: '#ECFDF5',
      glasses: false,
      beard: false,
      earrings: true,
    },
    voiceGender: 'female',
    voiceLang: 'en-GB',
    voicePitch: 1.05,
    voiceRate: 1,
    themeColor: '#059669',
    personalityNotes: 'Proud and celebratory. Applauds the learner and ends on a warm wave.',
    defaultEmotion: 'PROUD',
    entryGesture: 'APPLAUD',
    exitGesture: 'WAVE',
    energy: 1.1,
  },
];

/** Reusable praise lines; each avatar gets three, rotated. */
export const PRAISE_LINES: readonly Seg[] = [
  ["That's right, well done!", 'EXCITED', 'THUMBS_UP'],
  ["Spot on! You've clearly been paying attention.", 'CHEERFUL', 'APPLAUD'],
  ['Exactly right. Great work!', 'PROUD', 'NOD'],
  ['Correct! Nicely done.', 'CHEERFUL', 'THUMBS_UP'],
];

/** Lead-in an avatar speaks before any question pops up. */
export const QUESTION_LEAD_IN: Seg = ['Quick check before we move on.', 'ENCOURAGING', 'THINK'];

/** Draft business units, inferred from the company notes. Confirm with HR. */
export const BUSINESS_UNITS = [
  {
    slug: 'cloud-practice',
    name: 'Cloud Practice',
    description:
      'Salesforce consulting and implementation: CRM, Agentforce, Data Cloud, Sales Cloud, Service Cloud and Field Service.',
  },
  {
    slug: 'data-analytics-ei',
    name: 'Data, Analytics & Enterprise Integration',
    description:
      'Data platform modernization, business intelligence, analytics, API management and workflow automation.',
  },
  {
    slug: 'microsoft-business-applications',
    name: 'Microsoft Business Applications',
    description:
      'Dynamics 365, Power Platform and Azure-based solutions for CRM and ERP modernization.',
  },
  {
    slug: 'ai-transformation',
    name: 'AI Transformation',
    description:
      'AI strategy, readiness assessments, machine learning, natural language solutions and responsible AI governance.',
  },
] as const;

export const MODULES: ModuleDef[] = [
  /* ---------------------------------------------------------------- */
  /* 1. Company Introduction (Data/Company)                            */
  /* ---------------------------------------------------------------- */
  {
    slug: 'company-introduction',
    title: 'Company Introduction',
    description:
      'Who we are, what we do, our ShiftEVA platform, and the milestones that shaped LevelShift.',
    avatar: 'company',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'Welcome',
        topic: 'welcome',
        emotion: 'CHEERFUL',
        segs: [
          ['Hello, and a very warm welcome to LevelShift!', 'CHEERFUL', 'WAVE'],
          [
            "I'm Maya, and I'll be your first guide today. Over the next seven short modules, my colleagues and I will walk you through who we are, how we work, and what matters to us.",
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            "You'll meet our founders, learn about our culture, go through the policies and compliance essentials every employee needs, and take a tour of our business units.",
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            "This isn't an exam. We'll ask a few friendly questions along the way. If you get one wrong, we'll give you a hint, and if it still doesn't click, we'll explain the answer.",
            'ENCOURAGING',
            'NOD',
          ],
          [
            'The whole journey takes about forty minutes, and you can stop and pick up where you left off at any time.',
            'FRIENDLY',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Who We Are',
        topic: 'who-we-are',
        emotion: 'PROUD',
        segs: [
          [
            'LevelShift is a global AI transformation and technology consulting company. Our story began back in 1998.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'We bring together the strengths of three companies, PreludeSys, DemandBlue and DemandDynamics, under one brand with one purpose: helping enterprises become AI-native organizations.',
            'PROUD',
            'COUNT_THREE',
          ],
          [
            "We're headquartered in Irvine, California, and we work through a global delivery model, serving organizations all around the world.",
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            "More than three hundred customers trust us, and our team is somewhere between five hundred and a thousand people strong. And we've been certified as a Great Place to Work for several years in a row.",
            'PROUD',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Vision and Mission',
        topic: 'who-we-are',
        emotion: 'HOPEFUL',
        segs: [
          [
            'Every company needs a direction. Ours has two parts: a vision and a mission.',
            'FRIENDLY',
            'COUNT_TWO',
          ],
          [
            'Our vision is to be the trusted strategic partner that helps organizations successfully navigate digital and AI transformation, while delivering future-ready technology solutions.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'Our mission is to enable customers to become AI-native enterprises, by embedding artificial intelligence across their core business functions and processes.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            "In short: the vision is where we're heading, and the mission is how we help our customers get there.",
            'ENCOURAGING',
            'NOD',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'who-we-are' },
      {
        type: 'VIDEO',
        title: 'What We Do',
        topic: 'what-we-do',
        emotion: 'FRIENDLY',
        segs: [
          [
            'So what do we actually do? We help organizations modernize their technology and transform into AI-powered enterprises, through consulting, implementation, AI solutions and business transformation programs.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Our core services fall into four areas. First, AI transformation: AI strategy, readiness assessments, machine learning, natural language processing, and AI governance, security and responsible AI.',
            'NEUTRAL',
            'COUNT_ONE',
          ],
          [
            'Second, data modernization: modern data platforms, business intelligence and analytics, data governance, cloud data architectures, and Microsoft data solutions including Power BI.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Third, enterprise integration: connecting business systems through API management, application integration, workflow automation and hybrid cloud integration.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'And fourth, enterprise applications: CRM implementation, ERP modernization, business process optimization and customer experience transformation.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Technology Expertise',
        topic: 'what-we-do',
        emotion: 'EXCITED',
        segs: [
          [
            'Behind those services sits deep expertise in two major technology ecosystems.',
            'FRIENDLY',
            'COUNT_TWO',
          ],
          [
            'In Salesforce, we do CRM consulting and implementation, Agentforce, Data Cloud, Sales Cloud and Service Cloud, and Field Service solutions.',
            'NEUTRAL',
            'POINT_LEFT',
          ],
          [
            'In Microsoft, we work with Dynamics 365, Power Platform, Azure-based data solutions, and enterprise applications and integrations.',
            'NEUTRAL',
            'POINT_RIGHT',
          ],
          [
            'We also bring strong DevOps and data management practices: continuous delivery, test automation, data quality and governance, and development processes that work at enterprise scale.',
            'PROUD',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'ShiftEVA',
        topic: 'shifteva',
        emotion: 'EXCITED',
        segs: [
          [
            "Now let me tell you about one of our flagship offerings. It's called ShiftEVA.",
            'EXCITED',
            'SHOW_FRONT',
          ],
          [
            'ShiftEVA is a transformation platform designed to create what we call a Living Enterprise: an organization that keeps sensing, learning and improving.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'A Living Enterprise observes through unified telemetry, and learns from business feedback loops. Over time it increases organizational autonomy, and reduces decision latency, which simply means decisions get made faster.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'And most importantly, it keeps humans in control of AI-driven operations. AI assists; people decide.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'shifteva' },
      {
        type: 'VIDEO',
        title: 'What Makes Us Different',
        topic: 'what-we-do',
        emotion: 'PROUD',
        segs: [
          [
            'Plenty of companies work with technology. So what makes LevelShift different?',
            'FRIENDLY',
            'THINK',
          ],
          [
            'We combine deep industry expertise, AI Centers of Excellence, Salesforce ecosystem knowledge, Microsoft technology expertise, data and integration capabilities, and end-to-end transformation services.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            'But the real difference is our focus. We measure success by the business outcomes our customers achieve, not simply by how much technology gets implemented.',
            'SERIOUS',
            'NOD',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'what-we-do' },
      {
        type: 'VIDEO',
        title: 'Our Journey',
        topic: 'milestones',
        emotion: 'HOPEFUL',
        segs: [
          [
            'Let me take you through our journey. It began in 1998, when PreludeSys was founded, focusing on enterprise systems, managed IT services, digital operations and technology enablement. That laid the foundation for everything that followed.',
            'HOPEFUL',
            'POINT_LEFT',
          ],
          [
            'In 2012, we expanded into Salesforce with the launch of DemandBlue, offering Salesforce consulting, CRM transformation and on-demand Salesforce expertise. DemandBlue grew to become a Summit-tier Salesforce partner.',
            'PROUD',
            'COUNT_TWO',
          ],
          [
            "In 2020, DemandDynamics was introduced to focus on Microsoft Dynamics 365, Microsoft business applications and enterprise modernization. That expanded our expertise across Microsoft's technology stack.",
            'NEUTRAL',
            'COUNT_THREE',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Recognition and the Birth of LevelShift',
        topic: 'milestones',
        emotion: 'EXCITED',
        segs: [
          [
            'From 2021 onward, the company earned repeated Great Place to Work certifications, a reflection of our employee-focused culture.',
            'PROUD',
            'APPLAUD',
          ],
          [
            'Then, in 2025, came a big moment. PreludeSys, DemandBlue and DemandDynamics were unified under a single brand: LevelShift.',
            'EXCITED',
            'OPEN_ARMS',
          ],
          [
            'That gave us one unified, AI-first identity, expertise across platforms, stronger AI capabilities, and a single transformation partner for our customers.',
            'PROUD',
            'COUNT_THREE',
          ],
          [
            "Today, we help more than three hundred organizations use AI, data, integration, cloud, Salesforce and Microsoft technologies to build intelligent, adaptive and future-ready enterprises. And now, you're part of that story.",
            'HOPEFUL',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'milestones' },
      {
        type: 'TRANSITION',
        segs: [
          [
            "You now know who we are and where we came from. Next, you'll hear from the people who started it all. Over to our founders!",
            'EXCITED',
            'OPEN_ARMS',
          ],
        ],
      },
    ],
    questions: [
      {
        topic: 'who-we-are',
        text: 'Which three companies came together to form LevelShift?',
        options: [
          'PreludeSys, DemandBlue and DemandDynamics',
          'PreludeSys, Sybrant and ShiftEVA',
          'DemandBlue, Agentforce and Data Cloud',
          'DemandDynamics, PowerShift and BlueSys',
        ],
        hint: "Two of the three names begin with the word 'Demand'.",
        explanation:
          'LevelShift unites PreludeSys, DemandBlue and DemandDynamics. Think of it as three specialists forming one team: enterprise systems, Salesforce and Microsoft.',
      },
      {
        topic: 'who-we-are',
        text: 'Where is LevelShift headquartered?',
        options: [
          'Irvine, California',
          'Austin, Texas',
          'Seattle, Washington',
          'Boston, Massachusetts',
        ],
        hint: 'It is a city in Southern California.',
        explanation:
          'Our headquarters is in Irvine, California, and from there we serve more than three hundred customers through a global delivery model.',
      },
      {
        topic: 'who-we-are',
        text: "What is LevelShift's mission?",
        options: [
          'To enable customers to become AI-native enterprises',
          'To be the lowest-cost IT supplier in every market',
          'To build and sell our own hardware',
          'To replace people with fully automated systems',
        ],
        hint: 'The mission is about embedding AI across core business functions.',
        explanation:
          'Our mission is to enable customers to become AI-native enterprises by embedding AI across their core business functions and processes, with people still firmly in charge.',
      },
      {
        topic: 'what-we-do',
        text: 'Which of these is one of our four core service areas?',
        options: [
          'Data modernization',
          'Hardware manufacturing',
          'Retail banking',
          'Logistics and shipping',
        ],
        hint: 'The four areas are AI transformation, enterprise integration, enterprise applications and one more about information.',
        explanation:
          'Our four core service areas are AI transformation, data modernization, enterprise integration and enterprise applications.',
      },
      {
        topic: 'what-we-do',
        text: 'What does LevelShift measure its success by?',
        options: [
          'The business outcomes customers achieve',
          'How much technology gets installed',
          'The number of meetings held',
          'The size of each project team',
        ],
        hint: 'Think about what the customer actually feels at the end of a project.',
        explanation:
          'We focus on measurable business outcomes, not just implementing technology. A new system only matters if it makes the business better.',
      },
      {
        topic: 'shifteva',
        text: 'What does ShiftEVA always keep in control of AI-driven operations?',
        options: [
          'Humans',
          'The AI model itself',
          'An external vendor',
          'Nobody: it is fully automatic',
        ],
        hint: 'AI assists, but who decides?',
        explanation:
          'ShiftEVA keeps humans in control. It observes, learns and speeds up decisions, but people stay in charge of AI-driven operations.',
      },
      {
        topic: 'shifteva',
        text: 'ShiftEVA is designed to create what kind of organization?',
        options: [
          'A Living Enterprise',
          'A Paperless Office',
          'A Fully Outsourced Company',
          'A Static Enterprise',
        ],
        hint: 'It is an organization that keeps sensing, learning and improving, like something alive.',
        explanation:
          'ShiftEVA creates a Living Enterprise: one that observes through telemetry, learns from feedback, increases autonomy and reduces decision latency, with humans in control.',
      },
      {
        topic: 'milestones',
        text: 'In which year was the unified LevelShift brand launched?',
        options: ['2025', '1998', '2012', '2020'],
        hint: 'It is the most recent milestone on our timeline.',
        explanation:
          'The story runs 1998, 2012, 2020, and then 2025, when PreludeSys, DemandBlue and DemandDynamics became one brand: LevelShift.',
      },
      {
        topic: 'milestones',
        text: 'What did DemandBlue, launched in 2012, focus on?',
        options: [
          'Salesforce consulting',
          'Microsoft Dynamics 365',
          'Managed IT services',
          'Hardware manufacturing',
        ],
        hint: 'Think CRM, and a partner tier called Summit.',
        explanation:
          'DemandBlue was our Salesforce specialist and grew into a Summit-tier Salesforce partner. Blue, like the Salesforce cloud, is an easy way to remember it.',
      },
      {
        topic: 'milestones',
        text: 'Which company was founded first, in 1998?',
        options: ['PreludeSys', 'DemandBlue', 'DemandDynamics', 'LevelShift'],
        hint: "Its name suggests it's the opening of the story.",
        explanation:
          'PreludeSys came first, in 1998. A prelude is the opening of a piece of music, which is a handy way to remember that it started it all.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 2. Founders' Introduction (Data/Founders)                         */
  /* ---------------------------------------------------------------- */
  {
    slug: 'founders-introduction',
    title: "Founders' Introduction",
    description:
      'Meet the founders and leadership team: why LevelShift was built, how it grew, and where it is going.',
    avatar: 'founderRaj',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'Meet Rajamannar Abboy',
        topic: 'founders-introduction',
        emotion: 'FRIENDLY',
        avatar: 'founderRaj',
        segs: [
          [
            "Welcome to the team. I'm Rajamannar Abboy, one of the founders of LevelShift, and a Director of the company.",
            'FRIENDLY',
            'NOD',
          ],
          [
            "My background is in the engineering, medical equipment and aerospace industries, in both India and the United States. I'm a mechanical engineer by training, with certificates in systems engineering and manufacturing engineering.",
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'Today I lead strategic planning and operational improvement at LevelShift. I also consult on project management and program planning for a leading US defense organization.',
            'PROUD',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Meet Ramki Ramakrishnen',
        topic: 'founders-introduction',
        emotion: 'HOPEFUL',
        avatar: 'founderRamki',
        segs: [
          [
            "And I'm Ramki Ramakrishnen, Founder Director. Welcome! I'm so glad you're here.",
            'CHEERFUL',
            'WAVE',
          ],
          [
            "I'm a serial entrepreneur. My career has taken me through international finance, global supply chain, and manufacturing for the oil and gas, hydraulics and automobile industries.",
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            "I've founded and led six companies, including Indoshell Precision Technologies, with plants in Coimbatore and Iowa, IndoAutoShell American Corporation, GlobalExim Corporation, and even two film companies, Sindhujaa Films and SunMoonStars Film Studio.",
            'PROUD',
            'COUNT_THREE',
          ],
          [
            'Earlier on, I served as a Vice President at a leading investment company in Houston and at a leading public-sector bank in India. I studied finance at the University of Houston, criminology, and management at Madras University.',
            'NEUTRAL',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Built by Founders from Many Industries',
        topic: 'founding-journey',
        emotion: 'PROUD',
        avatar: 'founderRamki',
        segs: [
          [
            'As you can tell, LevelShift was not founded by people from just one industry.',
            'FRIENDLY',
            'THINK',
          ],
          [
            'Its founders came from engineering, aerospace, medical equipment, international finance, supply chain and manufacturing, in both India and the United States.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            "What Raj and I brought with us is a builder's mindset, from running businesses across continents. Plan carefully, run things well, and keep growing.",
            'PROUD',
            'HAND_ON_HEART',
          ],
          [
            "That builder's mindset still shapes how LevelShift plans, runs and grows today.",
            'HOPEFUL',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Mission and Vision',
        topic: 'vision',
        emotion: 'HOPEFUL',
        avatar: 'founderRaj',
        segs: [
          [
            'We believe technology only matters when it produces real business outcomes.',
            'SERIOUS',
            'SHOW_FRONT',
          ],
          [
            'So our mission is to help organizations turn technology into real business outcomes, by bringing together people, processes and technology across cloud, data, analytics, AI and enterprise applications.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'We want solutions that are technically sound, and that also make work simpler and better for the people who use them.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
          [
            'Our vision is to be a trusted transformation partner for customers around the world, and a place where people grow into leaders. We want to be known for curiosity, getting things done, and lasting impact.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'What We Believe',
        topic: 'vision',
        emotion: 'FRIENDLY',
        avatar: 'founderRamki',
        segs: [
          ['Let me share five beliefs that guide everything we do.', 'FRIENDLY', 'OPEN_ARMS'],
          [
            'One: people drive transformation. Technology succeeds when teams are empowered, mentored and trusted.',
            'PROUD',
            'COUNT_ONE',
          ],
          [
            'Two: curiosity and continuous improvement. We keep learning, adapting and getting better, one improvement at a time.',
            'HOPEFUL',
            'COUNT_TWO',
          ],
          [
            'Three: human-centered innovation. AI and automation work best when they are designed with empathy.',
            'EMPATHETIC',
            'COUNT_THREE',
          ],
          [
            'Four: discipline and integrity. Sound governance, financial stewardship and transparency support growth that lasts. And five: collaboration. The best outcomes come when people, processes and ideas work together.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'founders' },
      {
        type: 'VIDEO',
        title: 'Our Growth Story',
        topic: 'growth-story',
        emotion: 'PROUD',
        avatar: 'founderRaj',
        segs: [
          [
            'Many of our leaders have grown with this company. Muthukumar Ramalingam joined us in 2005 and has worked across development, delivery, operations, quality and marketing. Today he is our Chief Marketing Officer.',
            'PROUD',
            'NOD',
          ],
          [
            'His career shows something we care about deeply: we develop talent from within.',
            'HOPEFUL',
            'HAND_ON_HEART',
          ],
          [
            'We also found new ways to deliver value. We launched our On Demand Services model, with Selva Pandian as a founding member, to give customers flexible, high-impact access to expert talent.',
            'NEUTRAL',
            'POINT_RIGHT',
          ],
          [
            'Our capabilities grew into cloud, Salesforce, data, analytics and AI. And we grew through partnership, bringing in Sybrant Technologies, the IT services firm built by V. Thiyagarajan, known to all of us as VT, with his three decades of experience building and scaling businesses.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Leadership Team',
        topic: 'leadership',
        emotion: 'PROUD',
        avatar: 'founderRamki',
        segs: [
          [
            'Today, LevelShift is guided by a leadership team whose members mostly have more than twenty-five years of experience, from organizations such as Microsoft, Intel, IBM FileNET, EDS, Capgemini and BearingPoint.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            'Kiran Babu Chandra, our Chief Executive Officer, sets our strategic direction and growth. Chandramohan Parlapalli, our Chief Operating Officer, turns strategy into execution at scale.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Manoj Chandra, our Chief Technology Officer, leads technology innovation, delivery strategy and talent development. Rangesh Rajaram, our Chief Financial Officer, leads finance, compliance, vendor management and administration.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Muthukumar Ramalingam leads marketing. Selva Pandian is Managing Director of our Cloud Practice, and Kumar Vellore is Managing Director of Data, Analytics and Enterprise Integration. And VT is Senior Vice President for Strategic Accounts.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            "Many of them started out as engineers, consultants and entrepreneurs, and several grew their careers right here. You'll likely meet some of them soon.",
            'CHEERFUL',
            'NOD',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'growth' },
      {
        type: 'VIDEO',
        title: "Where We're Going",
        topic: 'future-goals',
        emotion: 'ENCOURAGING',
        avatar: 'founderRaj',
        segs: [
          [
            'Looking ahead, our focus is cloud, data, AI and intelligent automation, delivered for customers around the world.',
            'HOPEFUL',
            'POINT_RIGHT',
          ],
          [
            "So what does all this mean for you? You're joining a company that values learning, ownership and collaboration.",
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Our ask of you is simple. Stay curious, keep improving, and build things that matter to people.',
            'ENCOURAGING',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'TRANSITION',
        avatar: 'founderRamki',
        segs: [
          [
            "Now let's talk about what it feels like to work here. Zara will tell you about our culture.",
            'CHEERFUL',
            'HAND_ON_HEART',
          ],
        ],
      },
    ],
    questions: [
      {
        topic: 'founders',
        text: 'What mindset do the founders say still shapes how LevelShift plans, runs and grows?',
        options: [
          "A builder's mindset",
          'A wait-and-watch mindset',
          'A cost-cutting mindset',
          'A competitor-first mindset',
        ],
        hint: 'Both founders built and ran businesses across continents.',
        explanation:
          "It is a builder's mindset. Between them, the founders have built businesses in engineering, aerospace, finance and manufacturing, and they brought that habit of building here.",
      },
      {
        topic: 'founders',
        text: 'According to what we believe, what drives transformation?',
        options: ['People', 'Technology on its own', 'Budgets', 'Luck'],
        hint: 'Technology succeeds when teams are empowered, mentored and trusted.',
        explanation:
          'People drive transformation. The best technology still needs empowered, mentored and trusted teams to make it work.',
      },
      {
        topic: 'founders',
        text: 'Which belief says AI and automation work best when they are designed with empathy?',
        options: [
          'Human-centered innovation',
          'Discipline and integrity',
          'Speed over quality',
          'Automation first, people later',
        ],
        hint: 'The belief puts humans at the center.',
        explanation:
          'Human-centered innovation: AI and automation work best when they are designed with empathy for the people who use them.',
      },
      {
        topic: 'growth',
        text: 'Which service model did LevelShift launch to give customers flexible access to expert talent?',
        options: [
          'On Demand Services',
          'Pay Per Ticket',
          'Fixed Bench Staffing',
          'Offshore-Only Delivery',
        ],
        hint: 'The name says customers get help exactly when they ask for it.',
        explanation:
          'On Demand Services lets customers bring in expert talent when they need it, a bit like streaming a film instead of buying the whole cinema.',
      },
      {
        topic: 'growth',
        text: "What does Muthukumar Ramalingam's career, which began here in 2005, show about LevelShift?",
        options: [
          'We develop talent from within',
          'We only hire senior leaders from outside',
          'People must stay in one role for their whole career',
          'Marketing is the only path to leadership',
        ],
        hint: 'He worked across development, delivery, operations, quality and marketing before becoming CMO.',
        explanation:
          'He grew from development all the way to Chief Marketing Officer. It shows how LevelShift develops talent from within.',
      },
      {
        topic: 'growth',
        text: 'Which IT services firm, built by V. Thiyagarajan (VT), became part of LevelShift?',
        options: [
          'Sybrant Technologies',
          'Indoshell Precision Technologies',
          'GlobalExim Corporation',
          'BearingPoint',
        ],
        hint: 'Its name starts with the letter S.',
        explanation:
          'Sybrant Technologies joined LevelShift, bringing VT and his three decades of experience in building and scaling businesses.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 3. Company Culture (Data/Culture)                                 */
  /* ---------------------------------------------------------------- */
  {
    slug: 'company-culture',
    title: 'Company Culture',
    description: 'Our values, everyday behaviours and ways of working.',
    avatar: 'culture',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'Our Culture',
        topic: 'culture-overview',
        emotion: 'CHEERFUL',
        segs: [
          ["Hi! I'm Zara, and I get the fun part: our culture.", 'CHEERFUL', 'WAVE'],
          [
            'Our culture is built around innovation, customer success, collaboration, continuous learning and accountability.',
            'FRIENDLY',
            'SHOW_FRONT',
          ],
          [
            'As an AI-first company, we encourage everyone to think beyond traditional technology delivery and focus on creating real, measurable business impact.',
            'EXCITED',
            'OPEN_ARMS',
          ],
          [
            "You'll notice a future-focused mindset, customer-centric decisions, teamwork across functions, ownership, experimentation, and a deep respect for diversity and inclusion. It's why we've been recognized as a Great Place to Work again and again.",
            'PROUD',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Five Values',
        topic: 'values',
        emotion: 'FRIENDLY',
        segs: [
          [
            "We have five values: customer success, innovation, excellence, integrity and collaboration. Let's go through them.",
            'FRIENDLY',
            'SHOW_FRONT',
          ],
          [
            "Customer success comes first. Everything begins with understanding the customer's challenge. We put their needs first, focus on outcomes rather than just activities, and build long-term trust by communicating proactively and delivering on our commitments.",
            'SERIOUS',
            'COUNT_ONE',
          ],
          [
            'Innovation is encouraged at every level, from individual contributors to leadership. Challenge conventional thinking, explore new technologies, share new ideas openly, and experiment responsibly, especially with AI.',
            'EXCITED',
            'COUNT_TWO',
          ],
          [
            'Excellence means quality in every deliverable, interaction and decision. Pay attention to detail, review your work thoroughly, seek feedback, and keep improving.',
            'PROUD',
            'COUNT_THREE',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Integrity and Collaboration',
        topic: 'values',
        emotion: 'SERIOUS',
        segs: [
          [
            'Integrity is non-negotiable. Trust is built through ethical behaviour and transparency. Be honest and respectful, communicate openly, and take responsibility for your actions.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
          [
            'And when you make a mistake, admit it quickly. Everybody makes mistakes; hiding them is what causes real damage.',
            'EMPATHETIC',
            'NOD',
          ],
          [
            'Finally, collaboration. Success comes when teams work together. Respect diverse perspectives, share knowledge actively, work across teams, and help your colleagues succeed.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'values' },
      {
        type: 'VIDEO',
        title: 'Everyday Behaviours',
        topic: 'behaviours',
        emotion: 'ENCOURAGING',
        segs: [
          [
            'Values only count when they show up in daily behaviour. Here are seven behaviours we expect from everyone.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Be curious: ask questions, seek deeper understanding, and learn continuously.',
            'HOPEFUL',
            'COUNT_ONE',
          ],
          [
            'Take ownership: own your commitments, be accountable for outcomes, and follow through.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'Communicate clearly: share information transparently, listen actively, and escalate risks early.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'And act with empathy: understand the perspectives of customers and colleagues, show respect in every interaction, and help build an inclusive environment.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Think Big, Start Small',
        topic: 'behaviours',
        emotion: 'EXCITED',
        segs: [
          [
            'Next, my favourite: think big, start small. Keep the long-term goal in sight, then execute in manageable steps, learning and adapting as you go.',
            'EXCITED',
            'THUMBS_UP',
          ],
          [
            'Embrace change: adapt to new technologies, welcome feedback, and stay flexible and resilient.',
            'ENCOURAGING',
            'OPEN_ARMS',
          ],
          [
            'And deliver results: prioritize impact, meet your commitments, and focus on measurable outcomes.',
            'PROUD',
            'NOD',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'behaviours' },
      {
        type: 'VIDEO',
        title: 'How We Work with Customers',
        topic: 'ways-of-working',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Now, how does work actually get done here? Every project begins with understanding business value, customer goals and expected outcomes.',
            'FRIENDLY',
            'THINK',
          ],
          [
            'In practice that means requirement discovery sessions, collaborative planning, regular status updates, and outcome-based delivery.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'Most teams also work with an agile mindset: incremental delivery, continuous feedback, sprint planning and reviews, and adapting quickly to change.',
            'NEUTRAL',
            'POINT_LEFT',
          ],
          [
            'Why? Because it delivers value faster, keeps things transparent, and helps us manage risk better.',
            'ENCOURAGING',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Learning, Collaboration and Innovation',
        topic: 'ways-of-working',
        emotion: 'HOPEFUL',
        segs: [
          [
            'We never stop learning. You are encouraged to build expertise in AI, Microsoft technologies, the Salesforce ecosystem, cloud platforms, data engineering and business applications.',
            'HOPEFUL',
            'SHOW_FRONT',
          ],
          [
            'You can learn through certifications, internal training programs, knowledge-sharing sessions, and of course hands-on project experience.',
            'FRIENDLY',
            'NOD',
          ],
          [
            'We put collaboration first. Business stakeholders, delivery teams, architects, engineers, consultants and customer success teams all work closely together, solving problems as one team.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'And we expect innovation in how we execute: use AI tools responsibly, automate repetitive work, keep improving processes, and propose ideas that help our efficiency and our customers.',
            'EXCITED',
            'POINT_RIGHT',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'ways-of-working' },
      {
        type: 'VIDEO',
        title: 'Our Culture in One Line',
        topic: 'motto',
        emotion: 'PROUD',
        segs: [
          [
            'If you remember just one line about our culture, make it this one.',
            'FRIENDLY',
            'COUNT_ONE',
          ],
          [
            'Learn continuously, innovate boldly, collaborate deeply, and deliver customer success.',
            'PROUD',
            'HAND_ON_HEART',
          ],
          [
            "It brings people, technology and AI-driven innovation together to create meaningful impact. And now it's yours too!",
            'CHEERFUL',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'TRANSITION',
        segs: [
          [
            'A great culture also needs clear ground rules. Arjun is up next with our key policies.',
            'FRIENDLY',
            'THUMBS_UP',
          ],
        ],
      },
    ],
    questions: [
      {
        topic: 'values',
        text: "Which of these is one of LevelShift's five core values?",
        options: ['Integrity', 'Secrecy', 'Hierarchy', 'Speed at any cost'],
        hint: 'It is about honesty and transparency.',
        explanation:
          'Integrity is one of our five values, alongside customer success, innovation, excellence and collaboration. Trust is built when people are honest, especially about mistakes.',
      },
      {
        topic: 'values',
        text: 'According to our Customer Success value, what should we focus on?',
        options: [
          'Outcomes, not just activities',
          'Billable hours above everything',
          'What is most convenient internally',
          'Using the newest technology available',
        ],
        hint: 'A busy week is not the same as a result the customer can feel.',
        explanation:
          'We focus on outcomes. A customer does not remember how many meetings we held; they remember whether their problem was solved.',
      },
      {
        topic: 'values',
        text: 'You realize you made a mistake in a deliverable. What does our Integrity value expect?',
        options: [
          'Admit it quickly',
          'Hope nobody notices',
          'Blame the tools',
          'Fix it quietly and say nothing',
        ],
        hint: 'Integrity is about honesty and taking responsibility.',
        explanation:
          'Admit mistakes quickly. Owning a mistake early builds trust and gives the team time to fix it together.',
      },
      {
        topic: 'behaviours',
        text: "What does 'Think Big, Start Small' mean?",
        options: [
          'Aim for long-term goals and execute in manageable steps',
          'Only take on small tasks',
          'Plan for years before starting anything',
          'Leave the big ideas to leadership',
        ],
        hint: 'It combines an ambitious goal with a practical first step.',
        explanation:
          'Think big, start small means keeping a long-term goal in sight while moving in manageable steps, like climbing a mountain one camp at a time.',
      },
      {
        topic: 'behaviours',
        text: 'You spot a risk that could delay your project. What does our culture expect you to do?',
        options: [
          'Escalate it early',
          'Wait and see if it resolves itself',
          'Mention it at the end of the project',
          'Keep it to yourself to avoid worrying anyone',
        ],
        hint: "It is part of the 'Communicate Clearly' behaviour.",
        explanation:
          'Escalate risks early. A small problem raised on Monday is a quick fix; the same problem raised on Friday can be a missed deadline.',
      },
      {
        topic: 'behaviours',
        text: 'Which behaviour is about adapting to new technologies and welcoming feedback?',
        options: ['Embrace Change', 'Deliver Results', 'Take Ownership', 'Be Curious'],
        hint: 'The behaviour also asks you to stay flexible and resilient.',
        explanation:
          'Embrace Change: adapt to new technologies, welcome feedback, and stay flexible and resilient.',
      },
      {
        topic: 'ways-of-working',
        text: 'How does every project at LevelShift begin?',
        options: [
          'By understanding business value, customer goals and expected outcomes',
          'By choosing the newest technology',
          'By writing code straight away',
          'By agreeing the final invoice',
        ],
        hint: 'Our approach is customer-centric.',
        explanation:
          'Every project starts with understanding business value, customer goals and expected outcomes, through discovery sessions and collaborative planning.',
      },
      {
        topic: 'ways-of-working',
        text: 'Which of these is part of how most of our teams work?',
        options: [
          'Agile: incremental delivery and continuous feedback',
          'One big delivery at the very end',
          'No status updates until the project is finished',
          'Working alone without reviews',
        ],
        hint: 'Think sprints, reviews and small increments.',
        explanation:
          'Most teams use agile principles: incremental delivery, continuous feedback, sprint planning and reviews. It delivers value faster and keeps risks visible.',
      },
      {
        topic: 'ways-of-working',
        text: 'How are you encouraged to use AI tools at work?',
        options: [
          'Responsibly, to automate repetitive work and improve processes',
          'Not at all',
          'For everything, without checking the output',
          'Only outside working hours',
        ],
        hint: 'The key word is "responsibly".',
        explanation:
          'Use AI tools responsibly to automate repetitive work and improve processes, so you can spend your time on what matters most.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 4. Company Policies (Data/Policies)                               */
  /* ---------------------------------------------------------------- */
  {
    slug: 'company-policies',
    title: 'Company Policies',
    description:
      'Leave, attendance, the code of conduct and what we expect from every employee, in plain language.',
    avatar: 'policies',
    requiresAcknowledgment: true,
    steps: [
      {
        type: 'VIDEO',
        title: 'Policies Overview',
        topic: 'overview',
        emotion: 'FRIENDLY',
        segs: [
          [
            "Hello, I'm Arjun. I'll keep this practical and cover the policies you'll use most often.",
            'FRIENDLY',
            'WAVE',
          ],
          [
            "We'll go through four things: leave, attendance, our code of conduct, and what we expect from every employee.",
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'This is a summary. For complete details, your entitlements and the latest updates, always refer to the official HR policy documents, or simply ask HR.',
            'SERIOUS',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Types of Leave',
        topic: 'leave',
        emotion: 'FRIENDLY',
        segs: [
          [
            'We want you to maintain a healthy work-life balance, and come back refreshed, while keeping our work running smoothly.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Privileged or earned leave is for planned vacations and personal time. Casual leave covers short, unplanned personal needs. And sick leave is for illness or medical needs.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'There is also maternity leave, as per company policy and applicable law, paternity leave, and bereavement leave if you lose a family member.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
          [
            'Where applicable, you can get compensatory off for approved extra work. And public and company holidays follow the published holiday calendar.',
            'FRIENDLY',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Applying for Leave',
        topic: 'leave',
        emotion: 'NEUTRAL',
        segs: [
          [
            "Applying is simple. Apply through the approved HRMS system, and get your manager's approval before you take planned leave.",
            'NEUTRAL',
            'COUNT_ONE',
          ],
          [
            "If you're unwell or there's an emergency, inform your reporting manager immediately.",
            'EMPATHETIC',
            'NOD',
          ],
          [
            'Before an extended leave, complete a proper knowledge transfer. And stay within your leave balances.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'A few good habits: plan vacations in advance, avoid leave during critical project milestones where you can, and keep your team informed about your availability and handovers.',
            'FRIENDLY',
            'THUMBS_UP',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'leave' },
      {
        type: 'VIDEO',
        title: 'Attendance',
        topic: 'attendance',
        emotion: 'NEUTRAL',
        segs: [
          [
            'Regular attendance shows professionalism, accountability and commitment to your team. So, follow your assigned schedule, join meetings on time, and stay available during working hours.',
            'NEUTRAL',
            'POINT_RIGHT',
          ],
          [
            "Keep your calendar updated with leave, holidays and planned absences, and follow your team's hybrid, remote or in-office attendance guidelines.",
            'NEUTRAL',
            'NOD',
          ],
          [
            'Punctuality matters, for customer meetings and internal ones. If you are going to be late, let the people involved know whenever possible.',
            'SERIOUS',
            'COUNT_ONE',
          ],
          [
            'If you are absent, notify your manager promptly, update the attendance system accurately, and provide supporting documents if they are required.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'And when you work remotely, make sure your internet connection is stable, keep up your productivity, and stay reachable during agreed business hours.',
            'FRIENDLY',
            'COUNT_THREE',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'attendance' },
      {
        type: 'VIDEO',
        title: 'Code of Conduct',
        topic: 'conduct',
        emotion: 'SERIOUS',
        segs: [
          [
            'We expect everyone to keep the highest standards of professional and ethical behaviour.',
            'SERIOUS',
            'SHOW_FRONT',
          ],
          [
            'That means treating everyone with respect and dignity, communicating professionally, working as a team, and helping build an inclusive workplace.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'It also means integrity: act honestly and transparently, protect confidential information, avoid conflicts of interest, and comply with company policies and the law.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Zero Tolerance and Security',
        topic: 'conduct',
        emotion: 'SERIOUS',
        segs: [
          [
            'Some things are never acceptable. We have zero tolerance for harassment, discrimination, bullying, retaliation and unethical conduct.',
            'SERIOUS',
            'CAUTION',
          ],
          [
            'If you experience or witness any of these, report it to your manager or HR. Speaking up is always the right thing to do.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
          [
            'Our code of conduct also covers information security: safeguard customer and company data, use company resources responsibly, follow our cybersecurity policies, and report security incidents immediately.',
            'SERIOUS',
            'COUNT_THREE',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'conduct' },
      {
        type: 'VIDEO',
        title: 'What We Expect from You',
        topic: 'expectations',
        emotion: 'ENCOURAGING',
        segs: [
          ['Finally, six things we expect from every employee.', 'FRIENDLY', 'OPEN_ARMS'],
          [
            'Ownership: take responsibility for your tasks, deliverables, commitments and the quality of your work. Collaboration: work well with your team, your manager, other teams and customers.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Continuous learning: upgrade your skills, pursue certifications and learn emerging technologies. Customer focus: understand customer needs, act with urgency and professionalism, and keep service standards high.',
            'HOPEFUL',
            'COUNT_TWO',
          ],
          [
            'An innovation mindset: suggest improvements, embrace AI and automation, and drive efficiency. And accountability: be reliable, transparent, communicate on time, and stay committed to results.',
            'ENCOURAGING',
            'COUNT_TWO',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'expectations' },
      {
        type: 'ACKNOWLEDGMENT',
        title: 'Company Policies',
        topic: 'company-policies',
        ackText:
          "I confirm that I have gone through the summary of LevelShift's Leave, Attendance and Code of Conduct policies and the expectations of every employee. I understand that the official HR policy documents contain the full details that apply to me, and that I can contact HR with any questions.",
      },
      {
        type: 'TRANSITION',
        segs: [
          [
            'Thank you. Next, Priya will cover compliance: how we keep each other, and our data, safe.',
            'FRIENDLY',
            'NOD',
          ],
        ],
      },
    ],
    questions: [
      {
        topic: 'leave',
        text: 'How should you apply for planned leave?',
        options: [
          'Through the HRMS system, with manager approval beforehand',
          'By messaging a teammate',
          'By blocking your calendar only',
          'By informing HR after you return',
        ],
        hint: 'There is an approved system, and one person whose approval you need first.',
        explanation:
          'Planned leave goes through the HRMS system with your manager approving it in advance. That way your team can plan around you, and your leave balance stays accurate.',
      },
      {
        topic: 'leave',
        text: "You wake up unwell and can't work today. What should you do first?",
        options: [
          'Inform your reporting manager immediately',
          'Mention it when you are back',
          'Ask a colleague to quietly cover for you',
          'Post about it in a social chat group',
        ],
        hint: 'Think about who needs to know so your work can be covered.',
        explanation:
          'Tell your reporting manager straight away. Nobody minds that you are unwell; what causes trouble is a team finding out at the stand-up that you are missing.',
      },
      {
        topic: 'leave',
        text: 'Which type of leave is meant for short, unplanned personal needs?',
        options: [
          'Casual leave',
          'Privileged or earned leave',
          'Bereavement leave',
          'Compensatory off',
        ],
        hint: 'It is the most informal-sounding of the leave types.',
        explanation:
          'Casual leave covers short, unplanned personal needs. Earned leave is for planned vacations, and sick leave is for illness.',
      },
      {
        topic: 'leave',
        text: 'What should you do before going on an extended leave?',
        options: [
          'Complete a proper knowledge transfer',
          'Turn off all notifications without telling anyone',
          'Leave your work for the team to figure out',
          'Nothing; it is not needed',
        ],
        hint: 'Your team needs to keep things moving while you are away.',
        explanation:
          'Hand over properly before a long break, so your team can carry on smoothly and you can switch off with a clear mind.',
      },
      {
        topic: 'attendance',
        text: 'You are working remotely today. Which of these is expected?',
        options: [
          'Stay reachable during agreed business hours',
          'Reply only to messages from your manager',
          'Switch off your laptop whenever you like',
          'Work only when the internet happens to be fast',
        ],
        hint: 'Remote work still needs you to be available to your team.',
        explanation:
          'When you work remotely, keep a stable connection, maintain your productivity, and stay reachable during agreed business hours.',
      },
      {
        topic: 'attendance',
        text: 'You will be late for a customer meeting. What should you do?',
        options: [
          'Inform the people involved as early as possible',
          'Join late without saying anything',
          'Skip the meeting altogether',
          'Explain the next day',
        ],
        hint: 'Punctuality includes letting stakeholders know about delays.',
        explanation:
          "Let the people involved know about the delay whenever possible. A quick heads-up respects everyone's time.",
      },
      {
        topic: 'conduct',
        text: 'Which of these does LevelShift have zero tolerance for?',
        options: [
          'Retaliation',
          'Asking questions',
          'Disagreeing respectfully',
          'Taking approved leave',
        ],
        hint: 'It means punishing someone for speaking up.',
        explanation:
          'Retaliation is on the zero-tolerance list along with harassment, discrimination, bullying and unethical conduct. People must feel safe to raise concerns.',
      },
      {
        topic: 'conduct',
        text: 'What should you do with confidential information?',
        options: [
          'Protect it and share it only with authorized people',
          'Share it with friends at other companies if it seems harmless',
          'Keep a copy in your personal cloud storage',
          'Post it online once names are removed',
        ],
        hint: 'The Integrity and Ethics section uses the word "protect".',
        explanation:
          'Confidential information is protected and shared only with people authorized to see it. Our customers trust us with their business, and that trust is the product we sell.',
      },
      {
        topic: 'conduct',
        text: 'You witness a colleague being bullied. What should you do?',
        options: [
          'Report it to your manager or HR',
          'Ignore it; it is not your business',
          'Wait until it happens again',
          'Discuss it on social media',
        ],
        hint: 'You do not have to be the person affected to report it.',
        explanation:
          'If you experience or witness harassment, discrimination or bullying, report it to your manager or HR. Speaking up protects everyone.',
      },
      {
        topic: 'expectations',
        text: 'Which employee expectation is about taking responsibility for your tasks and the quality of your work?',
        options: ['Ownership', 'Innovation mindset', 'Customer focus', 'Continuous learning'],
        hint: 'If it is yours, you own it.',
        explanation:
          'Ownership means taking responsibility for your assigned tasks, deliverables, commitments and the quality of your work.',
      },
      {
        topic: 'expectations',
        text: 'What does the Accountability expectation involve?',
        options: [
          'Reliability, transparency, timely communication and commitment to results',
          'Working long hours no matter what',
          'Never asking for help',
          'Keeping problems private until they are solved',
        ],
        hint: 'It is about others being able to count on you.',
        explanation:
          'Accountability means being reliable and transparent, communicating on time, and staying committed to results.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 5. Compliance and Workplace Safety (Data/Compliance)              */
  /* ---------------------------------------------------------------- */
  {
    slug: 'compliance-and-workplace-safety',
    title: 'Compliance and Workplace Safety',
    description:
      'POSH, information security and data protection, and your responsibilities in each.',
    avatar: 'compliance',
    requiresAcknowledgment: true,
    steps: [
      {
        type: 'VIDEO',
        title: 'Why Compliance Matters',
        topic: 'overview',
        emotion: 'SERIOUS',
        segs: [
          [
            "I'm Priya. This section matters a great deal, so I'll ask for your full attention.",
            'SERIOUS',
            'NOD',
          ],
          [
            'Compliance is a critical part of our culture and operations. Every employee is expected to follow legal, ethical and organizational standards, so that our workplace stays safe, secure and professional.',
            'SERIOUS',
            'SHOW_FRONT',
          ],
          [
            "We'll cover three areas: POSH, which is the prevention of sexual harassment; information security; and data protection. After each one, you'll confirm that you've understood.",
            'NEUTRAL',
            'COUNT_THREE',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'What Is POSH?',
        topic: 'posh',
        emotion: 'SERIOUS',
        segs: [
          [
            'POSH stands for Prevention of Sexual Harassment at the Workplace. In India, it is governed by the Sexual Harassment of Women at Workplace Prevention, Prohibition and Redressal Act of 2013.',
            'SERIOUS',
            'SHOW_FRONT',
          ],
          [
            'Its objective is to give every employee a workplace that is safe, respectful, inclusive, and free from harassment and discrimination.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
          [
            'Every one of us has a part to play. Treat colleagues with dignity and respect, maintain professional boundaries, and avoid inappropriate verbal, physical or digital behaviour.',
            'SERIOUS',
            'COUNT_THREE',
          ],
          [
            'Report incidents without fear of retaliation, and cooperate fully if there is an investigation.',
            'SERIOUS',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Recognizing and Reporting Harassment',
        topic: 'posh',
        emotion: 'EMPATHETIC',
        segs: [
          [
            'Unacceptable conduct can take three forms. Verbal: sexually suggestive comments, inappropriate jokes or offensive remarks.',
            'SERIOUS',
            'COUNT_ONE',
          ],
          [
            "Physical: unwanted touching, physical intimidation, or invading someone's personal space.",
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'And digital: inappropriate messages, sharing offensive content, or unwanted communication through email, Teams, WhatsApp or social media.',
            'SERIOUS',
            'CAUTION',
          ],
          [
            'If you experience or witness harassment, report it immediately. Contact HR or the Internal Committee, known as the IC. Provide the relevant details and any evidence, and cooperate with the investigation.',
            'SERIOUS',
            'COUNT_THREE',
          ],
          [
            'Our commitment to you: zero tolerance toward harassment, fair and confidential investigations, protection against retaliation, and respect for every employee.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'posh' },
      {
        type: 'ACKNOWLEDGMENT',
        title: 'POSH',
        topic: 'posh',
        ackText:
          "I confirm that I have understood LevelShift's POSH (Prevention of Sexual Harassment) guidelines, including my responsibilities, what counts as unacceptable verbal, physical or digital conduct, and how to report an incident to HR or the Internal Committee. I understand that LevelShift has zero tolerance for harassment and protects those who report it against retaliation.",
      },
      {
        type: 'VIDEO',
        title: 'Why Security Matters',
        topic: 'information-security',
        emotion: 'SERIOUS',
        segs: [
          [
            "Information and cybersecurity are everyone's responsibility here, including yours, from day one.",
            'SERIOUS',
            'POINT_LEFT',
          ],
          [
            'We handle customer data, business information, intellectual property, employee information and project documentation. A single security breach can affect our customers, our employees and our business.',
            'SERIOUS',
            'CAUTION',
          ],
          [
            'Security rests on three principles, often called the CIA triad. Confidentiality: information is accessible only to authorized people.',
            'NEUTRAL',
            'COUNT_ONE',
          ],
          [
            'Integrity: information stays accurate and unaltered. And availability: systems and data are there when they are needed.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Your Security Responsibilities',
        topic: 'information-security',
        emotion: 'SERIOUS',
        segs: [
          [
            'Start with your accounts. Use strong passwords, enable multi-factor authentication, never share your credentials, and lock your system when you step away.',
            'SERIOUS',
            'COUNT_ONE',
          ],
          [
            'With email, verify that the sender is genuine, avoid clicking suspicious links, open attachments only from trusted sources, and report phishing attempts.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'With devices, use approved devices only, keep them updated, install authorized software only, and report a lost or stolen device immediately.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'And when you work remotely, use secure networks, connect through the VPN where required, and protect confidential information from anyone around you.',
            'SERIOUS',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Common Security Threats',
        topic: 'information-security',
        emotion: 'SERIOUS',
        segs: [
          ['Let me name the threats to watch out for.', 'SERIOUS', 'CAUTION'],
          [
            'Phishing: fraudulent emails that try to steal your credentials or information. Malware: malicious software designed to damage systems or gain unauthorized access.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'Social engineering: manipulating people into revealing confidential information, often by pretending to be someone you trust. And data leakage: sensitive information being exposed, accidentally or on purpose.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            "If something looks suspicious, don't click and don't reply. Report it. Nobody will ever be upset with you for reporting something that turns out to be harmless.",
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'information-security' },
      {
        type: 'ACKNOWLEDGMENT',
        title: 'Information Security',
        topic: 'information-security',
        ackText:
          'I confirm that I have understood my information security responsibilities at LevelShift, including protecting my accounts, credentials and devices, recognizing phishing and other threats, working securely when remote, and reporting security incidents or lost devices immediately.',
      },
      {
        type: 'VIDEO',
        title: 'Data Protection',
        topic: 'data-protection',
        emotion: 'SERIOUS',
        segs: [
          [
            'Data protection makes sure customer, employee and company information is collected, processed, stored and shared responsibly.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'Customer data includes business information, project data, contact information and transaction records. Employee data includes personal information, payroll and performance records, and identification documents.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'And company data includes financial information, strategic plans, intellectual property and internal communications. All of it must be protected.',
            'SERIOUS',
            'COUNT_THREE',
          ],
          [
            'Five principles guide us. Collect only what is needed. Use data responsibly, for authorized work only. Protect sensitive information. Share carefully, only with authorized people and platforms. And dispose of data securely, following company retention policies.',
            'SERIOUS',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Handling Data Day to Day',
        topic: 'data-protection',
        emotion: 'SERIOUS',
        segs: [
          [
            'Follow your confidentiality agreements, and access data only when you are authorized to. Comply with company and regulatory requirements at all times.',
            'SERIOUS',
            'NOD',
          ],
          [
            'Do use company-approved applications, classify information appropriately, verify recipients before you send an email, and keep your software updated.',
            'FRIENDLY',
            'THUMBS_UP',
          ],
          [
            "Don't share passwords, don't forward confidential information without authorization, don't use unauthorized cloud storage, and don't download sensitive data you don't need.",
            'SERIOUS',
            'CAUTION',
          ],
          [
            "Please don't store company data on personal devices, and never leave a device unattended and unlocked. If a data incident happens, report it immediately.",
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'data-protection' },
      {
        type: 'ACKNOWLEDGMENT',
        title: 'Data Protection',
        topic: 'data-protection',
        ackText:
          'I confirm that I have understood how to handle customer, employee and company data at LevelShift: accessing it only when authorized and on a need-to-know basis, never storing it on personal devices or unapproved cloud storage, and reporting data incidents immediately.',
      },
      {
        type: 'VIDEO',
        title: 'The Simple Rule',
        topic: 'summary',
        emotion: 'ENCOURAGING',
        segs: [
          [
            "Let's bring it together. For POSH: keep the workplace respectful, report harassment immediately, and support an inclusive culture.",
            'SERIOUS',
            'COUNT_ONE',
          ],
          [
            'For security: protect your systems, devices and credentials, follow good cybersecurity practice, and report anything suspicious promptly.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'For data protection: safeguard customer and company information, access data only on a need-to-know basis, and respect privacy and confidentiality.',
            'SERIOUS',
            'COUNT_THREE',
          ],
          [
            "And here's the simple rule to remember: respect people, protect information, follow policies, and report concerns promptly.",
            'ENCOURAGING',
            'THUMBS_UP',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'summary' },
      {
        type: 'TRANSITION',
        segs: [
          [
            'Well done, and thank you for your attention. Now for something lighter: Kabir will introduce our business units.',
            'FRIENDLY',
            'HAND_ON_HEART',
          ],
        ],
      },
    ],
    questions: [
      {
        topic: 'posh',
        text: 'Who should you contact to report sexual harassment?',
        options: [
          'HR or the Internal Committee (IC)',
          'Only your closest colleague',
          'The IT helpdesk',
          'Nobody, unless it happens more than once',
        ],
        hint: 'One is a department; the other is a committee set up for exactly this purpose.',
        explanation:
          'Report to HR or the Internal Committee, straight away. You do not need to wait for it to happen again, and you are protected against retaliation.',
      },
      {
        topic: 'posh',
        text: 'Which of these is an example of digital harassment?',
        options: [
          'Sending unwanted, inappropriate messages on Teams or WhatsApp',
          'Sending a meeting invite',
          'Emailing a project status update',
          'Giving written feedback on a piece of work',
        ],
        hint: 'Look for the option that is both unwanted and inappropriate.',
        explanation:
          'Unwanted, inappropriate messages count as harassment on any channel. The rules of respect are the same on a chat app as they are in a meeting room.',
      },
      {
        topic: 'posh',
        text: 'What happens to someone who reports harassment in good faith?',
        options: [
          'They are protected against retaliation',
          'They must prove it before anyone listens',
          'Their name is shared with the whole company',
          'They are moved to another team',
        ],
        hint: 'Our commitment includes fair and confidential investigations.',
        explanation:
          'People who report are protected against retaliation, and investigations are fair and confidential. That is what makes it safe to speak up.',
      },
      {
        topic: 'information-security',
        text: 'An unexpected email asks you to confirm your password through a link. What should you do?',
        options: [
          "Don't click, and report it as phishing",
          'Click the link to check whether it is real',
          'Forward it to your teammates to ask their opinion',
          'Reply with your password if it looks official',
        ],
        hint: 'Phishing emails are designed to make you click.',
        explanation:
          "Don't click; report it. Phishing works like a fishing lure: it only catches you if you bite. Reporting it also protects the next person who receives it.",
      },
      {
        topic: 'information-security',
        text: 'Which three principles make up information security?',
        options: [
          'Confidentiality, Integrity and Availability',
          'Speed, Cost and Quality',
          'Privacy, Profit and Performance',
          'Access, Audit and Archive',
        ],
        hint: 'Their initials spell C-I-A.',
        explanation:
          'Confidentiality, Integrity and Availability: only the right people see the data, the data stays accurate, and it is there when needed.',
      },
      {
        topic: 'information-security',
        text: 'Your company laptop is stolen. What should you do?',
        options: [
          'Report it immediately',
          'Wait a week in case it turns up',
          'Buy a replacement and say nothing',
          'Report it at your next performance review',
        ],
        hint: 'Every hour a lost device goes unreported is a risk.',
        explanation:
          'Report lost or stolen devices immediately, so access can be blocked before anyone can misuse the data on them.',
      },
      {
        topic: 'information-security',
        text: 'Someone calls pretending to be from IT and asks for your login details. What is this called?',
        options: ['Social engineering', 'Malware', 'Data backup', 'Multi-factor authentication'],
        hint: 'It manipulates people rather than computers.',
        explanation:
          'That is social engineering: manipulating people into revealing confidential information. Never share your credentials, whoever asks.',
      },
      {
        topic: 'data-protection',
        text: 'Where should company data NOT be stored?',
        options: [
          'On personal devices or unauthorized cloud storage',
          'In company-approved applications',
          'In approved project repositories',
          'On company-managed devices',
        ],
        hint: 'Three of the options include the words "company" or "approved".',
        explanation:
          'Company data stays out of personal devices and unapproved cloud storage. Once data leaves our approved systems, we can no longer protect it.',
      },
      {
        topic: 'data-protection',
        text: "What does 'collect only what is needed' mean?",
        options: [
          'Access and use only the information necessary for business purposes',
          'Collect everything, in case it is useful later',
          'Collect data only when a customer forgets to send it',
          'Never collect any data at all',
        ],
        hint: 'The key word is "necessary".',
        explanation:
          'Use only the information the job requires. Data you never collected cannot be leaked, which makes this the simplest protection of all.',
      },
      {
        topic: 'data-protection',
        text: 'Before sending an email with project data, what should you do?',
        options: [
          'Verify the recipients',
          'Add as many people as possible to be safe',
          'Copy it to your personal email first',
          'Remove the subject line',
        ],
        hint: 'One wrong address can expose sensitive information.',
        explanation:
          'Always verify recipients before sending. A mistyped address is one of the most common causes of data leakage.',
      },
      {
        topic: 'summary',
        text: 'What is the simple rule for compliance at LevelShift?',
        options: [
          'Respect people, protect information, follow policies, report concerns promptly',
          'Work fast, ship early, fix later',
          'Ask no questions and follow the crowd',
          'Report concerns only once you are completely sure',
        ],
        hint: 'It has four parts, and the last one is about speaking up quickly.',
        explanation:
          'Respect people, protect information, follow policies, and report concerns promptly. If you remember nothing else from this module, remember that.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 6. Business Units (draft structure; confirm with HR)              */
  /* ---------------------------------------------------------------- */
  {
    slug: 'business-units',
    title: 'Business Units',
    description: 'How LevelShift is organized, what each unit does, and how teams work together.',
    avatar: 'business',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'How We Are Organized',
        topic: 'overview',
        emotion: 'EXCITED',
        segs: [
          [
            "Hey, I'm Kabir! Let me show you how LevelShift is organized, and where you fit in.",
            'EXCITED',
            'WAVE',
          ],
          [
            'Our delivery work is organized into four business units: the Cloud Practice; Data, Analytics and Enterprise Integration; Microsoft Business Applications; and AI Transformation.',
            'FRIENDLY',
            'COUNT_THREE',
          ],
          [
            "We'll start with your own unit, then visit the others, so you get the full picture.",
            'CHEERFUL',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Cloud Practice',
        topic: 'bu-cloud-practice',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Our Cloud Practice lives in the Salesforce ecosystem. It is led by Selva Pandian, Managing Director of the Cloud Practice.',
            'FRIENDLY',
            'POINT_LEFT',
          ],
          [
            'The team delivers CRM consulting and implementation, Agentforce, Data Cloud, Sales Cloud, Service Cloud and Field Service solutions.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'It builds on our DemandBlue heritage, which made us a Summit-tier Salesforce partner.',
            'PROUD',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Data, Analytics & Enterprise Integration',
        topic: 'bu-data-analytics-ei',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Data, Analytics and Enterprise Integration is led by Kumar Vellore, who believes the future belongs to organizations that combine data, AI and human judgment.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            'The team modernizes data platforms, builds business intelligence and analytics, and puts data governance and cloud data architectures in place.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'It also connects business systems through API management, application integration, workflow automation and hybrid cloud integration.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Microsoft Business Applications',
        topic: 'bu-microsoft-business-applications',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Our Microsoft Business Applications team grew out of DemandDynamics, which brought us deep Microsoft expertise.',
            'FRIENDLY',
            'POINT_LEFT',
          ],
          [
            'It works with Dynamics 365, Power Platform and Azure-based solutions to modernize CRM and ERP, optimize business processes, and integrate enterprise applications for our customers.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'AI Transformation',
        topic: 'bu-ai-transformation',
        emotion: 'EXCITED',
        segs: [
          ['And AI Transformation runs through everything we do.', 'EXCITED', 'OPEN_ARMS'],
          [
            'The team delivers AI strategy and readiness assessments, machine learning and natural language solutions, and AI governance, security and responsible AI.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'Its goal is the same as our mission: helping customers become AI-native enterprises, with AI embedded across their core business functions.',
            'PROUD',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'How Teams Work Together',
        topic: 'how-teams-work-together',
        emotion: 'FRIENDLY',
        segs: [
          [
            'No unit works alone. A typical customer project brings business stakeholders, consultants, architects, engineers and customer success teams together around one customer goal.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Our business units are supported by Strategic Accounts, led by VT, and by company-wide functions: operations, technology, finance and compliance, and marketing, each led by a member of our leadership team.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            "So whichever unit you join, you'll work across teams, share what you know, and solve problems together. That's how we deliver one LevelShift to every customer.",
            'CHEERFUL',
            'THUMBS_UP',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'business-units' },
      {
        type: 'TRANSITION',
        segs: [
          ["That's the big picture. Anika will wrap things up for you.", 'CHEERFUL', 'POINT_RIGHT'],
        ],
      },
    ],
    questions: [
      {
        topic: 'business-units',
        text: 'Which practice focuses on the Salesforce ecosystem?',
        options: [
          'Cloud Practice',
          'Data, Analytics & Enterprise Integration',
          'Microsoft Business Applications',
          'AI Transformation',
        ],
        hint: 'Salesforce is delivered from the cloud.',
        explanation:
          'The Cloud Practice is our Salesforce home, covering Agentforce, Data Cloud, Sales Cloud, Service Cloud and Field Service.',
      },
      {
        topic: 'business-units',
        text: 'Which team works with Dynamics 365 and Power Platform?',
        options: [
          'Microsoft Business Applications',
          'Cloud Practice',
          'Data, Analytics & Enterprise Integration',
          'AI Transformation',
        ],
        hint: 'Both products are made by the same company, and the team is named after it.',
        explanation:
          'Dynamics 365 and Power Platform are Microsoft products, so they sit with our Microsoft Business Applications team.',
      },
      {
        topic: 'business-units',
        text: 'Which unit connects business systems through APIs and workflow automation?',
        options: [
          'Data, Analytics & Enterprise Integration',
          'Cloud Practice',
          'Microsoft Business Applications',
          'Strategic Accounts',
        ],
        hint: 'Connecting systems is called integration.',
        explanation:
          'Data, Analytics and Enterprise Integration modernizes data platforms and connects business systems through API management, application integration and workflow automation.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 7. Induction Conclusion                                           */
  /* ---------------------------------------------------------------- */
  {
    slug: 'induction-conclusion',
    title: 'Induction Conclusion',
    description: 'Recap, key takeaways, next steps and your feedback.',
    avatar: 'closing',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'You Made It',
        topic: 'recap',
        emotion: 'EXCITED',
        segs: [
          ["Congratulations! You've made it through the whole journey.", 'EXCITED', 'APPLAUD'],
          [
            "I'm Anika, and it's my job to wrap things up. Let's take a quick look back at everything you've covered.",
            'PROUD',
            'OPEN_ARMS',
          ],
          [
            'You learned who we are: a global AI transformation company, formed from PreludeSys, DemandBlue and DemandDynamics, helping enterprises become AI-native.',
            'NEUTRAL',
            'COUNT_ONE',
          ],
          [
            "You met our founders and leaders, and heard about their builder's mindset. And you discovered our culture: five values, seven everyday behaviours, and how we work together.",
            'FRIENDLY',
            'COUNT_TWO',
          ],
          [
            'You went through our policies and the compliance essentials, POSH, information security and data protection, and toured our business units.',
            'SERIOUS',
            'COUNT_THREE',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Key Takeaways',
        topic: 'takeaways',
        emotion: 'ENCOURAGING',
        segs: [
          ['If you remember just three things, make them these.', 'FRIENDLY', 'COUNT_THREE'],
          [
            'One: put customers first, and measure success by the outcomes they achieve.',
            'ENCOURAGING',
            'COUNT_ONE',
          ],
          [
            'Two: stay curious. Learn continuously, innovate boldly and collaborate deeply.',
            'HOPEFUL',
            'COUNT_TWO',
          ],
          [
            "Three: speak up early. Respect people, protect information, follow policies, and report concerns promptly, whether it's a project risk, a security threat or a colleague being treated badly.",
            'SERIOUS',
            'COUNT_THREE',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'takeaways' },
      {
        type: 'VIDEO',
        title: 'Next Steps',
        topic: 'next-steps',
        emotion: 'CHEERFUL',
        segs: [
          [
            'So what happens next? Your manager and HR will help you with team introductions and system access.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            'Take some time to read the official HR policy documents, and if you have questions about anything you saw today, just ask your manager or HR.',
            'FRIENDLY',
            'NOD',
          ],
          [
            'Before you go, please share your feedback on the next screen. It helps us improve this induction for everyone who joins after you.',
            'HOPEFUL',
            'HAND_ON_HEART',
          ],
          ["Once again, welcome to LevelShift. We're glad you're here.", 'CHEERFUL', 'WAVE'],
        ],
      },
    ],
    questions: [
      {
        topic: 'takeaways',
        text: 'You notice something that is not right: a project risk, a suspicious email, or a colleague being mistreated. What is the LevelShift way?',
        options: [
          'Speak up early and report it promptly',
          'Wait to see if someone else notices',
          'Deal with it only if it affects you',
          'Mention it at your next annual review',
        ],
        hint: 'It is the third key takeaway.',
        explanation:
          'Speak up early. Whether it is a risk, a threat or a person, raising it promptly is always the right call, and you are protected when you do.',
      },
      {
        topic: 'takeaways',
        text: 'Which line sums up our culture?',
        options: [
          'Learn continuously, innovate boldly, collaborate deeply, and deliver customer success',
          'Move fast and break things',
          'Work hard, keep quiet',
          'The customer is always wrong',
        ],
        hint: 'It starts with learning and ends with the customer.',
        explanation:
          'Learn continuously, innovate boldly, collaborate deeply, and deliver customer success. That is our culture in one line.',
      },
    ],
  },
];
