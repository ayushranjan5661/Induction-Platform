/**
 * Default induction content (used by the seed and by "Reset to default"), written from the source notes in /Data.
 * Company, founders, culture and business-unit facts come from levelshift.com (read 26 Nov 2026).
 *
 * Company content only - no real employee data. Wording and the business-unit
 * grouping are drafts that HR / Marketing must confirm before go-live.
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
  /** Fields left out (figure, build, bottom, colours) take the schema defaults. */
  appearance: Pick<
    AvatarAppearance,
    'skin' | 'hair' | 'hairStyle' | 'outfit' | 'shirt' | 'glasses' | 'beard' | 'earrings'
  > &
    Partial<AvatarAppearance>;
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
      character: '01-maya',
      skin: '#C68B5E',
      hair: '#2B1B12',
      hairStyle: 'long',
      top: 'jacket',
      bottom: 'skirt',
      pants: '#1F2A44',
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
      character: '02-arjun',
      skin: '#B9794C',
      hair: '#8A8F98',
      hairStyle: 'sidePart',
      top: 'shirt',
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
      character: '14-omar',
      skin: '#A86B43',
      hair: '#3A3A3A',
      hairStyle: 'short',
      top: 'sweater',
      build: 'broad',
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
      character: '07-amara',
      skin: '#E8B48C',
      hair: '#5B2C83',
      hairStyle: 'curly',
      top: 'tee',
      build: 'slim',
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
      character: '12-noah',
      skin: '#8D5A3B',
      hair: '#16110D',
      hairStyle: 'short',
      top: 'polo',
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
      character: '11-priya',
      skin: '#D9A066',
      hair: '#1C1410',
      hairStyle: 'bun',
      top: 'jacket',
      pants: '#2F3440',
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
      character: '06-mateo',
      skin: '#C98B5E',
      hair: '#1A1412',
      hairStyle: 'sidePart',
      top: 'vest',
      pants: '#6F8C9C',
      outfit: '#6F8C9C',
      shirt: '#EEDCA5',
      shoes: '#4A1F1F',
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
      character: '13-yuki',
      skin: '#7A4A2E',
      hair: '#0F0A07',
      hairStyle: 'bob',
      top: 'sweater',
      bottom: 'skirt',
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

/** Delivery teams, taken from the practices and services on levelshift.com. Confirm with HR. */
export const BUSINESS_UNITS = [
  {
    slug: 'cloud-practice',
    name: 'Cloud Practice',
    description:
      'Led by Selva Pandian. Cloud, data, AI and analytics, including enterprise-scale Salesforce implementations (Agentforce, Data Cloud, Field Service).',
  },
  {
    slug: 'data-analytics-ei',
    name: 'Data, Analytics & Enterprise Intelligence',
    description:
      'Led by Kumar Vellore. Data modernization, enterprise integration (Boomi, MuleSoft, Workato, Azure) and DevOps and test data management.',
  },
  {
    slug: 'microsoft-business-applications',
    name: 'Microsoft Business Applications',
    description:
      'Dynamics 365 ERP and CRM: advisory, migration, custom development and support. Grew out of DemandDynamics.',
  },
  {
    slug: 'ai-transformation',
    name: 'Enterprise AI',
    description:
      'Moves AI from pilot to production: AI strategy, architecture, governance, development and adoption, backed by 150+ pre-built agents.',
  },
  {
    slug: 'business-process-services',
    name: 'Business Process Services',
    description:
      'Led by Madhavi Parimelazhagan. AI and ML workflows with human review: medical records, leases, financial data, data management and contracts.',
  },
] as const;

export const MODULES: ModuleDef[] = [
  /* ---------------------------------------------------------------- */
  /* 1. Company Introduction (Data/Company, from levelshift.com)       */
  /* ---------------------------------------------------------------- */
  {
    slug: 'company-introduction',
    title: 'Company Introduction',
    description:
      'Who we are, what we deliver, the Living Enterprise and ShiftEVA, and the milestones that shaped LevelShift.',
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
            "You'll meet our founders and leaders, learn about our culture, go through the policies and compliance essentials every employee needs, and take a tour of our delivery teams.",
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
            'LevelShift is your AI transformation partner: a global technology solutions provider whose story began back in 1998.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'In 2025, we brought three companies, PreludeSys, DemandBlue and DemandDynamics, together under one brand, across Salesforce, Microsoft, Data and AI.',
            'PROUD',
            'COUNT_THREE',
          ],
          [
            'Our headquarters is in Irvine, California. We work through a global delivery model, and we hire in both the United States and India.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            "We bring more than twenty-seven years of experience, over three hundred customers trust us, and we've been certified as a Great Place to Work six years in a row, from 2021 to 2027.",
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
            'Our vision is to be the trusted strategic partner for organizations navigating their transformation journey, delivering tailored, future-ready technology solutions that drive business evolution.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'Our mission is to enable customers to become AI-native enterprises, by embedding AI across core business functions.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            'We treat AI transformation as a strategic choice. A customer can build on their existing digital foundations, reinvent as AI-native, or blend the two. We support them with industry-focused solutions, tailored roadmaps and AI Centers of Excellence.',
            'NEUTRAL',
            'COUNT_THREE',
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
        title: 'What We Deliver',
        topic: 'what-we-do',
        emotion: 'FRIENDLY',
        segs: [
          [
            'So what do we actually deliver? Our tagline says it best: AI-native enterprise solutions across data, integration and applications.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'First, Enterprise AI. We help customers move AI from pilot to production, with more than one hundred and fifty pre-built AI agents, and easy starting points like a ten-minute AI Maturity Assessment or a one-day Discovery Workshop.',
            'EXCITED',
            'COUNT_ONE',
          ],
          [
            'Second, Data Modernization, built on our own LevelShift Data Modernization Framework, with Foundation, Transformation and Activation layers, across Microsoft, Databricks and AWS.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Third, Enterprise Integration: connecting apps, unifying data and orchestrating workflows, on platforms such as Boomi, MuleSoft, Workato and Azure Integration.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'And fourth, Enterprise Applications, on Salesforce, Microsoft Dynamics 365 and SAP, covering front, middle and back-office processes.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'More Ways We Help',
        topic: 'what-we-do',
        emotion: 'EXCITED',
        segs: [
          ['We also offer two specialist services.', 'FRIENDLY', 'COUNT_TWO'],
          [
            'DevOps and Test Data Management: data privatization, synthetic test data and AI-powered automation, with our technology partner Perforce, including Delphix, BlazeMeter and Perfecto.',
            'NEUTRAL',
            'POINT_LEFT',
          ],
          [
            'And Business Process Services, where AI workflows and human review handle work such as medical record review, lease management, financial data processing and contract management.',
            'NEUTRAL',
            'POINT_RIGHT',
          ],
          [
            'Across all of this, we have more than five hundred certified experts in Salesforce, Microsoft, Boomi and AI.',
            'PROUD',
            'NOD',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'The Living Enterprise and ShiftEVA',
        topic: 'shifteva',
        emotion: 'EXCITED',
        segs: [
          [
            'Now let me tell you about our big idea: the Living Enterprise, and the platform behind it, ShiftEVA.',
            'EXCITED',
            'SHOW_FRONT',
          ],
          [
            'A Living Enterprise is one that senses, learns and evolves. ShiftEVA, our transformation platform, gets there in three steps.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'Reimagine for autonomy. Observe through unified telemetry. And learn from a feedback loop. The result is an enterprise built to evolve.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'That means lower decision latency, which simply means faster decisions, less friction, more autonomy, and continuous learning. And most importantly, humans stay in control.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'shifteva' },
      {
        type: 'VIDEO',
        title: 'Recognition and Partners',
        topic: 'what-we-do',
        emotion: 'PROUD',
        segs: [
          ['So how do others see us?', 'FRIENDLY', 'THINK'],
          [
            'Forrester named us in its Salesforce Consulting Services Landscape, for Agentforce, Data Cloud and Field Service. And ISG featured us in its Provider Lens, for our Salesforce capabilities and client satisfaction.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            "We were named Perforce Partner of the Year. We're a Salesforce Summit Partner, a Microsoft Solutions Partner and a Microsoft Fabric Featured Partner, and we hold SOC 2 certification.",
            'PROUD',
            'COUNT_THREE',
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
            'Let me take you through our journey. It began in 1998 with PreludeSys, focused on enterprise systems, managed IT and digital operations. That is where it all began.',
            'HOPEFUL',
            'POINT_LEFT',
          ],
          [
            'In 2012, we expanded into Salesforce with DemandBlue, which grew to become a Summit-tier Salesforce partner.',
            'PROUD',
            'COUNT_TWO',
          ],
          [
            'In 2020, DemandDynamics took us into Microsoft, with Dynamics 365 services.',
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
            'From 2021 to 2027, we have been certified as a Great Place to Work six years in a row.',
            'PROUD',
            'APPLAUD',
          ],
          [
            'Then, in 2025, came the next chapter. PreludeSys, DemandBlue and DemandDynamics became one brand: LevelShift.',
            'EXCITED',
            'OPEN_ARMS',
          ],
          [
            'One brand across Salesforce, Microsoft, Data and AI, and one partner for our customers.',
            'PROUD',
            'COUNT_THREE',
          ],
          [
            "Today, more than three hundred organizations around the world trust us to help them become AI-native. And now, you're part of that story.",
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
            "You now know who we are and where we came from. Next, you'll hear from our founders and meet our leadership team!",
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
          'PreludeSys, ShiftEVA and Boomi',
          'DemandBlue, Agentforce and Data Cloud',
          'DemandDynamics, PowerShift and BlueSys',
        ],
        hint: "Two of the three names begin with the word 'Demand'.",
        explanation:
          'LevelShift unites PreludeSys, DemandBlue and DemandDynamics: enterprise systems, Salesforce and Microsoft, now one brand.',
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
          'Our mission is to enable customers to become AI-native enterprises by embedding AI across core business functions.',
      },
      {
        topic: 'what-we-do',
        text: 'Which of these is one of the services LevelShift delivers?',
        options: [
          'Data Modernization',
          'Hardware manufacturing',
          'Retail banking',
          'Logistics and shipping',
        ],
        hint: 'Our tagline: AI-native enterprise solutions across data, integration and applications.',
        explanation:
          'We deliver Enterprise AI, Data Modernization, Enterprise Integration and Enterprise Applications, plus DevOps and Test Data Management and Business Process Services.',
      },
      {
        topic: 'what-we-do',
        text: 'Which company named LevelShift its Partner of the Year?',
        options: ['Perforce', 'Forrester', 'ISG', 'Gartner'],
        hint: 'It is our technology partner for DevOps and test data, the maker of Delphix.',
        explanation:
          'Perforce named us Partner of the Year for delivery quality across DevOps and data platforms. Forrester and ISG are analyst firms that featured us in their reports.',
      },
      {
        topic: 'what-we-do',
        text: 'Roughly how many certified experts does LevelShift have?',
        options: ['More than 500', 'About 10', 'About 50', 'None'],
        hint: 'It is in the hundreds, across Salesforce, Microsoft, Boomi and AI.',
        explanation:
          'LevelShift has more than five hundred certified experts across Salesforce, Microsoft, Boomi and AI.',
      },
      {
        topic: 'shifteva',
        text: 'In a Living Enterprise built with ShiftEVA, who stays in control?',
        options: [
          'Humans',
          'The AI model itself',
          'An external vendor',
          'Nobody: it is fully automatic',
        ],
        hint: 'AI assists, but who decides?',
        explanation:
          'Humans stay in control. The Living Enterprise speeds up decisions and learns continuously, but people stay in charge.',
      },
      {
        topic: 'shifteva',
        text: 'How does LevelShift describe a Living Enterprise?',
        options: [
          'One that senses, learns and evolves',
          'One that never changes its processes',
          'One that is fully outsourced',
          'One that runs without any feedback',
        ],
        hint: 'Think of something alive.',
        explanation:
          'A Living Enterprise senses, learns and evolves. ShiftEVA gets there by reimagining for autonomy, observing through unified telemetry and learning from a feedback loop.',
      },
      {
        topic: 'shifteva',
        text: 'Which of these is one of the three ShiftEVA steps?',
        options: [
          'Observe through unified telemetry',
          'Remove people from every decision',
          'Freeze all processes',
          'Outsource the feedback loop',
        ],
        hint: 'The three steps are reimagine, observe and learn.',
        explanation:
          'ShiftEVA works in three steps: reimagine for autonomy, observe through unified telemetry, and learn from a feedback loop.',
      },
      {
        topic: 'milestones',
        text: 'In which year was the unified LevelShift brand launched?',
        options: ['2025', '1998', '2012', '2020'],
        hint: 'It is the most recent milestone on our timeline.',
        explanation:
          'The story runs 1998, 2012, 2020, and then 2025, the next chapter, when PreludeSys, DemandBlue and DemandDynamics became one brand: LevelShift.',
      },
      {
        topic: 'milestones',
        text: 'What did DemandBlue, launched in 2012, focus on?',
        options: [
          'Salesforce',
          'Microsoft Dynamics 365',
          'Managed IT services',
          'Hardware manufacturing',
        ],
        hint: 'Think CRM, and a partner tier called Summit.',
        explanation:
          'DemandBlue took us into Salesforce and grew into a Summit-tier Salesforce partner. Blue, like the Salesforce cloud, is an easy way to remember it.',
      },
      {
        topic: 'milestones',
        text: 'Which company was founded first, in 1998?',
        options: ['PreludeSys', 'DemandBlue', 'DemandDynamics', 'LevelShift'],
        hint: "Its name suggests it's the opening of the story.",
        explanation:
          'PreludeSys came first, in 1998: "where it all began." A prelude is the opening of a piece of music.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 2. Founders' Introduction (Data/Founders, from levelshift.com)    */
  /* ---------------------------------------------------------------- */
  {
    slug: 'founders-introduction',
    title: "Founders' Introduction",
    description:
      'Meet our founders and leadership team: what they believe, how they grew with the company, and where we are going.',
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
            'Our story began in 1998 as PreludeSys, working on enterprise systems, managed IT and digital operations. Today, that same story continues as LevelShift, your AI transformation partner.',
            'PROUD',
            'SHOW_FRONT',
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
            "And I'm Ramki Ramakrishnen, one of our founders. Welcome! I'm so glad you're here.",
            'CHEERFUL',
            'WAVE',
          ],
          [
            "In this module, we'll share our mission and vision, what our leaders believe, and introduce you to the team that guides LevelShift today.",
            'FRIENDLY',
            'OPEN_ARMS',
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
            'Our mission is to enable customers to become AI-native enterprises, by embedding AI across core business functions.',
            'SERIOUS',
            'SHOW_FRONT',
          ],
          [
            'Our vision is to be the trusted strategic partner for organizations navigating their transformation journey, delivering tailored, future-ready technology solutions that drive business evolution.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'And we build all of it on one principle: people first, with humans always in control of AI.',
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'What Our Leaders Believe',
        topic: 'vision',
        emotion: 'FRIENDLY',
        avatar: 'founderRamki',
        segs: [
          [
            "Let me share five beliefs you'll hear from our leaders, in their own words.",
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'One: people define the value. As our CEO, Kiran Babu Chandra, puts it: technology defines the era, but people define the value.',
            'PROUD',
            'COUNT_ONE',
          ],
          [
            'Two: repeatable excellence. Our COO, Chandramohan Parlapalli, says scale is earned through repeatable excellence: disciplined processes, data-driven decisions and accountable ownership.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'Three: AI as an enabler, not a replacement. Our CTO, Manoj Chandra, reminds us that the real advantage lies in understanding AI deeply and keeping control.',
            'HOPEFUL',
            'COUNT_THREE',
          ],
          [
            'Four: discipline and trust. Our CFO, Rangesh Rajaram, asks us to secure data and use it with discipline and trust. And five: data comes first. Kumar Vellore says the integrity of your data decides the quality of your AI outcomes.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'founders' },
      {
        type: 'VIDEO',
        title: 'Growing with Our People',
        topic: 'growth-story',
        emotion: 'PROUD',
        avatar: 'founderRaj',
        segs: [
          [
            'Many of our leaders have grown with this company for more than two decades.',
            'PROUD',
            'NOD',
          ],
          [
            'Manoj Chandra, Rangesh Rajaram and Selva Pandian have been with us since 2000, and Chandramohan Parlapalli and Muthukumar Ramalingam since 2001.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'Muthu, our Chief Marketing Officer, has worked across software development, delivery, operations, quality and marketing. Careers like his show that we develop talent from within.',
            'HOPEFUL',
            'HAND_ON_HEART',
          ],
          [
            'And Selva Pandian was one of the founding members of our On Demand Services model, a new way of giving customers flexible access to expert help.',
            'NEUTRAL',
            'POINT_RIGHT',
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
            'Here is the team that guides LevelShift today. Many bring more than twenty-five years of experience, with organizations such as Microsoft, Intel, IBM FileNET, EDS, Capgemini and BearingPoint.',
            'PROUD',
            'SHOW_FRONT',
          ],
          [
            'Kiran Babu Chandra, our Chief Executive Officer, guides our strategic direction and growth. Chandramohan Parlapalli, our Chief Operating Officer, turns strategy into execution at scale.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Manoj Chandra, our Chief Technology Officer, leads technology innovation and delivery strategy. Rangesh Rajaram, our Chief Financial Officer, oversees finance, compliance, vendor management and administration.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'Muthukumar Ramalingam, our Chief Marketing Officer, leads marketing. Selva Pandian is Managing Director of our Cloud Practice, and Kumar Vellore is Managing Director of Data, Analytics and Enterprise Intelligence.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            "Thiyagarajan Velayutham is our Senior Vice President for Strategic Accounts. And Raj and I are proud to be among the founders. You'll likely meet many of them soon.",
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
            'Looking ahead, we are building the Living Enterprise: helping customers become AI-native, with humans always in control.',
            'HOPEFUL',
            'POINT_RIGHT',
          ],
          [
            "So what does this mean for you? You're joining a company that puts people first and grows its leaders from within.",
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Our ask of you is simple. Keep learning, own your work, and use AI as an enabler, never as a replacement for good judgment.',
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
        text: 'Our CEO says "technology defines the era, but..." what defines the value?',
        options: ['People', 'Technology on its own', 'Budgets', 'Market share'],
        hint: 'It is the same thing our culture puts first.',
        explanation:
          'People define the value. Kiran Babu Chandra believes people drive transformation, which is why we invest in developing future leaders.',
      },
      {
        topic: 'founders',
        text: 'How does our CTO, Manoj Chandra, say AI should be used?',
        options: [
          'As an enabler, not a replacement',
          'As a full replacement for people',
          'Only for marketing',
          'Not at all',
        ],
        hint: 'He talks about understanding AI deeply and keeping control.',
        explanation:
          'AI is an enabler, not a replacement. The real advantage lies in understanding it deeply and keeping control.',
      },
      {
        topic: 'founders',
        text: 'According to our COO, what is scale earned through?',
        options: [
          'Repeatable excellence',
          'Working longer hours',
          'Hiring as fast as possible',
          'Luck',
        ],
        hint: 'Disciplined processes, data-driven decisions and accountable ownership.',
        explanation:
          'Scale is earned through repeatable excellence: disciplined processes, data-driven decisions, accountable ownership, and teams confident in the process and the AI behind it.',
      },
      {
        topic: 'growth',
        text: 'Selva Pandian was a founding member of which LevelShift service model?',
        options: [
          'On Demand Services',
          'Pay Per Ticket',
          'Fixed Bench Staffing',
          'Offshore-Only Delivery',
        ],
        hint: 'The name says customers get help exactly when they ask for it.',
        explanation:
          'On Demand Services gives customers flexible access to expert help, a bit like streaming a film instead of buying the whole cinema.',
      },
      {
        topic: 'growth',
        text: 'Most of our leaders joined in 2000 or 2001 and grew with the company. What does that show?',
        options: [
          'We develop talent from within',
          'We only hire senior leaders from outside',
          'People must stay in one role for their whole career',
          'Marketing is the only path to leadership',
        ],
        hint: 'Muthu worked across development, delivery, operations, quality and marketing before becoming CMO.',
        explanation:
          'We develop talent from within. Many of our leaders have grown with LevelShift for more than two decades, often across several roles.',
      },
      {
        topic: 'growth',
        text: "Who is LevelShift's Chief Executive Officer?",
        options: ['Kiran Babu Chandra', 'Manoj Chandra', 'Rangesh Rajaram', 'Kumar Vellore'],
        hint: 'He believes technology defines the era, but people define the value.',
        explanation:
          'Kiran Babu Chandra is our CEO. Manoj Chandra is CTO, Rangesh Rajaram is CFO, and Kumar Vellore leads Data, Analytics and Enterprise Intelligence.',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 3. Company Culture (Data/Culture, from levelshift.com)            */
  /* ---------------------------------------------------------------- */
  {
    slug: 'company-culture',
    title: 'Company Culture',
    description: 'Shifters, our values, the Living Enterprise mindset, and how we learn and grow.',
    avatar: 'culture',
    requiresAcknowledgment: false,
    steps: [
      {
        type: 'VIDEO',
        title: 'We Are Shifters',
        topic: 'culture-overview',
        emotion: 'CHEERFUL',
        segs: [
          ["Hi! I'm Zara, and I get the fun part: our culture.", 'CHEERFUL', 'WAVE'],
          [
            "At LevelShift, we call ourselves Shifters: people who find opportunity where others don't.",
            'EXCITED',
            'OPEN_ARMS',
          ],
          [
            'We value people for their talent, their personality and competence, and their ability to learn and grow. Our whole culture rests on one belief: the belief in people and performance.',
            'PROUD',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'A Great Place to Work',
        topic: 'culture-overview',
        emotion: 'PROUD',
        segs: [
          [
            'And it shows. LevelShift has been certified as a Great Place to Work six years in a row, from 2021 to 2027.',
            'PROUD',
            'APPLAUD',
          ],
          [
            "Our HR leadership calls respect for people a core operating principle. It's how we treat customers, colleagues and everyone in between.",
            'EMPATHETIC',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Our Values',
        topic: 'values',
        emotion: 'FRIENDLY',
        segs: [
          [
            "Our values come straight from our leaders' own words. Here are the first four.",
            'FRIENDLY',
            'SHOW_FRONT',
          ],
          [
            'People first: technology defines the era, but people define the value.',
            'PROUD',
            'COUNT_ONE',
          ],
          [
            'Repeatable excellence: disciplined processes, data-driven decisions and accountable ownership.',
            'SERIOUS',
            'COUNT_TWO',
          ],
          [
            'Humans in control of AI: understand AI deeply, and use it as an enabler, never a replacement.',
            'HOPEFUL',
            'COUNT_THREE',
          ],
          [
            'And discipline and trust: protect data, and use it responsibly.',
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Three More Values',
        topic: 'values',
        emotion: 'EXCITED',
        segs: [
          [
            'Customer intent: stay attuned to what customers need, with the right context at the right time, so every interaction is relevant and meaningful.',
            'FRIENDLY',
            'COUNT_ONE',
          ],
          [
            "An AI-first mindset: AI isn't just a shift in technology, it's a shift in mindset. Align teams early, and rethink how services are delivered.",
            'EXCITED',
            'COUNT_TWO',
          ],
          ['And data integrity: good AI starts with trustworthy data.', 'NEUTRAL', 'COUNT_THREE'],
        ],
      },
      { type: 'QUESTION', pool: 'values' },
      {
        type: 'VIDEO',
        title: 'The Living Enterprise Mindset',
        topic: 'living-enterprise',
        emotion: 'HOPEFUL',
        segs: [
          [
            'We help customers build a Living Enterprise, one that senses, learns and evolves. And we try to work the same way ourselves.',
            'HOPEFUL',
            'OPEN_ARMS',
          ],
          [
            'That means deciding and acting quickly, removing the friction that slows teams down, and trusting people to own their work.',
            'ENCOURAGING',
            'COUNT_THREE',
          ],
          [
            "It means learning from every feedback loop. And it means humans stay in control: AI supports people, it doesn't replace their judgment.",
            'SERIOUS',
            'HAND_ON_HEART',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'living-enterprise' },
      {
        type: 'VIDEO',
        title: 'Learning and Growth',
        topic: 'growth',
        emotion: 'HOPEFUL',
        segs: [
          [
            'We grow people from within. Most of our leaders joined in 2000 or 2001 and grew with the company, often working across several roles.',
            'PROUD',
            'NOD',
          ],
          [
            'Certifications matter here. We have more than five hundred certified experts across Salesforce, Microsoft, Boomi and AI, including Microsoft Fabric and Perforce Delphix specialists.',
            'HOPEFUL',
            'SHOW_FRONT',
          ],
          [
            'And you can learn from our Centres of Excellence in AI, Integration and Test Data Management.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Stay Safe: Recruitment Fraud',
        topic: 'growth',
        emotion: 'SERIOUS',
        segs: [
          [
            'One practical tip before I go. Watch out for fake job offers that use our name.',
            'SERIOUS',
            'THINK',
          ],
          [
            'Our recruiters only use levelshift.com email addresses, and LevelShift never asks for fees during hiring. If something looks off, check with joinus at levelshift dot com.',
            'SERIOUS',
            'COUNT_TWO',
          ],
        ],
      },
      { type: 'QUESTION', pool: 'growth' },
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
            'People first, humans in control, and an enterprise built to evolve.',
            'PROUD',
            'HAND_ON_HEART',
          ],
          ["And now it's yours too!", 'CHEERFUL', 'THUMBS_UP'],
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
        text: 'What do LevelShift people call themselves?',
        options: ['Shifters', 'Levelers', 'Movers', 'Builders'],
        hint: 'It comes from the second half of our company name.',
        explanation: "We're Shifters: people who find opportunity where others don't.",
      },
      {
        topic: 'values',
        text: 'What belief does our culture rest on?',
        options: [
          'The belief in people and performance',
          'Seniority above everything',
          'Technology before people',
          'Speed at any cost',
        ],
        hint: 'It pairs who we are with what we deliver.',
        explanation:
          'Our culture rests on the belief in people and performance. We value talent, personality, competence and the ability to learn and grow.',
      },
      {
        topic: 'values',
        text: 'Which value says AI should be an enabler, never a replacement?',
        options: [
          'Humans in control of AI',
          'Repeatable excellence',
          'Customer intent',
          'Data integrity',
        ],
        hint: 'It is about who makes the final call.',
        explanation:
          'Humans in control of AI: understand AI deeply and use it as an enabler, never a replacement.',
      },
      {
        topic: 'values',
        text: 'How many years in a row has LevelShift been certified as a Great Place to Work?',
        options: ['Six (2021 to 2027)', 'One', 'Two', 'Ten'],
        hint: 'Count from 2021 to 2027 on the certificates.',
        explanation:
          'Six years in a row, from 2021 to 2027. Our HR leadership calls respect for people a core operating principle.',
      },
      {
        topic: 'living-enterprise',
        text: 'How do we describe a Living Enterprise?',
        options: [
          'One that senses, learns and evolves',
          'One that never changes',
          'One where AI makes every decision',
          'One that works without feedback',
        ],
        hint: 'Think of something alive.',
        explanation:
          'A Living Enterprise senses, learns and evolves, and we try to work that way ourselves.',
      },
      {
        topic: 'living-enterprise',
        text: 'In the Living Enterprise mindset, what is the role of AI?',
        options: [
          "It supports people; it doesn't replace their judgment",
          'It replaces people entirely',
          'It is never used',
          'It makes every decision without review',
        ],
        hint: 'Humans stay in control.',
        explanation:
          "AI supports people; it doesn't replace their judgment. Humans stay in control.",
      },
      {
        topic: 'growth',
        text: 'A "recruiter" emails a friend from a personal email address and asks for a fee to process a LevelShift offer. What should they do?',
        options: [
          'Treat it as fraud and check with joinus@levelshift.com',
          'Pay the fee quickly so the offer is not lost',
          'Reply with their bank details',
          'Forward the fee to HR later',
        ],
        hint: 'Our recruiters only use one email domain, and they never ask for fees.',
        explanation:
          'It is fraud. LevelShift recruiters only use @levelshift.com addresses and never ask for fees. Check with joinus@levelshift.com.',
      },
      {
        topic: 'growth',
        text: 'Roughly how many certified experts does LevelShift have across Salesforce, Microsoft, Boomi and AI?',
        options: ['More than 500', 'About 10', 'About 50', 'None'],
        hint: 'It is in the hundreds.',
        explanation:
          'More than five hundred. Certifications are a big part of how Shifters learn and grow.',
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
  /* 6. Business Units (practices and services on levelshift.com)      */
  /* ---------------------------------------------------------------- */
  {
    slug: 'business-units',
    title: 'Business Units',
    description:
      'How our delivery teams are organized, what each one does, and how teams work together.',
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
            "Hey, I'm Kabir! Let me show you how our delivery teams are organized, and where you fit in.",
            'EXCITED',
            'WAVE',
          ],
          [
            'We will visit five areas: the Cloud Practice; Data, Analytics and Enterprise Intelligence; Microsoft Business Applications; Enterprise AI; and Business Process Services.',
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
            'The Cloud Practice is led by Selva Pandian. It helps organizations use cloud, data, AI and analytics to solve complex business problems.',
            'FRIENDLY',
            'POINT_LEFT',
          ],
          [
            'Its work includes enterprise-scale Salesforce implementations, with Agentforce, Data Cloud and Field Service, building on our DemandBlue heritage as a Salesforce Summit Partner.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
          [
            'Selva was a founding member of our On Demand Services model, and he believes technology works best when it is designed with people in mind.',
            'PROUD',
            'THUMBS_UP',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Data, Analytics & Enterprise Intelligence',
        topic: 'bu-data-analytics-ei',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Data, Analytics and Enterprise Intelligence is led by Kumar Vellore, who believes the future belongs to organizations that combine data, AI and human judgment.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            'The team modernizes data platforms with our LevelShift Data Modernization Framework, and connects systems through enterprise integration on Boomi, MuleSoft, Workato and Azure.',
            'NEUTRAL',
            'COUNT_TWO',
          ],
          [
            'It also covers DevOps and Test Data Management with Perforce Delphix. We are a Microsoft Fabric Featured Partner and a strategic Databricks partner.',
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
            'Our Microsoft Business Applications team grew out of DemandDynamics, which took us into Microsoft in 2020.',
            'FRIENDLY',
            'POINT_LEFT',
          ],
          [
            'It works with Dynamics 365 for ERP and CRM, covering advisory, migration, custom development and support. We are a Microsoft Solutions Partner.',
            'NEUTRAL',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Enterprise AI',
        topic: 'bu-ai-transformation',
        emotion: 'EXCITED',
        segs: [
          ['And Enterprise AI runs through everything we do.', 'EXCITED', 'OPEN_ARMS'],
          [
            'The team helps customers move AI from pilot to production, across six disciplines: AI strategy, AI architecture, data governance for AI, data and platform engineering, AI development, and change management and adoption.',
            'NEUTRAL',
            'COUNT_THREE',
          ],
          [
            'Its AI Center of Excellence offers more than one hundred and fifty pre-built agents, so customers can get value quickly.',
            'PROUD',
            'SHOW_FRONT',
          ],
        ],
      },
      {
        type: 'VIDEO',
        title: 'Business Process Services',
        topic: 'bu-business-process-services',
        emotion: 'FRIENDLY',
        segs: [
          [
            'Business Process Services is led by Madhavi Parimelazhagan, our Director of KPO Operations.',
            'FRIENDLY',
            'POINT_RIGHT',
          ],
          [
            'The team combines AI and machine learning workflows with human review, for medical record review, lease management, financial data processing, data management and contract management.',
            'NEUTRAL',
            'COUNT_THREE',
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
            'No unit works alone. A typical customer project brings consultants, architects, engineers and delivery teams together around one customer goal.',
            'FRIENDLY',
            'OPEN_ARMS',
          ],
          [
            'Our units are supported by Strategic Accounts, led by Thiyagarajan Velayutham, and by company-wide functions: operations, technology, finance and compliance, and marketing, each led by a member of our leadership team.',
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
        text: 'Which team delivers enterprise-scale Salesforce implementations?',
        options: [
          'Cloud Practice',
          'Data, Analytics & Enterprise Intelligence',
          'Microsoft Business Applications',
          'Business Process Services',
        ],
        hint: 'It is led by Selva Pandian.',
        explanation:
          'The Cloud Practice, led by Selva Pandian, delivers enterprise-scale Salesforce work with Agentforce, Data Cloud and Field Service.',
      },
      {
        topic: 'business-units',
        text: 'Which team works with Dynamics 365?',
        options: [
          'Microsoft Business Applications',
          'Cloud Practice',
          'Data, Analytics & Enterprise Intelligence',
          'Enterprise AI',
        ],
        hint: 'The product is made by the company the team is named after.',
        explanation:
          'Dynamics 365 is a Microsoft product, so it sits with our Microsoft Business Applications team, which grew out of DemandDynamics.',
      },
      {
        topic: 'business-units',
        text: 'Which team covers data modernization and enterprise integration?',
        options: [
          'Data, Analytics & Enterprise Intelligence',
          'Cloud Practice',
          'Microsoft Business Applications',
          'Strategic Accounts',
        ],
        hint: 'It is led by Kumar Vellore.',
        explanation:
          'Data, Analytics and Enterprise Intelligence, led by Kumar Vellore, covers data modernization, enterprise integration, and DevOps and test data management.',
      },
      {
        topic: 'business-units',
        text: 'Which team handles medical record review and lease management?',
        options: [
          'Business Process Services',
          'Enterprise AI',
          'Cloud Practice',
          'Microsoft Business Applications',
        ],
        hint: 'It combines AI workflows with human review, and is led by our Director of KPO Operations.',
        explanation:
          'Business Process Services, led by Madhavi Parimelazhagan, uses AI workflows with human review for medical records, leases, financial data, data management and contracts.',
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
            'You learned who we are: your AI transformation partner, formed from PreludeSys, DemandBlue and DemandDynamics, helping enterprises become AI-native.',
            'NEUTRAL',
            'COUNT_ONE',
          ],
          [
            'You met our founders and leadership team, and heard what they believe. And you discovered our culture: Shifters, people first, and humans in control of AI.',
            'FRIENDLY',
            'COUNT_TWO',
          ],
          [
            'You went through our policies and the compliance essentials, POSH, information security and data protection, and toured our delivery teams.',
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
            'One: people first. Technology defines the era, but people define the value.',
            'ENCOURAGING',
            'COUNT_ONE',
          ],
          [
            'Two: keep humans in control. Use AI as an enabler, never a replacement, and keep learning.',
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
          'People first, humans in control, and an enterprise built to evolve',
          'Move fast and break things',
          'Work hard, keep quiet',
          'Technology first, people later',
        ],
        hint: 'It starts with people.',
        explanation:
          'People first, humans in control, and an enterprise built to evolve. That is our culture in one line.',
      },
    ],
  },
];
