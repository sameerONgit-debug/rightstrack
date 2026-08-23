import { watchdogAgent } from '@/lib/agents/watchdogAgent';
import { draftsmanAgent } from '@/lib/agents/draftsmanAgent';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request, { params }) {
  try {
    const { caseId } = params;
    const body = await request.json();
    
    // Validate input
    if (!caseId) {
      return Response.json(
        { error: { code: 'INVALID_INPUT', message: 'Case ID is required.' } },
        { status: 400 }
      );
    }

    // Step 1: Fetch case details from database
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return Response.json(
        { error: { code: 'CASE_NOT_FOUND', message: `Case ${caseId} not found.` } },
        { status: 404 }
      );
    }

    const { domain, created_at: filingDate, status: caseStatus, user_responses } = caseData;

    // Step 2: Check eligibility for escalation
    const eligibility = watchdogAgent.checkEscalationEligibility(
      domain,
      body.caseStatus || caseStatus,
      body.statusLastUpdated || new Date(filingDate).toISOString()
    );

    if (!eligibility.eligible) {
      return Response.json(
        {
          caseId,
          escalationId: uuidv4(),
          eligible: false,
          reasons: eligibility.reasons,
          message: 'Case is not yet eligible for escalation. Please wait until the deadline approaches or response is not received.',
          recommendedNextStep: 'Monitor case status',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Step 3: Calculate statutory deadlines
    const deadlines = watchdogAgent.calculateStatutoryDeadlines(domain, filingDate);

    // Step 4: Generate First Appeal petition
    const supportedLanguages = new Set(['en', 'hi', 'mr', 'bn', 'ta']);
    const language = supportedLanguages.has(body.language) ? body.language : 'en';

    const appealPetition = await watchdogAgent.generateFirstAppealPetition(
      caseId,
      domain,
      {
        filingDate,
        domain,
        summary: caseData.intake_data?.summary,
        originalDemand: caseData.user_responses,
      },
      body.appealReason || 'Non-response/Unsatisfactory response from primary authority',
      language
    );

    if (appealPetition.status === 'error') {
      return Response.json(
        {
          error: {
            code: 'APPEAL_GENERATION_FAILED',
            message: appealPetition.error,
          },
        },
        { status: 500 }
      );
    }

    // Step 5: Save escalation record
    const escalationId = appealPetition.appealId || uuidv4();
    const now = new Date().toISOString();

    const { error: escalationError } = await supabase
      .from('escalations')
      .insert([{
        id: escalationId,
        case_id: caseId,
        domain,
        appeal_level: appealPetition.appealLevel,
        authority: appealPetition.authority,
        status: 'drafted',
        petition_content: appealPetition.content,
        grounds: appealPetition.grounds,
        relief_sought: appealPetition.reliefSought,
        created_at: now,
      }]);

    if (escalationError) {
      console.warn('Error saving escalation record:', escalationError);
    }

    // Step 6: Update case status
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'appeal_drafted',
        updated_at: now,
      })
      .eq('id', caseId);

    if (updateError) {
      console.warn('Error updating case status:', updateError);
    }

    // Step 7: Compile comprehensive escalation response
    const response = {
      caseId,
      escalationId,
      timestamp: now,
      domain,
      language,

      // Eligibility information
      eligibility: {
        eligible: true,
        reasons: eligibility.reasons,
        daysSinceLastUpdate: eligibility.daysSinceLastUpdate,
      },

      // Statutory deadline information
      deadlines: deadlines.deadlines.map(d => ({
        appealLevel: d.appealLevel,
        appealTitle: d.appealTitle,
        authority: d.authority,
        deadline: d.deadline,
        daysRemaining: d.daysRemaining,
        status: d.status,
      })),

      // Appeal petition details
      appeal: {
        title: appealPetition.appealTitle,
        level: appealPetition.appealLevel,
        authority: appealPetition.authority,
        grounds: appealPetition.grounds,
        reliefSought: appealPetition.reliefSought,
        statutoryCitations: appealPetition.statutoryCitations,
      },

      // Document information
      document: {
        type: 'appeal_petition',
        status: 'drafted',
        readinessPercentage: appealPetition.readinessPercentage || 100,
        content: appealPetition.content.substring(0, 500) + '...',
        fullContent: appealPetition.content,
      },

      // Filing instructions
      filingInstructions: appealPetition.filingInstructions || [
        'Download the appeal petition',
        'Fill in any remaining placeholder information',
        'Obtain necessary certificates/documents',
        'File with the appropriate commission/authority',
        'Keep copy of receipt for future reference',
      ],

      // Required attachments
      requiredAttachments: appealPetition.requiredAttachments || [
        'Copy of original complaint/application',
        'Copy of order against which appeal is filed',
        'Proof of sending original application',
        'Supporting documents/evidence',
      ],

      // Next steps
      nextSteps: [
        'Review the appeal petition carefully',
        'Collect required supporting documents',
        `File appeal with ${appealPetition.authority}`,
        'Keep proof of filing for records',
        'Follow up on appeal status as per guidelines',
      ],

      // Warning and important information
      warningsAndCautions: [
        `Appeal must be filed within ${deadlines.deadlines[0]?.daysRemaining || 30} days`,
        'Original documents will be needed during appeal hearing',
        'Filing fee may be applicable (check with authority)',
        'Legal representation is advisable for complex cases',
      ],
    };

    return Response.json(response);

  } catch (error) {
    console.error('POST /api/cases/[caseId]/escalate error:', error);
    return Response.json(
      {
        error: {
          code: 'ESCALATION_FAILED',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { caseId } = params;

    if (!caseId) {
      return Response.json(
        { error: { code: 'INVALID_INPUT', message: 'Case ID is required.' } },
        { status: 400 }
      );
    }

    // Fetch monitoring status for the case
    const monitoring = await watchdogAgent.monitorCaseAndAlert(
      caseId,
      null, // domain will be fetched from DB
      {} // minimal case data
    );

    if (monitoring.status === 'error') {
      return Response.json(
        {
          caseId,
          error: {
            code: 'MONITORING_FAILED',
            message: monitoring.error,
          },
        },
        { status: 500 }
      );
    }

    return Response.json({
      caseId,
      monitoringDate: monitoring.monitoringDate,
      deadlines: monitoring.deadlines.deadlines,
      escalationStatus: monitoring.escalationStatus,
      alerts: monitoring.alerts,
      totalAlerts: monitoring.totalAlerts,
      requiresImmediateAction: monitoring.requiresImmediateAction,
    });

  } catch (error) {
    console.error('GET /api/cases/[caseId]/escalate error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
