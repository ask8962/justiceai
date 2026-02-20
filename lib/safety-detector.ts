/**
 * Safety & Escalation Detection Engine
 * Detects high-risk situations and provides verified helpline information
 */

// ─── Safety Categories ────────────────────────────────────────

export type SafetyCategory =
    | 'DOMESTIC_VIOLENCE'
    | 'CHILD_ABUSE'
    | 'SUICIDE_RISK'
    | 'DOWRY_HARASSMENT'
    | 'SEXUAL_ASSAULT'
    | 'CUSTODIAL_VIOLENCE'
    | 'HUMAN_TRAFFICKING'
    | 'CYBER_CRIME';

export interface Helpline {
    name: string;
    number: string;
    description: string;
    available: string;
}

export interface SafetyResult {
    isCritical: boolean;
    category: SafetyCategory | null;
    categoryLabel: string;
    helplines: Helpline[];
    warningMessage: string;
}

// ─── Verified Indian Helplines ────────────────────────────────

const HELPLINES: Record<SafetyCategory, Helpline[]> = {
    DOMESTIC_VIOLENCE: [
        { name: 'Women Helpline', number: '181', description: 'National Commission for Women — 24/7 helpline for women in distress', available: '24/7' },
        { name: 'One Stop Centre', number: '181', description: 'Scheme for women affected by violence (Sakhi Centre)', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response — immediate police assistance', available: '24/7' },
        { name: 'NALSA Legal Aid', number: '15100', description: 'National Legal Services Authority — free legal aid', available: 'Working hours' },
    ],
    CHILD_ABUSE: [
        { name: 'Childline India', number: '1098', description: 'Emergency phone service for children in need — run by Childline India Foundation', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
        { name: 'NCPCR', number: '011-23478200', description: 'National Commission for Protection of Child Rights', available: 'Working hours' },
    ],
    SUICIDE_RISK: [
        { name: 'iCall', number: '9152987821', description: 'Psychosocial helpline by TISS — trained counsellors', available: 'Mon-Sat 8am-10pm' },
        { name: 'Vandrevala Foundation', number: '1860-2662-345', description: 'Mental health support helpline — multilingual', available: '24/7' },
        { name: 'AASRA', number: '9820466726', description: 'Crisis intervention centre for the distressed', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
    ],
    DOWRY_HARASSMENT: [
        { name: 'Women Helpline', number: '181', description: 'National Commission for Women helpline', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
        { name: 'NALSA Legal Aid', number: '15100', description: 'Free legal aid for dowry harassment victims', available: 'Working hours' },
    ],
    SEXUAL_ASSAULT: [
        { name: 'Women Helpline', number: '181', description: 'National Commission for Women — 24/7 helpline', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
        { name: 'One Stop Centre', number: '181', description: 'Sakhi Centre for women affected by violence', available: '24/7' },
        { name: 'NALSA Legal Aid', number: '15100', description: 'Free legal aid', available: 'Working hours' },
    ],
    CUSTODIAL_VIOLENCE: [
        { name: 'NHRC', number: '011-23385368', description: 'National Human Rights Commission — complaints about custodial violence', available: 'Working hours' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
        { name: 'NALSA Legal Aid', number: '15100', description: 'Free legal aid for victims', available: 'Working hours' },
    ],
    HUMAN_TRAFFICKING: [
        { name: 'Anti-Trafficking Helpline', number: '1800-419-8588', description: 'Ministry of Home Affairs — anti-human trafficking helpline', available: '24/7' },
        { name: 'Childline India', number: '1098', description: 'For child trafficking cases', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
    ],
    CYBER_CRIME: [
        { name: 'Cyber Crime Helpline', number: '1930', description: 'National Cyber Crime Reporting Portal helpline', available: '24/7' },
        { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
    ],
};

// ─── Keyword Patterns ─────────────────────────────────────────

const SAFETY_KEYWORDS: Record<SafetyCategory, string[]> = {
    DOMESTIC_VIOLENCE: [
        'domestic violence', 'husband beating', 'wife beating', 'husband hits me', 'husband beats',
        'marital abuse', 'domestic abuse', 'pati marta hai', 'marpeet', 'ghar mein maar',
        'physical abuse husband', 'violence at home', 'beaten by spouse', 'protection order',
        'protection from domestic violence', 'dv act', 'घरेलू हिंसा', 'पति मारता है',
    ],
    CHILD_ABUSE: [
        'child abuse', 'child molest', 'child sexual abuse', 'pocso', 'minor abuse',
        'child beaten', 'child exploitation', 'child labour', 'child labor', 'bacha',
        'bachche ko maara', 'बच्चे के साथ', 'बाल शोषण', 'child trafficking',
    ],
    SUICIDE_RISK: [
        'want to die', 'kill myself', 'end my life', 'suicide', 'suicidal', 'no reason to live',
        'marna chahta', 'zindagi khatam', 'jeena nahi', 'आत्महत्या', 'मरना चाहता',
        'जीना नहीं', 'self harm', 'self-harm',
    ],
    DOWRY_HARASSMENT: [
        'dowry', 'dahej', 'dowry demand', 'dowry harassment', 'dahej ki maang',
        'dowry death', 'dahej hatya', 'bride burning', 'दहेज', 'दहेज उत्पीड़न',
        '498a', 'section 498',
    ],
    SEXUAL_ASSAULT: [
        'rape', 'sexual assault', 'sexual harassment', 'molest', 'molestation',
        'eve teasing', 'balatkar', 'sexual abuse', 'forced sex', 'यौन उत्पीड़न',
        'बलात्कार', 'posh act', 'workplace harassment', 'sexual misconduct',
    ],
    CUSTODIAL_VIOLENCE: [
        'police torture', 'custodial death', 'police beating', 'lock up', 'lockup torture',
        'police violence', 'encounter', 'fake encounter', 'thana mein maara', 'पुलिस हिंसा',
        'हिरासत में मौत', 'custodial torture',
    ],
    HUMAN_TRAFFICKING: [
        'trafficking', 'human trafficking', 'forced labour', 'bonded labour', 'bonded labor',
        'manav taskar', 'तस्करी', 'मानव तस्करी',
    ],
    CYBER_CRIME: [
        'cyber stalking', 'online harassment', 'revenge porn', 'morphed photos',
        'blackmail online', 'sextortion', 'online fraud', 'cyber bullying',
        'साइबर अपराध', 'ऑनलाइन धमकी',
    ],
};

const CATEGORY_LABELS: Record<SafetyCategory, string> = {
    DOMESTIC_VIOLENCE: 'Domestic Violence',
    CHILD_ABUSE: 'Child Abuse',
    SUICIDE_RISK: 'Mental Health Crisis',
    DOWRY_HARASSMENT: 'Dowry Harassment',
    SEXUAL_ASSAULT: 'Sexual Assault',
    CUSTODIAL_VIOLENCE: 'Custodial Violence',
    HUMAN_TRAFFICKING: 'Human Trafficking',
    CYBER_CRIME: 'Cyber Crime',
};

const WARNING_MESSAGES: Record<SafetyCategory, string> = {
    DOMESTIC_VIOLENCE:
        'We have detected that your situation may involve domestic violence. Your safety is our priority. Below are verified helplines that can provide immediate assistance.',
    CHILD_ABUSE:
        'We have detected that your situation may involve harm to a child. Every child deserves protection. Please reach out to the helplines below for immediate action.',
    SUICIDE_RISK:
        'We care about your wellbeing. If you or someone you know is having thoughts of self-harm, please reach out to a trained counsellor immediately. You are not alone.',
    DOWRY_HARASSMENT:
        'We have detected that your situation may involve dowry-related harassment. This is a serious criminal offence under Indian law. Please contact the helplines below.',
    SEXUAL_ASSAULT:
        'We have detected that your situation may involve sexual assault or harassment. This is a grave offence. Please reach out to the helplines below for immediate support.',
    CUSTODIAL_VIOLENCE:
        'We have detected concerns about custodial violence. This is a serious human rights violation. Please contact the authorities below.',
    HUMAN_TRAFFICKING:
        'We have detected that your situation may involve human trafficking. This is a serious crime. Please contact the anti-trafficking helpline immediately.',
    CYBER_CRIME:
        'We have detected that your situation may involve a cyber crime. Please report it to the National Cyber Crime Helpline immediately.',
};

// ─── Detection Function ───────────────────────────────────────

/**
 * Analyzes the user's question and AI response for safety-critical situations.
 * Returns helpline information and warning messages when risks are detected.
 */
export function detectSafetyRisk(
    question: string,
    riskLevel?: string
): SafetyResult {
    const normalizedQuestion = question.toLowerCase();

    // Check each category
    for (const [category, keywords] of Object.entries(SAFETY_KEYWORDS)) {
        const matched = keywords.some((kw) => normalizedQuestion.includes(kw.toLowerCase()));
        if (matched) {
            const cat = category as SafetyCategory;
            return {
                isCritical: true,
                category: cat,
                categoryLabel: CATEGORY_LABELS[cat],
                helplines: HELPLINES[cat],
                warningMessage: WARNING_MESSAGES[cat],
            };
        }
    }

    // If risk_level is HIGH but no specific category matched, show general escalation
    if (riskLevel?.toUpperCase() === 'HIGH') {
        return {
            isCritical: true,
            category: null,
            categoryLabel: 'High-Risk Situation',
            helplines: [
                { name: 'Police Emergency', number: '112', description: 'National Emergency Response', available: '24/7' },
                { name: 'NALSA Legal Aid', number: '15100', description: 'Free legal aid', available: 'Working hours' },
                { name: 'Women Helpline', number: '181', description: 'National Commission for Women', available: '24/7' },
            ],
            warningMessage:
                'Our AI has assessed this as a high-risk legal situation. We strongly recommend consulting a qualified lawyer. In the meantime, the following helplines may assist you.',
        };
    }

    return {
        isCritical: false,
        category: null,
        categoryLabel: '',
        helplines: [],
        warningMessage: '',
    };
}
