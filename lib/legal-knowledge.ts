// Legal Knowledge Base — shared between client and server

/**
 * JusticeAI Legal Knowledge Base
 * Curated Indian legal provisions for RAG (Retrieval Augmented Generation).
 * This provides grounded context to the LLM to reduce hallucinations.
 */

export interface LegalProvision {
  id: string;
  topic_keywords: string[];
  law_name: string;
  section: string;
  summary: string;
  indiankanoon_url: string;
}

const LEGAL_KNOWLEDGE_BASE: LegalProvision[] = [
  {
    id: 'ipc_302',
    topic_keywords: ['murder', 'killing', 'homicide', 'death', 'हत्या'],
    law_name: 'Indian Penal Code, 1860',
    section: 'Section 302',
    summary: 'Punishment for murder. Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1560742/',
  },
  {
    id: 'ipc_420',
    topic_keywords: ['fraud', 'cheating', 'scam', 'dishonesty', 'cheat', 'धोखाधड़ी'],
    law_name: 'Indian Penal Code, 1860',
    section: 'Section 420',
    summary: 'Cheating and dishonestly inducing delivery of property. Punishment up to 7 years imprisonment and fine.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1306824/',
  },
  {
    id: 'ipc_498a',
    topic_keywords: ['dowry', 'cruelty', 'wife', 'husband', 'domestic violence', 'marriage', 'दहेज', 'घरेलू हिंसा'],
    law_name: 'Indian Penal Code, 1860',
    section: 'Section 498A',
    summary: 'Husband or relative of husband of a woman subjecting her to cruelty. Punishment up to 3 years and fine.',
    indiankanoon_url: 'https://indiankanoon.org/doc/538436/',
  },
  {
    id: 'ipc_376',
    topic_keywords: ['rape', 'sexual assault', 'sexual violence', 'बलात्कार'],
    law_name: 'Indian Penal Code, 1860',
    section: 'Section 376',
    summary: 'Punishment for rape. Rigorous imprisonment for not less than 10 years, which may extend to imprisonment for life, and fine.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1279834/',
  },
  {
    id: 'ipc_304b',
    topic_keywords: ['dowry death', 'bride burning', 'दहेज मृत्यु'],
    law_name: 'Indian Penal Code, 1860',
    section: 'Section 304B',
    summary: 'Dowry death. Where the death of a woman is caused by burns or bodily injury within 7 years of marriage under dowry circumstances.',
    indiankanoon_url: 'https://indiankanoon.org/doc/653797/',
  },
  {
    id: 'cpa_2019',
    topic_keywords: ['consumer', 'product', 'defective', 'complaint', 'refund', 'warranty', 'उपभोक्ता', 'शिकायत'],
    law_name: 'Consumer Protection Act, 2019',
    section: 'Sections 34-37',
    summary: 'Consumers can file complaints for defective goods, deficient services, unfair trade practices, or misleading advertisements. District, State, and National Commissions handle disputes.',
    indiankanoon_url: 'https://indiankanoon.org/doc/110359706/',
  },
  {
    id: 'rent_control',
    topic_keywords: ['rent', 'tenant', 'landlord', 'eviction', 'lease', 'rental', 'किराया', 'मकान मालिक', 'किरायेदार'],
    law_name: 'Transfer of Property Act, 1882 / State Rent Control Acts',
    section: 'Section 106-111 (TPA)',
    summary: 'Governs landlord-tenant relationships. Tenants cannot be evicted without due notice. Notice period for month-to-month tenancy is 15 days. State-specific rent control laws provide additional protections.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1920037/',
  },
  {
    id: 'dv_act',
    topic_keywords: ['domestic violence', 'protection order', 'wife', 'abuse', 'घरेलू हिंसा', 'संरक्षण'],
    law_name: 'Protection of Women from Domestic Violence Act, 2005',
    section: 'Section 12',
    summary: 'Aggrieved person can file application to Magistrate for relief including protection orders, residence orders, monetary relief, and custody orders.',
    indiankanoon_url: 'https://indiankanoon.org/doc/542601/',
  },
  {
    id: 'rti_act',
    topic_keywords: ['rti', 'right to information', 'government', 'transparency', 'public authority', 'सूचना का अधिकार'],
    law_name: 'Right to Information Act, 2005',
    section: 'Section 6',
    summary: 'Any citizen can request information from public authorities. Request must be responded to within 30 days. Nominal fee of ₹10 for application.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1965344/',
  },
  {
    id: 'labor_wages',
    topic_keywords: ['wages', 'salary', 'minimum wage', 'payment', 'employer', 'worker', 'labour', 'labor', 'वेतन', 'मजदूरी'],
    law_name: 'Code on Wages, 2019',
    section: 'Sections 3-8',
    summary: 'Establishes minimum wages, timely payment of wages, and equal remuneration. Employers must pay wages before the 7th of each month. Penalties for delayed payment.',
    indiankanoon_url: 'https://indiankanoon.org/doc/80400/',
  },
  {
    id: 'bail',
    topic_keywords: ['bail', 'arrest', 'police', 'custody', 'fir', 'जमानत', 'गिरफ्तारी'],
    law_name: 'Code of Criminal Procedure, 1973',
    section: 'Sections 436-439',
    summary: 'Bail provisions. Bailable offences: bail as a matter of right. Non-bailable offences: court discretion. Anticipatory bail under Section 438.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1783708/',
  },
  {
    id: 'fir',
    topic_keywords: ['fir', 'police complaint', 'first information report', 'police station', 'एफआईआर', 'पुलिस'],
    law_name: 'Code of Criminal Procedure, 1973',
    section: 'Section 154',
    summary: 'FIR must be registered by police for cognizable offences. Refusal to register FIR is punishable. Zero FIR can be filed at any police station regardless of jurisdiction.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1980578/',
  },
  {
    id: 'property_dispute',
    topic_keywords: ['property', 'land', 'inheritance', 'succession', 'will', 'ancestral', 'संपत्ति', 'विरासत', 'जमीन'],
    law_name: 'Hindu Succession Act, 1956 / Indian Succession Act, 1925',
    section: 'Section 6 (HSA)',
    summary: 'Daughters have equal coparcenary rights in ancestral property (2005 Amendment). Self-acquired property can be willed freely. Intestate succession follows prescribed rules.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1253110/',
  },
  {
    id: 'divorce',
    topic_keywords: ['divorce', 'separation', 'marriage', 'alimony', 'maintenance', 'तलाक', 'भरण-पोषण'],
    law_name: 'Hindu Marriage Act, 1955',
    section: 'Section 13',
    summary: 'Grounds for divorce include cruelty, desertion (2+ years), conversion, unsoundness of mind, and mutual consent (Section 13B). Maintenance under Section 25.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1392051/',
  },
  {
    id: 'cyber_crime',
    topic_keywords: ['cyber', 'online', 'hacking', 'internet', 'data', 'privacy', 'identity theft', 'साइबर अपराध'],
    law_name: 'Information Technology Act, 2000',
    section: 'Sections 43, 66, 66C, 66D',
    summary: 'Addresses hacking (Sec 66), identity theft (Sec 66C), cheating by personation using computer resource (Sec 66D). Compensation and imprisonment provisions.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1439440/',
  },
  {
    id: 'sc_st_act',
    topic_keywords: ['caste', 'discrimination', 'sc', 'st', 'scheduled caste', 'scheduled tribe', 'atrocity', 'जाति', 'भेदभाव'],
    law_name: 'SC/ST (Prevention of Atrocities) Act, 1989',
    section: 'Section 3',
    summary: 'Prevents atrocities against Scheduled Castes and Scheduled Tribes. Offences include forced labor, denial of access, sexual exploitation of SC/ST women. Non-bailable and non-compoundable.',
    indiankanoon_url: 'https://indiankanoon.org/doc/700906/',
  },
  {
    id: 'motor_accident',
    topic_keywords: ['accident', 'motor', 'vehicle', 'insurance', 'compensation', 'road', 'दुर्घटना', 'वाहन'],
    law_name: 'Motor Vehicles Act, 1988',
    section: 'Section 166',
    summary: 'Victims of motor accidents can claim compensation from Motor Accident Claims Tribunal (MACT). No-fault liability under Section 163A for death/permanent disablement.',
    indiankanoon_url: 'https://indiankanoon.org/doc/785258/',
  },
  {
    id: 'cheque_bounce',
    topic_keywords: ['cheque', 'check', 'bounce', 'dishonour', 'negotiable', 'चेक बाउंस'],
    law_name: 'Negotiable Instruments Act, 1881',
    section: 'Section 138',
    summary: 'Dishonour of cheque for insufficiency of funds is a criminal offence. Complaint must be filed within 30 days of receiving bank memo. Punishment up to 2 years or twice the cheque amount.',
    indiankanoon_url: 'https://indiankanoon.org/doc/1823824/',
  },
  {
    id: 'child_rights',
    topic_keywords: ['child', 'minor', 'juvenile', 'pocso', 'child abuse', 'बच्चा', 'बाल अधिकार'],
    law_name: 'POCSO Act, 2012 / Juvenile Justice Act, 2015',
    section: 'Sections 3-12 (POCSO)',
    summary: 'Protection of Children from Sexual Offences. Covers penetrative and non-penetrative sexual assault, sexual harassment of minors. Mandatory reporting. Child-friendly courts.',
    indiankanoon_url: 'https://indiankanoon.org/doc/100472805/',
  },
  {
    id: 'employment_termination',
    topic_keywords: ['termination', 'fired', 'dismissed', 'retrenchment', 'notice period', 'employment', 'नौकरी', 'बर्खास्तगी'],
    law_name: 'Industrial Disputes Act, 1947',
    section: 'Sections 25F, 25N',
    summary: 'Retrenchment requires 1 month notice or pay in lieu, and retrenchment compensation of 15 days wages per year of service. Applicable to establishments with 100+ workers (300+ for some states).',
    indiankanoon_url: 'https://indiankanoon.org/doc/1428189/',
  },
];

/**
 * Search the legal knowledge base for relevant provisions.
 * Uses keyword matching against the query.
 * Returns top 3 most relevant provisions.
 */
export function searchLegalKnowledge(query: string): LegalProvision[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  const scored = LEGAL_KNOWLEDGE_BASE.map((provision) => {
    let score = 0;
    for (const keyword of provision.topic_keywords) {
      const keywordLower = keyword.toLowerCase();
      // Exact keyword match in query
      if (queryLower.includes(keywordLower)) {
        score += 3;
      }
      // Partial word overlap
      for (const word of queryWords) {
        if (keywordLower.includes(word) || word.includes(keywordLower)) {
          score += 1;
        }
      }
    }
    return { provision, score };
  });

  // Return top 3 with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.provision);
}

/**
 * Format retrieved provisions as context string for LLM injection.
 */
export function formatRetrievedContext(provisions: LegalProvision[]): string {
  if (provisions.length === 0) return '';

  const lines = provisions.map(
    (p) =>
      `- ${p.law_name}, ${p.section}: ${p.summary} [Source: ${p.indiankanoon_url}]`
  );

  return `\n--- VERIFIED LEGAL REFERENCES (from curated knowledge base) ---\n${lines.join('\n')}\n--- END REFERENCES ---\n\nUse these references to ground your response. Cite the specific sections when applicable.`;
}
