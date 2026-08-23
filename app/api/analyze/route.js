import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const prompt = body.narrative || body.prompt || '';
    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Narrative is required.' }, { status: 400 });
    }

    const text = prompt.toLowerCase();
    let detectedDomain = 'RTI';
    let domainName = 'Right to Information';
    let title = 'Statutory Information Disclosure Request';
    let rationale = 'This matter falls under public transparency and information disclosure mandates.';
    
    let questions = [
      {
        id: 'q_auth',
        key: 'target_authority',
        field_key: 'target_authority',
        fieldKey: 'target_authority',
        question_text: 'Name of the Public Authority / Department:',
        questionText: 'Name of the Public Authority / Department:',
        category: 'Authority',
        priority: 'high',
        input_type: 'text',
        inputType: 'text'
      }
    ];

    if (text.includes('cyber') || text.includes('upi') || text.includes('bank') || text.includes('fraud') || text.includes('scam') || text.includes('unauthorized')) {
      detectedDomain = 'CYBER';
      domainName = 'Cyber Crime & IT Act';
      title = 'Unauthorized Cyber & Banking Transaction Dispute';
      rationale = 'The grievance pertains to unauthorized digital debit under IT Act & RBI Ombudsman rules.';
      questions = [
        {
          id: 'q_tx',
          key: 'transaction_id',
          field_key: 'transaction_id',
          fieldKey: 'transaction_id',
          question_text: 'Transaction Reference / UTR Number:',
          questionText: 'Transaction Reference / UTR Number:',
          category: 'Financial',
          priority: 'high',
          input_type: 'text',
          inputType: 'text'
        },
        {
          id: 'q_bank',
          key: 'bank_name',
          field_key: 'bank_name',
          fieldKey: 'bank_name',
          question_text: 'Name of Bank / Digital Payment App:',
          questionText: 'Name of Bank / Digital Payment App:',
          category: 'Entity',
          priority: 'medium',
          input_type: 'text',
          inputType: 'text'
        }
      ];
    } else if (text.includes('flight') || text.includes('airline') || text.includes('refund') || text.includes('consumer') || text.includes('product') || text.includes('warranty')) {
      detectedDomain = 'CONSUMER';
      domainName = 'Consumer Protection';
      title = 'Deficiency in Commercial Service & Non-Refund';
      rationale = 'The grievance falls under Section 2(11) of the Consumer Protection Act, 2019.';
      questions = [
        {
          id: 'q_order',
          key: 'booking_ref',
          field_key: 'booking_ref',
          fieldKey: 'booking_ref',
          question_text: 'Booking PNR / Order Reference ID:',
          questionText: 'Booking PNR / Order Reference ID:',
          category: 'Booking',
          priority: 'high',
          input_type: 'text',
          inputType: 'text'
        }
      ];
    }

    const payload = {
      domain: detectedDomain,
      domainName: domainName,
      confidence: 0.95,
      summary: title,
      rationale: rationale,
      extracted_fields: { issue: prompt },
      clarifyingQuestions: questions,
      clarifying_questions: questions
    };

    return NextResponse.json({ success: true, data: payload, analysis: payload, ...payload });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}