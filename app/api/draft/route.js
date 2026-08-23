import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { domain = 'RTI', extracted_fields = {}, extractedFields = {}, language = 'en' } = body;

    const fields = { ...extractedFields, ...extracted_fields };
    const issueText = fields.issue || fields.narrative || fields.situation || 'Statutory Non-Compliance and Grievance';
    const referenceId = fields.transaction_id || fields.booking_ref || fields.reference_id || fields.application_date || `REF-${Math.floor(100000 + Math.random() * 900000)}`;
    const authority = fields.target_authority || fields.bank_name || fields.company_name || fields.pio_authority || 'Competent Redressal Authority';

    const dateToday = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const isCyber = domain === 'CYBER' || domain.toLowerCase().includes('cyber') || issueText.toLowerCase().includes('upi') || issueText.toLowerCase().includes('fraud');
    const isConsumer = domain === 'CONSUMER' || domain.toLowerCase().includes('consumer') || issueText.toLowerCase().includes('flight') || issueText.toLowerCase().includes('refund');

    let documentPayload = {};

    // ==========================================
    // 1. CYBER & BANKING FRAUD DOMAIN
    // ==========================================
    if (isCyber) {
      documentPayload = {
        title: 'Formal Legal Grievance for Cyber Fraud & Unauthorized Transaction',
        authorityRecipient: `To: Nodal Grievance Officer / Cyber Cell Ombudsman (${authority})`,
        sections: [
          {
            heading: '1. Complainant Details & Incident Summary',
            content: `The Complainant submits this statutory notice regarding an unauthorized cyber transaction and electronic deception amounting to the loss described in the dispute record [Reference No: ${referenceId}].`,
          },
          {
            heading: '2. Statement of Facts & Fraudulent Circumstances',
            content: issueText,
          },
          {
            heading: '3. Relief Claimed & Statutory Action Requested',
            content: `Immediate freezing of the beneficiary account under Section 66D of the IT Act, 2000, and full reversal of the unauthorized debit amount in strict compliance with the RBI Zero-Liability Mandate for customer fraud reporting.`,
          },
        ],
        citations: [
          {
            act: 'Information Technology Act, 2000',
            section: 'Section 66D',
            quote: 'Whoever, by means of any communication device or computer resource, cheats by personating shall be punished with imprisonment and fine.',
            verifiedDate: 'Aug 2026',
          },
          {
            act: 'Reserve Bank of India (RBI) Directions',
            section: 'Zero Customer Liability Framework',
            quote: 'A customer has zero liability where the deficiency lies neither with the bank nor with the customer, but lies elsewhere in the system and customer notifies the bank within three working days.',
            verifiedDate: 'Aug 2026',
          },
        ],
      };
    }
    // ==========================================
    // 2. CONSUMER PROTECTION DOMAIN
    // ==========================================
    else if (isConsumer) {
      documentPayload = {
        title: 'Formal Legal Notice for Deficiency in Service under Consumer Protection Act, 2019',
        authorityRecipient: `To: Grievance Redressal Officer / Consumer Disputes Redressal Commission (${authority})`,
        sections: [
          {
            heading: '1. Complainant Details & Subject Matter',
            content: `Notice is hereby served regarding unfair trade practice, failure of committed service, and non-refund of rightful dues [Booking/Invoice Ref: ${referenceId}].`,
          },
          {
            heading: '2. Statement of Facts',
            content: issueText,
          },
          {
            heading: '3. Mandatory Relief & Compensation Sought',
            content: `The Complainant demands immediate restitution and refund of all charges along with statutory interest and compensation for harassment caused due to deficiency in service under Section 2(11) of the Act.`,
          },
        ],
        citations: [
          {
            act: 'Consumer Protection Act, 2019',
            section: 'Section 2(11)',
            quote: '"Deficiency" means any fault, imperfection, shortcoming or inadequacy in the quality, nature and manner of performance which is required to be maintained by or under any law...',
            verifiedDate: 'Aug 2026',
          },
          {
            act: 'Consumer Protection Act, 2019',
            section: 'Section 35',
            quote: 'A complaint in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided may be filed with a District Commission...',
            verifiedDate: 'Aug 2026',
          },
        ],
      };
    }
    // ==========================================
    // 3. RTI (RIGHT TO INFORMATION) DOMAIN
    // ==========================================
    else {
      documentPayload = {
        title: 'Application for Information under Section 6(1) of the RTI Act, 2005',
        authorityRecipient: `To: Public Information Officer / Appellate Authority (${authority})`,
        sections: [
          {
            heading: '1. Applicant Details & Subject Matter',
            content: `The Applicant submits this statutory request seeking certified disclosures, records, and inspection under the statutory mandate of the RTI Act [Ref: ${referenceId}].`,
          },
          {
            heading: '2. Statement of Facts & Information Requested',
            content: issueText,
          },
          {
            heading: '3. Mandatory Statutory Response Timeline',
            content: `Information requested must be provided within the mandatory 30-day statutory period under Section 7(1) of the RTI Act, 2005.`,
          },
        ],
        citations: [
          {
            act: 'Right to Information Act, 2005',
            section: 'Section 6(1)',
            quote: '"A person who desires to obtain any information under this Act shall make a request in writing or through electronic means in English or Hindi or in the official language of the area..."',
            verifiedDate: 'Aug 2026',
          },
          {
            act: 'Right to Information Act, 2005',
            section: 'Section 7(1)',
            quote: '"The Central Public Information Officer or State Public Information Officer shall as expeditiously as possible, and in any case within thirty days of the receipt of the request, either provide the information..."',
            verifiedDate: 'Aug 2026',
          },
        ],
      };
    }

    // Convert to draft plain text string for easy copying/printing
    const fullDraftText = `${documentPayload.title.toUpperCase()}\n${documentPayload.authorityRecipient}\nDate: ${dateToday}\n\n` +
      documentPayload.sections.map(s => `${s.heading}\n${s.content}\n`).join('\n') +
      `\n\nRespectfully Submitted,\nAggrieved Citizen`;

    return NextResponse.json({
      success: true,
      data: {
        id: `doc_${Date.now()}`,
        domain: isCyber ? 'Cyber Crime' : isConsumer ? 'Consumer Protection' : 'RTI',
        title: documentPayload.title,
        authorityRecipient: documentPayload.authorityRecipient,
        sections: documentPayload.sections,
        citations: documentPayload.citations,
        draft: fullDraftText,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Draft generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate legal document' },
      { status: 500 }
    );
  }
}